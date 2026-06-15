import PageHeader from '@/components/PageHeader'

const MEMORY_STORES = [
  {
    name: 'mem0',
    version: '2.0.6',
    backend: 'Ollama (local)',
    status: 'local-only',
    description: 'Semantic memory layer for agent context — stores user preferences, past decisions, brand voice rules',
    entries: '~12 stored',
    note: 'Runs on localhost laptop only. Cloud equivalent requires Mem0 cloud API key.',
  },
  {
    name: 'ChromaDB',
    version: '1.5.9',
    backend: 'Local SQLite',
    status: 'local-only',
    description: 'Vector database for document embeddings — skills/CONTEXT.md, blog drafts, competitor content',
    entries: '~45 embeddings',
    note: 'Persisted to memory/chroma/ on laptop. Not available on Vercel.',
  },
  {
    name: 'LanceDB',
    version: '0.33.0',
    backend: 'Local files',
    status: 'local-only',
    description: 'High-performance vector store for content search and similarity matching',
    entries: '—',
    note: 'Installed but not yet populated.',
  },
  {
    name: 'outcomes.db',
    backend: 'SQLite',
    status: 'github-sync',
    description: 'Agent run history, token usage, content calendar, approval queue',
    entries: 'Live',
    note: 'Synced to outcomes.json in GitHub repo — readable by Vercel via /api/outcomes',
  },
]

const CLOUD_MEMORY_PLAN = [
  { step: 1, action: 'Add Mem0 cloud API key', detail: 'Sign up at mem0.ai, add MEM0_API_KEY to Vercel env' },
  { step: 2, action: 'Migrate agent memory to Mem0 cloud', detail: 'Update agents to use mem0.ai API instead of local Ollama' },
  { step: 3, action: 'Connect Pinecone or Upstash Vector', detail: 'For ChromaDB replacement — add PINECONE_API_KEY to Vercel' },
  { step: 4, action: 'Add memory viewer UI here', detail: 'Fetch entries from Mem0 cloud API and display semantic memories' },
]

export default function MemoryPage() {
  return (
    <div className="p-8 max-w-4xl">
      <PageHeader
        title="🧠 Memory"
        subtitle="Agent memory stores — local vs cloud"
        badge={{ label: 'Local only', ok: false }}
      />

      <div className="mb-6 bg-[#F59E0B]/10 border border-[#F59E0B]/25 rounded-xl p-4">
        <div className="text-[12px] text-[#F59E0B]">
          <strong>Note:</strong> All memory stores currently run on your laptop only.
          Vercel cannot access local SQLite, ChromaDB or LanceDB.
          Use <code className="bg-[#F59E0B]/10 px-1 rounded">outcomes.json</code> (GitHub-synced) for cross-environment data.
        </div>
      </div>

      {/* Memory stores */}
      <div className="space-y-3 mb-8">
        {MEMORY_STORES.map(m => (
          <div key={m.name} className={`bg-[#1C1C1C] border rounded-xl p-5 ${
            m.status === 'github-sync' ? 'border-[#22C55E]/25' : 'border-white/[0.07]'
          }`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-[13px] font-bold text-[#F1F5F9]">
                  {m.name} {m.version && <span className="text-[10px] text-[#475569] font-normal">v{m.version}</span>}
                </div>
                <div className="text-[11px] text-[#64748B]">Backend: {m.backend} · {m.entries}</div>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                m.status === 'github-sync'
                  ? 'text-[#22C55E] bg-[#22C55E]/10'
                  : 'text-[#F59E0B] bg-[#F59E0B]/10'
              }`}>
                {m.status === 'github-sync' ? 'GitHub synced' : 'Local only'}
              </span>
            </div>
            <p className="text-[12px] text-[#94A3B8] mb-2">{m.description}</p>
            <div className="text-[11px] text-[#475569] bg-[#161616] rounded px-3 py-2">{m.note}</div>
          </div>
        ))}
      </div>

      {/* Cloud migration plan */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-6">
        <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-4">
          Cloud Memory Migration Plan
        </div>
        <div className="space-y-3">
          {CLOUD_MEMORY_PLAN.map(s => (
            <div key={s.step} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-[#14B8A6]/15 border border-[#14B8A6]/30 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-[#14B8A6]">{s.step}</span>
              </div>
              <div>
                <div className="text-[12px] font-semibold text-[#F1F5F9]">{s.action}</div>
                <div className="text-[11px] text-[#64748B]">{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
