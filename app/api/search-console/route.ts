import { NextRequest, NextResponse } from 'next/server'
import * as crypto from 'crypto'

const SITE_URL = process.env.GSC_SITE_URL || 'https://irishpeptides.ie/'

async function getGoogleAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson)
  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
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

export async function GET(req: NextRequest) {
  const saJson = process.env.GA4_SERVICE_ACCOUNT_JSON
  if (!saJson) {
    return NextResponse.json({ connected: false, error: 'GA4_SERVICE_ACCOUNT_JSON not set' })
  }

  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get('days') || '28')
  const endDate = toISODate(new Date())
  const startDate = toISODate(new Date(Date.now() - days * 86400000))

  try {
    const accessToken = await getGoogleAccessToken(saJson)

    // Top keywords by clicks
    const [keywordsRes, pagesRes, trendsRes] = await Promise.all([
      fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate, endDate,
          dimensions: ['query'],
          rowLimit: 50,
          orderBy: [{ fieldName: 'clicks', sortOrder: 'DESCENDING' }],
        }),
        signal: AbortSignal.timeout(15000),
      }),
      fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate, endDate,
          dimensions: ['page'],
          rowLimit: 20,
          orderBy: [{ fieldName: 'clicks', sortOrder: 'DESCENDING' }],
        }),
        signal: AbortSignal.timeout(15000),
      }),
      fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate, endDate,
          dimensions: ['date'],
          rowLimit: 90,
          orderBy: [{ fieldName: 'date', sortOrder: 'ASCENDING' }],
        }),
        signal: AbortSignal.timeout(15000),
      }),
    ])

    const [kData, pData, tData] = await Promise.all([
      keywordsRes.ok ? keywordsRes.json() : { rows: [] },
      pagesRes.ok ? pagesRes.json() : { rows: [] },
      trendsRes.ok ? trendsRes.json() : { rows: [] },
    ])

    type GscRow = { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }

    const keywords = (kData.rows || []).map((r: GscRow) => ({
      query: r.keys[0],
      clicks: Math.round(r.clicks),
      impressions: Math.round(r.impressions),
      ctr: parseFloat((r.ctr * 100).toFixed(1)),
      position: parseFloat(r.position.toFixed(1)),
      status: r.position <= 10 ? 'green' : r.position <= 30 ? 'amber' : 'red',
    }))

    const pages = (pData.rows || []).map((r: GscRow) => ({
      page: r.keys[0].replace(SITE_URL.replace(/\/$/, ''), '') || '/',
      clicks: Math.round(r.clicks),
      impressions: Math.round(r.impressions),
      ctr: parseFloat((r.ctr * 100).toFixed(1)),
      position: parseFloat(r.position.toFixed(1)),
    }))

    const trends = (tData.rows || []).map((r: GscRow) => ({
      date: r.keys[0],
      clicks: Math.round(r.clicks),
      impressions: Math.round(r.impressions),
    }))

    // Summary totals
    const totalClicks = keywords.reduce((s: number, k: {clicks:number}) => s + k.clicks, 0)
    const totalImpressions = keywords.reduce((s: number, k: {impressions:number}) => s + k.impressions, 0)
    const avgPosition = keywords.length
      ? parseFloat((keywords.reduce((s: number, k: {position:number}) => s + k.position, 0) / keywords.length).toFixed(1))
      : 0
    const avgCtr = totalImpressions > 0
      ? parseFloat(((totalClicks / totalImpressions) * 100).toFixed(1))
      : 0

    return NextResponse.json({
      connected: true,
      dateRange: { startDate, endDate },
      summary: { totalClicks, totalImpressions, avgPosition, avgCtr, keywordCount: keywords.length },
      keywords,
      pages,
      trends,
      siteUrl: SITE_URL,
    })
  } catch (e) {
    return NextResponse.json({ connected: false, error: String(e) })
  }
}
