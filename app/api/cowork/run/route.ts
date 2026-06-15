import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const task = form.get('task') as string
    if (!task) return NextResponse.json({ error: 'No task provided' }, { status: 400 })

    const files = form.getAll('file') as File[]
    const attachments: { name: string; content: string; type: string }[] = []
    for (const f of files) {
      const text = await f.text().catch(() => '')
      attachments.push({ name: f.name, content: text.slice(0, 50000), type: f.type })
    }

    const backendRes = await fetch('http://localhost:8503/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, attachments }),
      signal: AbortSignal.timeout(120000), // 2 min for browser tasks
    })

    if (!backendRes.ok) {
      const err = await backendRes.text()
      return NextResponse.json({ error: `Backend error: ${backendRes.status} — ${err.slice(0, 200)}` })
    }

    const result = await backendRes.json()
    return NextResponse.json(result)
  } catch (e) {
    const msg = String(e)
    if (msg.includes('ECONNREFUSED') || msg.includes('fetch failed') || msg.includes('unreachable')) {
      return NextResponse.json({
        error: 'Local backend not running. Start it with:\ncd C:\\Projects\\irishpeptides_jarvis && py -3.14 cowork_server.py',
        success: false,
      })
    }
    return NextResponse.json({ error: msg, success: false })
  }
}
