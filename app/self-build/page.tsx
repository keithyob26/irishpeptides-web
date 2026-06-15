import PageHeader from '@/components/PageHeader'

const BUILD_CAPABILITIES = [
  {
    name: 'Plan Compliance Agent',
    file: 'agents/plan_compliance.py',
    schedule: 'Sunday 8pm UTC',
    status: 'scheduled',
    desc: 'Compares Master Plan V10 against what is actually built — emails gaps each Sunday',
  },
  {
    name: 'Protocol Guard',
    file: 'utils.py → protocol_guard()',
    schedule: 'Pre-commit hook',
    status: 'active',
    desc: 'Blocks content that violates brand safety, medical claims, EU advertising rules',
  },
  {
    name: 'Legal Compliance',
    file: 'agents/legal_compliance.py',
    schedule: 'On every post',
    status: 'active',
    desc: 'EU Regulation 1924/2006, ASAI Ireland, CCPC compliance — runs on all content before publish',
  },
]

const MASTER_PLAN_PHASES = [
  { phase: 'Phase 1', title: 'Foundation',     status: 'complete',    items: ['Domain + Vercel hosting', '19-panel Jarvis dashboard', '17 GitHub Actions agents', 'Resend newsletter', 'Notion build queue'] },
  { phase: 'Phase 2', title: 'Content Engine', status: 'in-progress', items: ['Content calendar live', 'First blog posts drafted', 'Social posts agent running', 'Newsletter agent scheduled', 'SEO keyword research done'] },
  { phase: 'Phase 3', title: 'Revenue',        status: 'planned',     items: ['Stripe integration', 'Affiliate programmes', 'Product pages', 'Cart + checkout', 'VAT compliance'] },
  { phase: 'Phase 4', title: 'Scale',          status: 'planned',     items: ['Google Ads', 'Influencer programme', 'Video pipeline', 'International EU shipping', 'B2B physio channel'] },
]

const STATUS_COLORS: Record<string, string> = {
  complete:     '#22C55E',
  'in-progress':'#14B8A6',
  planned:      '#475569',
  active:       '#14B8A6',
  scheduled:    '#22C55E',
}

export default function SelfBuildPage() {
  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="⚙️ Self Build"
        subtitle="Master Plan V10 — phase tracker + compliance agents"
        badge={{ label: 'Phase 1 complete', ok: true }}
      />

      {/* Compliance agents */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6 mb-6">
        <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-4">
          Self-Governance Agents
        </div>
        <div className="space-y-4">
          {BUILD_CAPABILITIES.map(b => (
            <div key={b.name} className="border border-white/[0.05] rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="text-[13px] font-semibold text-[#F1F5F9]">{b.name}</div>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ color: STATUS_COLORS[b.status], background: STATUS_COLORS[b.status] + '20' }}
                >
                  {b.status}
                </span>
              </div>
              <p className="text-[12px] text-[#94A3B8] mb-2">{b.desc}</p>
              <div className="flex gap-4 text-[11px]">
                <span className="text-[#64748B]">File: <code className="text-[#475569]">{b.file}</code></span>
                <span className="text-[#64748B]">Runs: <span className="text-[#F1F5F9]">{b.schedule}</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Master Plan phases */}
      <div className="space-y-4">
        {MASTER_PLAN_PHASES.map(p => (
          <div key={p.phase}
            className="bg-[#1C1C1C] border rounded-xl p-5"
            style={{ borderColor: STATUS_COLORS[p.status] + '30' }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[11px] font-bold text-[#64748B]">{p.phase}</span>
                <span className="text-[15px] font-bold text-[#F1F5F9] ml-2">{p.title}</span>
              </div>
              <span
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{ color: STATUS_COLORS[p.status], background: STATUS_COLORS[p.status] + '15', border: `1px solid ${STATUS_COLORS[p.status]}35` }}
              >
                {p.status}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              {p.items.map(item => (
                <div key={item} className="flex items-center gap-2 text-[12px]">
                  <span style={{ color: STATUS_COLORS[p.status] }}>
                    {p.status === 'complete' ? '✓' : p.status === 'in-progress' ? '◆' : '○'}
                  </span>
                  <span className={p.status === 'complete' ? 'text-[#94A3B8]' : p.status === 'in-progress' ? 'text-[#F1F5F9]' : 'text-[#475569]'}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-[11px] text-[#475569]">
        Plan compliance agent checks this every Sunday and emails gaps to keith.obeirne@greyhoundrecycling.com
      </div>
    </div>
  )
}
