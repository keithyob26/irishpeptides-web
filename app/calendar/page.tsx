'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/PageHeader'

interface CalendarItem {
  id: string
  agent: string
  action: string
  type: string
  title?: string
  content?: string
  status: string
  created_at: string
  published_at?: string
  scheduled_date?: string
}

const TYPE_COLORS: Record<string, string> = {
  blog:       'text-[#14B8A6]',
  blog_post:  'text-[#14B8A6]',
  social:     'text-[#A78BFA]',
  instagram:  'text-[#A78BFA]',
  tiktok:     'text-[#F472B6]',
  newsletter: 'text-[#F59E0B]',
}

const STATUS_COLORS: Record<string, string> = {
  pending_approval: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/25',
  approved:         'text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/25',
  published:        'text-[#14B8A6] bg-[#14B8A6]/10 border-[#14B8A6]/25',
  rejected:         'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/25',
  completed:        'text-[#64748B] bg-white/[0.04] border-white/[0.07]',
}

const STATUS_LABEL: Record<string, string> = {
  pending_approval: 'Pending',
  approved:         'Approved',
  published:        'Published',
  rejected:         'Rejected',
  completed:        'Done',
}

function detectType(o: CalendarItem): string {
  if (o.type) return o.type
  const action = o.action?.toLowerCase() || ''
  const agent  = o.agent?.toLowerCase() || ''
  if (action.includes('newsletter') || agent.includes('newsletter')) return 'newsletter'
  if (action.includes('blog') || agent.includes('blog')) return 'blog'
  if (action.includes('tiktok')) return 'tiktok'
  if (action.includes('instagram') || action.includes('social') || agent.includes('social')) return 'social'
  return 'social'
}

function typeLabel(t: string) {
  if (t === 'blog_post') return 'Blog'
  return t.charAt(0).toUpperCase() + t.slice(1)
}

function getDate(o: CalendarItem): string {
  return o.scheduled_date || o.created_at.split('T')[0]
}

function groupByWeek(items: CalendarItem[]): { week: string; items: CalendarItem[] }[] {
  const grouped: Record<string, CalendarItem[]> = {}
  for (const item of items) {
    const d = new Date(getDate(item))
    const day = d.getDay()
    const monday = new Date(d)
    monday.setDate(d.getDate() - ((day + 6) % 7))
    const key = monday.toISOString().split('T')[0]
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(item)
  }
  return Object.entries(grouped)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([week, items]) => ({ week, items }))
}

export default function CalendarPage() {
  const router = useRouter()
  const [items, setItems] = useState<CalendarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newTopic, setNewTopic] = useState('')
  const [newType, setNewType] = useState('blog')
  const [newDate, setNewDate] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [outcomesRes, calendarRes] = await Promise.allSettled([
        fetch('/api/outcomes'),
        fetch('/api/calendar'),
      ])

      const outcomesData = outcomesRes.status === 'fulfilled' ? await outcomesRes.value.json() : { outcomes: [] }
      const calendarData = calendarRes.status === 'fulfilled' ? await calendarRes.value.json() : { items: [] }

      const outcomeItems: CalendarItem[] = (outcomesData.outcomes || []).filter((o: CalendarItem) => {
        const t = detectType(o)
        return ['blog', 'blog_post', 'social', 'instagram', 'tiktok', 'newsletter'].includes(t)
      })

      // calendar.md planned items — dedupe against outcomes by date+type
      const outcomeKeys = new Set(
        outcomeItems.map(o => `${o.scheduled_date || o.created_at.split('T')[0]}|${detectType(o)}`)
      )
      const plannedItems: CalendarItem[] = (calendarData.items || []).filter((o: CalendarItem) => {
        return !outcomeKeys.has(`${o.scheduled_date}|${o.type}`)
      })

      const all = [...outcomeItems, ...plannedItems]
      all.sort((a, b) => new Date(getDate(b)).getTime() - new Date(getDate(a)).getTime())
      setItems(all)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function addContent() {
    if (!newTopic.trim()) return
    setAdding(true)
    try {
      const getRes = await fetch('/api/outcomes')
      const data = await getRes.json()
      const newItem = {
        id: Math.random().toString(36).slice(2, 10),
        agent: 'manual',
        action: newTopic,
        title: newTopic,
        type: newType,
        content: '',
        status: 'pending_approval',
        created_at: new Date().toISOString(),
        scheduled_date: newDate || new Date().toISOString().split('T')[0],
      }
      const updated = [newItem, ...(data.outcomes || [])]
      await fetch('/api/outcomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcomes: updated, sha: data.sha }),
      })
      setNewTopic('')
      setNewType('blog')
      setNewDate('')
      setShowAdd(false)
      await load()
    } catch (e) {
      setError(String(e))
    } finally {
      setAdding(false)
    }
  }

  const pendingCount = items.filter(o => o.status === 'pending_approval').length
  const weeks = groupByWeek(items)

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="Content Calendar"
        subtitle="Live — synced from Content Studio + 8-week plan"
        badge={{ label: loading ? 'Loading…' : `${items.length} items`, ok: true }}
      />

      {error && (
        <div className="mb-4 text-[12px] text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {pendingCount > 0 && (
          <button onClick={() => router.push('/content')}
            className="text-[12px] px-4 py-2 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] hover:bg-[#F59E0B]/20 transition-all">
            {pendingCount} pending — Review in Content Studio →
          </button>
        )}
        <button onClick={() => setShowAdd(o => !o)}
          className="text-[12px] px-4 py-2 rounded-lg bg-[#14B8A6]/10 border border-[#14B8A6]/30 text-[#14B8A6] hover:bg-[#14B8A6]/20 transition-all">
          + Add Content
        </button>
        <button onClick={load} className="ml-auto text-[11px] text-[#475569] hover:text-[#14B8A6] transition-colors">↺ Refresh</button>
      </div>

      {showAdd && (
        <div className="bg-[#1C1C1C] border border-[#14B8A6]/20 rounded-xl p-5 mb-6">
          <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-3">Add Content</div>
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              value={newTopic}
              onChange={e => setNewTopic(e.target.value)}
              placeholder="Topic or title…"
              className="flex-1 min-w-[200px] bg-[#161616] border border-white/[0.07] rounded-lg px-4 py-2.5 text-[13px] text-[#F1F5F9] placeholder-[#475569] outline-none focus:border-[#14B8A6]/50"
            />
            <select value={newType} onChange={e => setNewType(e.target.value)}
              className="bg-[#161616] border border-white/[0.07] rounded-lg px-3 py-2.5 text-[12px] text-[#F1F5F9] outline-none focus:border-[#14B8A6]/50">
              <option value="blog">Blog</option>
              <option value="social">Social</option>
              <option value="newsletter">Newsletter</option>
              <option value="tiktok">TikTok</option>
            </select>
            <input
              type="date"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="bg-[#161616] border border-white/[0.07] rounded-lg px-3 py-2.5 text-[12px] text-[#F1F5F9] outline-none focus:border-[#14B8A6]/50"
            />
            <button onClick={addContent} disabled={adding || !newTopic.trim()}
              className="px-5 py-2.5 rounded-lg text-[12px] font-semibold text-[#0A0F1E] disabled:opacity-40 transition-opacity"
              style={{ background: '#14B8A6' }}>
              {adding ? '…' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-[13px] text-[#64748B]">Loading calendar…</div>
      ) : items.length === 0 ? (
        <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-8 text-center">
          <div className="text-3xl mb-3">📅</div>
          <div className="text-[14px] font-semibold text-[#F1F5F9] mb-1">Calendar is empty</div>
          <div className="text-[12px] text-[#64748B] mb-4">Agents populate this when content is generated. Add items manually or run content_engine.py.</div>
          <button onClick={() => setShowAdd(true)}
            className="text-[12px] px-4 py-2 rounded-lg bg-[#14B8A6]/10 border border-[#14B8A6]/30 text-[#14B8A6] hover:bg-[#14B8A6]/20 transition-all">
            + Add Content
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {weeks.map(({ week, items: weekItems }) => {
            const weekEnd = new Date(week)
            weekEnd.setDate(weekEnd.getDate() + 6)
            const label = `Week of ${new Date(week).toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })} – ${weekEnd.toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })}`
            return (
              <div key={week}>
                <div className="text-[11px] font-semibold text-[#475569] uppercase tracking-wide mb-2">{label}</div>
                <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl overflow-hidden">
                  {weekItems.map((o) => {
                    const type = detectType(o)
                    const isPending = o.status === 'pending_approval'
                    return (
                      <div key={o.id}
                        className={`flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.04] last:border-0 transition-colors ${isPending ? 'hover:bg-[#F59E0B]/[0.03] cursor-pointer' : 'hover:bg-white/[0.02]'}`}
                        onClick={isPending ? () => router.push('/content') : undefined}
                      >
                        <span className="text-[12px] text-[#64748B] font-mono w-20 shrink-0">{getDate(o)}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wide w-16 shrink-0 ${TYPE_COLORS[type] || 'text-[#64748B]'}`}>
                          {typeLabel(type)}
                        </span>
                        <span className="text-[13px] text-[#94A3B8] flex-1 truncate">{o.title || o.action}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${STATUS_COLORS[o.status] || STATUS_COLORS.completed}`}>
                          {STATUS_LABEL[o.status] || o.status}
                        </span>
                        {isPending && <span className="text-[10px] text-[#F59E0B] shrink-0">Review →</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
