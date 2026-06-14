import PageHeader from "@/components/PageHeader";

const METRICS = [
  { label: "Users (7d)",    value: "—" },
  { label: "Sessions (7d)", value: "—" },
  { label: "Bounce Rate",   value: "—" },
  { label: "Avg Session",   value: "—" },
  { label: "Page Views",    value: "—" },
  { label: "Conversions",   value: "—" },
];

export default function AnalyticsPage() {
  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="📊 Analytics"
        subtitle="GA4 live traffic — irishpeptides.ie"
        badge={{ label: "Not connected", ok: false }}
      />

      {/* Connect banner */}
      <div className="bg-[#1C1C1C] border border-[#14B8A6]/20 rounded-xl p-6 mb-6">
        <div className="text-base font-bold text-[#F1F5F9] mb-2">Connect Google Analytics 4</div>
        <div className="text-[13px] text-[#94A3B8] mb-4">
          Property ID: <code className="text-[#14B8A6] bg-white/[0.05] px-2 py-0.5 rounded">G-4XJ8V62DSN</code>
        </div>
        <ol className="space-y-2 text-[13px] text-[#94A3B8]">
          <li><span className="text-[#14B8A6] font-semibold">1.</span> Google Cloud Console → Create Service Account → Grant Viewer role</li>
          <li><span className="text-[#14B8A6] font-semibold">2.</span> Download JSON key → paste as single line in secrets</li>
          <li><span className="text-[#14B8A6] font-semibold">3.</span> Add <code className="text-[#14B8A6]">GA4_SERVICE_ACCOUNT_JSON</code> and <code className="text-[#14B8A6]">GA4_PROPERTY_ID</code></li>
        </ol>
      </div>

      {/* Metrics grid — empty state */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4 mb-6">
        {METRICS.map(m => (
          <div key={m.label} className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-4">
            <div className="text-[11px] text-[#64748B] uppercase tracking-wide mb-2">{m.label}</div>
            <div className="text-2xl font-bold text-[#334155]">{m.value}</div>
            <div className="text-[11px] text-[#475569] mt-1">Connect GA4</div>
          </div>
        ))}
      </div>

      {/* Top pages placeholder */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
        <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-4">Top Pages</div>
        <div className="space-y-2">
          {["/", "/about.html", "/calculators/reconstitution", "/blog", "/coaching"].map(p => (
            <div key={p} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
              <span className="text-[13px] text-[#64748B] font-mono">{p}</span>
              <span className="text-[13px] text-[#334155]">—</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
