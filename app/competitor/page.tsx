'use client'

import { useEffect, useState } from 'react'
import PageHeader from '@/components/PageHeader'

const COMPETITORS = [
  {
    name: 'Direct Peptides (EU)',
    url: 'directpeptides.com',
    region: 'EU',
    strengths: ['EU-focused', 'Clean site', 'CoA available', 'Good SEO'],
    weaknesses: ['No Irish SEO', 'Limited content', 'No community', 'Generic branding'],
    pricePoint: '$$',
    threat: 'High',
  },
  {
    name: 'Enhanced Athlete (IE/UK)',
    url: 'enhancedathlete.com',
    region: 'IE/UK',
    strengths: ['YouTube presence', 'Irish audience', 'Brand recognition', 'Social following'],
    weaknesses: ['Not peptide-focused', 'Legal issues history', 'Broad scope', 'Limited IE content'],
    pricePoint: '$$$',
    threat: 'High',
  },
  {
    name: 'Swiss Chems (EU)',
    url: 'swisschems.is',
    region: 'EU',
    strengths: ['EU-based', 'Good SEO', 'Regular sales', 'Wide catalogue'],
    weaknesses: ['Generic branding', 'No Irish content', 'Site feels dated', 'No IE trust signals'],
    pricePoint: '$$',
    threat: 'Medium',
  },
  {
    name: 'Biosynth (IE/EU)',
    url: 'biosynth.com',
    region: 'IE/EU',
    strengths: ['Irish base', 'Professional site', 'Research credibility'],
    weaknesses: ['B2B focus', 'No consumer marketing', 'High price point'],
    pricePoint: '$$$',
    threat: 'Medium',
  },
  {
    name: 'Peptide Pro (UK)',
    url: 'peptidepro.co.uk',
    region: 'UK',
    strengths: ['UK market share', 'Post-Brexit positioning', 'Active socials'],
    weaknesses: ['No EU shipping clarity', 'UK-only focus', 'Limited Irish SEO'],
    pricePoint: '$$',
    threat: 'Medium',
  },
]

const CONTENT_GAPS = [
  { gap: 'No competitor has Irish-specific legal guidance page', opportunity: 'Create: Are peptides legal in Ireland? — own that keyword' },
  { gap: 'No competitor targets "buy peptides Ireland" with local trust signals', opportunity: 'Add Trustpilot, Irish address, Irish phone → outrank all' },
  { gap: 'Nobody covers EU peptide regulations vs Irish HPRA rules', opportunity: 'Blog: EU peptide grey area explained — Irish-specific' },
  { gap: 'No Irish competitor has a protocol builder tool', opportunity: 'Free tool: Peptide Protocol Builder — highest-intent conversion' },
  { gap: 'No competitor has Irish sports medicine / physio testimonials', opportunity: 'Source 3 Irish practitioners → case study content' },
]

const THREAT_COLORS: Record<string, string> = {
  High:   '#EF4444',
  Medium: '#F59E0B',
  Low:    '#22C55E',
}

interface CompetitorUpdate {
  name: string
  changes: string[]
  detected_at: string
}

export default function CompetitorPage() {
  const [updates, setUpdates] = useState<CompetitorUpdate[]>([])
  const [lastRun, setLastRun] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadUpdates()
  }, [])

  async function loadUpdates() {
    try {
      const res = await fetch('/api/outcomes')
      const data = await res.json()
      const outcomes: Record<string, unknown>[] = data.outcomes || []
      const compOutcomes = outcomes
        .filter((o: Record<string, unknown>) =>
          (o.agent as string)?.toLowerCase().includes('competitor') ||
          (o.action as string)?.toLowerCase().includes('competitor')
        )
        .slice(0, 5)

      if (compOutcomes.length > 0) {
        setLastRun(compOutcomes[0].created_at as string)
        setUpdates(compOutcomes.map((o: Record<string, unknown>) => ({
          name: (o.title as string) || 'Competitor update',
          changes: [(o.content as string || '').slice(0, 200)],
          detected_at: o.created_at as string,
        })))
      }
    } catch {}
  }

  async function triggerRefresh() {
    setRefreshing(true)
    try {
      await fetch('/api/workflow-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow: 'competitor-monitor.yml' }),
      })
    } catch {}
    setTimeout(() => setRefreshing(false), 3000)
  }

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="🎯 Competitor Monitor"
        subtitle="Ireland · UK · EU peptide seller landscape"
        badge={{ label: `${COMPETITORS.length} competitors tracked`, ok: true }}
      />

      {/* Auto-crawl notice */}
      <div className="mb-6 bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="text-[12px] text-[#94A3B8]">
            <strong className="text-[#F1F5F9]">Competitor Monitor Agent</strong> runs Monday 9am UTC via GitHub Actions.
            Crawls IE/UK/EU competitors — detects new products, price changes, content updates.
            {lastRun && (
              <span className="ml-2 text-[#475569]">Last crawl: {new Date(lastRun).toLocaleString()}</span>
            )}
          </div>
          <button
            onClick={triggerRefresh}
            disabled={refreshing}
            className="ml-4 text-[11px] px-3 py-1.5 rounded-lg border border-[#14B8A6]/30 text-[#14B8A6] hover:bg-[#14B8A6]/10 transition-all disabled:opacity-50 shrink-0"
          >
            {refreshing ? 'Triggered…' : '▶ Run now'}
          </button>
        </div>
      </div>

      {/* Agent updates */}
      {updates.length > 0 && (
        <div className="mb-6 bg-[#1C1C1C] border border-[#14B8A6]/20 rounded-xl p-5">
          <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-3">Latest Agent Findings</div>
          <div className="space-y-2">
            {updates.map((u, i) => (
              <div key={i} className="border-b border-white/[0.04] pb-2 last:border-0">
                <div className="text-[12px] font-medium text-[#F1F5F9]">{u.name}</div>
                {u.changes.map((c, j) => (
                  <div key={j} className="text-[11px] text-[#94A3B8] mt-0.5">{c}</div>
                ))}
                <div className="text-[10px] text-[#475569] mt-0.5">{new Date(u.detected_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitor cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {COMPETITORS.map(c => (
          <div key={c.name} className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-[13px] font-bold text-[#F1F5F9]">{c.name}</div>
                <div className="text-[11px] text-[#475569]">{c.url} · {c.region}</div>
              </div>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                style={{ color: THREAT_COLORS[c.threat], background: THREAT_COLORS[c.threat] + '20' }}
              >
                {c.threat} threat
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="text-[10px] text-[#22C55E] font-semibold mb-1">Strengths</div>
                <ul className="space-y-0.5">
                  {c.strengths.map(s => (
                    <li key={s} className="text-[11px] text-[#94A3B8]">· {s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-[10px] text-[#EF4444] font-semibold mb-1">Weaknesses</div>
                <ul className="space-y-0.5">
                  {c.weaknesses.map(w => (
                    <li key={w} className="text-[11px] text-[#94A3B8]">· {w}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
              <span className="text-[11px] text-[#64748B]">Price: <span className="text-[#F1F5F9]">{c.pricePoint}</span></span>
              <a href={`https://${c.url}`} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-[#14B8A6] hover:underline">
                Visit →
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Content Gaps */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
        <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-4">
          Content Gaps — Nobody Has These
        </div>
        <div className="space-y-3">
          {CONTENT_GAPS.map((g, i) => (
            <div key={i} className="border border-white/[0.05] rounded-lg p-4">
              <div className="text-[12px] text-[#94A3B8] mb-2">🎯 Gap: {g.gap}</div>
              <div className="text-[12px] text-[#22C55E]">✓ Opportunity: {g.opportunity}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
