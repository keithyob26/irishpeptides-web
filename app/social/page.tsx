'use client'

import { useEffect, useState } from 'react'
import PageHeader from '@/components/PageHeader'

interface PostRecord {
  id: string
  title?: string
  action: string
  content?: string
  status: string
  created_at: string
  published_at?: string
  type?: string
  agent?: string
}

const STATUS_COLORS: Record<string, string> = {
  published: 'text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/25',
  approved:  'text-[#14B8A6] bg-[#14B8A6]/10 border-[#14B8A6]/25',
  pending_approval: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/25',
  rejected:  'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/25',
}

export default function SocialPage() {
  const [posts, setPosts] = useState<PostRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [socialQ, setSocialQ] = useState('')
  const [socialAnswer, setSocialAnswer] = useState('')
  const [socialLoading, setSocialLoading] = useState(false)

  async function askSocial(q: string) {
    if (!q.trim()) return
    setSocialLoading(true)
    setSocialAnswer('')
    try {
      const r = await fetch('/api/ask-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, context: 'social' }),
      })
      const d = await r.json()
      setSocialAnswer(d.answer || d.error || 'No answer.')
    } catch (e) {
      setSocialAnswer('Error: ' + String(e))
    } finally {
      setSocialLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [])

  async function loadPosts() {
    setLoading(true)
    try {
      const res = await fetch('/api/outcomes')
      const data = await res.json()
      const all: PostRecord[] = (data.outcomes || []).filter((o: PostRecord) =>
        ['social', 'instagram', 'tiktok', 'facebook', 'content_engine', 'content_studio'].some(k =>
          (o.agent || '').toLowerCase().includes(k) ||
          (o.type || '').toLowerCase().includes(k) ||
          (o.action || '').toLowerCase().includes('social') ||
          (o.action || '').toLowerCase().includes('instagram') ||
          (o.action || '').toLowerCase().includes('tiktok')
        )
      )
      setPosts(all)
    } catch {}
    setLoading(false)
  }

  const published = posts.filter(p => p.status === 'published')
  const pending = posts.filter(p => p.status === 'pending_approval')
  const approved = posts.filter(p => p.status === 'approved')

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="Social Hub"
        subtitle="Buffer scheduling · ManyChat keyword triggers"
        badge={{ label: 'Disconnected — setup required', ok: false }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Buffer */}
        <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[13px] font-semibold text-[#F1F5F9]">Buffer — Post Scheduling</div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/25">
              Disconnected
            </span>
          </div>

          <div className="bg-[#F59E0B]/5 border border-[#F59E0B]/15 rounded-lg p-3 mb-4">
            <div className="text-[11px] font-semibold text-[#F59E0B] mb-1">Manual OAuth Setup Required</div>
            <p className="text-[11px] text-[#94A3B8]">
              Buffer requires OAuth token from their developer dashboard — not a standard API key.
              Complete the OAuth flow to enable Instagram, TikTok, and Facebook scheduling.
            </p>
          </div>

          <div className="space-y-2 mb-4">
            <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide">Setup steps</div>
            <ol className="space-y-1.5 text-[12px] text-[#94A3B8]">
              <li><span className="text-[#14B8A6] font-semibold">1.</span> Go to{' '}
                <a href="https://buffer.com/developers/apps" target="_blank" rel="noreferrer"
                   className="text-[#14B8A6] hover:underline">buffer.com/developers/apps</a>
              </li>
              <li><span className="text-[#14B8A6] font-semibold">2.</span> Create app — set redirect URI to your Vercel URL</li>
              <li><span className="text-[#14B8A6] font-semibold">3.</span> Run OAuth flow → exchange code for access token</li>
              <li><span className="text-[#14B8A6] font-semibold">4.</span> Update <code className="text-[#14B8A6]">BUFFER_ACCESS_TOKEN</code> in Vercel env vars</li>
            </ol>
          </div>

          <div className="space-y-2 border-t border-white/[0.07] pt-4">
            <div className="text-[11px] text-[#475569]">Connect to enable:</div>
            {['Instagram', 'TikTok', 'Facebook'].map(p => (
              <div key={p} className="flex items-center justify-between py-1.5">
                <span className="text-[13px] text-[#94A3B8]">{p}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full border text-[#475569] border-[#334155]">Not connected</span>
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
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/25">
              Disconnected
            </span>
          </div>

          <div className="bg-[#F59E0B]/5 border border-[#F59E0B]/15 rounded-lg p-3 mb-4">
            <div className="text-[11px] font-semibold text-[#F59E0B] mb-1">API Key Regeneration Required</div>
            <p className="text-[11px] text-[#94A3B8]">
              ManyChat returned 401. Regenerate the API key at ManyChat Settings then update <code className="text-[#14B8A6]">MANYCHAT_API_KEY</code> in Vercel.
            </p>
          </div>

          <div className="space-y-2 mb-4">
            <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide">Setup steps</div>
            <ol className="space-y-1.5 text-[12px] text-[#94A3B8]">
              <li><span className="text-[#14B8A6] font-semibold">1.</span> Go to{' '}
                <a href="https://app.manychat.com/settings/api" target="_blank" rel="noreferrer"
                   className="text-[#14B8A6] hover:underline">app.manychat.com/settings/api</a>
              </li>
              <li><span className="text-[#14B8A6] font-semibold">2.</span> Click <strong className="text-[#F1F5F9]">Regenerate</strong> and copy new key</li>
              <li><span className="text-[#14B8A6] font-semibold">3.</span> Update <code className="text-[#14B8A6]">MANYCHAT_API_KEY</code> in Vercel env vars</li>
              <li><span className="text-[#14B8A6] font-semibold">4.</span> Redeploy Vercel to pick up the key</li>
            </ol>
          </div>

          <div className="border-t border-white/[0.07] pt-4">
            <div className="text-[11px] text-[#475569] mb-2">Keyword triggers (once connected):</div>
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

      {/* Stats cards (placeholder until Buffer connected) */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Posts', value: posts.length || '—', sub: 'Connect Buffer for live stats' },
          { label: 'Published', value: published.length || '—', sub: 'Via Buffer once connected' },
          { label: 'Pending', value: pending.length || '—', sub: 'In approval queue' },
        ].map(s => (
          <div key={s.label} className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-4">
            <div className="text-[10px] text-[#64748B] uppercase tracking-wide mb-1">{s.label}</div>
            <div className="text-2xl font-bold text-[#F1F5F9]">{s.value}</div>
            <div className="text-[10px] text-[#475569] mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Post history */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide">Post History</div>
          <button onClick={loadPosts} className="text-[10px] text-[#475569] hover:text-[#14B8A6] transition-colors">↺ Refresh</button>
        </div>

        {loading ? (
          <div className="text-[12px] text-[#64748B]">Loading post history…</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-2xl mb-2">📝</div>
            <div className="text-[13px] text-[#64748B]">No posts yet — Content Engine generates posts on Tue/Thu/Sat 7am</div>
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map(p => (
              <div key={p.id} className="flex items-start gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-[12px] font-medium text-[#F1F5F9] truncate">{p.title || p.action}</span>
                    <span className="text-[10px] text-[#475569]">{p.type || 'social'}</span>
                  </div>
                  {p.content && (
                    <div className="text-[11px] text-[#64748B] truncate">{p.content.slice(0, 100)}</div>
                  )}
                  <div className="text-[10px] text-[#334155] mt-0.5">{new Date(p.created_at).toLocaleString()}</div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${STATUS_COLORS[p.status] || 'text-[#64748B] border-white/[0.07]'}`}>
                  {p.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ask Jarvis — social */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6 mt-6">
        <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-1">Ask Jarvis</div>
        <div className="text-[12px] text-[#475569] mb-4">Ask about your social performance in plain English</div>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={socialQ}
            onChange={e => setSocialQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && askSocial(socialQ)}
            placeholder="e.g. Which TikTok did best this week? How is Instagram growing?"
            className="flex-1 bg-[#161616] border border-white/[0.07] rounded-lg px-3 py-2 text-[13px] text-[#F1F5F9] placeholder-[#334155] focus:outline-none focus:border-[#14B8A6]/50"
          />
          <button
            onClick={() => askSocial(socialQ)}
            disabled={socialLoading || !socialQ.trim()}
            className="px-4 py-2 bg-[#14B8A6] text-[#0F172A] text-[12px] font-semibold rounded-lg disabled:opacity-40 hover:bg-[#0D9488] transition-colors"
          >
            {socialLoading ? '…' : 'Ask'}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {['Which TikTok did best this week?', 'Are people using the IRISH keyword?', 'How many emails captured this week?', 'How is my Instagram growing?'].map(q => (
            <button
              key={q}
              onClick={() => { setSocialQ(q); askSocial(q) }}
              disabled={socialLoading}
              className="text-[11px] text-[#64748B] border border-white/[0.07] rounded-full px-3 py-1 hover:border-[#14B8A6]/40 hover:text-[#94A3B8] transition-colors disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>

        {socialAnswer && (
          <div className="bg-[#161616] border border-[#14B8A6]/20 rounded-lg p-4 text-[13px] text-[#94A3B8] leading-relaxed">
            {socialAnswer}
          </div>
        )}
      </div>
    </div>
  )
}
