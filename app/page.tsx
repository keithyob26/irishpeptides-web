import PageHeader from "@/components/PageHeader";

const KPIS = [
  { label: "Site Status",       value: "—",  sub: "Connect irishpeptides.ie" },
  { label: "GA4 Users (7d)",    value: "—",  sub: "Add GA4 service account"  },
  { label: "Newsletter Subs",   value: "—",  sub: "Add RESEND_API_KEY"        },
  { label: "Stripe Revenue",    value: "—",  sub: "Add STRIPE_API_KEY"        },
];

const AGENTS = [
  { name: "Content Engine",   schedule: "Tue/Thu/Sat 7am" },
  { name: "GA4 Monitor",      schedule: "Daily 8am"       },
  { name: "SEO Loop",         schedule: "Monday 8am"      },
  { name: "Newsletter Agent", schedule: "Sunday 10am"     },
  { name: "CFO Agent",        schedule: "Sunday 8am"      },
  { name: "Site Optimiser",   schedule: "Sunday 9am"      },
];

export default function HomePage() {
  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="🧬 Irish Peptides Command Centre"
        subtitle="irishpeptides.ie · Jarvis Dashboard"
        badge={{ label: "v1.0", ok: true }}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {KPIS.map(k => (
          <div key={k.label} className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-4">
            <div className="text-[11px] text-[#64748B] uppercase tracking-wide mb-2">{k.label}</div>
            <div className="text-2xl font-bold text-[#F1F5F9]">{k.value}</div>
            <div className="text-[11px] text-[#64748B] mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6 mb-6">
        <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-3">Morning Briefing</div>
        <div className="space-y-2 text-[13px] text-[#94A3B8]">
          <p>📊 GA4: <span className="text-[#F59E0B]">not connected</span> — add GA4_SERVICE_ACCOUNT_JSON</p>
          <p>📅 Next: <span className="text-[#F1F5F9]">2026-06-17 · Blog — TB-500 vs BPC-157</span></p>
          <p>🤖 Agents: <span className="text-[#22C55E]">6 scheduled via GitHub Actions</span></p>
          <p>📬 Newsletter: <span className="text-[#F1F5F9]">2 subscribers</span> · Resend connected</p>
        </div>
      </div>

      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
        <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-4">Scheduled Agents</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {AGENTS.map(a => (
            <div key={a.name} className="bg-[#161616] border border-white/[0.05] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="status-dot status-green"></span>
                <span className="text-[12px] font-semibold text-[#F1F5F9]">{a.name}</span>
              </div>
              <div className="text-[11px] text-[#64748B]">{a.schedule}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
