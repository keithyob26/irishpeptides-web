import PageHeader from "@/components/PageHeader";

const KEYS = [
  { key: "GEMINI_API_KEY",          label: "Gemini",           status: "ok"      },
  { key: "DEEPSEEK_API_KEY",        label: "DeepSeek",         status: "ok"      },
  { key: "NOTION_API_KEY",          label: "Notion",           status: "ok"      },
  { key: "GITHUB_TOKEN",            label: "GitHub",           status: "ok"      },
  { key: "RESEND_API_KEY",          label: "Resend",           status: "ok"      },
  { key: "MANYCHAT_API_KEY",        label: "ManyChat",         status: "warn",   note: "401 — regenerate key" },
  { key: "GA4_SERVICE_ACCOUNT_JSON","label": "GA4",            status: "missing" },
  { key: "BUFFER_ACCESS_TOKEN",     label: "Buffer",           status: "missing" },
  { key: "ANTHROPIC_API_KEY",       label: "Anthropic",        status: "missing" },
  { key: "STRIPE_API_KEY",          label: "Stripe",           status: "missing" },
  { key: "CALLMEBOT_API_KEY",       label: "CallMeBot",        status: "missing" },
];

const statusConfig: Record<string, { dot: string; label: string }> = {
  ok:      { dot: "status-green", label: "Connected"  },
  warn:    { dot: "status-amber", label: "Warning"    },
  missing: { dot: "status-grey",  label: "Not set"    },
};

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-3xl">
      <PageHeader
        title="⚙️ Settings"
        subtitle="API keys · Token budget · Notifications"
      />

      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6 mb-6">
        <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-4">API Keys</div>
        <div className="space-y-1">
          {KEYS.map(k => {
            const sc = statusConfig[k.status];
            return (
              <div key={k.key} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`status-dot ${sc.dot}`}></span>
                  <div>
                    <span className="text-[13px] text-[#F1F5F9]">{k.label}</span>
                    <code className="text-[11px] text-[#475569] ml-2">{k.key}</code>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[12px] text-[#64748B]">{sc.label}</span>
                  {k.note && <div className="text-[11px] text-[#F59E0B]">{k.note}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Token budget */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6 mb-6">
        <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-4">Token Budget</div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Daily Cap",    value: "15,000 tokens" },
            { label: "Used Today",   value: "—"             },
            { label: "Remaining",    value: "—"             },
          ].map(t => (
            <div key={t.label} className="bg-[#161616] border border-white/[0.05] rounded-lg p-3 text-center">
              <div className="text-[11px] text-[#64748B] mb-1">{t.label}</div>
              <div className="text-base font-bold text-[#F1F5F9]">{t.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
        <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-4">Notifications</div>
        <div className="space-y-3 text-[13px]">
          <div className="flex items-center justify-between">
            <span className="text-[#94A3B8]">Email alerts</span>
            <span className="text-[#F1F5F9]">keithyob@gmail.com</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#94A3B8]">WhatsApp</span>
            <span className="text-[#F59E0B]">CallMeBot key missing</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#94A3B8]">Resend from</span>
            <span className="text-[#F1F5F9]">onboarding@resend.dev</span>
          </div>
        </div>
      </div>
    </div>
  );
}
