'use client'

import { useState, useEffect } from 'react'
import PageHeader from '@/components/PageHeader'

type Tab = 'map' | 'agents' | 'skills' | 'plugins' | 'health'

// ── Agents ────────────────────────────────────────────────────────────────────
type AgentStatus = 'active' | 'partial' | 'manual'
interface Agent {
  name: string; category: string; schedule: string; desc: string; status: AgentStatus
}
const AGENTS: Agent[] = [
  // Content
  { name: 'content_engine',          category: 'Content',        schedule: 'Tue/Thu/Sat 7am',  status: 'active',  desc: 'Generates blog + carousel + newsletter from Notion calendar topics. Runs quality chain before publish.' },
  { name: 'blog_writer',             category: 'Content',        schedule: 'On demand',        status: 'active',  desc: 'SEO-optimised blog posts. Irish keywords. Protocol-guarded. Auto-commits to irishpeptides.ie.' },
  { name: 'content_brief',           category: 'Content',        schedule: 'On demand',        status: 'active',  desc: 'Creates structured content brief before content_engine runs. Feeds topic + angle + keywords.' },
  { name: 'first_social_post',       category: 'Content',        schedule: 'One-time',         status: 'active',  desc: 'Generated first TikTok + Instagram post. Quality chain passed. Awaiting Buffer queue.' },
  { name: 'weekly_nutrition_repost', category: 'Content',        schedule: 'Monday 8am',       status: 'active',  desc: 'Reposts nutrition guide with fresh layout each week. Tracks which layout wins in post_layout_tracker.json.' },
  { name: 'gym_splits_carousel',     category: 'Content',        schedule: 'On demand',        status: 'active',  desc: 'Generates gym split carousels (PPL, Upper/Lower, 5-day). 6 slides + CTA.' },
  { name: 'peptide_carousel',        category: 'Content',        schedule: 'On demand',        status: 'active',  desc: '5-slide peptide deep dives: title, mechanism, dosages, Reddit intel, CTA. Dark navy/teal brand.' },
  { name: 'build_buffer_calendar',   category: 'Content',        schedule: 'Monthly',          status: 'active',  desc: '30-day Buffer calendar. Free tools + peptide posts, IG DM PLAN CTA, TikTok URL CTA.' },
  // Video
  { name: 'video_gen',               category: 'Video',          schedule: 'On demand',        status: 'active',  desc: 'Builds Emily-voice peptide videos. edge-tts en-IE EmilyNeural. Per-slide audio sync. Reddit dosing + influencer hooks.' },
  { name: 'make_all_videos',         category: 'Video',          schedule: 'On demand',        status: 'active',  desc: 'Batch video generation for all free tools. 4 tool variants (macro, TDEE, reconstitution, body fat).' },
  { name: 'post_to_video',           category: 'Video',          schedule: 'On demand',        status: 'active',  desc: 'Assembles slides + audio into MP4 via MoviePy. Overlays brand logo and captions.' },
  { name: 'video_pipeline',          category: 'Video',          schedule: 'Scheduled',        status: 'active',  desc: 'Full pipeline: script → voice → slides → video → Buffer queue. Orchestrates other video agents.' },
  { name: 'music_gen',               category: 'Video',          schedule: 'On demand',        status: 'active',  desc: 'Music overlay on video files. TikTok music added manually in app — this handles non-TikTok platforms.' },
  { name: 'trending_sounds',         category: 'Video',          schedule: 'Monday 6am',       status: 'active',  desc: 'WhatsApp alert with top 3 trending TikTok sounds for the week. Saves to memory/trending_sounds.json.' },
  { name: 'fire_today_and_calendar', category: 'Video',          schedule: 'On demand',        status: 'active',  desc: 'Queues today\'s scheduled posts to Buffer and updates calendar state.' },
  // SEO / Site
  { name: 'seo_loop',                category: 'SEO/Site',       schedule: 'Monday 8am',       status: 'active',  desc: 'GSC keyword gap finder. Ranks 8–15 → blog auto-generated. Monitors position change 2 weeks after. Learns what moves needle.' },
  { name: 'site_optimiser',          category: 'SEO/Site',       schedule: 'Sunday 9am',       status: 'active',  desc: 'CRO agent. Reads Hotjar + GA4. Flags high-traffic/low-conversion pages. Proposes specific headline/CTA changes. Before/after Playwright screenshots on approve.' },
  { name: 'site_health',             category: 'SEO/Site',       schedule: 'Daily',            status: 'active',  desc: 'Checks irishpeptides.ie uptime, page load, 404s, broken links. WhatsApp alert on issues.' },
  { name: 'site_audit',              category: 'SEO/Site',       schedule: 'Weekly',           status: 'active',  desc: 'Full technical SEO audit. Crawlability, meta tags, schema, mobile, Core Web Vitals.' },
  { name: 'site_qa',                 category: 'SEO/Site',       schedule: 'Post-deploy',      status: 'active',  desc: 'Playwright panel check — runs after every Vercel deploy. Tests all 19 dashboard panels.' },
  { name: 'gsc_request_indexing',    category: 'SEO/Site',       schedule: 'On demand',        status: 'active',  desc: 'Submits new URLs to Google Search Console for faster indexing. Runs after new blog posts.' },
  // Analytics
  { name: 'ga4_monitor',             category: 'Analytics',      schedule: 'Daily 8am',        status: 'partial', desc: 'GA4 daily traffic report. Needs GA4_SERVICE_ACCOUNT_JSON from Vercel env to pull live data.' },
  { name: 'competitor_monitor',      category: 'Analytics',      schedule: 'Monday 9am',       status: 'active',  desc: 'IE/UK only. Crawl4AI scrapes top 3 Irish supplement competitors. Flags new content, pricing, products.' },
  { name: 'affiliate_monitor',       category: 'Analytics',      schedule: 'Monday 8am',       status: 'active',  desc: 'Tracks affiliate link clicks from GA4. Estimates commissions. Spots new Irish affiliate programmes.' },
  { name: 'system_health',           category: 'Analytics',      schedule: 'Daily',            status: 'active',  desc: 'Checks all API keys are valid. Alerts before expiry. Tests fallback chain: Claude → Gemini → DeepSeek.' },
  { name: 'social_performance',      category: 'Analytics',      schedule: 'Weekly',           status: 'active',  desc: 'Pulls Buffer/ManyChat engagement data. Finds top-performing posts. Feeds learning back to content_engine.' },
  { name: 'trend_intel',             category: 'Analytics',      schedule: 'Weekly',           status: 'active',  desc: 'Reddit + HackerNews mining for peptide/fitness trends. Outputs to memory/trend_intel.json.' },
  // Email
  { name: 'newsletter_agent',        category: 'Email',          schedule: 'Sunday 10am',      status: 'active',  desc: 'Weekly newsletter. Pulls top content, GA4 highlights, coaching enquiries. Sends via Resend from keith@irishpeptides.ie.' },
  // Compliance
  { name: 'legal_compliance',        category: 'Compliance',     schedule: 'On content',       status: 'active',  desc: 'EU Regulation 1924/2006, ASAI, CCPC, GDPR, HPRA checks on every piece of content. Flags medical claims with law ref.' },
  { name: 'protocol_guard',          category: 'Compliance',     schedule: 'On content',       status: 'active',  desc: 'Irish Peptides brand protocol. Checks disclaimers, safe language, no unapproved claims. Pre-commit hook.' },
  { name: 'plan_compliance',         category: 'Compliance',     schedule: 'Sunday 8pm',       status: 'active',  desc: 'Weekly check that all agents are running per plan. Flags drift. Reports to Notion.' },
  // Infrastructure
  { name: 'supermarket_scraper',     category: 'Infrastructure', schedule: 'Monday 6am',       status: 'active',  desc: 'Tesco/Aldi/Lidl/FitFoods/NutriQuick weekly protein products. Ranks by protein/€. Feeds content_engine. Top 3 → Content Studio.' },
  { name: 'archive_agent',           category: 'Infrastructure', schedule: 'Monthly',          status: 'active',  desc: 'Archives old content drafts. Keeps memory/ clean. Logs archive index.' },
  { name: 'resume_agent',            category: 'Infrastructure', schedule: 'Daily 8am',        status: 'active',  desc: 'Detects interrupted GitHub Actions runs. Resumes from last checkpoint. Uses utils/checkpoint.py.' },
  { name: 'daily_briefing',          category: 'Infrastructure', schedule: 'Daily 8:30am',     status: 'active',  desc: 'Morning brief: top tasks from Notion, GA4 summary, social performance, trending sounds pick.' },
  { name: 'sync_token_usage',        category: 'Infrastructure', schedule: 'Post-agent',       status: 'active',  desc: 'Exports SQLite token_usage → GitHub JSON after every agent run. Powers Token Dashboard on Settings page.' },
  { name: 'skill_discovery',         category: 'Infrastructure', schedule: 'Sunday 9pm',       status: 'active',  desc: 'Searches GitHub for tools relevant to peptides/SEO/ecommerce. Top 5 to WhatsApp + Notion.' },
  { name: 'tool_ideas_agent',        category: 'Infrastructure', schedule: 'Sunday 8pm',       status: 'active',  desc: 'Reddit/GSC/competitor research to generate 3 new free tool ideas. Pending approval in Content Studio.' },
  { name: 'build_blueprint_pdf',     category: 'Infrastructure', schedule: 'On demand',        status: 'partial', desc: 'Generates 7-Day Fat Loss Blueprint PDF using Irish supermarket food data. Resend auto-delivers on email signup. NOT YET RUN.' },
  { name: 'master_agent',            category: 'Infrastructure', schedule: 'Orchestrator',     status: 'active',  desc: 'Routes tasks to sub-agents. Reads Notion queue and dispatches via GitHub Actions repository_dispatch.' },
  // Revenue
  { name: 'cfo_agent',               category: 'Revenue',        schedule: 'Sunday 8am',       status: 'active',  desc: 'Revenue monitoring. GA4 traffic, subscribers, engagement. Suggests opportunities matching current audience size.' },
  { name: 'ceo_agent',               category: 'Revenue',        schedule: 'On demand',        status: 'active',  desc: 'Strategy and positioning insights. Reads full plan + competitor data. Suggests growth moves.' },
  { name: 'client_plan_builder',     category: 'Revenue',        schedule: 'On inquiry',       status: 'active',  desc: 'Triggers on Formspree coaching enquiry. Generates personalised plan. WhatsApp to Keith to approve before sending.' },
  // Social / Comms
  { name: 'manychat_handler',        category: 'Social/Comms',   schedule: 'Every 4h',         status: 'active',  desc: 'Instagram DM automation. Keywords: IRISH/GUIDE/PEPTIDES/COACH/TOOLS. Day 1 + Day 3 follow-up sequence. AI-personalised DMs.' },
  { name: 'gbp_agent',               category: 'Social/Comms',   schedule: 'Weekly',           status: 'active',  desc: 'Google Business Profile updates. Posts, reviews monitoring, Q&A responses.' },
  { name: 'social_intel',            category: 'Social/Comms',   schedule: 'Weekly',           status: 'active',  desc: 'Scrapes top peptide influencers (@aubergine_avenger, @ayubace). Extracts hooks and caption styles for content_engine.' },
  { name: 'studies_fetcher',         category: 'Social/Comms',   schedule: 'Weekly',           status: 'active',  desc: 'Fetches recent peptide research abstracts. Feeds into blog_writer for credible citations.' },
  { name: 'batch_schedule',          category: 'Social/Comms',   schedule: 'On demand',        status: 'active',  desc: 'Bulk-schedules posts to Buffer. Respects 250/day rate limit with sleep between calls.' },
]

// ── Skills ────────────────────────────────────────────────────────────────────
interface Skill { name: string; category: string; desc: string; installed: boolean }
const SKILLS: Skill[] = [
  // Custom Irish Peptides
  { name: 'ip-brand-voice',       category: 'Custom IP',  installed: true,  desc: 'Tone, audience, coaching tiers, Irish market focus, disclaimer requirements. Injected into all content generation.' },
  { name: 'ip-legal-compliance',  category: 'Custom IP',  installed: true,  desc: 'Irish + EU law, EU 1924/2006, ASAI, CCPC, GDPR, affiliate disclosure. Used by legal_compliance agent.' },
  { name: 'ip-protocol-guard',    category: 'Custom IP',  installed: true,  desc: 'All Irish peptide compliance rules. Blocks medical claims. Pre-commit hook on content_drafts/.' },
  { name: 'ip-peptide-research',  category: 'Custom IP',  installed: true,  desc: 'All compounds, reconstitution calculations, cycle guidance, safety info. Powers AI chat answers.' },
  // Marketing
  { name: 'marketing-skills:copywriting',       category: 'Marketing', installed: true,  desc: 'Persuasive copy for social, email, landing pages. Hook-first structure.' },
  { name: 'marketing-skills:social',            category: 'Marketing', installed: true,  desc: 'Social media content strategy. Platform-specific formatting for TikTok, Instagram, LinkedIn.' },
  { name: 'marketing-skills:content-strategy',  category: 'Marketing', installed: true,  desc: 'Content calendar, topic clustering, repurposing strategy.' },
  { name: 'marketing-skills:emails',            category: 'Marketing', installed: true,  desc: 'Email sequences, newsletter copy, subject lines optimised for Irish audience.' },
  { name: 'marketing-skills:cro',               category: 'Marketing', installed: true,  desc: 'Conversion rate optimisation. Landing page analysis, CTA testing, funnel improvements.' },
  { name: 'marketing-skills:launch',            category: 'Marketing', installed: true,  desc: 'Product launch strategy. Pre-launch waitlist, launch week content, post-launch follow-up.' },
  { name: 'marketing-skills:seo-audit',         category: 'Marketing', installed: true,  desc: 'Full SEO audit checklist. Technical + on-page + off-page for irishpeptides.ie.' },
  { name: 'marketing-skills:analytics',         category: 'Marketing', installed: true,  desc: 'GA4 interpretation, conversion tracking setup, KPI dashboard design.' },
  { name: 'marketing-skills:lead-magnets',      category: 'Marketing', installed: true,  desc: 'Lead magnet design, Blueprint PDF strategy, email capture optimisation.' },
  { name: 'marketing-skills:competitor-profiling', category: 'Marketing', installed: true, desc: 'IE/UK competitor analysis. Content gaps, pricing strategy, differentiators.' },
  // SEO
  { name: 'claude-seo:seo',          category: 'SEO', installed: true, desc: 'Full SEO orchestrator. Runs audit, content, technical, schema in sequence.' },
  { name: 'claude-seo:seo-content',  category: 'SEO', installed: true, desc: 'E-E-A-T content quality, readability, depth, AI citation readiness. Flags thin content.' },
  { name: 'claude-seo:seo-technical',category: 'SEO', installed: true, desc: 'Crawlability, indexability, security, URL structure, mobile, Core Web Vitals, JS rendering.' },
  { name: 'claude-seo:seo-schema',   category: 'SEO', installed: true, desc: 'Schema.org JSON-LD detection, validation, generation for articles, products, FAQs.' },
  { name: 'claude-seo:seo-geo',      category: 'SEO', installed: true, desc: 'AI search visibility. llms.txt, passage-level citability, Google AI Overviews, ChatGPT/Perplexity.' },
  { name: 'claude-seo:seo-sitemap',  category: 'SEO', installed: true, desc: 'Sitemap validation, generation, quality gates. Submits to GSC.' },
  { name: 'claude-seo:seo-cluster',  category: 'SEO', installed: true, desc: 'Semantic topic clustering. Hub-and-spoke architecture. Internal link matrices.' },
  // Dev / Deployment
  { name: 'vercel:nextjs',            category: 'Dev', installed: true, desc: 'Next.js best practices for irishpeptides-web. App Router, caching, ISR, edge functions.' },
  { name: 'vercel:ai-sdk',            category: 'Dev', installed: true, desc: 'Vercel AI SDK patterns. Streaming, tool use, agent workflows in Next.js.' },
  { name: 'vercel:deployment-expert', category: 'Dev', installed: true, desc: 'CI/CD pipeline, preview URLs, env vars, rollbacks, domain config.' },
  { name: 'vercel:vercel-agent',      category: 'Dev', installed: true, desc: 'Full Vercel platform agent. Deployments, logs, env, project management.' },
  { name: 'nextjs-best-practices',    category: 'Dev', installed: true, desc: 'App Router patterns, Server Components, metadata, image optimisation.' },
  // Memory / Tools
  { name: 'claude-mem:make-plan',     category: 'Memory/Tools', installed: true, desc: 'Creates structured implementation plans. Used at session start for complex tasks.' },
  { name: 'claude-mem:standup',       category: 'Memory/Tools', installed: true, desc: 'Daily standup from memory. What was done, what\'s next, blockers.' },
  { name: 'claude-mem:mem-search',    category: 'Memory/Tools', installed: true, desc: 'Semantic search across all session memories. Recalls context from past sessions.' },
  { name: 'caveman:caveman',          category: 'Memory/Tools', installed: true, desc: 'Terse caveman mode. Drops filler, articles, pleasantries. Full/lite/ultra levels.' },
  { name: 'ponytail:ponytail',        category: 'Memory/Tools', installed: true, desc: 'Lazy dev mode. YAGNI enforced. Stdlib first. Shortest working diff wins.' },
  { name: 'last30days:last30days',    category: 'Memory/Tools', installed: true, desc: 'Reddit/HN/X/YouTube research for last 30 days. Used by trend_intel + tool_ideas agents.' },
  // Research
  { name: 'deep-research',            category: 'Research', installed: true, desc: 'Multi-source research with synthesis. Used for peptide content, competitor analysis, market research.' },
  { name: 'blog-write',               category: 'Research', installed: true, desc: 'Long-form SEO blog writing. Intro, headers, conclusion, meta description, schema.' },
]

// ── GitHub Plugins ─────────────────────────────────────────────────────────────
interface Plugin { name: string; desc: string; url: string; category: string; key: string; priority: 'installed' | 'high' | 'medium' | 'low' }
const PLUGINS: Plugin[] = [
  // Installed
  { key: 'caveman',         name: 'Caveman Mode',         category: 'DX',        priority: 'installed', url: 'https://github.com/anthropics/claude-code-caveman',          desc: 'Terse response mode. Removes filler from all responses. full/lite/ultra levels.' },
  { key: 'ponytail',        name: 'Ponytail Mode',        category: 'DX',        priority: 'installed', url: 'https://github.com/anthropics/claude-code-ponytail',         desc: 'Lazy dev mode. YAGNI. Stdlib first. Shortest diff wins.' },
  { key: 'claude-mem',      name: 'Claude Memory (MCP)',  category: 'Memory',    priority: 'installed', url: 'https://github.com/anthropics/claude-mem',                   desc: 'Persistent memory across sessions. Observations, entities, semantic search.' },
  { key: 'vercel',          name: 'Vercel Plugin',        category: 'Deploy',    priority: 'installed', url: 'https://github.com/vercel/claude-code-plugin',               desc: 'Vercel deployment, AI SDK, Next.js skills, env vars, CLI.' },
  { key: 'claude-seo',      name: 'Claude SEO',           category: 'SEO',       priority: 'installed', url: 'https://github.com/AgriciDaniel/claude-seo',                 desc: '15 SEO skills: audit, content, technical, schema, geo, sitemap, cluster.' },
  { key: 'last30days',      name: 'Last 30 Days',         category: 'Research',  priority: 'installed', url: 'https://github.com/mvanhorn/last30days-skill',               desc: 'Research Reddit/HN/X/YouTube last 30 days. Used by trend + ideas agents.' },
  { key: 'marketing-skills',name: 'Marketing Skills',     category: 'Marketing', priority: 'installed', url: 'https://github.com/charlie947/marketing-skills',             desc: '20 marketing skills: copywriting, CRO, social, emails, launch, SEO audit.' },
  // High priority — should install
  { key: 'skill-creator',   name: 'Skill Creator',        category: 'DX',        priority: 'high',      url: 'https://github.com/anthropics/skills/tree/main/skills/skill-creator', desc: 'Build custom skills for Irish Peptides. Needed to create/update ip-* skills.' },
  { key: 'notebooklm',      name: 'NotebookLM Skill',     category: 'Research',  priority: 'high',      url: 'https://github.com/PleasePrompto/notebooklm-skill',          desc: 'NotebookLM integration. Upload plan docs, query knowledge base.' },
  { key: 'antigravity',     name: 'Antigravity Skills',   category: 'DX',        priority: 'high',      url: 'https://github.com/antigravitygroup/antigravity-awesome-skills', desc: 'Auto-selects relevant skills for this project. Discovers new useful skills.' },
  // Medium priority
  { key: 'social-media',    name: 'Social Media Skills',  category: 'Marketing', priority: 'medium',    url: 'https://github.com/charlie947/social-media-skills',          desc: 'Instagram, TikTok, LinkedIn, Twitter content workflows.' },
  { key: 'ai-second-brain', name: 'AI Second Brain',      category: 'Memory',    priority: 'medium',    url: 'https://github.com/charlie947/ai-second-brain',              desc: 'Persistent AI knowledge base. Complements claude-mem with structured notes.' },
  { key: 'wshobson-agents', name: 'Agents Skill',         category: 'DX',        priority: 'medium',    url: 'https://github.com/wshobson/agents',                         desc: 'Agent management and orchestration helpers.' },
  // Low priority
  { key: 'cybersecurity',   name: 'Cybersecurity Skills', category: 'Security',  priority: 'low',       url: 'https://github.com/mukul975/Anthropic-Cybersecurity-Skills', desc: 'Security audit, penetration testing patterns. For site hardening.' },
]

// ── Missing items from the plan ────────────────────────────────────────────────
const MISSING = [
  { item: 'Blueprint PDF',        type: 'agent',   detail: 'build_blueprint_pdf.py exists but never run. Run to generate 7-Day Fat Loss Blueprint.', action: 'Run py -3.14 agents/build_blueprint_pdf.py' },
  { item: 'GA4 Service Account',  type: 'key',     detail: 'GA4_SERVICE_ACCOUNT_JSON not set in Vercel env. Analytics panel showing partial data.', action: 'Add to Vercel: Settings → Env Vars' },
  { item: 'Peptide Tracker Deploy',type: 'deploy',  detail: 'keithyob26/peptide-tracker built but not on Cloudflare Pages yet.', action: 'Cloudflare Pages → connect repo → peptidetracker.irishpeptides.ie' },
  { item: 'Skill Creator plugin',  type: 'plugin',  detail: 'Needed to build/update custom ip-* skills via skill-creator.', action: 'npx skills add github.com/anthropics/skills/tree/main/skills/skill-creator' },
  { item: 'Personal Story',        type: 'content', detail: 'About page still shows placeholder content. Keith confirmed personal story is ready.', action: 'Paste story into Notion queue for about page update' },
  { item: 'Hotjar',                type: 'tool',    detail: 'Not installed on irishpeptides.ie. Needed by site_optimiser for heatmap data.', action: 'Sign up hotjar.com → paste tracking ID into Notion queue' },
  { item: 'Cal.com',               type: 'tool',    detail: 'Coaching booking page has no live booking link. Cal.com not deployed.', action: 'py -3.14 agents/playwright_setup.py cal_com' },
  { item: 'Crawl4AI',              type: 'tool',    detail: 'Not installed. competitor_monitor + supermarket_scraper using fallback data.', action: 'pip install crawl4ai --break-system-packages && crawl4ai-setup' },
  { item: 'Scrapling',             type: 'tool',    detail: 'Recommended upgrade for Tesco.ie scraper. Handles dynamic JS sites, anti-bot.', action: 'pip install scrapling' },
  { item: 'Stripe',                type: 'payment', detail: 'Revenue phase blocked until Stripe set up. Sole trader registration required first.', action: 'YOU: Register sole trader at Revenue.ie first' },
]

// ── Map nodes (kept from original, expanded) ──────────────────────────────────
interface MapNode { id: string; label: string; category: string; color: string; x: number; y: number; status: 'connected' | 'partial' | 'not_connected'; desc: string }
const NODES: MapNode[] = [
  { id: 'jarvis',    label: 'Jarvis\nDashboard', category: 'core',    color: '#14B8A6', x: 400, y: 260, status: 'connected', desc: 'Next.js command centre — irishpeptides-web.vercel.app' },
  { id: 'notion',    label: 'Notion\nQueue',     category: 'content', color: '#8B5CF6', x: 160, y: 100, status: 'connected', desc: 'Build queue, content calendar, task management' },
  { id: 'content',   label: 'Content\nEngine',   category: 'content', color: '#8B5CF6', x: 160, y: 240, status: 'connected', desc: 'Tue/Thu/Sat — blog + social + newsletter' },
  { id: 'github',    label: 'GitHub\nActions',   category: 'infra',   color: '#E2E8F0', x: 160, y: 380, status: 'connected', desc: '21+ scheduled workflows — agents run here' },
  { id: 'gemini',    label: 'Gemini\nFlash',     category: 'ai',      color: '#4285F4', x: 630, y:  80, status: 'connected', desc: 'Primary AI — content, SEO, analysis. CONTEXT.md injected.' },
  { id: 'deepseek',  label: 'DeepSeek',          category: 'ai',      color: '#22C55E', x: 630, y: 200, status: 'connected', desc: 'Fallback AI — reasoning, drafts. €0.001/piece.' },
  { id: 'ollama',    label: 'Gemma 4\n(local)',  category: 'ai',      color: '#F59E0B', x: 630, y: 320, status: 'partial',   desc: 'Local LLM — laptop only, free. Simple monitoring tasks.' },
  { id: 'buffer',    label: 'Buffer\nSocial',    category: 'publish', color: '#F97316', x: 280, y: 440, status: 'connected', desc: 'Instagram + TikTok scheduling. 250/day rate limit.' },
  { id: 'resend',    label: 'Resend\nEmail',     category: 'publish', color: '#EC4899', x: 400, y: 460, status: 'connected', desc: 'Newsletter + Blueprint auto-delivery. keith@irishpeptides.ie' },
  { id: 'site',      label: 'irishpeptides.ie',  category: 'publish', color: '#14B8A6', x: 530, y: 440, status: 'connected', desc: 'Main site on Cloudflare Pages. Auto-deploys from GitHub.' },
  { id: 'ga4',       label: 'Google\nAnalytics', category: 'analytics', color: '#FF6D00', x: 160, y: 510, status: 'partial', desc: 'GA4 tracking. Service account JSON needed for API access.' },
  { id: 'manychat',  label: 'ManyChat\nDM',      category: 'publish', color: '#0084FF', x: 400, y: 110, status: 'connected', desc: 'Instagram DM automation. DM PLAN → auto resource link.' },
  { id: 'callmebot', label: 'WhatsApp\nAlerts',  category: 'alert',   color: '#25D366', x: 630, y: 440, status: 'connected', desc: 'Agent alerts via CallMeBot. Key 7883019.' },
  { id: 'tracker',   label: 'Peptide\nTracker',  category: 'product', color: '#A78BFA', x: 530, y: 110, status: 'partial',   desc: 'PWA v1.0 on GitHub. Needs Cloudflare Pages deploy.' },
]

const EDGES = [
  { from: 'notion',   to: 'content',   label: 'feeds topics' },
  { from: 'jarvis',   to: 'notion',    label: 'reads' },
  { from: 'jarvis',   to: 'github',    label: 'triggers' },
  { from: 'github',   to: 'content',   label: 'runs' },
  { from: 'github',   to: 'callmebot', label: 'notifies' },
  { from: 'content',  to: 'gemini',    label: 'uses' },
  { from: 'content',  to: 'deepseek',  label: 'fallback' },
  { from: 'content',  to: 'buffer',    label: 'posts to' },
  { from: 'content',  to: 'resend',    label: 'sends via' },
  { from: 'content',  to: 'site',      label: 'deploys to' },
  { from: 'ga4',      to: 'jarvis',    label: 'reports to' },
  { from: 'manychat', to: 'jarvis',    label: 'reads' },
  { from: 'jarvis',   to: 'manychat',  label: 'reads' },
  { from: 'ollama',   to: 'content',   label: 'local only' },
]

const STATUS_COLORS = { connected: '#22C55E', partial: '#F59E0B', not_connected: '#EF4444' }
const CAT_COLORS: Record<string, string> = { Content: '#8B5CF6', Video: '#EC4899', 'SEO/Site': '#14B8A6', Analytics: '#FF6D00', Email: '#4285F4', Compliance: '#F59E0B', Infrastructure: '#64748B', Revenue: '#22C55E', 'Social/Comms': '#0084FF' }

// ── Components ────────────────────────────────────────────────────────────────
function MapTab() {
  const [selected, setSelected] = useState<MapNode | null>(null)
  const getNode = (id: string) => NODES.find(n => n.id === id)
  return (
    <div>
      <div className="bg-[#0D1117] border border-white/[0.07] rounded-xl overflow-hidden mb-4" style={{ height: 560 }}>
        <svg width="100%" height="100%" viewBox="0 60 800 500" preserveAspectRatio="xMidYMid meet">
          <defs><marker id="arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#334155" /></marker></defs>
          {EDGES.map(e => {
            const f = getNode(e.from); const t = getNode(e.to)
            if (!f || !t) return null
            return (
              <g key={`${e.from}-${e.to}`}>
                <line x1={f.x} y1={f.y} x2={t.x} y2={t.y} stroke="#1E293B" strokeWidth={1} markerEnd="url(#arr)" />
                <text x={(f.x+t.x)/2} y={(f.y+t.y)/2-4} textAnchor="middle" fontSize={8} fill="#334155">{e.label}</text>
              </g>
            )
          })}
          {NODES.map(n => {
            const isSel = selected?.id === n.id
            return (
              <g key={n.id} onClick={() => setSelected(isSel ? null : n)} style={{ cursor: 'pointer' }}>
                <circle cx={n.x} cy={n.y} r={isSel ? 30 : 24} fill={n.color+'15'} stroke={isSel ? n.color : n.color+'50'} strokeWidth={isSel ? 2 : 1} style={{ filter: isSel ? `drop-shadow(0 0 8px ${n.color}60)` : 'none' }} />
                <circle cx={n.x} cy={n.y-18} r={4} fill={STATUS_COLORS[n.status]} />
                {n.label.split('\n').map((l, i) => <text key={i} x={n.x} y={n.y+i*11} textAnchor="middle" fontSize={9} fontWeight={600} fill={isSel ? n.color : '#94A3B8'}>{l}</text>)}
              </g>
            )
          })}
        </svg>
      </div>
      {selected && (
        <div className="bg-[#1C1C1C] border rounded-xl p-4" style={{ borderColor: selected.color+'40' }}>
          <div className="flex justify-between mb-1">
            <span className="font-bold text-[#F1F5F9]">{selected.label.replace('\n', ' ')}</span>
            <button onClick={() => setSelected(null)} className="text-[#475569] hover:text-white">×</button>
          </div>
          <div className="text-[11px] mb-2" style={{ color: STATUS_COLORS[selected.status] }}>{selected.status} · {selected.category}</div>
          <p className="text-[13px] text-[#94A3B8]">{selected.desc}</p>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-3">
        {Object.entries(STATUS_COLORS).map(([s, c]) => (
          <div key={s} className="flex items-center gap-1.5 text-[11px]" style={{ color: c }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: c }} />
            {s === 'connected' ? 'Connected' : s === 'partial' ? 'Partial' : 'Not connected'}
          </div>
        ))}
      </div>
    </div>
  )
}

function AgentsTab() {
  const [filter, setFilter] = useState('')
  const [cat, setCat] = useState('All')
  const cats = ['All', ...Array.from(new Set(AGENTS.map(a => a.category)))]
  const shown = AGENTS.filter(a =>
    (cat === 'All' || a.category === cat) &&
    (a.name.includes(filter.toLowerCase()) || a.desc.toLowerCase().includes(filter.toLowerCase()))
  )
  const total = AGENTS.length
  const active = AGENTS.filter(a => a.status === 'active').length
  return (
    <div>
      <div className="flex gap-4 mb-4 text-sm">
        <span className="text-[#22C55E]">{active} active</span>
        <span className="text-[#F59E0B]">{AGENTS.filter(a => a.status === 'partial').length} partial</span>
        <span className="text-[#64748B]">{total} total</span>
      </div>
      <div className="flex gap-2 mb-3 flex-wrap">
        {cats.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-3 py-1 text-xs rounded-full border transition-all ${cat === c ? 'border-[#14B8A6] text-[#14B8A6] bg-[#14B8A6]/10' : 'border-white/10 text-[#64748B] hover:text-white'}`}>
            {c}
          </button>
        ))}
        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search agents…"
          className="ml-auto px-3 py-1 text-xs bg-[#0D1117] border border-white/10 rounded text-white placeholder-[#475569] focus:outline-none focus:border-[#14B8A6]" />
      </div>
      <div className="space-y-1">
        {shown.map(a => (
          <div key={a.name} className="flex gap-3 items-start bg-[#0D1117] border border-white/[0.05] rounded-lg px-3 py-2 hover:border-white/10">
            <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: a.status === 'active' ? '#22C55E' : a.status === 'partial' ? '#F59E0B' : '#EF4444' }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] font-mono text-[#F1F5F9]">{a.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: (CAT_COLORS[a.category] || '#475569') + '25', color: CAT_COLORS[a.category] || '#94A3B8' }}>{a.category}</span>
                <span className="text-[10px] text-[#475569]">{a.schedule}</span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">{a.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SkillsTab() {
  const [cat, setCat] = useState('All')
  const cats = ['All', 'Custom IP', 'Marketing', 'SEO', 'Dev', 'Memory/Tools', 'Research']
  const shown = SKILLS.filter(s => cat === 'All' || s.category === cat)
  const SKILL_CAT_COLORS: Record<string, string> = { 'Custom IP': '#14B8A6', 'Marketing': '#EC4899', 'SEO': '#FF6D00', 'Dev': '#4285F4', 'Memory/Tools': '#8B5CF6', 'Research': '#22C55E' }
  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {cats.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-3 py-1 text-xs rounded-full border transition-all ${cat === c ? 'border-[#14B8A6] text-[#14B8A6] bg-[#14B8A6]/10' : 'border-white/10 text-[#64748B] hover:text-white'}`}>
            {c}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-2">
        {shown.map(s => (
          <div key={s.name} className="flex gap-3 items-start bg-[#0D1117] border border-white/[0.05] rounded-lg px-3 py-2">
            <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: s.installed ? '#22C55E' : '#EF4444' }} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[12px] font-mono text-[#F1F5F9]">{s.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: (SKILL_CAT_COLORS[s.category] || '#475569') + '25', color: SKILL_CAT_COLORS[s.category] || '#94A3B8' }}>{s.category}</span>
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PluginsTab({ states, toggle }: { states: Record<string, boolean>; toggle: (k: string) => void }) {
  const PRIORITY_COLORS = { installed: '#22C55E', high: '#F59E0B', medium: '#64748B', low: '#334155' }
  const PRIORITY_LABELS = { installed: 'Installed', high: 'Install next', medium: 'Consider', low: 'Optional' }
  const groups = ['installed', 'high', 'medium', 'low'] as const
  return (
    <div className="space-y-6">
      {groups.map(g => {
        const items = PLUGINS.filter(p => p.priority === g)
        if (!items.length) return null
        return (
          <div key={g}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full" style={{ background: PRIORITY_COLORS[g] }} />
              <span className="text-sm font-semibold" style={{ color: PRIORITY_COLORS[g] }}>{PRIORITY_LABELS[g]}</span>
              <span className="text-[11px] text-[#475569]">({items.length})</span>
            </div>
            <div className="space-y-1.5">
              {items.map(p => {
                const overrideInstalled = g === 'installed' ? true : !!states[p.key]
                return (
                  <div key={p.key} className="flex gap-3 items-start bg-[#0D1117] border border-white/[0.05] rounded-lg px-3 py-2.5 hover:border-white/10">
                    <button onClick={() => g !== 'installed' && toggle(p.key)}
                      className={`w-4 h-4 rounded border flex-shrink-0 mt-0.5 transition-all flex items-center justify-center text-[10px] ${overrideInstalled ? 'bg-[#22C55E] border-[#22C55E]' : 'border-white/20 hover:border-[#14B8A6]'}`}
                      title={g === 'installed' ? 'System plugin — always installed' : 'Mark as installed'}>
                      {overrideInstalled && '✓'}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold text-[#F1F5F9]">{p.name}</span>
                        <span className="text-[10px] text-[#475569] px-1.5 py-0.5 bg-white/5 rounded">{p.category}</span>
                        <a href={p.url} target="_blank" rel="noreferrer" className="text-[10px] text-[#14B8A6] hover:underline ml-auto">
                          GitHub ↗
                        </a>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-0.5">{p.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      <p className="text-[10px] text-[#334155]">Tick marks saved in localStorage. Refresh to persist between sessions.</p>
    </div>
  )
}

function HealthTab({ pluginStates }: { pluginStates: Record<string, boolean> }) {
  const TYPE_COLORS: Record<string, string> = { agent: '#8B5CF6', key: '#EF4444', deploy: '#F59E0B', plugin: '#4285F4', content: '#EC4899', tool: '#F97316', payment: '#22C55E' }
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-[#F1F5F9] mb-3">Missing / Blocked ({MISSING.length} items)</h3>
        <div className="space-y-2">
          {MISSING.map(m => (
            <div key={m.item} className="bg-[#0D1117] border border-white/[0.05] rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: (TYPE_COLORS[m.type] || '#475569') + '25', color: TYPE_COLORS[m.type] || '#94A3B8' }}>{m.type}</span>
                <span className="text-[13px] font-semibold text-[#F1F5F9]">{m.item}</span>
              </div>
              <p className="text-[11px] text-[#64748B] mb-1.5">{m.detail}</p>
              <div className="text-[10px] font-mono text-[#14B8A6] bg-[#14B8A6]/5 px-2 py-1 rounded">{m.action}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[#F1F5F9] mb-3">Agent Health Overview</h3>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { label: 'Total agents',    val: AGENTS.length,                                        color: '#F1F5F9' },
            { label: 'Active',          val: AGENTS.filter(a => a.status === 'active').length,     color: '#22C55E' },
            { label: 'Partial / setup', val: AGENTS.filter(a => a.status === 'partial').length,    color: '#F59E0B' },
            { label: 'Manual steps',    val: AGENTS.filter(a => a.status === 'manual').length,     color: '#EF4444' },
          ].map(s => (
            <div key={s.label} className="bg-[#0D1117] border border-white/[0.05] rounded-lg px-3 py-2.5 text-center">
              <div className="text-xl font-bold" style={{ color: s.color }}>{s.val}</div>
              <div className="text-[11px] text-[#64748B]">{s.label}</div>
            </div>
          ))}
        </div>
        <a href="https://github.com/keithyob26/irishpeptides-jarvis/actions" target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-[12px] text-[#14B8A6] border border-[#14B8A6]/30 rounded-lg px-3 py-2 hover:bg-[#14B8A6]/10 transition-all">
          View live GitHub Actions runs ↗
        </a>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[#F1F5F9] mb-3">Plugin Coverage</h3>
        <div className="space-y-1">
          {PLUGINS.filter(p => p.priority === 'high' && !pluginStates[p.key]).map(p => (
            <div key={p.key} className="flex items-center gap-2 text-[11px] text-[#F59E0B]">
              <span>⚠</span>
              <span className="font-semibold">{p.name}</span>
              <span className="text-[#64748B]">— recommended, not yet installed</span>
              <a href={p.url} target="_blank" rel="noreferrer" className="ml-auto text-[#14B8A6] hover:underline">Install ↗</a>
            </div>
          ))}
          {PLUGINS.filter(p => p.priority === 'high').every(p => pluginStates[p.key] || p.priority === 'installed') && (
            <p className="text-[11px] text-[#22C55E]">✓ All high-priority plugins installed</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BrainPage() {
  const [tab, setTab] = useState<Tab>('map')
  const [pluginStates, setPluginStates] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try { setPluginStates(JSON.parse(localStorage.getItem('ip_plugins') || '{}')) } catch {}
  }, [])

  const togglePlugin = (k: string) => {
    const next = { ...pluginStates, [k]: !pluginStates[k] }
    setPluginStates(next)
    try { localStorage.setItem('ip_plugins', JSON.stringify(next)) } catch {}
  }

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'map',     label: 'Map' },
    { id: 'agents',  label: 'Agents',  badge: AGENTS.length },
    { id: 'skills',  label: 'Skills',  badge: SKILLS.length },
    { id: 'plugins', label: 'Plugins', badge: PLUGINS.length },
    { id: 'health',  label: 'Health',  badge: MISSING.length },
  ]

  const connectedCount = NODES.filter(n => n.status === 'connected').length

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="🧬 Brain"
        subtitle="Source of truth — agents, skills, plugins, system health"
        badge={{ label: `${connectedCount}/${NODES.length} nodes connected`, ok: AGENTS.filter(a => a.status === 'partial').length === 0 }}
      />

      <div className="flex gap-1 mb-6 bg-[#0D1117] rounded-lg p-1 w-fit border border-white/[0.05]">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 text-sm rounded-md transition-all flex items-center gap-1.5 ${tab === t.id ? 'bg-[#14B8A6] text-black font-semibold' : 'text-[#64748B] hover:text-white'}`}>
            {t.label}
            {t.badge !== undefined && (
              <span className={`text-[10px] px-1 rounded ${tab === t.id ? 'bg-black/20 text-black' : 'bg-white/5 text-[#475569]'}`}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'map'     && <MapTab />}
      {tab === 'agents'  && <AgentsTab />}
      {tab === 'skills'  && <SkillsTab />}
      {tab === 'plugins' && <PluginsTab states={pluginStates} toggle={togglePlugin} />}
      {tab === 'health'  && <HealthTab pluginStates={pluginStates} />}
    </div>
  )
}
