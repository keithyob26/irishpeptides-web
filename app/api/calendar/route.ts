import { NextResponse } from 'next/server'

const CALENDAR_API = 'https://api.github.com/repos/keithyob26/irishpeptides-jarvis/contents/content_drafts/calendar.md'

const STATUS_MAP: Record<string, string> = {
  pending:     'pending_approval',
  in_progress: 'pending_approval',
  approved:    'approved',
  published:   'published',
  rejected:    'rejected',
}

export async function GET() {
  try {
    const token = process.env.JARVIS_GITHUB_TOKEN || process.env.GITHUB_TOKEN
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github+json',
    }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(CALENDAR_API, {
      headers,
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return NextResponse.json({ items: [] })

    const json = await res.json()
    // GitHub Contents API returns base64-encoded content
    const md = Buffer.from(json.content, 'base64').toString('utf-8')
    const items = []

    for (const line of md.split(/\r?\n/)) {
      const m = line.match(/^## (\d{4}-\d{2}-\d{2}) \| (\w+) \| (.+) \| (\w+)$/)
      if (!m) continue
      const [, date, type, title, statusRaw] = m
      const slug = title.trim().slice(0, 24).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '').toLowerCase()
      items.push({
        id: `cal-${date}-${type}-${slug}`,
        agent: 'calendar',
        action: title.trim(),
        title: title.trim(),
        type: type.trim(),
        content: '',
        status: STATUS_MAP[statusRaw.trim()] || 'pending_approval',
        created_at: `${date}T00:00:00Z`,
        scheduled_date: date,
      })
    }

    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ items: [] })
  }
}
