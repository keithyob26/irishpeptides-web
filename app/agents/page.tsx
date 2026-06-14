import PageHeader from "@/components/PageHeader";

const AGENTS = [
  {
    name: "Content Engine",
    schedule: "Tue / Thu / Sat 7am UTC",
    status: "scheduled",
    desc: "Reads calendar.md → generates blog/Instagram/TikTok/newsletter → Legal + Protocol Guard → WhatsApp approval",
    file: "agents/content_engine.py",
  },
  {
    name: "GA4 Monitor",
    schedule: "Daily 8am UTC",
    status: "scheduled",
    desc: "Pulls GA4 traffic → identifies >20% drops → WhatsApp alert → saves to memory/ga4_reports/",
    file: "agents/ga4_monitor.py",
    warning: "GA4_SERVICE_ACCOUNT_JSON missing",
  },
  {
    name: "SEO Loop",
    schedule: "Monday 8am UTC",
    status: "scheduled",
    desc: "Reads GSC data → identifies keyword gaps → generates optimisation tasks",
    file: "agents/seo_loop.py",
  },
  {
    name: "Newsletter Agent",
    schedule: "Sunday 10am UTC",
    status: "scheduled",
    desc: "Pulls top content → builds email → Resend send to subscribers",
    file: "agents/newsletter_agent.py",
  },
  {
    name: "CFO Agent",
    schedule: "Sunday 8am UTC",
    status: "scheduled",
    desc: "GA4 + Resend + affiliate metrics → revenue summary → strategic recommendations",
    file: "agents/cfo_agent.py",
  },
  {
    name: "Site Optimiser",
    schedule: "Sunday 9am UTC",
    status: "scheduled",
    desc: "GA4 conversion data → identifies underperforming pages → generates improvement tasks",
    file: "agents/site_optimiser.py",
  },
  {
    name: "Competitor Monitor",
    schedule: "Monday 9am UTC",
    status: "scheduled",
    desc: "Crawl4AI scrapes top 3 Irish supplement competitors → content gaps report",
    file: "agents/competitor_monitor.py",
  },
  {
    name: "Legal Compliance",
    schedule: "On every content piece",
    status: "active",
    desc: "Checks EU Reg 1924/2006, ASAI, CCPC compliance on all generated content",
    file: "agents/legal_compliance.py",
  },
  {
    name: "Protocol Guard",
    schedule: "On every content piece",
    status: "active",
    desc: "Adds required disclaimers, removes medical claims, enforces brand safety",
    file: "utils._ip_protocol_guard",
  },
  {
    name: "Plan Compliance Agent",
    schedule: "Sunday 8pm UTC",
    status: "not_built",
    desc: "Audits all systems against master plan. Reports what is complete vs outstanding.",
    file: "agents/plan_compliance.py",
  },
  {
    name: "Site QA Agent",
    schedule: "After every deploy",
    status: "built_not_scheduled",
    desc: "Playwright tests all pages, forms, calculators, mobile. WhatsApp alert on failure.",
    file: "qa/site_qa.py",
  },
];

const statusConfig: Record<string, { label: string; cls: string }> = {
  scheduled:           { label: "Scheduled",       cls: "text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/25" },
  active:              { label: "Active",           cls: "text-[#14B8A6] bg-[#14B8A6]/10 border-[#14B8A6]/25" },
  not_built:           { label: "Not built",        cls: "text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/25" },
  built_not_scheduled: { label: "Built / no cron", cls: "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/25" },
};

export default function AgentsPage() {
  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="🤖 Agent Network"
        subtitle="All agents — status, schedule, source file"
        badge={{ label: "9/11 operational", ok: true }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {AGENTS.map(a => {
          const sc = statusConfig[a.status];
          return (
            <div key={a.name} className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="text-[13px] font-semibold text-[#F1F5F9]">{a.name}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${sc.cls}`}>
                  {sc.label}
                </span>
              </div>
              <div className="text-[11px] text-[#64748B] mb-2">{a.schedule}</div>
              <p className="text-[12px] text-[#94A3B8] mb-2">{a.desc}</p>
              <code className="text-[10px] text-[#475569]">{a.file}</code>
              {a.warning && (
                <div className="mt-2 text-[11px] text-[#F59E0B]">⚠️ {a.warning}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
