import { NextRequest, NextResponse } from 'next/server'
import * as crypto from 'crypto'

const PROPERTY_ID = process.env.GA4_PROPERTY_ID || 'properties/453318049'

async function getGoogleAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson)
  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  })).toString('base64url')

  const sigInput = `${header}.${payload}`
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(sigInput)
  const sig = sign.sign(sa.private_key, 'base64url')
  const jwt = `${sigInput}.${sig}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
    signal: AbortSignal.timeout(10000),
  })
  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) throw new Error(tokenData.error_description || 'Token exchange failed')
  return tokenData.access_token
}

function toISODate(d: Date) { return d.toISOString().split('T')[0] }

function parseDateRange(startDate: string | null, endDate: string | null, days: string | null) {
  const end = new Date()
  let start: Date

  if (startDate && endDate) {
    return { startDate, endDate }
  }

  const numDays = parseInt(days || '30')
  const now = new Date()

  if (days === 'mtd') {
    start = new Date(now.getFullYear(), now.getMonth(), 1)
  } else if (days === 'ytd') {
    start = new Date(now.getFullYear(), 0, 1)
  } else {
    start = new Date(Date.now() - numDays * 86400000)
  }

  return { startDate: toISODate(start), endDate: toISODate(end) }
}

async function runGA4Report(
  accessToken: string,
  metrics: string[],
  dimensions: string[],
  dateRange: { startDate: string; endDate: string },
  limit = 20
) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/${PROPERTY_ID}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
        metrics: metrics.map(name => ({ name })),
        dimensions: dimensions.map(name => ({ name })),
        orderBys: metrics.length > 0 ? [{ metric: { metricName: metrics[0] }, desc: true }] : [],
        limit,
      }),
      signal: AbortSignal.timeout(15000),
    }
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GA4 API ${res.status}: ${err.slice(0, 200)}`)
  }
  return res.json()
}

async function runGA4DateReport(
  accessToken: string,
  metrics: string[],
  dateRange: { startDate: string; endDate: string }
) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/${PROPERTY_ID}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: dateRange.startDate, endDate: dateRange.endDate }],
        metrics: metrics.map(name => ({ name })),
        dimensions: [{ name: 'date' }],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
        limit: 365,
      }),
      signal: AbortSignal.timeout(15000),
    }
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GA4 API ${res.status}: ${err.slice(0, 200)}`)
  }
  return res.json()
}

export async function GET(req: NextRequest) {
  const saJson = process.env.GA4_SERVICE_ACCOUNT_JSON

  if (!saJson) {
    return NextResponse.json({ connected: false, error: 'GA4_SERVICE_ACCOUNT_JSON not set' })
  }

  const { searchParams } = new URL(req.url)
  const dateRange = parseDateRange(
    searchParams.get('startDate'),
    searchParams.get('endDate'),
    searchParams.get('days')
  )

  try {
    const accessToken = await getGoogleAccessToken(saJson)

    const [summary, topPages, byDate] = await Promise.all([
      runGA4Report(accessToken,
        ['sessions', 'totalUsers', 'newUsers', 'screenPageViews', 'bounceRate', 'averageSessionDuration', 'sessionsPerUser'],
        [], dateRange),
      runGA4Report(accessToken,
        ['screenPageViews', 'sessions', 'averageSessionDuration', 'bounceRate'],
        ['pagePath'], dateRange, 20),
      runGA4DateReport(accessToken, ['sessions', 'totalUsers'], dateRange),
    ])

    const summaryRow = summary.rows?.[0]
    const metricHeaders: string[] = summary.metricHeaders?.map((h: { name: string }) => h.name) || []

    const getMetric = (row: { metricValues?: { value: string }[] } | undefined, name: string) => {
      const idx = metricHeaders.indexOf(name)
      return idx >= 0 ? row?.metricValues?.[idx]?.value ?? '0' : '0'
    }

    const topPagesHeaders: string[] = topPages.metricHeaders?.map((h: { name: string }) => h.name) || []
    const getPM = (row: { metricValues?: { value: string }[] } | undefined, name: string) => {
      const idx = topPagesHeaders.indexOf(name)
      return idx >= 0 ? row?.metricValues?.[idx]?.value ?? '0' : '0'
    }

    const topPagesData = (topPages.rows || []).slice(0, 15).map((row: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }) => ({
      path: row.dimensionValues?.[0]?.value || '/',
      pageviews: parseInt(getPM(row, 'screenPageViews')),
      sessions: parseInt(getPM(row, 'sessions')),
      avgTimeOnPage: parseFloat(getPM(row, 'averageSessionDuration')).toFixed(0),
      bounceRate: parseFloat(getPM(row, 'bounceRate')).toFixed(1),
    }))

    const byDateData = (byDate.rows || []).map((row: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }) => {
      const dateStr = row.dimensionValues?.[0]?.value || ''
      return {
        date: `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`,
        sessions: parseInt(row.metricValues?.[0]?.value || '0'),
        users: parseInt(row.metricValues?.[1]?.value || '0'),
      }
    })

    const sessions = parseInt(getMetric(summaryRow, 'sessions'))
    const pageviews = parseInt(getMetric(summaryRow, 'screenPageViews'))

    return NextResponse.json({
      connected: true,
      dateRange,
      summary: {
        sessions,
        users: parseInt(getMetric(summaryRow, 'totalUsers')),
        newUsers: parseInt(getMetric(summaryRow, 'newUsers')),
        pageviews,
        bounceRate: parseFloat(getMetric(summaryRow, 'bounceRate')).toFixed(1),
        avgSessionDuration: parseFloat(getMetric(summaryRow, 'averageSessionDuration')).toFixed(0),
        pagesPerSession: sessions > 0 ? (pageviews / sessions).toFixed(2) : '0',
      },
      topPages: topPagesData,
      byDate: byDateData,
      propertyId: PROPERTY_ID,
    })
  } catch (e) {
    return NextResponse.json({ connected: false, error: String(e) })
  }
}
