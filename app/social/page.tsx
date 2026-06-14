import PageHeader from "@/components/PageHeader";

export default function SocialPage() {
  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="📣 Social Hub"
        subtitle="Buffer scheduling · ManyChat keyword triggers"
        badge={{ label: "Partial — Buffer missing", ok: false }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Buffer */}
        <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[13px] font-semibold text-[#F1F5F9]">📅 Buffer</div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/25">
              Not connected
            </span>
          </div>
          <p className="text-[12px] text-[#64748B] mb-4">
            Add <code className="text-[#14B8A6]">BUFFER_ACCESS_TOKEN</code> to connect Buffer and see scheduled posts.
          </p>
          <div className="space-y-2">
            {["Instagram", "TikTok"].map(p => (
              <div key={p} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                <span className="text-[13px] text-[#94A3B8]">{p}</span>
                <span className="text-[12px] text-[#334155]">— posts pending</span>
              </div>
            ))}
          </div>
          <a href="https://publish.buffer.com" target="_blank" rel="noreferrer"
             className="text-[12px] text-[#14B8A6] hover:underline mt-3 inline-block">
            ↗ Open Buffer
          </a>
        </div>

        {/* ManyChat */}
        <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[13px] font-semibold text-[#F1F5F9]">💬 ManyChat</div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/25">
              401 Unauthorized
            </span>
          </div>
          <p className="text-[12px] text-[#64748B] mb-4">
            API key present but returning 401. Regenerate key at ManyChat dashboard.
          </p>
          <div className="space-y-2">
            {["IRISH", "PEPTIDES", "COACH", "BLUEPRINT"].map(kw => (
              <div key={kw} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                <code className="text-[12px] text-[#14B8A6]">{kw}</code>
                <span className="text-[12px] text-[#334155]">— triggers</span>
              </div>
            ))}
          </div>
          <a href="https://app.manychat.com" target="_blank" rel="noreferrer"
             className="text-[12px] text-[#14B8A6] hover:underline mt-3 inline-block">
            ↗ Open ManyChat
          </a>
        </div>
      </div>

      {/* First post status */}
      <div className="mt-6 bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-xl p-5">
        <div className="text-[12px] font-semibold text-[#F59E0B] mb-2">First Post — Awaiting Publish</div>
        <p className="text-[12px] text-[#94A3B8]">
          BPC-157 myth bust written. Status: <code>DRAFT — DO NOT PUBLISH</code>.
          Review at <code className="text-[#14B8A6]">content_drafts/first_post/instagram_caption.md</code> then approve.
        </p>
      </div>
    </div>
  );
}
