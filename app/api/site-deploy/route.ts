import { NextRequest, NextResponse } from 'next/server'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''
const SITE_REPO = 'keithyob26/irishpeptides-website'

export async function POST(req: NextRequest) {
  if (!GITHUB_TOKEN) return NextResponse.json({ error: 'GITHUB_TOKEN not set' }, { status: 500 })

  const { message = 'chore: trigger deploy' } = await req.json().catch(() => ({})) as { message?: string }

  const headers = {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'irishpeptides-jarvis',
  }

  try {
    // Get current deploy-trigger file SHA
    const fileRes = await fetch(
      `https://api.github.com/repos/${SITE_REPO}/contents/.deploy-trigger`,
      { headers }
    )

    const now = new Date().toISOString()
    const newContent = Buffer.from(`Last deploy: ${now}\n`).toString('base64')

    const putBody: Record<string, unknown> = {
      message: `${message} [${now}]`,
      content: newContent,
    }

    if (fileRes.ok) {
      const fileData = await fileRes.json()
      putBody.sha = fileData.sha
    }

    const putRes = await fetch(
      `https://api.github.com/repos/${SITE_REPO}/contents/.deploy-trigger`,
      { method: 'PUT', headers, body: JSON.stringify(putBody) }
    )

    if (!putRes.ok) {
      const err = await putRes.json()
      return NextResponse.json({ error: err.message || 'Deploy failed' }, { status: 500 })
    }

    const result = await putRes.json()
    return NextResponse.json({
      ok: true,
      sha: (result.commit?.sha as string)?.slice(0, 7),
      timestamp: now,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
