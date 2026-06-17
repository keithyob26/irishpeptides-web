import { NextRequest, NextResponse } from 'next/server'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''
const REPO = 'keithyob26/irishpeptides-jarvis'
const PATH = 'memory/manual_steps_done.json'
const RAW = `https://raw.githubusercontent.com/${REPO}/master/${PATH}`
const API = `https://api.github.com/repos/${REPO}/contents/${PATH}`

const GH = { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' }

// GET — return list of done step IDs
export async function GET() {
  try {
    const r = await fetch(RAW, { cache: 'no-store', signal: AbortSignal.timeout(6000) })
    if (!r.ok) return NextResponse.json({ done: [] })
    const data = await r.json()
    return NextResponse.json({ done: data.done || [], updated_at: data.updated_at || '' })
  } catch {
    return NextResponse.json({ done: [] })
  }
}

// POST — add or remove a step_id from done list
export async function POST(req: NextRequest) {
  const { step_id, action } = await req.json() as { step_id: string; action?: 'add' | 'remove' }
  if (!step_id || !GITHUB_TOKEN) return NextResponse.json({ ok: false, error: 'missing step_id or token' })

  try {
    // Read current file
    const fileRes = await fetch(API, { headers: GH, cache: 'no-store' })
    if (!fileRes.ok) return NextResponse.json({ ok: false, error: 'failed to read file' })
    const fileData = await fileRes.json()
    const current = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf-8'))
    const done: string[] = current.done || []

    // Toggle or explicit action
    const isAdding = action === 'remove' ? false : action === 'add' ? true : !done.includes(step_id)
    const updated = isAdding
      ? [...new Set([...done, step_id])]
      : done.filter((id: string) => id !== step_id)

    const payload = { done: updated, updated_at: new Date().toISOString() }
    const putRes = await fetch(API, {
      method: 'PUT',
      headers: { ...GH, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `chore: mark manual step ${step_id} as ${isAdding ? 'done' : 'pending'}`,
        content: Buffer.from(JSON.stringify(payload, null, 2)).toString('base64'),
        sha: fileData.sha,
      }),
    })
    if (!putRes.ok) return NextResponse.json({ ok: false, error: `github ${putRes.status}` })
    return NextResponse.json({ ok: true, done: updated, action: isAdding ? 'added' : 'removed' })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) })
  }
}
