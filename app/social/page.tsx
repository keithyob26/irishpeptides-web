import PageHeader from "@/components/PageHeader";

export default function SocialPage() {
  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="Social Hub"
        subtitle="Buffer scheduling · ManyChat keyword triggers"
        badge={{ label: "Partial — setup needed", ok: false }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Buffer */}
        <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[13px] font-semibold text-[#F1F5F9]">Buffer — Post Scheduling</div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/25">
              Token rejected
            </span>
          </div>

          <div className="bg-[#EF4444]/5 border border-[#EF4444]/15 rounded-lg p-3 mb-4">
            <div className="text-[11px] font-semibold text-[#EF4444] mb-1">OIDC Token Rejected</div>
            <p className="text-[11px] text-[#94A3B8]">
              The <code className="text-[#14B8A6]">BUFFER_ACCESS_TOKEN</code> was rejected by Buffer&apos;s API
              — this is a standard OAuth access token, not an OIDC token. Buffer requires you to
              complete the OAuth flow directly from their developer dashboard to get a working token.
            </p>
          </div>

          <div className="space-y-2 mb-4">
            <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide">Fix steps</div>
            <ol className="space-y-1.5 text-[12px] text-[#94A3B8]">
              <li><span className="text-[#14B8A6] font-semibold">1.</span> Go to{' '}
                <a href="https://buffer.com/developers/apps" target="_blank" rel="noreferrer"
                   className="text-[#14B8A6] hover:underline">buffer.com/developers/apps</a>
              </li>
              <li><span className="text-[#14B8A6] font-semibold">2.</span> Create or open your app → copy the OAuth callback URL</li>
              <li><span className="text-[#14B8A6] font-semibold">3.</span> Run the OAuth flow:
                <code className="block mt-1 bg-[#161616] text-[#14B8A6] px-2 py-1 rounded text-[10px]">
                  GET https://buffer.com/oauth2/authorize?client_id=YOUR_ID&amp;redirect_uri=...&amp;response_type=code
                </code>
              </li>
              <li><span className="text-[#14B8A6] font-semibold">4.</span> Exchange code for access token → update <code className="text-[#14B8A6]">BUFFER_ACCESS_TOKEN</code> in Vercel</li>
            </ol>
          </div>

          <div className="space-y-2 border-t border-white/[0.07] pt-4">
            <div className="text-[11px] text-[#475569]">Connected channels (once fixed):</div>
            {['Instagram', 'TikTok', 'Facebook'].map(p => (
              <div key={p} className="flex items-center justify-between py-1.5">
                <span className="text-[13px] text-[#94A3B8]">{p}</span>
                <span className="text-[11px] text-[#334155]">Pending auth</span>
              </div>
            ))}
          </div>
          <a href="https://buffer.com/developers/apps" target="_blank" rel="noreferrer"
             className="text-[12px] text-[#14B8A6] hover:underline mt-3 inline-block">
            ↗ Buffer Developer Dashboard
          </a>
        </div>

        {/* ManyChat */}
        <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[13px] font-semibold text-[#F1F5F9]">ManyChat — DM Automations</div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/25">
              401 Unauthorized
            </span>
          </div>

          <div className="bg-[#EF4444]/5 border border-[#EF4444]/15 rounded-lg p-3 mb-4">
            <div className="text-[11px] font-semibold text-[#EF4444] mb-1">API Key Expired or Invalid</div>
            <p className="text-[11px] text-[#94A3B8]">
              ManyChat returned HTTP 401. The key in <code className="text-[#14B8A6]">MANYCHAT_API_KEY</code>{' '}
              is either expired or has been rotated. ManyChat API keys can expire — regenerate at the
              Settings page, then update the key in Vercel.
            </p>
          </div>

          <div className="space-y-2 mb-4">
            <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide">Fix steps</div>
            <ol className="space-y-1.5 text-[12px] text-[#94A3B8]">
              <li><span className="text-[#14B8A6] font-semibold">1.</span> Go to{' '}
                <a href="https://app.manychat.com/settings/api" target="_blank" rel="noreferrer"
                   className="text-[#14B8A6] hover:underline">app.manychat.com → Settings → API</a>
              </li>
              <li><span className="text-[#14B8A6] font-semibold">2.</span> Click <strong className="text-[#F1F5F9]">Regenerate</strong> → copy new key</li>
              <li><span className="text-[#14B8A6] font-semibold">3.</span> Update <code className="text-[#14B8A6]">MANYCHAT_API_KEY</code> in Vercel environment variables</li>
              <li><span className="text-[#14B8A6] font-semibold">4.</span> Redeploy Vercel to pick up new key</li>
            </ol>
          </div>

          <div className="border-t border-white/[0.07] pt-4">
            <div className="text-[11px] text-[#475569] mb-2">Keyword triggers (once fixed):</div>
            <div className="grid grid-cols-2 gap-1.5">
              {['IRISH', 'PEPTIDES', 'COACH', 'BLUEPRINT', 'BPC', 'TB500'].map(kw => (
                <div key={kw} className="flex items-center justify-between bg-[#161616] rounded-lg px-2.5 py-1.5">
                  <code className="text-[11px] text-[#14B8A6]">{kw}</code>
                  <span className="text-[10px] text-[#334155]">trigger</span>
                </div>
              ))}
            </div>
          </div>
          <a href="https://app.manychat.com/settings/api" target="_blank" rel="noreferrer"
             className="text-[12px] text-[#14B8A6] hover:underline mt-3 inline-block">
            ↗ ManyChat API Settings
          </a>
        </div>
      </div>

      {/* First post status */}
      <div className="mt-6 bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-xl p-5">
        <div className="text-[12px] font-semibold text-[#F59E0B] mb-2">First Post — Awaiting Publish</div>
        <p className="text-[12px] text-[#94A3B8]">
          BPC-157 myth bust written and quality-chain approved. Status:{' '}
          <code className="text-[#14B8A6]">DRAFT — DO NOT PUBLISH</code>.
          Review at <code className="text-[#14B8A6]">content_drafts/first_post/instagram_caption.md</code> then approve via the Approvals panel.
        </p>
      </div>

      {/* Scheduled posts placeholder */}
      <div className="mt-6 bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
        <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-4">Upcoming Scheduled Posts</div>
        <div className="text-center py-6">
          <div className="text-2xl mb-2">📅</div>
          <div className="text-[13px] text-[#64748B]">No scheduled posts — connect Buffer to manage your queue</div>
        </div>
      </div>
    </div>
  )
}
