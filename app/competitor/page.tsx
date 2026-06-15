import PageHeader from '@/components/PageHeader'

const COMPETITORS = [
  {
    name: 'Peptide Sciences (US)',
    url: 'peptidesciences.com',
    region: 'US/Global',
    strengths: ['Large catalogue', 'Strong affiliate', 'CoA downloads'],
    weaknesses: ['No Irish presence', 'US focus', 'No EU shipping clarity'],
    pricePoint: '$$',
    threat: 'Medium',
  },
  {
    name: 'Swiss Chems (CH)',
    url: 'swisschems.is',
    region: 'EU/Global',
    strengths: ['EU-based', 'Good SEO', 'Regular sales'],
    weaknesses: ['Generic branding', 'No Irish content', 'Site feels dated'],
    pricePoint: '$$',
    threat: 'High',
  },
  {
    name: 'Amino Asylum (US)',
    url: 'aminoasylum.shop',
    region: 'US',
    strengths: ['Active community', 'Social presence', 'Broad range'],
    weaknesses: ['US only', 'No EU compliance', 'Limited SEO'],
    pricePoint: '$',
    threat: 'Low',
  },
  {
    name: 'Enhanced Athlete (IE/UK)',
    url: 'enhancedathlete.com',
    region: 'IE/UK',
    strengths: ['YouTube presence', 'Irish audience', 'Brand recognition'],
    weaknesses: ['Not peptide-focused', 'Legal issues history', 'Broad scope'],
    pricePoint: '$$$',
    threat: 'Medium',
  },
  {
    name: 'Direct Peptides (EU)',
    url: 'directpeptides.com',
    region: 'EU',
    strengths: ['EU-focused', 'Clean site', 'CoA available'],
    weaknesses: ['No Irish SEO', 'Limited content', 'No community'],
    pricePoint: '$$',
    threat: 'High',
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

export default function CompetitorPage() {
  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="🎯 Competitor Monitor"
        subtitle="Irish + EU peptide seller landscape"
        badge={{ label: `${COMPETITORS.length} competitors tracked`, ok: true }}
      />

      {/* Auto-crawl notice */}
      <div className="mb-6 bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-4">
        <div className="text-[12px] text-[#94A3B8]">
          <strong className="text-[#F1F5F9]">Competitor Monitor Agent</strong> runs Monday 9am UTC via GitHub Actions.
          It crawls top competitors, detects new products, price changes, and content updates.
          Last crawl results appear in Agent Network once the workflow has run.
        </div>
      </div>

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
