'use client'

import { useState } from 'react'
import PageHeader from '@/components/PageHeader'

const MARKET_TRENDS = [
  { label: 'Irish Sports Nutrition Market Growth', value: '+12% YoY', sub: '2024–2026 projection', color: '#22C55E' },
  { label: 'BPC-157 Search Volume (Ireland)', value: '+40%', sub: 'vs same period last year', color: '#14B8A6' },
  { label: 'TB-500 Search Volume (IE/UK)', value: '+28%', sub: 'recovery peptide demand rising', color: '#14B8A6' },
  { label: 'Peptide Market Size (EU)', value: '€2.1B', sub: 'est. 2025, growing 9% CAGR', color: '#A78BFA' },
]

const COMPETITORS_QUICK = [
  {
    name: 'Direct Peptides EU',
    url: 'directpeptides.com',
    threat: 'High',
    gap: 'No Irish-localised SEO or trust signals',
  },
  {
    name: 'Enhanced Athlete',
    url: 'enhancedathlete.com',
    threat: 'High',
    gap: 'Not peptide-focused; legal issues history',
  },
  {
    name: 'Swiss Chems',
    url: 'swisschems.is',
    threat: 'Medium',
    gap: 'Generic branding, no Irish content or IE shipping clarity',
  },
]

const THREAT_COLORS: Record<string, string> = {
  High:   '#EF4444',
  Medium: '#F59E0B',
  Low:    '#22C55E',
}

const CHANNEL_COLORS: Record<string, string> = {
  Instagram: '#E1306C',
  TikTok:    '#69C9D0',
  Email:     '#A78BFA',
  Blog:      '#F59E0B',
  SEO:       '#22C55E',
  'Instagram + TikTok': '#E1306C',
  'TikTok/IG Reels':    '#69C9D0',
  'Blog + SEO':         '#F59E0B',
  'SEO + Email':        '#22C55E',
  'Email Sequence':     '#A78BFA',
}

interface CampaignIdea {
  title: string
  objective: string
  channel: string
  targetAudience: string
  concept: string
  cta: string
  estimatedReach: string
}

const CAMPAIGN_IDEAS: CampaignIdea[] = [
  {
    title: 'Recovery Season',
    objective: 'Drive BPC-157 product awareness and conversions among team sport players',
    channel: 'Instagram + TikTok',
    targetAudience: 'GAA & rugby players, ages 18–35, post-season Sept–Nov',
    concept: 'Run a "Recovery Season" campaign timed to GAA and Leinster Rugby post-season (Sept–Nov). Publish Instagram carousel posts showing a weekly BPC-157 recovery protocol with before/after performance markers. Support with a short TikTok series — "My recovery week with peptides" — featuring relatable amateur athletes.',
    cta: 'Shop BPC-157 Recovery Protocol →',
    estimatedReach: '8,000–15,000 Irish sports accounts',
  },
  {
    title: 'Irish Rugby Partnership',
    objective: 'Build brand visibility and local trust via club-level sponsorship',
    channel: 'TikTok',
    targetAudience: 'Rugby players and fans, clubs in Leinster/Munster, ages 20–40',
    concept: 'Sponsor a local amateur rugby club\'s kit for one season. Film TikTok behind-the-scenes of training days, kit handover, and recovery sessions. Leverage the club\'s own following to extend reach authentically — local faces carry more trust than polished ads in the Irish market.',
    cta: 'Partner with Irish Peptides — DM us',
    estimatedReach: '5,000–12,000 (club + shared reach)',
  },
  {
    title: 'Peptide Protocol Builder',
    objective: 'Capture high-intent leads via free interactive tool, drive email list growth',
    channel: 'SEO + Email',
    targetAudience: 'Research-oriented buyers, fitness professionals, ages 25–45',
    concept: 'Build and launch a free "Peptide Protocol Builder" tool on the website. Users input their goal (recovery, muscle, tendon repair) and get a personalised peptide protocol PDF. The tool gates the download behind an email capture form, feeding a nurture sequence that converts to purchase within 7–14 days.',
    cta: 'Build My Peptide Protocol — Free',
    estimatedReach: '500–2,000 high-intent leads/month via SEO',
  },
  {
    title: 'Research-First Content',
    objective: 'Establish authority as Ireland\'s most credible peptide information source',
    channel: 'TikTok/IG Reels',
    targetAudience: 'Biohackers, physios, personal trainers, age 22–45',
    concept: 'Produce a weekly short-form video series breaking down one peptide study per week in plain English. Format: 60-second "What this study actually means" Reels with on-screen text. Over 12 weeks this builds a reference library that drives organic discovery and positions Irish Peptides as the research-first brand in the market.',
    cta: 'Follow for weekly peptide science',
    estimatedReach: '3,000–10,000 organic views/video at scale',
  },
  {
    title: 'First Order Discount',
    objective: 'Convert first-time site visitors into paying customers',
    channel: 'Email Sequence',
    targetAudience: 'New subscribers and cart abandoners, all demographics',
    concept: 'Deploy a 3-email welcome and conversion sequence for all new sign-ups. Email 1 (day 0): brand story + 20% first order discount code. Email 2 (day 3): most popular product breakdown with social proof. Email 3 (day 7): urgency close — "your 20% discount expires in 48 hours." Expected conversion: 8–14% of new subscribers.',
    cta: 'Claim 20% Off Your First Order',
    estimatedReach: 'All new email subscribers (scalable)',
  },
  {
    title: 'Legal & Safe in Ireland',
    objective: 'Own the "are peptides legal in Ireland" keyword and capture bottom-of-funnel SEO traffic',
    channel: 'Blog + SEO',
    targetAudience: 'First-time buyers, cautious researchers, ages 25–50',
    concept: 'Write a definitive, authoritative blog post: "Are Peptides Legal in Ireland? 2025 Guide." Cover HPRA classification, EU grey-area context, research-only framing, and safe sourcing guidance. This is the single highest-value SEO piece for the Irish market — no competitor has published it. Pair with an FAQ schema to capture featured snippets.',
    cta: 'Read: Are Peptides Legal in Ireland?',
    estimatedReach: '1,000–3,000 monthly organic visitors at ranking',
  },
  {
    title: 'Physio & PT Partnerships',
    objective: 'Generate authentic testimonials and open a B2B channel via Irish healthcare professionals',
    channel: 'Blog + SEO',
    targetAudience: 'Irish physiotherapists, sports coaches, personal trainers',
    concept: 'Identify and reach out to 10 Irish physiotherapists and PTs. Offer a complimentary product sample in exchange for an honest documented case study. Publish 3–5 practitioner case studies on the blog with full interview format. This builds the most credible trust signal possible and opens a wholesale/professional channel.',
    cta: 'Practitioner Programme — Apply Here',
    estimatedReach: '2,000+ per case study (practitioner\'s audience + SEO)',
  },
  {
    title: 'Winter Gains Campaign',
    objective: 'Capture the January fitness resolution traffic spike with a targeted blitz',
    channel: 'Instagram + TikTok',
    targetAudience: 'Fitness-motivated adults, new gym joiners, ages 20–40, Jan spike',
    concept: 'Launch a "New Year, New Recovery" campaign from Dec 28 to Jan 14. Publish daily Instagram stories with training + peptide content, TikTok "January protocol" challenge, and a limited-time bundle deal. Time paid ad spend (if available) to peak Jan 2–7 when gym signup intent is highest. Heavy use of Irish gym and fitness hashtags.',
    cta: 'Start Your January Protocol →',
    estimatedReach: '10,000–25,000 (boosted Jan traffic window)',
  },
]

function channelColor(channel: string): string {
  return CHANNEL_COLORS[channel] ?? '#94A3B8'
}

export default function MarketIntelligencePage() {
  const [copied, setCopied] = useState<number | null>(null)

  function copyIdea(idea: CampaignIdea, idx: number) {
    const text = [
      `Campaign: ${idea.title}`,
      `Objective: ${idea.objective}`,
      `Channel: ${idea.channel}`,
      `Target Audience: ${idea.targetAudience}`,
      `Concept: ${idea.concept}`,
      `CTA: ${idea.cta}`,
      `Estimated Reach: ${idea.estimatedReach}`,
    ].join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(idx)
      setTimeout(() => setCopied(null), 1800)
    })
  }

  function downloadAllAsWord() {
    const rows = CAMPAIGN_IDEAS.map(
      (idea, i) => `
        <h2 style="color:#14B8A6;margin-top:24pt;">${i + 1}. ${idea.title}</h2>
        <table border="0" cellpadding="4" style="width:100%;font-family:Arial,sans-serif;font-size:11pt;">
          <tr><td width="160"><b>Objective</b></td><td>${idea.objective}</td></tr>
          <tr><td><b>Channel</b></td><td>${idea.channel}</td></tr>
          <tr><td><b>Target Audience</b></td><td>${idea.targetAudience}</td></tr>
          <tr><td><b>Concept</b></td><td>${idea.concept}</td></tr>
          <tr><td><b>CTA</b></td><td>${idea.cta}</td></tr>
          <tr><td><b>Estimated Reach</b></td><td>${idea.estimatedReach}</td></tr>
        </table>
      `
    ).join('')

    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8">
      <title>Irish Peptides — Campaign Ideas</title></head>
      <body style="font-family:Arial,sans-serif;font-size:11pt;color:#111;">
        <h1 style="color:#0D5C54;">Irish Peptides — Campaign Ideas</h1>
        <p style="color:#555;">Generated ${new Date().toLocaleDateString('en-IE', { day:'numeric', month:'long', year:'numeric' })} · irishpeptides.ie</p>
        ${rows}
      </body></html>
    `
    const blob = new Blob([html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'irish-peptides-campaign-ideas.doc'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="📈 Market Intelligence"
        subtitle="Campaigns · Trends · Competitive Gaps"
        badge={{ label: `${CAMPAIGN_IDEAS.length} campaign ideas`, ok: true }}
      />

      {/* Market Trends */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {MARKET_TRENDS.map((t, i) => (
          <div key={i} className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-4">
            <div className="text-[22px] font-black leading-none mb-1" style={{ color: t.color }}>{t.value}</div>
            <div className="text-[11px] font-semibold text-[#F1F5F9] leading-snug mb-1">{t.label}</div>
            <div className="text-[10px] text-[#475569]">{t.sub}</div>
          </div>
        ))}
      </div>

      {/* Competitors Quick Reference */}
      <div className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-5 mb-8">
        <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide mb-3">
          Competitor Quick Reference
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <th className="text-left text-[10px] text-[#475569] font-semibold pb-2 pr-4">Competitor</th>
                <th className="text-left text-[10px] text-[#475569] font-semibold pb-2 pr-4">URL</th>
                <th className="text-left text-[10px] text-[#475569] font-semibold pb-2 pr-4">Threat</th>
                <th className="text-left text-[10px] text-[#475569] font-semibold pb-2">Key Gap</th>
              </tr>
            </thead>
            <tbody>
              {COMPETITORS_QUICK.map((c, i) => (
                <tr key={i} className="border-b border-white/[0.04] last:border-0">
                  <td className="py-2.5 pr-4 font-medium text-[#F1F5F9]">{c.name}</td>
                  <td className="py-2.5 pr-4">
                    <a href={`https://${c.url}`} target="_blank" rel="noopener noreferrer"
                      className="text-[#475569] hover:text-[#14B8A6] transition-colors">
                      {c.url}
                    </a>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ color: THREAT_COLORS[c.threat], background: THREAT_COLORS[c.threat] + '20' }}
                    >
                      {c.threat}
                    </span>
                  </td>
                  <td className="py-2.5 text-[#94A3B8]">{c.gap}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign Ideas */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[11px] font-semibold text-[#14B8A6] uppercase tracking-wide">Campaign Ideas</div>
            <div className="text-[11px] text-[#475569] mt-0.5">Irish Peptides-specific campaigns ready to execute</div>
          </div>
          <button
            onClick={downloadAllAsWord}
            className="text-[11px] px-4 py-2 rounded-lg border border-[#14B8A6]/30 text-[#14B8A6] hover:bg-[#14B8A6]/10 transition-all font-medium shrink-0"
          >
            ↓ Download All as Word
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CAMPAIGN_IDEAS.map((idea, i) => (
            <div key={i} className="bg-[#1C1C1C] border border-white/[0.07] rounded-xl p-5 flex flex-col gap-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="text-[13px] font-bold text-[#F1F5F9] leading-snug">{idea.title}</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">{idea.objective}</div>
                </div>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{ color: channelColor(idea.channel), background: channelColor(idea.channel) + '22' }}
                >
                  {idea.channel}
                </span>
              </div>

              {/* Concept */}
              <div className="text-[11px] text-[#94A3B8] leading-relaxed">{idea.concept}</div>

              {/* Meta row */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-[#475569] font-semibold">Audience: </span>
                  <span className="text-[#94A3B8]">{idea.targetAudience}</span>
                </div>
                <div>
                  <span className="text-[#475569] font-semibold">Reach: </span>
                  <span className="text-[#94A3B8]">{idea.estimatedReach}</span>
                </div>
              </div>

              {/* CTA + Copy */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
                <div className="text-[11px] text-[#14B8A6] font-medium truncate flex-1 mr-3">{idea.cta}</div>
                <button
                  onClick={() => copyIdea(idea, i)}
                  className="text-[10px] px-3 py-1.5 rounded-lg border border-white/[0.1] text-[#94A3B8] hover:text-[#F1F5F9] hover:border-white/[0.2] transition-all shrink-0"
                >
                  {copied === i ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
