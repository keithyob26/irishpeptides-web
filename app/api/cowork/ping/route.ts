import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const r = await fetch('http://localhost:8503/ping', {
      signal: AbortSignal.timeout(2000),
      cache: 'no-store',
    })
    if (r.ok) return NextResponse.json({ ok: true })
    return NextResponse.json({ ok: false }, { status: 503 })
  } catch {
    return NextResponse.json({ ok: false, error: 'Backend unreachable' }, { status: 503 })
  }
}
