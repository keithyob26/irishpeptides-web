import { NextResponse } from 'next/server'
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

async function runGA4Report(
  accessToken: string,
  metrics: string[],
  dimensions: string[],
  days = 30
) {
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]

  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/${PROPERTY_ID}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        metrics: metrics.map(name => ({ name })),
        dimensions: dimensions.map(name => ({ name })),
        orderBys: dimensions.length > 0 ? [{ dimension: { dimensionName: dimensions[0] } }] : [],
        limit: 20,
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

export async function GET() {
  const saJson = process.env.GA4_SERVICE_ACCOUNT_JSON

  if (!saJson) {
    return NextResponse.json({ connected: false, error: 'GA4_SERVICE_ACCOUNT_JSON not set' })
  }

  try {
    const accessToken = await getGoogleAccessToken(saJson)

    // Fetch summary metrics (last 30 days)
    const [summary, topPages, byDate] = await Promise.all([
      runGA4Report(accessToken, ['sessions', 'totalUsers', 'screenPageViews', 'bounceRate', 'averageSessionDuration'], [], 30),
      runGA4Report(accessToken, ['screenPageViews', 'sessions'], ['pagePath'], 30),
      runGA4Report(accessToken, ['sessions', 'totalUsers'], ['date'], 30),
    ])

    const summaryRow = summary.rows?.[0]
    const metricHeaders = summary.metricHeaders?.map((h: { name: string }) => h.name) || []

    const getMetric = (row: { metricValues?: { value: string }[] } | undefined, name: string) => {
      const idx = metricHeaders.indexOf(name)
      return idx >= 0 ? row?.metricValues?.[idx]?.value ?? '0' : '0'
    }

    const topPagesData = (topPages.rows || []).slice(0, 10).map((row: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }) => ({
      path: row.dimensionValues?.[0]?.value || '/',
      pageviews: parseInt(row.metricValues?.[0]?.value || '0'),
      sessions: parseInt(row.metricValues?.[1]?.value || '0'),
    }))

    const byDateData = (byDate.rows || []).map((row: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }) => {
      const dateStr = row.dimensionValues?.[0]?.value || ''
      return {
        date: `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`,
        sessions: parseInt(row.metricValues?.[0]?.value || '0'),
        users: parseInt(row.metricValues?.[1]?.value || '0'),
      }
    })

    return NextResponse.json({
      connected: true,
      summary: {
        sessions: parseInt(getMetric(summaryRow, 'sessions')),
        users: parseInt(getMetric(summaryRow, 'totalUsers')),
        pageviews: parseInt(getMetric(summaryRow, 'screenPageViews')),
        bounceRate: parseFloat(getMetric(summaryRow, 'bounceRate')).toFixed(1),
        avgSessionDuration: parseFloat(getMetric(summaryRow, 'averageSessionDuration')).toFixed(0),
      },
      topPages: topPagesData,
      byDate: byDateData,
      propertyId: PROPERTY_ID,
    })
  } catch (e) {
    return NextResponse.json({ connected: false, error: String(e) })
  }
}
