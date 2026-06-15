'use client'

import PageHeader from '@/components/PageHeader'

const SECTIONS = [
  {
    title: 'Getting Started',
    icon: '🚀',
    color: '#14B8A6',
    items: [
      { q: 'How do I add API keys?', a: 'Go to System Health → each missing key shows setup instructions. Keys are added in the Vercel dashboard under Project Settings → Environment Variables.' },
      { q: 'Why is Buffer/ManyChat disconnected?', a: 'Buffer and ManyChat are manually controlled — content is scheduled directly. Click "Setup Guide" on the Social Hub page to connect them when ready.' },
      { q: 'How does the approval flow work?', a: 'Agents generate content → it appears in Content Studio as "Pending". Review the draft, then Approve (publishes immediately) or Reject with a reason (agent rewrites automatically).' },
      { q: 'Where does blog content go?', a: 'Approved blog posts are committed directly to the irishpeptides-website GitHub repo as Markdown files. They deploy automatically via GitHub Pages.' },
    ],
  },
  {
    title: 'AI Chat',
    icon: '💬',
    color: '#A78BFA',
    items: [
      { q: 'Which AI models are available?', a: 'Claude (default, via CLI — free on Team plan), Gemini Flash, DeepSeek, and Ollama (local). Switch models in the chat dropdown.' },
      { q: 'Can the AI trigger agents?', a: 'Yes. Say "write a blog post about X" or "run the content engine" — the chat detects intent and dispatches the relevant GitHub Actions workflow automatically.' },
      { q: 'Can I ask about my analytics?', a: 'Yes. Ask "what are my top keywords" or "show me Search Console data" — the AI pulls live data from GA4 and Search Console in real time.' },
      { q: 'How is chat history saved?', a: 'Conversations are grouped by date (Today / Yesterday / Last 7 days / Older) in the sidebar. Max 50 conversations kept. Data syncs to GitHub.' },
    ],
  },
  {
    title: 'Agents & Automation',
    icon: '🤖',
    color: '#F59E0B',
    items: [
      { q: 'How many agents are running?', a: 'There are 19 agents covering content creation, SEO, competitor monitoring, analytics, compliance, and newsletter. See Agent Network for the live status map.' },
      { q: 'How do I trigger an agent manually?', a: 'Go to Agent Network → click any agent node → Run Now. Or dispatch via chat. GitHub Actions also shows all workflow runs.' },
      { q: 'What is the Skill Discovery agent?', a: 'Runs every Sunday at 9pm. Searches GitHub for tools and libraries relevant to Irish Peptides — peptide tracking, supplement ecommerce, health SEO — and sends a WhatsApp summary with the top 5.' },
      { q: 'What is plan compliance?', a: 'Every Sunday at 8pm, plan_compliance.py checks all agents against the master plan and flags any drift. Results appear in outcomes.json and the Agent Network page.' },
    ],
  },
  {
    title: 'Troubleshooting',
    icon: '🔧',
    color: '#EF4444',
    items: [
      { q: 'System Health shows red — what do I do?', a: 'Check the System Health page for specific error messages. Most issues are missing API keys (add in Vercel) or rate limits (wait and retry). Buffer/ManyChat red is expected — they are intentionally disconnected.' },
      { q: 'Content Studio is empty', a: 'Run the content_engine agent manually from Agent Network, or ask the AI chat to write a blog post. Agents write to outcomes.json which feeds Content Studio.' },
      { q: 'Analytics shows no data', a: 'GA4 needs the service account email added as a Viewer in GA4 Admin → Account Access Management. Search Console needs the same service account added as a Full User in SC settings.' },
      { q: 'WhatsApp notifications not arriving', a: 'Check CALLMEBOT_API_KEY and CALLMEBOT_PHONE in Vercel env vars. You can test by visiting the /api/publish GET endpoint. The number must have messaged the CallMeBot bot first.' },
    ],
  },
]

export default function HelpPage() {
  return (
    <div className="p-8 max-w-4xl">
      <PageHeader
        title="Help & Documentation"
        subtitle="Getting started, AI Chat, Agents, Troubleshooting"
        badge={{ label: 'Docs', ok: true }}
      />

      <div className="space-y-8">
        {SECTIONS.map(section => (
          <div key={section.title}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">{section.icon}</span>
              <h2 className="text-[14px] font-semibold" style={{ color: section.color }}>{section.title}</h2>
            </div>
            <div className="space-y-3">
              {section.items.map(item => (
                <div key={item.q} className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-4">
                  <div className="text-[13px] font-semibold text-[#F1F5F9] mb-1.5">{item.q}</div>
                  <div className="text-[12px] text-[#94A3B8] leading-relaxed">{item.a}</div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-5 mt-6">
          <div className="text-[13px] font-semibold text-[#F1F5F9] mb-2">Quick Links</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: 'Agent Network', href: '/agents' },
              { label: 'Content Studio', href: '/content' },
              { label: 'System Health', href: '/health' },
              { label: 'Analytics', href: '/analytics' },
            ].map(link => (
              <a key={link.href} href={link.href}
                className="text-[11px] text-center py-2 px-3 rounded-lg border border-white/[0.07] text-[#94A3B8] hover:text-[#14B8A6] hover:border-[#14B8A6]/30 transition-all">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
