import PageHeader from '@/components/PageHeader'

const VAT_THRESHOLD = 37500 // Ireland VAT registration threshold (EUR)

const MILESTONES = [
  { label: 'VAT Registration',  threshold: 37500,  desc: 'Mandatory VAT registration at €37,500 revenue' },
  { label: 'Stripe Payout',     threshold: 100,    desc: 'First Stripe payout after €100 processed' },
  { label: 'Ad Eligibility',    threshold: 1000,   desc: 'Google AdSense eligibility at €1,000/month' },
  { label: 'Affiliate Tier 2',  threshold: 5000,   desc: 'Higher commission brackets open at €5k/month' },
]

const AFFILIATE_PROGRAMS = [
  { name: 'Peptide Sciences',   commission: '10%', status: 'not_joined', url: '#' },
  { name: 'Swiss Chems',        commission: '8%',  status: 'not_joined', url: '#' },
  { name: 'Amino Asylum',       commission: '12%', status: 'not_joined', url: '#' },
  { name: 'Amazon Associates',  commission: '3%',  status: 'not_joined', url: '#' },
]

export default function RevenuePage() {
  const stripeConnected = !!(process.env.STRIPE_API_KEY)

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="💰 Revenue"
        subtitle="Stripe, VAT monitor, affiliate tracker"
        badge={{ label: stripeConnected ? 'Stripe connected' : 'Stripe not connected', ok: stripeConnected }}
      />

      {/* Stripe connection notice */}
      {!stripeConnected && (
        <div className="mb-6 bg-[#F59E0B]/10 border border-[#F59E0B]/25 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <div className="text-[13px] font-semibold text-[#F59E0B] mb-1">Stripe not connected</div>
              <div className="text-[12px] text-[#94A3B8] mb-3">
                Add <code className="text-[#14B8A6]">STRIPE_API_KEY</code> to Vercel environment variables to see live revenue data.
              </div>
              <a
                href="https://vercel.com/keithyob26/irishpeptides-web/settings/environment-variables"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-[#14B8A6] hover:underline"
              >
                → Open Vercel env settings
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Revenue KPIs (placeholders until Stripe connected) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Revenue MTD',      value: '—',    sub: 'Month to date'    },
          { label: 'Revenue YTD',      value: '—',    sub: 'Year to date'     },
          { label: 'Avg Order Value',  value: '—',    sub: 'Last 30 days'     },
          { label: 'VAT Distance',     value: `€${VAT_THRESHOLD.toLocaleString()}`, sub: 'To VAT threshold' },
        ].map(k => (
          <div key={k.label} className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-4">
            <div className="text-[11px] text-[#64748B] uppercase tracking-wide mb-2">{k.label}</div>
            <div className="text-2xl font-bold text-[#F1F5F9]">{k.value}</div>
            <div className="text-[11px] text-[#64748B] mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* VAT Threshold Monitor */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6 mb-6">
        <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-4">
          VAT Threshold Monitor
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] text-[#F1F5F9]">Ireland VAT threshold (goods/services)</span>
          <span className="text-[13px] font-bold text-[#F1F5F9]">€37,500</span>
        </div>
        <div className="h-2 bg-[#161616] rounded-full mb-2 overflow-hidden">
          <div className="h-full bg-[#14B8A6] rounded-full" style={{ width: '0%' }} />
        </div>
        <div className="text-[11px] text-[#64748B]">
          0% · €0 of €37,500 · Connect Stripe to see live progress
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
          <div className="bg-[#161616] rounded-lg p-3">
            <div className="text-[#64748B] mb-1">Standard VAT rate</div>
            <div className="text-[#F1F5F9] font-semibold">23%</div>
          </div>
          <div className="bg-[#161616] rounded-lg p-3">
            <div className="text-[#64748B] mb-1">Reduced (food supps)</div>
            <div className="text-[#F1F5F9] font-semibold">0% or 13.5%</div>
          </div>
        </div>
      </div>

      {/* Revenue Milestones */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6 mb-6">
        <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-4">
          Revenue Milestones
        </div>
        <div className="space-y-3">
          {MILESTONES.map(m => (
            <div key={m.label} className="flex items-center gap-4">
              <span className="status-dot status-grey shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[13px] text-[#F1F5F9] font-medium">{m.label}</span>
                  <span className="text-[12px] text-[#64748B]">€{m.threshold.toLocaleString()}</span>
                </div>
                <div className="text-[11px] text-[#64748B]">{m.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Affiliate Programs */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
        <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-4">
          Affiliate Programs
        </div>
        <div className="grid grid-cols-2 gap-3">
          {AFFILIATE_PROGRAMS.map(a => (
            <div key={a.name} className="bg-[#161616] border border-white/[0.05] rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] font-semibold text-[#F1F5F9]">{a.name}</span>
                <span className="text-[11px] text-[#14B8A6] font-bold">{a.commission}</span>
              </div>
              <span className="text-[10px] text-[#475569]">Not joined</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
