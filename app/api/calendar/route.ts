import { NextResponse } from 'next/server'

const CALENDAR_RAW = 'https://raw.githubusercontent.com/keithyob26/irishpeptides-jarvis/master/content_drafts/calendar.md'

const STATUS_MAP: Record<string, string> = {
  pending:     'pending_approval',
  in_progress: 'pending_approval',
  approved:    'approved',
  published:   'published',
  rejected:    'rejected',
}

export async function GET() {
  try {
    const res = await fetch(CALENDAR_RAW, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return NextResponse.json({ items: [] })

    const md = await res.text()
    const items = []

    for (const line of md.split('\n')) {
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
