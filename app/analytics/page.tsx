'use client'

import { useEffect, useState } from 'react'
import PageHeader from '@/components/PageHeader'

interface AnalyticsData {
  connected: boolean
  error?: string
  summary?: {
    sessions: number
    users: number
    pageviews: number
    bounceRate: string
    avgSessionDuration: string
  }
  topPages?: { path: string; pageviews: number; sessions: number }[]
  byDate?: { date: string; sessions: number; users: number }[]
  propertyId?: string
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-4">
      <div className="text-[11px] text-[#64748B] uppercase tracking-wide mb-2">{label}</div>
      <div className="text-2xl font-bold text-[#F1F5F9]">{value}</div>
      {sub && <div className="text-[11px] text-[#475569] mt-1">{sub}</div>}
    </div>
  )
}

function MiniBar({ data }: { data: { date: string; sessions: number }[] }) {
  if (!data.length) return null
  const max = Math.max(...data.map(d => d.sessions), 1)
  return (
    <div className="flex items-end gap-0.5 h-12">
      {data.slice(-30).map((d, i) => (
        <div
          key={i}
          title={`${d.date}: ${d.sessions} sessions`}
          style={{ height: `${Math.max(4, (d.sessions / max) * 48)}px`, background: '#14B8A6', opacity: 0.7 + 0.3 * (i / data.length) }}
          className="flex-1 rounded-sm min-w-[4px] cursor-default"
        />
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(d => setData(d))
      .catch(e => setData({ connected: false, error: String(e) }))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8 max-w-5xl">
        <PageHeader title="Analytics" subtitle="GA4 live traffic — irishpeptides.ie" badge={{ label: 'Loading…', ok: true }} />
        <div className="text-[13px] text-[#64748B]">Fetching analytics data…</div>
      </div>
    )
  }

  if (!data?.connected) {
    return (
      <div className="p-8 max-w-5xl">
        <PageHeader title="Analytics" subtitle="GA4 live traffic — irishpeptides.ie" badge={{ label: 'Not connected', ok: false }} />

        <div className="bg-[#1C1C1C] border border-[#14B8A6]/20 rounded-xl p-6 mb-6">
          <div className="text-base font-bold text-[#F1F5F9] mb-2">Connect Google Analytics 4</div>
          <div className="text-[13px] text-[#94A3B8] mb-4">
            Property ID: <code className="text-[#14B8A6] bg-white/[0.05] px-2 py-0.5 rounded">G-4XJ8V62DSN</code>
            {data?.error && (
              <span className="ml-4 text-[#EF4444]">Error: {data.error}</span>
            )}
          </div>
          <ol className="space-y-2 text-[13px] text-[#94A3B8]">
            <li><span className="text-[#14B8A6] font-semibold">1.</span> Go to{' '}
              <a href="https://console.cloud.google.com/iam-admin/serviceaccounts" target="_blank" rel="noreferrer" className="text-[#14B8A6] hover:underline">
                Google Cloud Console → Service Accounts
              </a>
            </li>
            <li><span className="text-[#14B8A6] font-semibold">2.</span> Create service account → Add Viewer role for your GA4 property</li>
            <li><span className="text-[#14B8A6] font-semibold">3.</span> Download JSON key → minify to single line</li>
            <li><span className="text-[#14B8A6] font-semibold">4.</span> Add to Vercel:{' '}
              <code className="text-[#14B8A6] bg-white/[0.05] px-1.5 py-0.5 rounded">GA4_SERVICE_ACCOUNT_JSON</code> +{' '}
              <code className="text-[#14B8A6] bg-white/[0.05] px-1.5 py-0.5 rounded">GA4_PROPERTY_ID=properties/453318049</code>
            </li>
            <li><span className="text-[#14B8A6] font-semibold">5.</span> In GA4 Admin → Property Access Management → add service account email as Viewer</li>
          </ol>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {['Users (7d)', 'Sessions (7d)', 'Bounce Rate', 'Avg Session', 'Page Views', 'Top Source'].map(m => (
            <div key={m} className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-4">
              <div className="text-[11px] text-[#64748B] uppercase tracking-wide mb-2">{m}</div>
              <div className="text-2xl font-bold text-[#334155]">—</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const s = data.summary!
  const fmt = (n: number) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n)
  const fmtDur = (sec: string) => {
    const s = parseInt(sec)
    return `${Math.floor(s / 60)}m ${s % 60}s`
  }

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="Analytics"
        subtitle={`GA4 · ${data.propertyId} · last 30 days`}
        badge={{ label: 'Live', ok: true }}
      />

      {/* Summary stats */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-6">
        <Stat label="Sessions" value={fmt(s.sessions)} sub="Last 30 days" />
        <Stat label="Users" value={fmt(s.users)} sub="Unique visitors" />
        <Stat label="Page Views" value={fmt(s.pageviews)} />
        <Stat label="Bounce Rate" value={s.bounceRate + '%'} />
        <Stat label="Avg Session" value={fmtDur(s.avgSessionDuration)} />
      </div>

      {/* Sessions over time */}
      {data.byDate && data.byDate.length > 0 && (
        <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-5 mb-6">
          <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-3">Sessions Over Time (30d)</div>
          <MiniBar data={data.byDate} />
          <div className="flex justify-between text-[10px] text-[#475569] mt-1">
            <span>{data.byDate[0]?.date}</span>
            <span>{data.byDate[data.byDate.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {/* Top pages */}
      {data.topPages && data.topPages.length > 0 && (
        <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
          <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-4">Top Pages</div>
          <div className="space-y-1">
            {data.topPages.map((p, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                <span className="text-[13px] text-[#94A3B8] font-mono truncate max-w-[60%]">{p.path}</span>
                <div className="flex items-center gap-4">
                  <span className="text-[12px] text-[#64748B]">{p.sessions} sessions</span>
                  <span className="text-[13px] font-semibold text-[#F1F5F9]">{fmt(p.pageviews)} views</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
