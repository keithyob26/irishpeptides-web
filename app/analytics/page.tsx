'use client'

import { useEffect, useState, useCallback } from 'react'
import PageHeader from '@/components/PageHeader'

type MainTab = 'ga4' | 'search'

interface SearchConsoleData {
  connected: boolean
  error?: string
  dateRange?: { startDate: string; endDate: string }
  summary?: { totalClicks: number; totalImpressions: number; avgPosition: number; avgCtr: number; keywordCount: number }
  keywords?: { query: string; clicks: number; impressions: number; ctr: number; position: number; status: 'green' | 'amber' | 'red' }[]
  pages?: { page: string; clicks: number; impressions: number; ctr: number; position: number }[]
  trends?: { date: string; clicks: number; impressions: number }[]
  siteUrl?: string
}

interface AnalyticsData {
  connected: boolean
  error?: string
  dateRange?: { startDate: string; endDate: string }
  summary?: {
    sessions: number
    users: number
    newUsers: number
    pageviews: number
    bounceRate: string
    avgSessionDuration: string
    pagesPerSession: string
  }
  topPages?: { path: string; pageviews: number; sessions: number; avgTimeOnPage: string; bounceRate: string }[]
  byDate?: { date: string; sessions: number; users: number }[]
  propertyId?: string
}

type QuickRange = '7' | '30' | 'mtd' | 'ytd' | 'custom'

const QUICK_RANGES: { key: QuickRange; label: string }[] = [
  { key: '7', label: 'Last 7 Days' },
  { key: '30', label: 'Last 30 Days' },
  { key: 'mtd', label: 'Month to Date' },
  { key: 'ytd', label: 'Year to Date' },
  { key: 'custom', label: 'Custom' },
]

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-4">
      <div className="text-[11px] text-[#64748B] uppercase tracking-wide mb-2">{label}</div>
      <div className="text-2xl font-bold text-[#F1F5F9]">{value}</div>
      {sub && <div className="text-[11px] text-[#475569] mt-1">{sub}</div>}
    </div>
  )
}

function LineChart({ data }: { data: { date: string; sessions: number }[] }) {
  if (!data.length) return null
  const max = Math.max(...data.map(d => d.sessions), 1)
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 100 - (d.sessions / max) * 90
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  const area = `0,100 ${pts} 100,100`

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-20">
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#14B8A6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#grad)" />
      <polyline points={pts} fill="none" stroke="#14B8A6" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

function fmt(n: number) { return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n) }
function fmtDur(sec: string) {
  const s = parseInt(sec)
  return isNaN(s) ? '—' : `${Math.floor(s / 60)}m ${s % 60}s`
}

const POSITION_COLOR: Record<string, string> = { green: '#22C55E', amber: '#F59E0B', red: '#EF4444' }

function SearchTab({ days }: { days: string }) {
  const [sc, setSc] = useState<SearchConsoleData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/search-console?days=${days}`)
      setSc(await r.json())
    } catch (e) {
      setSc({ connected: false, error: String(e) })
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => { load() }, [load])

  if (!sc?.connected) {
    return (
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
        <div className="text-[13px] font-semibold text-[#F1F5F9] mb-2">Search Console Not Connected</div>
        <div className="text-[12px] text-[#94A3B8] mb-3">
          {loading ? 'Fetching Search Console data…' : (sc?.error || 'GA4_SERVICE_ACCOUNT_JSON must have access to Search Console property.')}
        </div>
        <ol className="space-y-1.5 text-[12px] text-[#94A3B8]">
          <li><span className="text-[#14B8A6] font-semibold">1.</span> Go to Search Console → Settings → Users and permissions</li>
          <li><span className="text-[#14B8A6] font-semibold">2.</span> Add service account email from GA4_SERVICE_ACCOUNT_JSON as Full user</li>
          <li><span className="text-[#14B8A6] font-semibold">3.</span> Add GSC_SITE_URL=https://irishpeptides.ie/ to Vercel env vars</li>
        </ol>
      </div>
    )
  }

  const s = sc.summary!
  const kws = sc.keywords || []
  const green = kws.filter(k => k.status === 'green')
  const amber = kws.filter(k => k.status === 'amber')
  const red = kws.filter(k => k.status === 'red')

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total Clicks" value={loading ? '…' : s.totalClicks.toLocaleString()} />
        <Stat label="Impressions" value={loading ? '…' : s.totalImpressions.toLocaleString()} />
        <Stat label="Avg Position" value={loading ? '…' : s.avgPosition.toFixed(1)} sub="Lower is better" />
        <Stat label="Avg CTR" value={loading ? '…' : s.avgCtr + '%'} sub="Click-through rate" />
      </div>

      {/* Position distribution */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Top 10 (Green)', count: green.length, color: '#22C55E', desc: 'Ranking well' },
          { label: 'Pos 11–30 (Amber)', count: amber.length, color: '#F59E0B', desc: 'Improvement needed' },
          { label: 'Pos 30+ (Red)', count: red.length, color: '#EF4444', desc: 'Poor visibility' },
        ].map(b => (
          <div key={b.label} className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: b.color }}>{b.label}</div>
            <div className="text-2xl font-bold" style={{ color: b.color }}>{b.count}</div>
            <div className="text-[10px] text-[#475569] mt-0.5">{b.desc}</div>
          </div>
        ))}
      </div>

      {/* Click trend chart */}
      {sc.trends && sc.trends.length > 0 && (
        <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-5">
          <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-3">Click Trend</div>
          {(() => {
            const data = sc.trends!
            const max = Math.max(...data.map(d => d.clicks), 1)
            const pts = data.map((d, i) => {
              const x = (i / Math.max(data.length - 1, 1)) * 100
              const y = 100 - (d.clicks / max) * 90
              return `${x.toFixed(1)},${y.toFixed(1)}`
            }).join(' ')
            return (
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-16">
                <defs>
                  <linearGradient id="gsc-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#14B8A6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon points={`0,100 ${pts} 100,100`} fill="url(#gsc-grad)" />
                <polyline points={pts} fill="none" stroke="#14B8A6" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
              </svg>
            )
          })()}
        </div>
      )}

      {/* Keyword table */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide">Top Keywords</div>
          <button onClick={load} className="text-[10px] text-[#475569] hover:text-[#14B8A6]">↺ Refresh</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] text-[#475569] uppercase tracking-wide border-b border-white/[0.05]">
                <th className="text-left pb-2 font-semibold">Keyword</th>
                <th className="text-right pb-2 font-semibold">Position</th>
                <th className="text-right pb-2 font-semibold">Clicks</th>
                <th className="text-right pb-2 font-semibold">Impressions</th>
                <th className="text-right pb-2 font-semibold">CTR</th>
              </tr>
            </thead>
            <tbody>
              {kws.slice(0, 30).map((k, i) => (
                <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="py-2 text-[#94A3B8] truncate max-w-[180px]">{k.query}</td>
                  <td className="py-2 text-right">
                    <span className="font-bold text-[13px]" style={{ color: POSITION_COLOR[k.status] }}>
                      {k.position}
                    </span>
                  </td>
                  <td className="py-2 text-right font-semibold text-[#F1F5F9]">{k.clicks}</td>
                  <td className="py-2 text-right text-[#64748B]">{k.impressions}</td>
                  <td className="py-2 text-right text-[#64748B]">{k.ctr}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Poor ranking pages */}
      {red.length > 0 && (
        <div className="bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-xl p-5">
          <div className="text-[11px] font-semibold text-[#EF4444] uppercase tracking-wide mb-3">
            Flagged for Improvement — Position 30+ ({red.length} keywords)
          </div>
          <div className="space-y-1">
            {red.slice(0, 10).map((k, i) => (
              <div key={i} className="flex items-center justify-between py-1 border-b border-white/[0.04] last:border-0">
                <span className="text-[12px] text-[#94A3B8]">{k.query}</span>
                <span className="text-[12px] text-[#EF4444] font-bold">pos {k.position}</span>
              </div>
            ))}
          </div>
          <div className="text-[11px] text-[#F59E0B] mt-3">
            SEO Loop agent runs Monday 8am — targets these keywords with optimised content.
          </div>
        </div>
      )}
    </div>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [quickRange, setQuickRange] = useState<QuickRange>('30')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [mainTab, setMainTab] = useState<MainTab>('ga4')

  const fetchData = useCallback(async (range: QuickRange, start?: string, end?: string) => {
    setLoading(true)
    try {
      let url = '/api/analytics'
      if (range === 'custom' && start && end) {
        url += `?startDate=${start}&endDate=${end}`
      } else if (range !== 'custom') {
        url += `?days=${range}`
      }
      const d = await fetch(url).then(r => r.json())
      setData(d)
    } catch (e) {
      setData({ connected: false, error: String(e) })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData('30') }, [fetchData])

  const handleQuickRange = (key: QuickRange) => {
    setQuickRange(key)
    if (key !== 'custom') fetchData(key)
  }

  const handleCustomApply = () => {
    if (customStart && customEnd) fetchData('custom', customStart, customEnd)
  }

  if (!data?.connected) {
    return (
      <div className="p-8 max-w-5xl">
        <PageHeader title="Analytics" subtitle="GA4 live traffic — irishpeptides.ie" badge={{ label: loading ? 'Loading…' : 'Not connected', ok: false }} />
        {loading ? (
          <div className="text-[13px] text-[#64748B]">Fetching analytics data…</div>
        ) : (
          <div className="bg-[#1C1C1C] border border-[#14B8A6]/20 rounded-xl p-6">
            <div className="text-base font-bold text-[#F1F5F9] mb-2">Connect Google Analytics 4</div>
            <div className="text-[13px] text-[#94A3B8] mb-4">
              Property ID: <code className="text-[#14B8A6] bg-white/[0.05] px-2 py-0.5 rounded">G-4XJ8V62DSN</code>
              {data?.error && <span className="ml-4 text-[#EF4444]">Error: {data.error}</span>}
            </div>
            <ol className="space-y-2 text-[13px] text-[#94A3B8]">
              <li><span className="text-[#14B8A6] font-semibold">1.</span> Create service account → add Viewer role for GA4 property</li>
              <li><span className="text-[#14B8A6] font-semibold">2.</span> Download JSON key → minify to single line</li>
              <li><span className="text-[#14B8A6] font-semibold">3.</span> Add to Vercel: <code className="text-[#14B8A6]">GA4_SERVICE_ACCOUNT_JSON</code> + <code className="text-[#14B8A6]">GA4_PROPERTY_ID=properties/539754026</code></li>
            </ol>
          </div>
        )}
      </div>
    )
  }

  const s = data.summary!

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="Analytics"
        subtitle={`GA4 · ${data.propertyId} · ${data.dateRange?.startDate} to ${data.dateRange?.endDate}`}
        badge={{ label: loading ? 'Refreshing…' : 'Live', ok: true }}
      />

      {/* Main tab switcher */}
      <div className="flex gap-2 mb-6">
        {([
          { key: 'ga4', label: 'GA4 Traffic' },
          { key: 'search', label: 'Organic Search' },
        ] as { key: MainTab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => setMainTab(t.key)}
            className={`text-[12px] font-semibold px-4 py-2 rounded-lg border transition-all ${
              mainTab === t.key
                ? 'bg-[#14B8A6]/10 border-[#14B8A6]/30 text-[#14B8A6]'
                : 'border-white/[0.07] text-[#64748B] hover:text-[#F1F5F9]'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {mainTab === 'search' && <SearchTab days={quickRange === 'custom' ? '28' : quickRange} />}

      {mainTab === 'ga4' && <>

      {/* Date range filter */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-4 mb-6 flex flex-wrap items-center gap-3">
        <span className="text-[11px] text-[#64748B] font-semibold uppercase tracking-wide">Date Range</span>
        <div className="flex gap-1.5 flex-wrap">
          {QUICK_RANGES.map(r => (
            <button key={r.key} onClick={() => handleQuickRange(r.key)}
              className={`text-[11px] px-3 py-1.5 rounded-full border transition-all ${
                quickRange === r.key
                  ? 'bg-[#14B8A6]/10 border-[#14B8A6]/30 text-[#14B8A6]'
                  : 'border-white/[0.07] text-[#64748B] hover:text-[#F1F5F9]'
              }`}>
              {r.label}
            </button>
          ))}
        </div>
        {quickRange === 'custom' && (
          <div className="flex items-center gap-2 flex-wrap">
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
              className="bg-[#161616] border border-white/[0.07] rounded-lg px-3 py-1.5 text-[12px] text-[#F1F5F9] outline-none focus:border-[#14B8A6]/50" />
            <span className="text-[11px] text-[#475569]">to</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
              className="bg-[#161616] border border-white/[0.07] rounded-lg px-3 py-1.5 text-[12px] text-[#F1F5F9] outline-none focus:border-[#14B8A6]/50" />
            <button onClick={handleCustomApply} disabled={!customStart || !customEnd}
              className="px-4 py-1.5 text-[11px] font-semibold rounded-lg border border-[#14B8A6]/30 text-[#14B8A6] hover:bg-[#14B8A6]/10 transition-all disabled:opacity-40">
              Apply
            </button>
          </div>
        )}
        <button onClick={() => fetchData(quickRange, customStart, customEnd)}
          className="ml-auto text-[11px] text-[#475569] hover:text-[#14B8A6] transition-colors">↺ Refresh</button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Stat label="Sessions" value={loading ? '…' : fmt(s.sessions)} sub={data.dateRange?.startDate + ' – ' + data.dateRange?.endDate} />
        <Stat label="Unique Visitors" value={loading ? '…' : fmt(s.users)} sub="Total users" />
        <Stat label="New Users" value={loading ? '…' : fmt(s.newUsers)} sub="First visit" />
        <Stat label="Page Views" value={loading ? '…' : fmt(s.pageviews)} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Stat label="Bounce Rate" value={loading ? '…' : s.bounceRate + '%'} sub="Left without interaction" />
        <Stat label="Avg Session" value={loading ? '…' : fmtDur(s.avgSessionDuration)} sub="Duration" />
        <Stat label="Pages / Session" value={loading ? '…' : s.pagesPerSession} sub="Depth" />
      </div>

      {/* Sessions over time line chart */}
      {data.byDate && data.byDate.length > 0 && (
        <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-5 mb-6">
          <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-1">Sessions Over Time</div>
          <div className="text-[11px] text-[#475569] mb-3">{data.dateRange?.startDate} – {data.dateRange?.endDate}</div>
          <LineChart data={data.byDate} />
          <div className="flex justify-between text-[10px] text-[#475569] mt-1">
            <span>{data.byDate[0]?.date}</span>
            <span>{data.byDate[data.byDate.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {/* Top pages table */}
      {data.topPages && data.topPages.length > 0 && (
        <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
          <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-4">Top Pages</div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-[10px] text-[#475569] uppercase tracking-wide border-b border-white/[0.05]">
                  <th className="text-left pb-2 font-semibold">Page</th>
                  <th className="text-right pb-2 font-semibold">Pageviews</th>
                  <th className="text-right pb-2 font-semibold">Sessions</th>
                  <th className="text-right pb-2 font-semibold">Avg Time</th>
                  <th className="text-right pb-2 font-semibold">Bounce</th>
                </tr>
              </thead>
              <tbody>
                {data.topPages.map((p, i) => (
                  <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 text-[#94A3B8] font-mono truncate max-w-[200px]">{p.path}</td>
                    <td className="py-2.5 text-right font-semibold text-[#F1F5F9]">{fmt(p.pageviews)}</td>
                    <td className="py-2.5 text-right text-[#64748B]">{p.sessions}</td>
                    <td className="py-2.5 text-right text-[#64748B]">{fmtDur(p.avgTimeOnPage)}</td>
                    <td className="py-2.5 text-right">
                      <span className={`font-medium ${parseFloat(p.bounceRate) > 70 ? 'text-[#EF4444]' : parseFloat(p.bounceRate) > 50 ? 'text-[#F59E0B]' : 'text-[#22C55E]'}`}>
                        {p.bounceRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      </>}
    </div>
  )
}
