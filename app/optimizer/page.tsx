'use client'

import { useState } from 'react'
import PageHeader from '@/components/PageHeader'

interface SeoGap {
  keyword: string
  intent: string
  volume: string
  difficulty: string
  action: string
  priority: string
  who: string
  isAuto: boolean
}

interface TechIssue {
  issue: string
  severity: string
  fix: string
  who: string
  isAuto: boolean
}

const SEO_GAPS: SeoGap[] = [
  { keyword: 'BPC-157 Ireland buy', intent: 'Commercial', volume: '~320/mo', difficulty: 'Low', action: 'Create dedicated /bpc-157-ireland-buy landing page with local signals', priority: 'High', who: 'Content Studio agent', isAuto: true },
  { keyword: 'TB-500 Ireland', intent: 'Commercial', volume: '~210/mo', difficulty: 'Low', action: 'Create /tb-500-ireland page — compare BPC-157 vs TB-500 for injury repair', priority: 'High', who: 'Content Studio agent', isAuto: true },
  { keyword: 'peptides for healing Ireland', intent: 'Informational', volume: '~90/mo', difficulty: 'Low', action: 'Blog post: best healing peptides for athletes in Ireland — hub page', priority: 'Medium', who: 'Content Studio agent', isAuto: true },
  { keyword: 'buy peptides online Ireland', intent: 'Commercial', volume: '~170/mo', difficulty: 'Medium', action: 'Optimize homepage for this exact match + create FAQ schema', priority: 'High', who: 'Manual — needs site edit', isAuto: false },
  { keyword: 'sermorelin Ireland', intent: 'Commercial', volume: '~60/mo', difficulty: 'Low', action: 'Category page for GH peptides — sermorelin, ipamorelin, GHRP-6', priority: 'Medium', who: 'Content Studio agent', isAuto: true },
  { keyword: 'peptides legal Ireland', intent: 'Informational', volume: '~140/mo', difficulty: 'Low', action: 'FAQ page: Are peptides legal in Ireland? Clear legal framework + disclaimer', priority: 'High', who: 'Content Studio agent', isAuto: true },
]

const TECH_ISSUES: TechIssue[] = [
  { issue: 'No hreflang tag for Irish market', severity: 'Medium', fix: 'Add hreflang="en-IE" to all pages', who: 'Manual — site template edit', isAuto: false },
  { issue: 'Missing FAQ schema on product pages', severity: 'High', fix: 'Add FAQPage JSON-LD to BPC-157 and TB-500 pages', who: 'Manual — inject into page HTML', isAuto: false },
  { issue: 'No sitemap.xml verified in GSC', severity: 'High', fix: 'Submit sitemap.xml to Google Search Console', who: 'Manual — GSC dashboard', isAuto: false },
  { issue: 'Images missing alt text', severity: 'Medium', fix: 'Add descriptive alt text with target keywords', who: 'Content agent can generate alt tags', isAuto: true },
  { issue: 'Page speed mobile score <60', severity: 'High', fix: 'Compress hero images, defer non-critical JS', who: 'Manual — site optimisation', isAuto: false },
  { issue: 'No local business schema', severity: 'Medium', fix: 'Add LocalBusiness JSON-LD with Irish address and phone', who: 'Manual — inject into page HTML', isAuto: false },
]

const PRIORITY_COLOR: Record<string, string> = {
  High: '#EF4444', Medium: '#F59E0B', Low: '#22C55E',
}

async function approveToNotion(title: string) {
  await fetch('/api/notion-queue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `SEO Optimizer approved: ${title}`,
      checked: false,
    }),
  })
}

export default function OptimizerPage() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [approved, setApproved] = useState<Set<string>>(new Set())
  const [approving, setApproving] = useState<string | null>(null)

  const approve = async (key: string, label: string) => {
    setApproving(key)
    try {
      await approveToNotion(label)
      setApproved(prev => new Set([...prev, key]))
    } catch { /* ignore */ } finally {
      setApproving(null)
    }
  }

  const dismiss = (key: string) => setDismissed(prev => new Set([...prev, key]))

  const visibleGaps = SEO_GAPS.filter(g => !dismissed.has(g.keyword))
  const visibleIssues = TECH_ISSUES.filter(t => !dismissed.has(t.issue))

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader title="Optimizer" subtitle="SEO keyword gaps and technical recommendations"
        badge={{ label: `${SEO_GAPS.filter(g => g.priority === 'High').length} high priority`, ok: false }} />

      <div className="mb-6 bg-[#14B8A6]/10 border border-[#14B8A6]/25 rounded-xl p-4 flex items-start gap-3">
        <div className="text-[12px] text-[#94A3B8] flex-1">
          <strong className="text-[#14B8A6]">Connect Google Search Console</strong> — add <code className="bg-[#14B8A6]/10 px-1 rounded">GA4_SERVICE_ACCOUNT_JSON</code> to Vercel for live GSC keyword data.
          Recommendations below are based on market research.
        </div>
        <div className="text-[11px] text-[#64748B] shrink-0">
          <strong className="text-[#F59E0B]">Auto</strong> = handled by agent<br/>
          <strong className="text-[#94A3B8]">Manual</strong> = needs you
        </div>
      </div>

      {/* Keyword Gaps */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6 mb-6">
        <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-4">
          Keyword Opportunities ({visibleGaps.length})
        </div>
        {visibleGaps.length === 0 ? (
          <div className="text-[13px] text-[#64748B] text-center py-4">All dismissed or approved.</div>
        ) : (
          <div className="space-y-3">
            {visibleGaps.map(g => {
              const isApproved = approved.has(g.keyword)
              return (
                <div key={g.keyword} className={`border rounded-lg p-4 transition-opacity ${isApproved ? 'border-[#22C55E]/30 bg-[#22C55E]/5' : 'border-white/[0.05]'}`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-[#F1F5F9] mb-0.5">{g.keyword}</div>
                      <div className="flex gap-3 text-[11px] flex-wrap">
                        <span className="text-[#64748B]">Intent: <span className="text-[#94A3B8]">{g.intent}</span></span>
                        <span className="text-[#64748B]">Vol: <span className="text-[#94A3B8]">{g.volume}</span></span>
                        <span className="text-[#64748B]">Diff: <span className="text-[#94A3B8]">{g.difficulty}</span></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ color: PRIORITY_COLOR[g.priority], background: PRIORITY_COLOR[g.priority] + '20' }}>
                        {g.priority}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${g.isAuto ? 'bg-[#F59E0B]/20 text-[#F59E0B]' : 'bg-white/[0.07] text-[#64748B]'}`}>
                        {g.isAuto ? 'AUTO' : 'MANUAL'}
                      </span>
                    </div>
                  </div>
                  <div className="text-[12px] text-[#14B8A6] bg-[#14B8A6]/05 border border-[#14B8A6]/15 rounded-lg px-3 py-2 mb-2">
                    → {g.action}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#475569]">Handled by: {g.who}</span>
                    {!isApproved ? (
                      <div className="flex gap-1.5">
                        <button onClick={() => approve(g.keyword, g.keyword)} disabled={approving === g.keyword}
                          className="px-3 py-1 text-[11px] font-semibold rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] hover:bg-[#22C55E]/20 disabled:opacity-50 transition-all">
                          {approving === g.keyword ? '…' : '✓ Approve'}
                        </button>
                        <button onClick={() => dismiss(g.keyword)}
                          className="px-3 py-1 text-[11px] font-semibold rounded-lg bg-white/[0.05] border border-white/[0.07] text-[#64748B] hover:text-[#EF4444] hover:border-[#EF4444]/30 transition-all">
                          Dismiss
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#22C55E] font-semibold">✓ Added to Notion queue</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Technical Issues */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
        <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-4">
          Technical Issues ({visibleIssues.length})
        </div>
        {visibleIssues.length === 0 ? (
          <div className="text-[13px] text-[#64748B] text-center py-4">All dismissed or approved.</div>
        ) : (
          <div className="space-y-3">
            {visibleIssues.map(t => {
              const isApproved = approved.has(t.issue)
              return (
                <div key={t.issue} className={`border rounded-lg p-4 transition-all ${isApproved ? 'border-[#22C55E]/30 bg-[#22C55E]/5' : 'border-white/[0.05]'}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                      style={{ color: PRIORITY_COLOR[t.severity], background: PRIORITY_COLOR[t.severity] + '20' }}>
                      {t.severity}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-[#F1F5F9] mb-0.5">{t.issue}</div>
                      <div className="text-[11px] text-[#64748B] mb-2">Fix: {t.fix}</div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[#475569]">{t.who}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${t.isAuto ? 'bg-[#F59E0B]/20 text-[#F59E0B]' : 'bg-white/[0.07] text-[#64748B]'}`}>
                            {t.isAuto ? 'AUTO' : 'MANUAL'}
                          </span>
                        </div>
                        {!isApproved ? (
                          <div className="flex gap-1.5">
                            <button onClick={() => approve(t.issue, t.issue)} disabled={approving === t.issue}
                              className="px-3 py-1 text-[11px] font-semibold rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] hover:bg-[#22C55E]/20 disabled:opacity-50 transition-all">
                              {approving === t.issue ? '…' : '✓ Approve'}
                            </button>
                            <button onClick={() => dismiss(t.issue)}
                              className="px-3 py-1 text-[11px] font-semibold rounded-lg bg-white/[0.05] border border-white/[0.07] text-[#64748B] hover:text-[#EF4444] hover:border-[#EF4444]/30 transition-all">
                              Dismiss
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#22C55E] font-semibold">✓ Added to Notion queue</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
