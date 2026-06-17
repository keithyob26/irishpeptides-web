'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/PageHeader'

interface Outcome {
  id: string
  agent: string
  action: string
  content?: string
  status: string
  created_at: string
  published_at?: string
  token?: string
  type?: string
  title?: string
  slug?: string
  image_url?: string
  video_url?: string
  scheduled_date?: string
  hashtags?: string[]
  channels?: string[]
  skills_used?: string[]
  tools_used?: string[]
  model?: string
  meta_title?: string
  meta_description?: string
  keywords?: string[]
  read_time?: number
}

type ContentType = 'all' | 'blog' | 'social' | 'newsletter'

const TYPE_COLORS: Record<string, string> = {
  blog:       'text-[#14B8A6] bg-[#14B8A6]/10 border-[#14B8A6]/25',
  blog_post:  'text-[#14B8A6] bg-[#14B8A6]/10 border-[#14B8A6]/25',
  social:     'text-[#A78BFA] bg-[#A78BFA]/10 border-[#A78BFA]/25',
  social_post:'text-[#A78BFA] bg-[#A78BFA]/10 border-[#A78BFA]/25',
  instagram:  'text-[#A78BFA] bg-[#A78BFA]/10 border-[#A78BFA]/25',
  tiktok:     'text-[#F472B6] bg-[#F472B6]/10 border-[#F472B6]/25',
  newsletter: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/25',
  tool_idea:  'text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/25',
}

const STATUS_COLORS: Record<string, string> = {
  pending_approval: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/25',
  approved:         'text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/25',
  published:        'text-[#14B8A6] bg-[#14B8A6]/10 border-[#14B8A6]/25',
  rejected:         'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/25',
  completed:        'text-[#64748B] bg-white/[0.04] border-white/[0.07]',
}

const STATUS_LABEL: Record<string, string> = {
  pending_approval: 'Pending',
  approved:         'Approved',
  published:        'Published',
  rejected:         'Rejected',
  completed:        'Completed',
}

const AI_SYSTEM_COLORS: Record<string, string> = {
  'Gemini':      'text-[#4285F4] bg-[#4285F4]/10 border-[#4285F4]/25',
  'DeepSeek':    'text-[#06B6D4] bg-[#06B6D4]/10 border-[#06B6D4]/25',
  'Claude':      'text-[#D97706] bg-[#D97706]/10 border-[#D97706]/25',
  'ChatGPT':     'text-[#10A37F] bg-[#10A37F]/10 border-[#10A37F]/25',
  'Google Flow': 'text-[#FBBC04] bg-[#FBBC04]/10 border-[#FBBC04]/25',
}

const REGEN_MODEL_COLORS: Record<string, string> = {
  gemini:   'bg-[#4285F4]/20 border-[#4285F4]/50 text-[#4285F4]',
  deepseek: 'bg-[#06B6D4]/20 border-[#06B6D4]/50 text-[#06B6D4]',
  claude:   'bg-[#D97706]/20 border-[#D97706]/50 text-[#D97706]',
}

function detectType(o: Outcome): string {
  if (o.type) return o.type
  const action = o.action?.toLowerCase() || ''
  const agent  = o.agent?.toLowerCase() || ''
  if (action.includes('newsletter') || agent.includes('newsletter')) return 'newsletter'
  if (action.includes('blog') || agent.includes('blog')) return 'blog'
  if (action.includes('tiktok') || agent.includes('tiktok')) return 'tiktok'
  if (action.includes('instagram') || action.includes('social') || agent.includes('social')) return 'social'
  return 'social'
}

function isSocialType(type: string): boolean {
  return ['social', 'social_post', 'instagram', 'tiktok'].includes(type)
}

function detectAISystem(o: Outcome): string {
  const model = (o.model || '').toLowerCase()
  const skills = (o.skills_used || []).join(' ').toLowerCase()
  if (model.includes('gemini') || skills.includes('gemini')) return 'Gemini'
  if (model.includes('deepseek') || skills.includes('deepseek')) return 'DeepSeek'
  if (model.includes('claude') || skills.includes('claude')) return 'Claude'
  if (model.includes('gpt') || skills.includes('chatgpt') || skills.includes('openai')) return 'ChatGPT'
  if (skills.includes('google-flow') || skills.includes('flow')) return 'Google Flow'
  if (model) return model.split('-')[0].charAt(0).toUpperCase() + model.split('-')[0].slice(1)
  return ''
}

function typeLabel(t: string): string {
  if (t === 'blog_post') return 'Blog'
  if (t === 'social_post') return 'Social'
  if (t === 'tool_idea') return 'Tool Idea'
  return t.charAt(0).toUpperCase() + t.slice(1)
}

function decodeEmoji(text: string | undefined): string {
  if (!text) return ''
  return text.replace(/u\{([0-9A-Fa-f]+)\}/gi, (_, hex) => {
    try { return String.fromCodePoint(parseInt(hex, 16)) } catch { return '' }
  })
}

function ImagePreview({ src }: { src: string }) {
  const [err, setErr] = useState(false)
  if (!src) return null
  if (err) return (
    <div className="rounded-lg border border-white/[0.07] bg-[#1C2026] px-3 py-2 inline-flex items-center gap-2">
      <span className="text-lg">🖼</span>
      <span className="text-[10px] text-[#475569] truncate max-w-[240px]">{src.split('/').pop()}</span>
      <a href={src} target="_blank" rel="noopener noreferrer"
        className="text-[10px] text-[#14B8A6] hover:underline shrink-0">Open ↗</a>
    </div>
  )
  return (
    <img src={src} alt="Content preview"
      className="rounded-lg max-h-48 w-auto object-cover border border-white/[0.07]"
      onError={() => setErr(true)}
    />
  )
}

export default function ContentStudioPage() {
  const router = useRouter()
  const [outcomes, setOutcomes] = useState<Outcome[]>([])
  const [sha, setSha] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [publishResult, setPublishResult] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<ContentType>('all')
  const [error, setError] = useState('')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [autoApprovedCount, setAutoApprovedCount] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [creatingPost, setCreatingPost] = useState(false)
  const [createResult, setCreateResult] = useState('')
  const [regenModel, setRegenModel] = useState<Record<string, string>>({})
  const [regenerating, setRegenerating] = useState<Record<string, boolean>>({})
  const [regenResult, setRegenResult] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/outcomes')
      const data = await res.json()
      setSha(data.sha || '')
      const all: Outcome[] = (data.outcomes || []).filter(
        (o: Outcome) => ['pending_approval', 'approved', 'published', 'rejected'].includes(o.status)
          || o.agent?.toLowerCase().includes('content')
          || o.agent?.toLowerCase().includes('social')
          || o.agent?.toLowerCase().includes('newsletter')
          || o.agent?.toLowerCase().includes('blog')
          || o.agent?.toLowerCase().includes('scraper')
      )
      setOutcomes(all)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Auto-approve non-social pending items (blogs, tools, SEO fixes go live immediately)
  useEffect(() => {
    if (loading) return
    const toAutoApprove = outcomes.filter(o => {
      if (o.status !== 'pending_approval') return false
      return !isSocialType(detectType(o))
    })
    if (toAutoApprove.length === 0) return

    let active = true
    ;(async () => {
      for (const o of toAutoApprove) {
        if (!active) break
        const type = detectType(o)
        try {
          await fetch('/api/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: o.id, action: 'approve', type,
              content: o.content || '',
              title: o.title || o.action,
              slug: (o.slug || (o.action || '').replace(/\s+/g, '-').toLowerCase()).slice(0, 60),
              date: o.scheduled_date || new Date().toISOString().split('T')[0],
            }),
          })
        } catch {}
      }
      if (active) {
        setAutoApprovedCount(c => c + toAutoApprove.length)
        setTimeout(load, 1500)
      }
    })()
    return () => { active = false }
  }, [outcomes, loading, load])

  async function handleCreatePost() {
    if (!newPostContent.trim()) return
    setCreatingPost(true)
    setCreateResult('')
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `manual-${Date.now()}`,
          action: 'approve',
          type: 'social',
          content: newPostContent,
          title: newPostContent.slice(0, 60),
          slug: 'manual-post',
          date: new Date().toISOString().split('T')[0],
        }),
      })
      const result = await res.json()
      if (result.error) {
        setCreateResult(`Error: ${result.error}`)
      } else {
        setCreateResult('✓ Queued via Buffer!')
        setNewPostContent('')
        setTimeout(() => { setShowCreate(false); setCreateResult(''); load() }, 2000)
      }
    } catch (e) {
      setCreateResult(`Error: ${String(e)}`)
    } finally {
      setCreatingPost(false)
    }
  }

  async function handleRegenerate(o: Outcome) {
    const model = regenModel[o.id] || 'gemini'
    setRegenerating(prev => ({ ...prev, [o.id]: true }))
    setRegenResult(prev => ({ ...prev, [o.id]: '' }))
    try {
      const res = await fetch('/api/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: o.id, model }),
      })
      const result = await res.json()
      if (result.error) {
        setRegenResult(prev => ({ ...prev, [o.id]: `Error: ${result.error}` }))
      } else {
        setRegenResult(prev => ({ ...prev, [o.id]: `✓ Rewritten with ${result.model}` }))
        setTimeout(load, 1500)
      }
    } catch (e) {
      setRegenResult(prev => ({ ...prev, [o.id]: `Error: ${String(e)}` }))
    } finally {
      setRegenerating(prev => ({ ...prev, [o.id]: false }))
    }
  }

  // Social/newsletter only in pending queue — blogs/tools/SEO auto-publish
  const pending = outcomes.filter(o =>
    o.status === 'pending_approval' && isSocialType(detectType(o))
  )
  const history = outcomes.filter(o => o.status !== 'pending_approval')

  const filtered = (list: Outcome[]) =>
    filter === 'all' ? list : list.filter(o => {
      const t = detectType(o)
      if (filter === 'blog') return t === 'blog' || t === 'blog_post'
      if (filter === 'social') return ['social', 'social_post', 'instagram', 'tiktok'].includes(t)
      return t === filter
    })

  async function decide(o: Outcome, action: 'approve' | 'reject', reason?: string) {
    setProcessing(o.id)
    setRejectingId(null)
    setRejectReason('')
    setPublishResult(prev => ({ ...prev, [o.id]: '' }))
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: o.id,
          action,
          type: detectType(o),
          content: o.content || '',
          title: o.title || o.action,
          slug: o.slug || (o.action || '').replace(/\s+/g, '-').toLowerCase().slice(0, 60),
          date: o.scheduled_date || new Date().toISOString().split('T')[0],
          sha,
          outcomes,
          reason: reason || '',
        }),
      })
      const result = await res.json()
      setPublishResult(prev => ({
        ...prev,
        [o.id]: result.error ? `Error: ${result.error}` : (action === 'approve' ? '✓ Approved & published' : '✗ Rejected'),
      }))
      setTimeout(load, 1500)
    } catch (e) {
      setPublishResult(prev => ({ ...prev, [o.id]: `Error: ${String(e)}` }))
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <PageHeader
        title="Content Studio"
        subtitle="Social posts need approval — blogs, tools, SEO auto-publish"
      />

      {/* Auto-approve banner */}
      {autoApprovedCount > 0 && (
        <div className="mb-4 px-4 py-3 bg-[#22C55E]/5 border border-[#22C55E]/20 rounded-xl text-[12px] text-[#22C55E]">
          ✓ {autoApprovedCount} blog/tool/SEO item{autoApprovedCount > 1 ? 's' : ''} auto-published — no approval needed
        </div>
      )}

      {/* Filter tabs + New Post button */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'blog', 'social', 'newsletter'] as ContentType[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-[11px] font-semibold rounded-lg border transition-all ${
                filter === f
                  ? 'bg-[#14B8A6]/15 border-[#14B8A6]/40 text-[#14B8A6]'
                  : 'bg-white/[0.03] border-white/[0.07] text-[#64748B] hover:text-[#94A3B8]'
              }`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreate(true)}
          className="px-4 py-1.5 text-[12px] font-semibold rounded-lg bg-[#A78BFA]/10 border border-[#A78BFA]/30 text-[#A78BFA] hover:bg-[#A78BFA]/20 transition-all">
          + New Post
        </button>
      </div>

      {loading && <div className="text-[#475569] text-[13px]">Loading content…</div>}
      {error  && <div className="text-[#EF4444] text-[12px]">Error: {error}</div>}

      {!loading && !error && (
        <>
          {/* Pending — social/newsletter only */}
          {filtered(pending).length > 0 && (
            <div className="mb-8">
              <div className="text-[11px] font-semibold text-[#F59E0B] uppercase tracking-wide mb-3">
                Pending Approval ({filtered(pending).length}) — Social Posts
              </div>
              <div className="space-y-4">
                {filtered(pending).map(o => {
                  const type = detectType(o)
                  const aiSystem = detectAISystem(o)
                  const isExpanded = expanded === o.id
                  const selectedModel = regenModel[o.id] || 'gemini'
                  return (
                    <div key={o.id} className="bg-[#1C1C1C] border border-[#F59E0B]/30 rounded-xl overflow-hidden">
                      <div className="flex items-start justify-between gap-4 p-5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TYPE_COLORS[type] || TYPE_COLORS.social}`}>
                              {typeLabel(type)}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[o.status]}`}>
                              {STATUS_LABEL[o.status] || o.status}
                            </span>
                            {aiSystem && (
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${AI_SYSTEM_COLORS[aiSystem] || 'text-[#64748B] bg-white/[0.04] border-white/[0.07]'}`}>
                                {aiSystem}
                              </span>
                            )}
                            <span className="text-[10px] text-[#475569]">{o.agent}</span>
                            <span className="text-[10px] text-[#475569]">{new Date(o.created_at).toLocaleString()}</span>
                          </div>
                          <div className="text-[14px] font-semibold text-[#F1F5F9] mb-1">
                            {decodeEmoji(o.title || o.action)}
                          </div>
                        </div>
                        <button
                          onClick={() => setExpanded(isExpanded ? null : o.id)}
                          className="text-[11px] text-[#64748B] hover:text-[#14B8A6] transition-colors shrink-0 mt-1"
                        >
                          {isExpanded ? 'Collapse ▲' : 'Expand ▼'}
                        </button>
                      </div>

                      {o.content && (
                        <div className={`px-5 pb-0 transition-all ${isExpanded ? '' : 'max-h-24 overflow-hidden'}`}>
                          <div className="text-[12px] text-[#94A3B8] bg-[#161616] rounded-lg p-4 whitespace-pre-wrap leading-relaxed">
                            {decodeEmoji(o.content)}
                          </div>
                        </div>
                      )}

                      {o.image_url && (
                        <div className="px-5 pt-3">
                          <ImagePreview src={o.image_url} />
                        </div>
                      )}

                      {o.video_url && (
                        <div className="px-5 pt-3">
                          <a href={o.video_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[12px] bg-[#161616] border border-white/[0.07] rounded-lg px-3 py-2 text-[#14B8A6] hover:border-[#14B8A6]/40 transition-colors">
                            ▶ View video
                          </a>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-3 p-5 pt-4">
                        <div className="text-[11px]">
                          {publishResult[o.id] && (
                            <span className={publishResult[o.id].includes('Error') ? 'text-[#EF4444]' : 'text-[#22C55E]'}>
                              {publishResult[o.id]}
                            </span>
                          )}
                          {type === 'newsletter' ? (
                            <span className="text-[#475569]">→ Send via Resend</span>
                          ) : (
                            <span className="text-[#475569]">→ Schedule via Buffer</span>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => decide(o, 'approve')}
                            disabled={processing === o.id}
                            className="px-5 py-2 text-[12px] font-semibold rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] hover:bg-[#22C55E]/20 transition-all disabled:opacity-50"
                          >
                            {processing === o.id ? '…' : '✓ Approve & Publish'}
                          </button>
                          <button
                            onClick={() => setRejectingId(rejectingId === o.id ? null : o.id)}
                            disabled={processing === o.id}
                            className="px-4 py-2 text-[12px] font-semibold rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/20 transition-all disabled:opacity-50"
                          >
                            {processing === o.id ? '…' : '✗ Reject'}
                          </button>
                        </div>
                      </div>

                      {rejectingId === o.id && (
                        <div className="px-5 pb-4">
                          <div className="bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-lg p-3">
                            <div className="text-[11px] font-semibold text-[#EF4444] mb-2">Rejection reason — agent rewrites based on this</div>
                            <textarea
                              value={rejectReason}
                              onChange={e => setRejectReason(e.target.value)}
                              placeholder="e.g. Too salesy, needs more evidence-based tone. Focus on research, not hype."
                              rows={2}
                              className="w-full bg-[#161616] border border-white/[0.07] rounded-lg px-3 py-2 text-[12px] text-[#F1F5F9] placeholder-[#475569] outline-none focus:border-[#EF4444]/40 resize-none"
                            />
                            <div className="flex gap-2 mt-2">
                              <button onClick={() => decide(o, 'reject', rejectReason)}
                                className="px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/20">
                                Confirm Reject
                              </button>
                              <button onClick={() => setRejectingId(null)} className="text-[11px] text-[#475569] hover:text-[#F1F5F9]">Cancel</button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* AI Regenerate toggle — visible when expanded */}
                      {isExpanded && (
                        <div className="px-5 pb-3">
                          <div className="bg-[#161616] border border-white/[0.07] rounded-lg p-3">
                            <div className="text-[11px] font-semibold text-[#94A3B8] mb-2">Regenerate with AI</div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {(['gemini', 'deepseek', 'claude'] as const).map(m => (
                                <button
                                  key={m}
                                  onClick={() => setRegenModel(prev => ({ ...prev, [o.id]: m }))}
                                  className={`px-3 py-1 text-[10px] font-semibold rounded-full border transition-all ${
                                    selectedModel === m
                                      ? REGEN_MODEL_COLORS[m]
                                      : 'bg-white/[0.03] border-white/[0.07] text-[#64748B] hover:text-[#94A3B8]'
                                  }`}>
                                  {m.charAt(0).toUpperCase() + m.slice(1)}
                                </button>
                              ))}
                              <button
                                onClick={() => handleRegenerate(o)}
                                disabled={regenerating[o.id]}
                                className="ml-auto px-4 py-1.5 text-[11px] font-semibold rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 text-[#8B5CF6] hover:bg-[#8B5CF6]/20 disabled:opacity-40 transition-all"
                              >
                                {regenerating[o.id] ? '…Generating' : '↻ Regenerate'}
                              </button>
                            </div>
                            {regenResult[o.id] && (
                              <div className={`mt-2 text-[11px] ${regenResult[o.id].includes('Error') ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
                                {regenResult[o.id]}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {isExpanded && (o.channels?.length || o.hashtags?.length || o.skills_used?.length || o.model) && (
                        <div className="px-5 pb-4 space-y-2">
                          {o.model && <div className="flex items-center gap-2"><span className="text-[10px] text-[#475569] w-16">Model:</span><span className="text-[10px] px-2 py-0.5 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20">{o.model}</span></div>}
                          {o.channels?.length ? <div className="flex items-center gap-2 flex-wrap"><span className="text-[10px] text-[#475569] w-16">Channels:</span>{o.channels.map(c=><span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20">{c}</span>)}</div> : null}
                          {o.hashtags?.length ? <div className="flex items-center gap-2 flex-wrap"><span className="text-[10px] text-[#475569] w-16">Tags:</span><div className="text-[10px] text-[#94A3B8]">{o.hashtags.slice(0,8).map(h => `#${h}`).join(' ')}</div></div> : null}
                          {o.skills_used?.length ? <div className="flex items-center gap-2 flex-wrap"><span className="text-[10px] text-[#475569] w-16">Skills:</span>{o.skills_used.map(s=><span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">{s}</span>)}</div> : null}
                          {o.keywords?.length ? <div className="flex items-center gap-2 flex-wrap"><span className="text-[10px] text-[#475569] w-16">Keywords:</span><div className="text-[10px] text-[#94A3B8]">{o.keywords!.join(', ')}</div></div> : null}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* History */}
          {filtered(history).length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-3">
                History ({filtered(history).length})
              </div>
              <div className="space-y-2">
                {filtered(history).map(o => {
                  const type = detectType(o)
                  const aiSystem = detectAISystem(o)
                  return (
                    <div key={o.id} className="bg-[#161616] border border-white/[0.05] rounded-lg px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${TYPE_COLORS[type] || TYPE_COLORS.social}`}>
                            {typeLabel(type).toUpperCase()}
                          </span>
                          {aiSystem && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${AI_SYSTEM_COLORS[aiSystem] || 'text-[#64748B] bg-white/[0.04] border-white/[0.07]'}`}>
                              {aiSystem.toUpperCase()}
                            </span>
                          )}
                          <span className="text-[12px] text-[#F1F5F9] truncate">
                            {decodeEmoji(o.title || o.action)}
                          </span>
                          <span className="text-[11px] text-[#475569]">{o.agent}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-[#475569]">{new Date(o.created_at).toLocaleDateString()}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[o.status] || STATUS_COLORS.completed}`}>
                            {STATUS_LABEL[o.status] || o.status}
                          </span>
                        </div>
                      </div>
                      {o.content && (
                        <div className="text-[11px] text-[#64748B] mt-1.5 truncate">
                          {decodeEmoji(o.content.slice(0, 120))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-8 flex items-center gap-4">
        <button onClick={() => router.push('/calendar')}
          className="text-[12px] text-[#14B8A6] hover:underline">
          View Content Calendar →
        </button>
        <button onClick={load} className="text-[12px] text-[#475569] hover:text-[#14B8A6] transition-colors">
          ↺ Refresh
        </button>
      </div>

      {/* New Post Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6 w-full max-w-lg">
            <div className="text-[14px] font-bold text-[#F1F5F9] mb-1">Create Social Post</div>
            <div className="text-[11px] text-[#475569] mb-4">Publishes directly via Buffer — no approval queue</div>
            <textarea
              value={newPostContent}
              onChange={e => setNewPostContent(e.target.value)}
              placeholder="Write your post here… include hashtags at the end."
              rows={5}
              className="w-full bg-[#161616] border border-white/[0.07] rounded-lg px-4 py-3 text-[13px] text-[#F1F5F9] placeholder-[#475569] outline-none focus:border-[#14B8A6]/40 resize-none mb-4"
            />
            <div className="flex gap-3 justify-end items-center">
              <span className="text-[11px] text-[#475569]">{newPostContent.length}/500</span>
              <button onClick={() => { setShowCreate(false); setCreateResult('') }}
                className="text-[12px] text-[#475569] hover:text-[#F1F5F9]">Cancel</button>
              <button onClick={handleCreatePost}
                disabled={!newPostContent.trim() || creatingPost}
                className="px-5 py-2 text-[12px] font-semibold rounded-lg bg-[#14B8A6]/10 border border-[#14B8A6]/30 text-[#14B8A6] hover:bg-[#14B8A6]/20 disabled:opacity-40 transition-all">
                {creatingPost ? '…Publishing' : '▶ Publish via Buffer'}
              </button>
            </div>
            {createResult && (
              <div className={`mt-3 text-[12px] ${createResult.includes('Error') ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
                {createResult}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
