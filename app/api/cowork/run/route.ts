import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const task = form.get('task') as string
    if (!task) return NextResponse.json({ error: 'No task provided' }, { status: 400 })

    const files = form.getAll('file') as File[]

    // Build multipart form for FastAPI /task (SSE streaming)
    const backendForm = new FormData()
    backendForm.append('task', task)
    for (const f of files) backendForm.append('files', f)

    const backendRes = await fetch('http://localhost:8503/task', {
      method: 'POST',
      body: backendForm,
      signal: AbortSignal.timeout(120000),
    })

    if (!backendRes.ok || !backendRes.body) {
      const err = await backendRes.text().catch(() => '')
      return NextResponse.json({ error: `Backend error: ${backendRes.status} — ${err.slice(0, 200)}`, success: false })
    }

    // Proxy SSE stream through to the client
    const stream = new ReadableStream({
      async start(controller) {
        const reader = backendRes.body!.getReader()
        const decoder = new TextDecoder()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            controller.enqueue(value)
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    })
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
