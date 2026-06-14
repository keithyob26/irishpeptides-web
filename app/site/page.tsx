import PageHeader from "@/components/PageHeader";

const PAGES = [
  { path: "/",             title: "Home",         status: "live" },
  { path: "/about.html",   title: "About",        status: "live" },
  { path: "/coaching",     title: "Coaching",     status: "live" },
  { path: "/blog",         title: "Blog",         status: "live" },
  { path: "/free-tools",   title: "Free Tools",   status: "live" },
  { path: "/calculators",  title: "Calculators",  status: "live" },
  { path: "/contact.html", title: "Contact",      status: "live" },
  { path: "/faq.html",     title: "FAQ",          status: "live" },
];

export default function SitePage() {
  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="🌐 Site Control"
        subtitle="irishpeptides.ie · keithyob26/irishpeptides-website"
        badge={{ label: "GitHub connected", ok: true }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Edit file */}
        <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
          <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-3">Edit File</div>
          <input
            type="text"
            placeholder="File path — e.g. index.html"
            className="w-full bg-[#161616] border border-white/[0.07] rounded-lg px-3 py-2 text-[13px] text-[#F1F5F9] placeholder-[#475569] outline-none mb-2 focus:border-[#14B8A6]/50"
            disabled
          />
          <textarea
            placeholder="File content will load here…"
            rows={6}
            className="w-full bg-[#161616] border border-white/[0.07] rounded-lg px-3 py-2 text-[12px] font-mono text-[#F1F5F9] placeholder-[#475569] outline-none resize-none focus:border-[#14B8A6]/50"
            disabled
          />
          <button className="mt-2 w-full py-2.5 rounded-lg text-[13px] font-semibold text-[#0A0F1E] opacity-50"
                  style={{ background: "#14B8A6" }} disabled>
            Commit to GitHub
          </button>
          <p className="text-[11px] text-[#475569] mt-2">Requires Jarvis at localhost:8502</p>
        </div>

        {/* Site pages */}
        <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
          <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-3">Pages</div>
          <div className="space-y-1">
            {PAGES.map(p => (
              <div key={p.path} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                <div>
                  <span className="text-[13px] text-[#F1F5F9]">{p.title}</span>
                  <span className="text-[11px] text-[#475569] ml-2 font-mono">{p.path}</span>
                </div>
                <span className="status-dot status-green"></span>
              </div>
            ))}
          </div>
          <a href="https://irishpeptides.ie" target="_blank" rel="noreferrer"
             className="text-[12px] text-[#14B8A6] hover:underline mt-3 inline-block">
            ↗ Open irishpeptides.ie
          </a>
        </div>
      </div>

      {/* Commit log */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
        <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-3">Recent Commits</div>
        <div className="space-y-2">
          {[
            "Fix: Streamlit Cloud compatibility -- cross-platform paths",
            "Task 4: Site QA Agent -- Playwright tests + Notion task helpers",
            "Task 2: Full visual content pipeline -- Imagen 4 + Veo 3 + MoviePy",
          ].map((msg, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-white/[0.04] last:border-0">
              <span className="text-[#14B8A6] font-mono text-[11px] mt-0.5">●</span>
              <span className="text-[12px] text-[#94A3B8]">{msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
