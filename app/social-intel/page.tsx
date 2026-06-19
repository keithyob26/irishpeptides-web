'use client'

import { useEffect, useState } from 'react'
import PageHeader from '@/components/PageHeader'

const JARVIS_RAW = 'https://raw.githubusercontent.com/keithyob26/irishpeptides-jarvis/master/memory'

interface TrendIntel {
  date?: string
  fetched_at?: string
  trending_topics?: string[]
  top_questions?: string[]
  viral_hooks?: string[]
  trending_compounds?: string[]
  sentiment?: string
  summary?: string
  top_posts?: { title: string; score: number; comments: number; subreddit: string }[]
}

interface PostWinners {
  winners?: string[]
  updated?: string
}

interface PerfInsights {
  generated_at?: string
  insight?: string
  top_hashtags?: string[]
  best_type?: string
  best_time?: string
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-5 ${className}`}>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[11px] font-semibold text-[#64748B] uppercase tracking-widest mb-4">{children}</h2>
}

function Tag({ text, variant = 'default' }: { text: string; variant?: 'teal' | 'amber' | 'default' }) {
  const colors = {
    teal:    'bg-[#14B8A6]/10 text-[#14B8A6] border-[#14B8A6]/20',
    amber:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
    default: 'bg-white/[0.04] text-[#94A3B8] border-white/[0.07]',
  }
  return (
    <span className={`inline-block border rounded-full px-3 py-1 text-[11px] font-medium mr-2 mb-2 ${colors[variant]}`}>
      {text}
    </span>
  )
}

function SentimentBadge({ sentiment }: { sentiment?: string }) {
  if (!sentiment) return null
  const map: Record<string, { label: string; color: string }> = {
    positive: { label: 'Positive', color: 'text-emerald-400' },
    neutral:  { label: 'Neutral',  color: 'text-[#94A3B8]'   },
    negative: { label: 'Negative', color: 'text-red-400'      },
  }
  const s = map[sentiment] ?? map.neutral
  return <span className={`text-xs font-semibold ${s.color}`}>{s.label} sentiment</span>
}

export default function SocialIntelPage() {
  const [trends,   setTrends]   = useState<TrendIntel | null>(null)
  const [winners,  setWinners]  = useState<PostWinners | null>(null)
  const [perf,     setPerf]     = useState<PerfInsights | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    const bust = Date.now()
    Promise.all([
      fetch(`${JARVIS_RAW}/trend_intel.json?v=${bust}`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
      fetch(`${JARVIS_RAW}/post_winners.json?v=${bust}`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
      fetch(`${JARVIS_RAW}/performance_insights.json?v=${bust}`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
    ]).then(([t, w, p]) => {
      setTrends(t)
      setWinners(w)
      setPerf(p)
      setLoading(false)
    }).catch(e => {
      setError(String(e))
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="flex-1 p-6 space-y-4">
      <PageHeader title="Social Intelligence" subtitle="Trending topics, post winners, performance insights" />
      <div className="text-[#64748B] text-sm">Loading intel...</div>
    </div>
  )

  return (
    <div className="flex-1 p-6 space-y-6 max-w-5xl">
      <PageHeader
        title="Social Intelligence"
        subtitle={trends?.date ? `Last updated: ${trends.date}` : 'Trending topics · Post winners · Performance'}
      />

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">{error}</div>
      )}

      {/* Trend summary bar */}
      {trends?.summary && (
        <Card>
          <div className="flex items-start gap-3">
            <span className="text-2xl">📡</span>
            <div>
              <div className="text-[12px] font-semibold text-[#F1F5F9] mb-1">
                This week's pulse — <SentimentBadge sentiment={trends.sentiment} />
              </div>
              <p className="text-[13px] text-[#94A3B8]">{trends.summary}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Trending Topics */}
        <Card>
          <SectionTitle>Trending Topics</SectionTitle>
          {trends?.trending_topics?.length ? (
            <div>{trends.trending_topics.map(t => <Tag key={t} text={t} variant="teal" />)}</div>
          ) : (
            <p className="text-[#64748B] text-sm">Run trend_intel.py to populate</p>
          )}
        </Card>

        {/* Trending Compounds */}
        <Card>
          <SectionTitle>Trending Compounds</SectionTitle>
          {trends?.trending_compounds?.length ? (
            <div>{trends.trending_compounds.map(c => <Tag key={c} text={c} variant="amber" />)}</div>
          ) : (
            <p className="text-[#64748B] text-sm">No compound data yet</p>
          )}
        </Card>

        {/* Post Winners */}
        <Card>
          <SectionTitle>Top Performing Peptides</SectionTitle>
          {winners?.winners?.length ? (
            <div>
              {winners.winners.map((w, i) => (
                <div key={w} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                  <span className="text-lg">{['🥇','🥈','🥉'][i] ?? '🏅'}</span>
                  <span className="text-[13px] font-semibold text-[#F1F5F9]">{w}</span>
                </div>
              ))}
              {winners.updated && (
                <p className="text-[10px] text-[#475569] mt-3">Updated: {winners.updated}</p>
              )}
            </div>
          ) : (
            <p className="text-[#64748B] text-sm">Post more content to see winners</p>
          )}
        </Card>

        {/* Performance Insights */}
        <Card>
          <SectionTitle>Performance Insights</SectionTitle>
          {perf?.insight ? (
            <div className="space-y-3">
              <p className="text-[13px] text-[#94A3B8]">{perf.insight}</p>
              {perf.best_time && (
                <div className="text-[12px] text-[#64748B]">Best posting time: <span className="text-[#14B8A6] font-semibold">{perf.best_time}</span></div>
              )}
              {perf.top_hashtags?.length && (
                <div>
                  <div className="text-[11px] text-[#64748B] mb-1">Top hashtags</div>
                  <div>{perf.top_hashtags.slice(0, 6).map(h => <Tag key={h} text={h} />)}</div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[#64748B] text-sm">Run social_performance.py to populate</p>
          )}
        </Card>
      </div>

      {/* Viral Hooks */}
      {trends?.viral_hooks?.length ? (
        <Card>
          <SectionTitle>Viral Hook Templates (adapt for posts)</SectionTitle>
          <div className="space-y-2">
            {trends.viral_hooks.map((h, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                <span className="text-[#14B8A6] font-bold text-sm min-w-[20px]">{i + 1}.</span>
                <span className="text-[13px] text-[#F1F5F9]">{h}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* Top Questions */}
      {trends?.top_questions?.length ? (
        <Card>
          <SectionTitle>Questions Your Audience Is Asking</SectionTitle>
          <div className="space-y-2">
            {trends.top_questions.map((q, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                <span className="text-amber-400 font-bold text-sm min-w-[20px]">Q</span>
                <span className="text-[13px] text-[#94A3B8]">{q}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* Top Reddit Posts */}
      {trends?.top_posts?.length ? (
        <Card>
          <SectionTitle>Top Reddit Posts This Week</SectionTitle>
          <div className="space-y-2">
            {trends.top_posts.slice(0, 8).map((p, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                <div className="min-w-[48px] text-center">
                  <div className="text-[13px] font-bold text-[#14B8A6]">{p.score}</div>
                  <div className="text-[9px] text-[#475569]">pts</div>
                </div>
                <div>
                  <div className="text-[12px] text-[#F1F5F9]">{p.title}</div>
                  <div className="text-[10px] text-[#475569] mt-0.5">r/{p.subreddit} · {p.comments} comments</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* Agent status */}
      <Card className="border-dashed">
        <SectionTitle>Agent Schedule</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px]">
          <div className="p-3 bg-white/[0.02] rounded-lg">
            <div className="font-semibold text-[#F1F5F9] mb-1">trend_intel.py</div>
            <div className="text-[#64748B]">Every Monday 5:30am UTC</div>
            <div className="text-[#14B8A6] text-[11px] mt-1">Reddit → AI extract → memory/trend_intel.json</div>
          </div>
          <div className="p-3 bg-white/[0.02] rounded-lg">
            <div className="font-semibold text-[#F1F5F9] mb-1">social_performance.py</div>
            <div className="text-[#64748B]">Every Monday 8am UTC</div>
            <div className="text-[#14B8A6] text-[11px] mt-1">Buffer GraphQL → memory/post_winners.json</div>
          </div>
          <div className="p-3 bg-white/[0.02] rounded-lg">
            <div className="font-semibold text-[#F1F5F9] mb-1">content_engine.py</div>
            <div className="text-[#64748B]">Tue / Thu / Sat 7am UTC</div>
            <div className="text-[#14B8A6] text-[11px] mt-1">Reads trend_intel → viral hook → carousel</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
