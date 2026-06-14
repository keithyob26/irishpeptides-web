import PageHeader from "@/components/PageHeader";

const DRAFTS = [
  { slug: "tb-500-vs-bpc-157-what-the-research-actually", date: "2026-06-14", type: "blog", status: "in_progress" },
  { slug: "bpc-157-evidence-overview-first-post",         date: "2026-06-14", type: "social", status: "draft"       },
];

const CALENDAR = [
  { date: "2026-06-17", type: "blog",      topic: "TB-500 vs BPC-157: What the research actually compares", status: "in_progress" },
  { date: "2026-06-17", type: "instagram", topic: "3 recovery metrics you should track",                    status: "pending" },
  { date: "2026-06-17", type: "tiktok",    topic: "What is Ipamorelin? 60-second breakdown",                status: "pending" },
  { date: "2026-06-19", type: "blog",      topic: "Protein timing: Does the anabolic window actually matter?", status: "pending" },
  { date: "2026-06-21", type: "blog",      topic: "BPC-157 and gut health: reviewing the animal study evidence", status: "pending" },
];

const statusColor: Record<string, string> = {
  in_progress: "text-[#14B8A6] bg-[#14B8A6]/10 border-[#14B8A6]/25",
  pending:     "text-[#64748B] bg-white/[0.04] border-white/[0.07]",
  draft:       "text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/25",
  approved:    "text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/25",
};

export default function ContentPage() {
  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="✍️ Content Studio"
        subtitle="Blog · Instagram · TikTok · Newsletter"
        badge={{ label: "Engine active", ok: true }}
      />

      {/* Generate section */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6 mb-6">
        <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-3">Generate Content</div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Topic — e.g. BPC-157 for joint recovery…"
            className="flex-1 bg-[#161616] border border-white/[0.07] rounded-lg px-4 py-3 text-[13px] text-[#F1F5F9] placeholder-[#475569] outline-none focus:border-[#14B8A6]/50"
            disabled
          />
          <button className="px-5 py-3 rounded-lg text-[13px] font-semibold text-[#0A0F1E] shrink-0"
                  style={{ background: "#14B8A6" }}>
            Generate
          </button>
        </div>
        <p className="text-[11px] text-[#475569] mt-2">Requires Jarvis at localhost:8502</p>
      </div>

      {/* Content calendar */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6 mb-6">
        <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-4">Content Calendar — Week 1</div>
        <div className="space-y-2">
          {CALENDAR.map((item, i) => (
            <div key={i} className="flex items-center gap-4 py-2.5 border-b border-white/[0.04] last:border-0">
              <span className="text-[12px] text-[#64748B] font-mono w-24 shrink-0">{item.date}</span>
              <span className="text-[11px] uppercase tracking-wide text-[#475569] w-16 shrink-0">{item.type}</span>
              <span className="text-[13px] text-[#94A3B8] flex-1 truncate">{item.topic}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${statusColor[item.status] ?? statusColor.pending}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent drafts */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
        <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-4">Recent Drafts</div>
        <div className="space-y-2">
          {DRAFTS.map(d => (
            <div key={d.slug} className="flex items-center gap-4 py-2.5 border-b border-white/[0.04] last:border-0">
              <span className="text-[11px] uppercase tracking-wide text-[#475569] w-12 shrink-0">{d.type}</span>
              <span className="text-[13px] text-[#94A3B8] flex-1 truncate font-mono text-[12px]">{d.slug}</span>
              <span className="text-[12px] text-[#64748B]">{d.date}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColor[d.status] ?? statusColor.pending}`}>
                {d.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
