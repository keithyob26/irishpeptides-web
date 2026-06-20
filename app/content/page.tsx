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
  instagram:  'text-[#A78BFA] bg-[#A78BFA]/10 border-[#A78BFA]/25',
  tiktok:     'text-[#F472B6] bg-[#F472B6]/10 border-[#F472B6]/25',
  newsletter: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/25',
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

function typeLabel(t: string): string {
  if (t === 'blog_post') return 'Blog'
  return t.charAt(0).toUpperCase() + t.slice(1)
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
      )
      setOutcomes(all)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const pending = outcomes.filter(o => o.status === 'pending_approval')
  const history = outcomes.filter(o => o.status !== 'pending_approval')

  const filtered = (list: Outcome[]) =>
    filter === 'all' ? list : list.filter(o => {
      const t = detectType(o)
      if (filter === 'blog') return t === 'blog' || t === 'blog_post'
      if (filter === 'social') return ['social', 'instagram', 'tiktok'].includes(t)
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
          slug: o.slug || o.action?.replace(/\s+/g, '-').toLowerCase().slice(0, 60),
          date: o.scheduled_date || new Date().toISOString().split('T')[0],
          reason: reason || undefined,
        }),
      })
      const data = await res.json()
      const msg = action === 'reject'
        ? `Rejected${reason ? ' — agent will rewrite' : ''}`
        : (data.status === 'published' ? 'Published ✓' : 'Approved (publish pending)')
      setPublishResult(prev => ({ ...prev, [o.id]: msg }))
      setOutcomes(prev => prev.map(item =>
        item.id === o.id ? { ...item, status: data.status || (action === 'reject' ? 'rejected' : 'approved') } : item
      ))
    } catch (e) {
      setPublishResult(prev => ({ ...prev, [o.id]: `Error: ${String(e).slice(0, 80)}` }))
    } finally {
      setProcessing(null)
    }
  }

  const pendingCount = pending.length

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="Content Studio"
        subtitle="Blog · Instagram · TikTok · Newsletter · Approval flow"
        badge={{ label: pendingCount > 0 ? `${pendingCount} pending` : 'All clear', ok: pendingCount === 0 }}
      />

      {error && (
        <div className="mb-4 text-[12px] text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg px-4 py-3">{error}</div>
      )}

      {/* Type filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'blog', 'social', 'newsletter'] as ContentType[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-[11px] px-3 py-1.5 rounded-full border transition-all capitalize ${
              filter === f
                ? 'bg-[#14B8A6]/10 border-[#14B8A6]/30 text-[#14B8A6]'
                : 'border-white/[0.07] text-[#64748B] hover:text-[#F1F5F9]'
            }`}>
            {f === 'all' ? `All (${outcomes.length})` : f}
          </button>
        ))}
        <button onClick={load} className="ml-auto text-[11px] text-[#475569] hover:text-[#14B8A6] transition-colors">↺ Refresh</button>
      </div>

      {loading ? (
        <div className="text-[13px] text-[#64748B]">Loading content…</div>
      ) : outcomes.length === 0 ? (
        <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-8 text-center">
          <div className="text-3xl mb-3">✍️</div>
          <div className="text-[14px] font-semibold text-[#F1F5F9] mb-1">No content yet</div>
          <div className="text-[12px] text-[#64748B]">Agents will push content here when generated. Run content_engine.py to generate.</div>
        </div>
      ) : (
        <>
          {/* Pending approval */}
          {filtered(pending).length > 0 && (
            <div className="mb-8">
              <div className="text-[11px] font-semibold text-[#F59E0B] uppercase tracking-wide mb-3">
                Pending Approval ({filtered(pending).length})
              </div>
              <div className="space-y-4">
                {filtered(pending).map(o => {
                  const type = detectType(o)
                  const isExpanded = expanded === o.id
                  return (
                    <div key={o.id} className="bg-[#1C1C1C] border border-[#F59E0B]/30 rounded-xl overflow-hidden">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4 p-5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TYPE_COLORS[type] || TYPE_COLORS.social}`}>
                              {typeLabel(type)}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[o.status]}`}>
                              {STATUS_LABEL[o.status] || o.status}
                            </span>
                            <span className="text-[10px] text-[#475569]">{o.agent}</span>
                            <span className="text-[10px] text-[#475569]">{new Date(o.created_at).toLocaleString()}</span>
                          </div>
                          <div className="text-[14px] font-semibold text-[#F1F5F9] mb-1">{o.title || o.action}</div>
                        </div>
                        <button
                          onClick={() => setExpanded(isExpanded ? null : o.id)}
                          className="text-[11px] text-[#64748B] hover:text-[#14B8A6] transition-colors shrink-0 mt-1"
                        >
                          {isExpanded ? 'Collapse ▲' : 'Expand ▼'}
                        </button>
                      </div>

                      {/* Content preview — always show a snippet */}
                      {o.content && (
                        <div className={`px-5 pb-0 transition-all ${isExpanded ? '' : 'max-h-24 overflow-hidden'}`}>
                          <div className="text-[12px] text-[#94A3B8] bg-[#161616] rounded-lg p-4 whitespace-pre-wrap leading-relaxed">
                            {o.content}
                          </div>
                        </div>
                      )}

                      {/* Image preview */}
                      {isExpanded && o.image_url && (
                        <div className="px-5 pt-3">
                          <img src={o.image_url} alt="Content preview"
                            className="rounded-lg max-h-64 object-cover border border-white/[0.07]"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        </div>
                      )}

                      {/* Video link */}
                      {isExpanded && o.video_url && (
                        <div className="px-5 pt-3">
                          <a href={o.video_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[12px] text-[#14B8A6] hover:underline">
                            ▶ View video
                          </a>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center justify-between gap-3 p-5 pt-4">
                        <div className="text-[11px]">
                          {publishResult[o.id] && (
                            <span className={publishResult[o.id].includes('Error') ? 'text-[#EF4444]' : 'text-[#22C55E]'}>
                              {publishResult[o.id]}
                            </span>
                          )}
                          {type === 'blog' || type === 'blog_post' ? (
                            <span className="text-[#475569]">→ GitHub commit to irishpeptides-website</span>
                          ) : type === 'newsletter' ? (
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

                      {/* Reject reason */}
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

                      {/* Metadata */}
                      {isExpanded && (o.channels?.length || o.hashtags?.length || o.skills_used?.length || o.model) && (
                        <div className="px-5 pb-4 space-y-2">
                          {o.model && <div className="flex items-center gap-2"><span className="text-[10px] text-[#475569] w-16">Model:</span><span className="text-[10px] px-2 py-0.5 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20">{o.model}</span></div>}
                          {o.channels?.length && <div className="flex items-center gap-2 flex-wrap"><span className="text-[10px] text-[#475569] w-16">Channels:</span>{o.channels.map(c=><span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20">{c}</span>)}</div>}
                          {o.hashtags?.length && <div className="flex items-center gap-2 flex-wrap"><span className="text-[10px] text-[#475569] w-16">Tags:</span><div className="text-[10px] text-[#94A3B8]">{o.hashtags.slice(0,8).join(' ')}</div></div>}
                          {o.skills_used?.length && <div className="flex items-center gap-2 flex-wrap"><span className="text-[10px] text-[#475569] w-16">Skills:</span>{o.skills_used.map(s=><span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">{s}</span>)}</div>}
                          {o.keywords?.length && <div className="flex items-center gap-2 flex-wrap"><span className="text-[10px] text-[#475569] w-16">Keywords:</span><div className="text-[10px] text-[#94A3B8]">{o.keywords!.join(', ')}</div></div>}
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
                  return (
                    <div key={o.id} className="bg-[#161616] border border-white/[0.05] rounded-lg px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${TYPE_COLORS[type] || TYPE_COLORS.social}`}>
                            {typeLabel(type).toUpperCase()}
                          </span>
                          <span className="text-[12px] text-[#F1F5F9] truncate">{o.title || o.action}</span>
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
                        <div className="text-[11px] text-[#64748B] mt-1.5 truncate">{o.content.slice(0, 120)}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Quality Chain checker */}
      <QualityChain />

      {/* Navigate to calendar */}
      <div className="mt-8 flex items-center gap-4">
        <button onClick={() => router.push('/calendar')}
          className="text-[12px] text-[#14B8A6] hover:underline">
          View Content Calendar →
        </button>
        <button onClick={load} className="text-[12px] text-[#475569] hover:text-[#14B8A6] transition-colors">
          ↺ Refresh
        </button>
      </div>
    </div>
  )
}

interface QualityStep {
  id: string
  label: string
  icon: string
  pass?: boolean
  issues?: string[]
  suggestion?: string
  score?: number
}

function QualityChain() {
  const [content, setContent] = useState('')
  const [running, setRunning] = useState(false)
  const [steps, setSteps] = useState<QualityStep[]>([])
  const [overallPass, setOverallPass] = useState<boolean | null>(null)

  async function runCheck() {
    if (!content.trim()) return
    setRunning(true)
    setSteps([])
    setOverallPass(null)
    try {
      const r = await fetch('/api/quality-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const d = await r.json()
      setSteps(d.steps || [])
      setOverallPass(d.overall_pass ?? false)
    } catch (e) {
      setSteps([{ id: 'error', label: 'Error', icon: '❌', pass: false, issues: [String(e)] }])
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6 mt-8">
      <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-1">Quality & Compliance Chain</div>
      <div className="text-[12px] text-[#475569] mb-4">
        Paste content to run through Legal → Protocol Guard → Quality review
      </div>

      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Paste blog post, caption, or TikTok script here…"
        rows={5}
        className="w-full bg-[#161616] border border-white/[0.07] rounded-lg px-3 py-2.5 text-[13px] text-[#F1F5F9] placeholder-[#334155] focus:outline-none focus:border-[#14B8A6]/50 resize-none mb-3"
      />

      <button
        onClick={runCheck}
        disabled={running || !content.trim()}
        className="px-5 py-2 bg-[#14B8A6] text-[#0F172A] text-[12px] font-semibold rounded-lg disabled:opacity-40 hover:bg-[#0D9488] transition-colors mb-6"
      >
        {running ? 'Checking…' : 'Run Quality Chain'}
      </button>

      {/* Pipeline steps */}
      {(running || steps.length > 0) && (
        <div className="space-y-3">
          {/* Show placeholders while running */}
          {running && steps.length === 0 && (
            ['Legal Compliance', 'Protocol Guard', 'Quality Review'].map((label, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-[#161616] rounded-lg border border-white/[0.05]">
                <div className="w-5 h-5 rounded-full border-2 border-[#14B8A6] border-t-transparent animate-spin" />
                <span className="text-[13px] text-[#475569]">{label}</span>
              </div>
            ))
          )}

          {steps.map(step => (
            <div key={step.id} className={`p-4 rounded-lg border ${step.pass ? 'bg-[#10B981]/5 border-[#10B981]/20' : 'bg-[#EF4444]/5 border-[#EF4444]/20'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span>{step.icon}</span>
                  <span className="text-[13px] font-medium text-[#F1F5F9]">{step.label}</span>
                  {step.score !== undefined && (
                    <span className="text-[11px] text-[#64748B]">Score: {step.score}/10</span>
                  )}
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${step.pass ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-[#EF4444]/15 text-[#EF4444]'}`}>
                  {step.pass ? '✓ Pass' : '✗ Fail'}
                </span>
              </div>
              {step.issues && step.issues.length > 0 && (
                <div className="text-[12px] text-[#EF4444] mb-1.5 space-y-0.5">
                  {step.issues.map((issue, i) => <div key={i}>• {issue}</div>)}
                </div>
              )}
              {step.suggestion && (
                <div className="text-[12px] text-[#94A3B8] italic">{step.suggestion}</div>
              )}
            </div>
          ))}

          {overallPass !== null && (
            <div className={`p-3 rounded-lg text-center font-semibold text-[13px] ${overallPass ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' : 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20'}`}>
              {overallPass ? '✓ Content ready for approval' : '✗ Issues found — revise before publishing'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
