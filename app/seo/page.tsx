'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import PageHeader from '@/components/PageHeader'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────────────────────────────

interface SCKeyword {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  status: 'green' | 'amber' | 'red'
}

interface SCData {
  connected: boolean
  error?: string
  summary?: { totalClicks: number; totalImpressions: number; avgPosition: number; avgCtr: number; keywordCount: number }
  keywords?: SCKeyword[]
  trends?: { date: string; clicks: number; impressions: number }[]
}

interface Outcome {
  id: string
  agent: string
  action?: string
  title?: string
  type: string
  status: string
  content?: string
  created_at: string
  scheduled_date?: string
}

type ActivityFilter = 'all' | 'content' | 'intel' | 'social' | 'newsletter'

const POS_COLOR: Record<string, string> = {
  green: '#22C55E',
  amber: '#F59E0B',
  red:   '#EF4444',
}

function posColor(pos: number) {
  if (pos <= 10) return '#22C55E'
  if (pos <= 30) return '#F59E0B'
  return '#EF4444'
}

function posStatus(pos: number | undefined) {
  if (!pos) return 'red'
  if (pos <= 10) return 'green'
  if (pos <= 30) return 'amber'
  return 'red'
}

function fmt(n: number) { return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n) }

const STATUS_LABEL: Record<string, string> = {
  completed: 'Done',
  published: 'Published',
  pending_approval: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
}
const STATUS_COLOR: Record<string, string> = {
  completed: '#22C55E',
  published: '#14B8A6',
  pending_approval: '#F59E0B',
  approved: '#22C55E',
  rejected: '#EF4444',
}

const ACTIVITY_TYPES: Record<ActivityFilter, string[]> = {
  all: [],
  content: ['blog', 'announcement', 'content'],
  intel: ['intel'],
  social: ['instagram', 'tiktok', 'social'],
  newsletter: ['newsletter'],
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function SeoPage() {
  const [sc, setSc]         = useState<SCData | null>(null)
  const [scLoading, setScLoading] = useState(true)
  const [keywords, setKeywords]   = useState<string[]>([])
  const [kwLoading, setKwLoading] = useState(true)
  const [outcomes, setOutcomes]   = useState<Outcome[]>([])
  const [actFilter, setActFilter] = useState<ActivityFilter>('all')
  const [newKw, setNewKw]         = useState('')
  const [adding, setAdding]       = useState(false)
  const [removing, setRemoving]   = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load Search Console
  const loadSC = useCallback(async () => {
    setScLoading(true)
    try {
      const r = await fetch('/api/search-console?days=30')
      setSc(await r.json())
    } catch {
      setSc({ connected: false, error: 'Fetch failed' })
    } finally {
      setScLoading(false)
    }
  }, [])

  // Load target keywords
  const loadKeywords = useCallback(async () => {
    setKwLoading(true)
    try {
      const r = await fetch('/api/seo-keywords')
      const d = await r.json()
      setKeywords(Array.isArray(d.keywords) ? d.keywords : [])
    } catch {
      setKeywords([])
    } finally {
      setKwLoading(false)
    }
  }, [])

  // Load agent activity
  const loadOutcomes = useCallback(async () => {
    try {
      const r = await fetch('/api/outcomes')
      const d = await r.json()
      const all: Outcome[] = Array.isArray(d.outcomes) ? d.outcomes : []
      all.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      setOutcomes(all.slice(0, 60))
    } catch { /* non-fatal */ }
  }, [])

  useEffect(() => { loadSC(); loadKeywords(); loadOutcomes() }, [loadSC, loadKeywords, loadOutcomes])

  const handleAddKeyword = async () => {
    const kw = newKw.trim()
    if (!kw || adding) return
    setAdding(true)
    try {
      const r = await fetch('/api/seo-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: kw }),
      })
      const d = await r.json()
      if (d.keywords) setKeywords(d.keywords)
      setNewKw('')
      inputRef.current?.focus()
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveKeyword = async (kw: string) => {
    setRemoving(kw)
    try {
      const r = await fetch('/api/seo-keywords', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: kw }),
      })
      const d = await r.json()
      if (d.keywords) setKeywords(d.keywords)
    } finally {
      setRemoving(null)
    }
  }

  // Enrich tracked keywords with Search Console positions
  const kwMap = new Map<string, SCKeyword>()
  if (sc?.keywords) {
    for (const k of sc.keywords) kwMap.set(k.query.toLowerCase(), k)
  }

  const filteredActivity = outcomes.filter(o => {
    if (actFilter === 'all') return true
    return ACTIVITY_TYPES[actFilter].some(t => o.type?.toLowerCase().includes(t))
  })

  const s = sc?.summary
  const scKws = sc?.keywords || []

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="SEO & Rankings"
        subtitle="Google Search Console · keyword positions · agent activity"
        badge={{ label: scLoading ? 'Loading…' : sc?.connected ? 'Live' : 'SC not connected', ok: !!sc?.connected }}
      />

      {/* ── Summary stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Avg Position',   value: scLoading ? '…' : s ? s.avgPosition.toFixed(1) : '—',  sub: 'Lower is better' },
          { label: 'Top-10 Keywords',value: scLoading ? '…' : s ? String(scKws.filter(k => k.status === 'green').length) : '—', sub: 'Ranking well' },
          { label: 'Total Clicks',   value: scLoading ? '…' : s ? fmt(s.totalClicks) : '—',  sub: 'Last 30 days' },
          { label: 'Avg CTR',        value: scLoading ? '…' : s ? s.avgCtr + '%' : '—',  sub: 'Click-through rate' },
        ].map(k => (
          <div key={k.label} className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-4">
            <div className="text-[11px] text-[#64748B] uppercase tracking-wide mb-2">{k.label}</div>
            <div className="text-2xl font-bold text-[#F1F5F9]">{k.value}</div>
            <div className="text-[11px] text-[#64748B] mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Rankings + Target keywords (2-col) ── */}
      <div className="grid md:grid-cols-[1fr_320px] gap-6 mb-6">

        {/* Live rankings */}
        <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide">Live Rankings</div>
            <div className="flex items-center gap-3">
              <button onClick={loadSC} className="text-[10px] text-[#475569] hover:text-[#14B8A6] transition-colors">↺ Refresh</button>
              <Link href="/analytics" className="text-[10px] text-[#475569] hover:text-[#14B8A6] transition-colors">Full analytics →</Link>
            </div>
          </div>

          {!sc?.connected && !scLoading && (
            <div className="rounded-lg bg-[#161616] border border-white/[0.05] p-4 text-[12px] text-[#64748B]">
              Search Console not connected.{' '}
              <Link href="/analytics" className="text-[#14B8A6] hover:underline">Connect via Analytics →</Link>
            </div>
          )}

          {sc?.connected && (
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-[10px] text-[#475569] uppercase tracking-wide border-b border-white/[0.05]">
                    <th className="text-left pb-2 font-semibold">Keyword</th>
                    <th className="text-right pb-2 font-semibold">Pos</th>
                    <th className="text-right pb-2 font-semibold">Clicks</th>
                    <th className="text-right pb-2 font-semibold">Impr</th>
                  </tr>
                </thead>
                <tbody>
                  {scKws.slice(0, 25).map((k, i) => (
                    <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="py-1.5 text-[#94A3B8] truncate max-w-[200px]">{k.query}</td>
                      <td className="py-1.5 text-right">
                        <span className="font-bold" style={{ color: POS_COLOR[k.status] }}>{k.position}</span>
                      </td>
                      <td className="py-1.5 text-right text-[#F1F5F9] font-semibold">{k.clicks}</td>
                      <td className="py-1.5 text-right text-[#64748B]">{k.impressions}</td>
                    </tr>
                  ))}
                  {scKws.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-[#475569]">No keywords yet — site needs traffic first</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Target keywords */}
        <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6 flex flex-col">
          <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-4">Target Keywords</div>
          <div className="text-[11px] text-[#475569] mb-4">
            Track keywords manually — positions pulled from Search Console when available.
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 mb-4 min-h-[120px]">
            {kwLoading && <div className="text-[12px] text-[#475569]">Loading…</div>}
            {!kwLoading && keywords.length === 0 && (
              <div className="text-[12px] text-[#475569]">No target keywords yet. Add one below.</div>
            )}
            {keywords.map(kw => {
              const match = kwMap.get(kw.toLowerCase())
              const pos = match?.position
              const st = posStatus(pos)
              return (
                <div key={kw} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-[#161616] border border-white/[0.04] group">
                  <span className="text-[12px] text-[#94A3B8] flex-1 truncate">{kw}</span>
                  <span className="text-[12px] font-bold ml-3 shrink-0" style={{ color: POS_COLOR[st] }}>
                    {pos ? `#${pos}` : '—'}
                  </span>
                  <button
                    onClick={() => handleRemoveKeyword(kw)}
                    disabled={removing === kw}
                    className="ml-2 text-[#334155] hover:text-[#EF4444] transition-colors text-[11px] opacity-0 group-hover:opacity-100 shrink-0"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>

          {/* Add form */}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newKw}
              onChange={e => setNewKw(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddKeyword()}
              placeholder="e.g. BPC-157 research UK"
              className="flex-1 bg-[#161616] border border-white/[0.07] rounded-lg px-3 py-2 text-[12px] text-[#F1F5F9] placeholder-[#334155] outline-none focus:border-[#14B8A6]/40 transition-colors"
            />
            <button
              onClick={handleAddKeyword}
              disabled={!newKw.trim() || adding}
              className="px-4 py-2 text-[11px] font-semibold rounded-lg border border-[#14B8A6]/30 text-[#14B8A6] hover:bg-[#14B8A6]/10 transition-all disabled:opacity-40 shrink-0"
            >
              {adding ? '…' : '+ Add'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Click trend sparkline ── */}
      {sc?.connected && sc.trends && sc.trends.length > 1 && (
        <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-5 mb-6">
          <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-3">Click Trend — Last 30 Days</div>
          {(() => {
            const data = sc.trends!
            const max = Math.max(...data.map(d => d.clicks), 1)
            const pts = data.map((d, i) => {
              const x = (i / Math.max(data.length - 1, 1)) * 100
              const y = 100 - (d.clicks / max) * 85
              return `${x.toFixed(1)},${y.toFixed(1)}`
            }).join(' ')
            return (
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-14">
                <defs>
                  <linearGradient id="seo-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#14B8A6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon points={`0,100 ${pts} 100,100`} fill="url(#seo-grad)" />
                <polyline points={pts} fill="none" stroke="#14B8A6" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              </svg>
            )
          })()}
          <div className="flex justify-between text-[10px] text-[#475569] mt-1">
            <span>{sc.trends[0]?.date}</span>
            <span>{sc.trends[sc.trends.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {/* ── Position buckets ── */}
      {sc?.connected && scKws.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Top 10', count: scKws.filter(k => k.status === 'green').length, color: '#22C55E', desc: 'Ranking well' },
            { label: 'Pos 11–30', count: scKws.filter(k => k.status === 'amber').length, color: '#F59E0B', desc: 'Needs push' },
            { label: 'Pos 30+', count: scKws.filter(k => k.status === 'red').length, color: '#EF4444', desc: 'Poor visibility' },
          ].map(b => (
            <div key={b.label} className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: b.color }}>{b.label}</div>
              <div className="text-2xl font-bold" style={{ color: b.color }}>{b.count}</div>
              <div className="text-[10px] text-[#475569] mt-0.5">{b.desc}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Agent activity ── */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide">Agent Activity</div>
          <Link href="/agent-skills" className="text-[10px] text-[#475569] hover:text-[#14B8A6] transition-colors">
            All agents →
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 mb-4 flex-wrap">
          {(['all', 'content', 'intel', 'social', 'newsletter'] as ActivityFilter[]).map(f => (
            <button key={f} onClick={() => setActFilter(f)}
              className={`text-[11px] px-3 py-1.5 rounded-full border capitalize transition-all ${
                actFilter === f
                  ? 'bg-[#14B8A6]/10 border-[#14B8A6]/30 text-[#14B8A6]'
                  : 'border-white/[0.07] text-[#64748B] hover:text-[#F1F5F9]'
              }`}>
              {f}
            </button>
          ))}
        </div>

        {filteredActivity.length === 0 ? (
          <div className="text-[12px] text-[#475569] py-4">
            No agent activity yet — agents write here after each run.{' '}
            <Link href="/agent-skills" className="text-[#14B8A6] hover:underline">Check schedules →</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-[10px] text-[#475569] uppercase tracking-wide border-b border-white/[0.05]">
                  <th className="text-left pb-2 font-semibold">Agent</th>
                  <th className="text-left pb-2 font-semibold pl-3">Action</th>
                  <th className="text-left pb-2 font-semibold pl-3">Detail</th>
                  <th className="text-right pb-2 font-semibold">Status</th>
                  <th className="text-right pb-2 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredActivity.slice(0, 30).map((o, i) => (
                  <tr key={o.id || i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors align-top">
                    <td className="py-2 text-[#F1F5F9] font-semibold whitespace-nowrap">{o.agent || '—'}</td>
                    <td className="py-2 pl-3 text-[#94A3B8] truncate max-w-[160px]">{o.title || o.action || '—'}</td>
                    <td className="py-2 pl-3 text-[#64748B] truncate max-w-[220px] text-[11px]">{o.content || ''}</td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{
                          color: STATUS_COLOR[o.status] || '#64748B',
                          background: (STATUS_COLOR[o.status] || '#64748B') + '18',
                        }}>
                        {STATUS_LABEL[o.status] || o.status}
                      </span>
                    </td>
                    <td className="py-2 text-right text-[#475569] whitespace-nowrap">
                      {(o.scheduled_date || o.created_at || '').slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Wiring notice */}
        <div className="mt-4 pt-4 border-t border-white/[0.05] text-[11px] text-[#334155]">
          SEO Loop, Competitor Monitor, Social Performance → not yet writing to activity log.
          Wire pending: <Link href="/agent-skills" className="text-[#64748B] hover:text-[#14B8A6]">see Agent Skills</Link>
        </div>
      </div>
    </div>
  )
}
