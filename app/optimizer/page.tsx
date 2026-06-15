import PageHeader from '@/components/PageHeader'

const SEO_GAPS = [
  {
    keyword: 'BPC-157 Ireland buy',
    intent: 'Commercial',
    volume: '~320/mo',
    difficulty: 'Low',
    action: 'Create dedicated /bpc-157-ireland-buy landing page with local signals',
    priority: 'High',
  },
  {
    keyword: 'TB-500 Ireland',
    intent: 'Commercial',
    volume: '~210/mo',
    difficulty: 'Low',
    action: 'Create /tb-500-ireland page — compare BPC-157 vs TB-500 for injury repair',
    priority: 'High',
  },
  {
    keyword: 'peptides for healing Ireland',
    intent: 'Informational',
    volume: '~90/mo',
    difficulty: 'Low',
    action: 'Blog post: best healing peptides for athletes in Ireland — hub page',
    priority: 'Medium',
  },
  {
    keyword: 'buy peptides online Ireland',
    intent: 'Commercial',
    volume: '~170/mo',
    difficulty: 'Medium',
    action: 'Optimize homepage for this exact match + create FAQ schema',
    priority: 'High',
  },
  {
    keyword: 'sermorelin Ireland',
    intent: 'Commercial',
    volume: '~60/mo',
    difficulty: 'Low',
    action: 'Category page for GH peptides — sermorelin, ipamorelin, GHRP-6',
    priority: 'Medium',
  },
  {
    keyword: 'peptides legal Ireland',
    intent: 'Informational',
    volume: '~140/mo',
    difficulty: 'Low',
    action: 'FAQ page: Are peptides legal in Ireland? Clear legal framework + disclaimer',
    priority: 'High',
  },
]

const TECH_ISSUES = [
  { issue: 'No hreflang tag for Irish market', severity: 'Medium', fix: 'Add hreflang="en-IE" to all pages' },
  { issue: 'Missing FAQ schema on product pages', severity: 'High', fix: 'Add FAQPage JSON-LD to BPC-157 and TB-500 pages' },
  { issue: 'No sitemap.xml verified in GSC', severity: 'High', fix: 'Submit sitemap.xml to Google Search Console' },
  { issue: 'Images missing alt text', severity: 'Medium', fix: 'Add descriptive alt text with target keywords' },
  { issue: 'Page speed mobile score <60', severity: 'High', fix: 'Compress hero images, defer non-critical JS' },
  { issue: 'No local business schema', severity: 'Medium', fix: 'Add LocalBusiness JSON-LD with Irish address and phone' },
]

const PRIORITY_COLOR: Record<string, string> = {
  High:   '#EF4444',
  Medium: '#F59E0B',
  Low:    '#22C55E',
}

export default function OptimizerPage() {
  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="🔍 Optimizer"
        subtitle="SEO keyword gaps and technical recommendations"
        badge={{ label: `${SEO_GAPS.filter(g => g.priority === 'High').length} high priority`, ok: false }}
      />

      {/* Connect GSC notice */}
      <div className="mb-6 bg-[#14B8A6]/10 border border-[#14B8A6]/25 rounded-xl p-4">
        <div className="text-[12px] text-[#14B8A6]">
          <strong>Connect Google Search Console</strong> — add <code className="bg-[#14B8A6]/10 px-1 rounded">GA4_SERVICE_ACCOUNT_JSON</code> to Vercel to see live GSC keyword data. Recommendations below are based on market research.
        </div>
      </div>

      {/* Keyword Gaps */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6 mb-6">
        <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-4">
          Keyword Opportunities ({SEO_GAPS.length})
        </div>
        <div className="space-y-3">
          {SEO_GAPS.map((g, i) => (
            <div key={i} className="border border-white/[0.05] rounded-lg p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="text-[13px] font-semibold text-[#F1F5F9] mb-0.5">{g.keyword}</div>
                  <div className="flex gap-3 text-[11px]">
                    <span className="text-[#64748B]">Intent: <span className="text-[#94A3B8]">{g.intent}</span></span>
                    <span className="text-[#64748B]">Volume: <span className="text-[#94A3B8]">{g.volume}</span></span>
                    <span className="text-[#64748B]">Difficulty: <span className="text-[#94A3B8]">{g.difficulty}</span></span>
                  </div>
                </div>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{ color: PRIORITY_COLOR[g.priority], background: PRIORITY_COLOR[g.priority] + '20' }}
                >
                  {g.priority}
                </span>
              </div>
              <div className="text-[12px] text-[#14B8A6] bg-[#14B8A6]/05 border border-[#14B8A6]/15 rounded-lg px-3 py-2">
                → {g.action}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Issues */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
        <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-4">
          Technical Issues ({TECH_ISSUES.length})
        </div>
        <div className="space-y-3">
          {TECH_ISSUES.map((t, i) => (
            <div key={i} className="flex items-start gap-3 border-b border-white/[0.04] pb-3 last:border-0 last:pb-0">
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                style={{ color: PRIORITY_COLOR[t.severity], background: PRIORITY_COLOR[t.severity] + '20' }}
              >
                {t.severity}
              </span>
              <div>
                <div className="text-[12px] font-medium text-[#F1F5F9] mb-0.5">{t.issue}</div>
                <div className="text-[11px] text-[#64748B]">Fix: {t.fix}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
