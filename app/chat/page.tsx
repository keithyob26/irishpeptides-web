import PageHeader from "@/components/PageHeader";

export default function ChatPage() {
  return (
    <div className="p-8 max-w-4xl">
      <PageHeader
        title="💬 AI Chat"
        subtitle="Ask Jarvis anything about Irish Peptides performance"
        badge={{ label: "Gemini + DeepSeek", ok: true }}
      />

      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl overflow-hidden">
        {/* Chat history area */}
        <div className="h-[420px] p-6 overflow-y-auto flex flex-col gap-4">
          {/* Welcome message */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                 style={{ background: "#14B8A6", color: "#0A0F1E" }}>J</div>
            <div className="bg-[#161616] border border-white/[0.05] rounded-xl px-4 py-3 max-w-[80%]">
              <div className="text-[11px] text-[#14B8A6] font-semibold mb-1">Jarvis</div>
              <p className="text-[13px] text-[#E2E8F0]">
                Good morning. I&#39;m your Irish Peptides AI assistant. Ask me about site traffic, content performance,
                social stats, or anything about the business.
              </p>
            </div>
          </div>
        </div>

        {/* Model selector + input */}
        <div className="border-t border-white/[0.07] p-4">
          <div className="flex gap-2 mb-3">
            {["Gemini Flash", "DeepSeek", "Gemma 4 (Local)"].map(m => (
              <button key={m}
                className={`text-[11px] px-3 py-1.5 rounded-full border transition-all ${
                  m === "Gemini Flash"
                    ? "bg-[#14B8A6]/10 border-[#14B8A6]/30 text-[#14B8A6]"
                    : "border-white/[0.07] text-[#64748B] hover:text-[#F1F5F9]"
                }`}>
                {m}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ask Jarvis anything… e.g. How many visitors did we get this week?"
              className="flex-1 bg-[#161616] border border-white/[0.07] rounded-lg px-4 py-3 text-[13px] text-[#F1F5F9] placeholder-[#475569] outline-none focus:border-[#14B8A6]/50"
              disabled
            />
            <button className="px-4 py-3 rounded-lg text-[13px] font-semibold text-[#0A0F1E]"
                    style={{ background: "#14B8A6" }}>
              Send
            </button>
          </div>
          <p className="text-[11px] text-[#475569] mt-2">
            Live chat requires running Jarvis locally at localhost:8502
          </p>
        </div>
      </div>

      {/* Connection note */}
      <div className="mt-4 bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-xl p-4">
        <div className="text-[12px] text-[#F59E0B] font-semibold mb-1">Requires local connection</div>
        <p className="text-[12px] text-[#94A3B8]">
          AI Chat with live data requires Jarvis running at localhost:8502. This dashboard shows the UI.
          Full integration coming when API routes are added.
        </p>
      </div>
    </div>
  );
}
