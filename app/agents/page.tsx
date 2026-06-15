'use client'

import { useCallback, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  NodeProps,
  Handle,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import PageHeader from '@/components/PageHeader'

type AgentStatus = 'scheduled' | 'active' | 'not_built' | 'built_not_scheduled'

interface AgentData {
  name: string
  schedule: string
  status: AgentStatus
  desc: string
  file: string
  warning?: string
  model: string
  color: string
}

const STATUS_COLORS: Record<AgentStatus, string> = {
  scheduled:           '#22C55E',
  active:              '#14B8A6',
  not_built:           '#EF4444',
  built_not_scheduled: '#F59E0B',
}

const STATUS_LABELS: Record<AgentStatus, string> = {
  scheduled:           'Scheduled',
  active:              'Active',
  not_built:           'Not built',
  built_not_scheduled: 'Built / no cron',
}

const AGENTS_RAW: AgentData[] = [
  { name: 'Content Engine',    schedule: 'Tue/Thu/Sat 7am', status: 'scheduled',  desc: 'Generates blog, Instagram, TikTok, newsletter from calendar topics.',  file: 'agents/content_engine.py',    model: 'Gemini → DeepSeek', color: '#8B5CF6' },
  { name: 'GA4 Monitor',       schedule: 'Daily 8am UTC',   status: 'scheduled',  desc: 'Pulls GA4 traffic, alerts on >20% drops, saves reports.',              file: 'agents/ga4_monitor.py',       model: 'Gemini → DeepSeek', color: '#14B8A6' },
  { name: 'SEO Loop',          schedule: 'Monday 8am UTC',  status: 'scheduled',  desc: 'GSC keyword gaps → optimisation tasks → content suggestions.',          file: 'agents/seo_loop.py',          model: 'Gemini → DeepSeek', color: '#06B6D4' },
  { name: 'Newsletter Agent',  schedule: 'Sunday 10am UTC', status: 'scheduled',  desc: 'Builds weekly email digest, sends via Resend to subscribers.',          file: 'agents/newsletter_agent.py',  model: 'Gemini → DeepSeek', color: '#10B981' },
  { name: 'CFO Agent',         schedule: 'Sunday 8am UTC',  status: 'scheduled',  desc: 'GA4 + Resend + Stripe metrics → revenue summary + recommendations.',    file: 'agents/cfo_agent.py',         model: 'Gemini → DeepSeek', color: '#F59E0B' },
  { name: 'Site Optimiser',    schedule: 'Sunday 9am UTC',  status: 'scheduled',  desc: 'GA4 conversion data → underperforming pages → improvement tasks.',      file: 'agents/site_optimiser.py',    model: 'Gemini → DeepSeek', color: '#EF4444' },
  { name: 'Competitor Monitor',schedule: 'Monday 9am UTC',  status: 'scheduled',  desc: 'Crawls top 3 Irish supplement competitors → content gap report.',       file: 'agents/competitor_monitor.py',model: 'Gemini → DeepSeek', color: '#F472B6' },
  { name: 'Legal Compliance',  schedule: 'On every post',   status: 'active',     desc: 'EU Reg 1924/2006, ASAI, CCPC compliance check on all content.',         file: 'agents/legal_compliance.py',  model: 'Rule-based',        color: '#64748B' },
  { name: 'Protocol Guard',    schedule: 'On every post',   status: 'active',     desc: 'Adds disclaimers, removes medical claims, enforces brand safety.',       file: 'utils.py',                    model: 'Rule-based',        color: '#64748B' },
  { name: 'System Health',     schedule: 'Daily 6am UTC',   status: 'scheduled',  desc: 'Checks all API keys, services, commits health_results.json.',           file: 'agents/system_health.py',     model: 'Gemini',            color: '#EF4444' },
  { name: 'Video Pipeline',    schedule: 'Thursday 10am',   status: 'scheduled',  desc: 'Generates video scripts, thumbnails, captions from weekly topic.',      file: 'agents/video_pipeline.py',    model: 'Gemini → DeepSeek', color: '#F59E0B' },
]

function AgentNode({ data }: NodeProps<AgentData>) {
  const c = STATUS_COLORS[data.status]
  return (
    <>
      <Handle type="target" position={Position.Left} style={{ background: '#334155', border: 'none' }} />
      <div
        className="rounded-xl px-3 py-2.5 cursor-pointer transition-all"
        style={{
          background: '#161616',
          border: `1.5px solid ${data.color}44`,
          minWidth: 160,
          maxWidth: 190,
          boxShadow: `0 0 12px ${data.color}15`,
        }}
      >
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[11px] font-bold text-[#F1F5F9] truncate">{data.name}</span>
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: c, boxShadow: `0 0 6px ${c}` }}
          />
        </div>
        <div className="text-[9px] text-[#475569] truncate">{data.schedule}</div>
        {data.warning && <div className="text-[9px] text-[#F59E0B] mt-0.5 truncate">⚠ {data.warning}</div>}
      </div>
      <Handle type="source" position={Position.Right} style={{ background: '#334155', border: 'none' }} />
    </>
  )
}

const nodeTypes = { agent: AgentNode }

function buildGraph(agents: AgentData[], filter: string, search: string) {
  const filtered = agents.filter(a => {
    if (filter !== 'all' && a.status !== filter) return false
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const cols = 3
  const nodes: Node[] = filtered.map((a, i) => ({
    id: a.name,
    type: 'agent',
    position: {
      x: (i % cols) * 240 + 40,
      y: Math.floor(i / cols) * 120 + 40,
    },
    data: a,
  }))

  const edges: Edge[] = [
    { id: 'e1', source: 'Content Engine',    target: 'Legal Compliance', animated: true, style: { stroke: '#8B5CF655' } },
    { id: 'e2', source: 'Content Engine',    target: 'Protocol Guard',   animated: true, style: { stroke: '#8B5CF655' } },
    { id: 'e3', source: 'GA4 Monitor',       target: 'CFO Agent',        style: { stroke: '#14B8A644' } },
    { id: 'e4', source: 'GA4 Monitor',       target: 'Site Optimiser',   style: { stroke: '#14B8A644' } },
    { id: 'e5', source: 'SEO Loop',          target: 'Content Engine',   style: { stroke: '#06B6D444' } },
    { id: 'e6', source: 'Competitor Monitor',target: 'Content Engine',   style: { stroke: '#F472B844' } },
    { id: 'e7', source: 'System Health',     target: 'CFO Agent',        style: { stroke: '#EF444444' } },
  ].filter(e =>
    filtered.some(a => a.name === e.source) &&
    filtered.some(a => a.name === e.target)
  )

  return { nodes, edges }
}

export default function AgentsPage() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<AgentData | null>(null)

  const { nodes: initNodes, edges: initEdges } = buildGraph(AGENTS_RAW, filter, search)
  const [nodes, , onNodesChange] = useNodesState(initNodes)
  const [edges, , onEdgesChange] = useEdgesState(initEdges)

  const { nodes: fNodes, edges: fEdges } = buildGraph(AGENTS_RAW, filter, search)

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelected(node.data as AgentData)
  }, [])

  const scheduled = AGENTS_RAW.filter(a => a.status === 'scheduled').length
  const active    = AGENTS_RAW.filter(a => a.status === 'active').length

  return (
    <div className="p-8 max-w-7xl">
      <PageHeader
        title="🤖 Agent Network"
        subtitle="Interactive agent graph — click a node to inspect"
        badge={{ label: `${scheduled + active}/${AGENTS_RAW.length} operational`, ok: true }}
      />

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search agents…"
          className="bg-[#1C1C1C] border border-white/[0.07] rounded-lg px-3 py-2 text-[12px] text-[#F1F5F9] placeholder-[#475569] outline-none focus:border-[#14B8A6]/50 w-44"
        />
        {(['all', 'scheduled', 'active', 'not_built'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-[11px] px-3 py-1.5 rounded-full border transition-all ${
              filter === f
                ? 'bg-[#14B8A6]/10 border-[#14B8A6]/30 text-[#14B8A6]'
                : 'border-white/[0.07] text-[#64748B] hover:text-[#F1F5F9]'
            }`}>
            {f === 'all' ? 'All' : STATUS_LABELS[f as AgentStatus]}
          </button>
        ))}
      </div>

      {/* React Flow graph */}
      <div className="rounded-xl overflow-hidden border border-white/[0.07]" style={{ height: 480, background: '#0D1117' }}>
        <ReactFlow
          nodes={fNodes}
          edges={fEdges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          attributionPosition="bottom-right"
        >
          <Background variant={BackgroundVariant.Dots} color="#1E293B" gap={20} size={1} />
          <Controls style={{ background: '#1C1C1C', border: '1px solid #334155', borderRadius: 8 }} />
          <MiniMap
            nodeColor={n => (n.data as AgentData).color}
            style={{ background: '#161616', border: '1px solid #334155', borderRadius: 8 }}
          />
        </ReactFlow>
      </div>

      {/* Selected node detail */}
      {selected && (
        <div className="mt-4 bg-[#1C1C1C] border rounded-xl p-5" style={{ borderColor: selected.color + '44' }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-[15px] font-bold text-[#F1F5F9]">{selected.name}</div>
              <div className="text-[11px] mt-0.5" style={{ color: STATUS_COLORS[selected.status] }}>
                {STATUS_LABELS[selected.status]} · {selected.schedule}
              </div>
            </div>
            <button onClick={() => setSelected(null)}
              className="text-[#475569] hover:text-[#F1F5F9] text-xl leading-none">×</button>
          </div>
          <p className="text-[13px] text-[#94A3B8] mb-3">{selected.desc}</p>
          <div className="flex flex-wrap gap-3 text-[11px]">
            <span className="text-[#64748B]">Model: <span className="text-[#F1F5F9]">{selected.model}</span></span>
            <span className="text-[#64748B]">File: <code className="text-[#475569]">{selected.file}</code></span>
          </div>
          {selected.warning && (
            <div className="mt-3 text-[11px] text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-lg px-3 py-2">
              ⚠ {selected.warning}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4">
        {(Object.entries(STATUS_COLORS) as [AgentStatus, string][]).map(([s, c]) => (
          <div key={s} className="flex items-center gap-1.5 text-[11px]" style={{ color: c }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: c }} />
            {STATUS_LABELS[s]}
          </div>
        ))}
      </div>
    </div>
  )
}
