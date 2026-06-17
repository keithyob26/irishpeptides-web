"use client";

import { useEffect, useState } from "react";

const NOTION_PAGE_ID = "381a0eb7-e3ea-81e5-afec-e0785e05de61";

interface Step {
  id: string;
  title: string;
  done: boolean;
  category: string;
  blocks_what?: string;
  url?: string;
  substeps: string[];
}

const STEPS: Step[] = [
  // ── VERCEL KEYS ──────────────────────────────────────────────────────────────
  {
    id: "anthropic_key",
    title: "ANTHROPIC_API_KEY → Vercel",
    category: "Vercel Keys",
    blocks_what: "Claude AI Chat (streaming SSE + file upload)",
    url: "https://console.anthropic.com/settings/keys",
    done: false,
    substeps: [
      "Go to console.anthropic.com → Settings → API Keys",
      "Create new key → copy it (shown once only)",
      "Go to vercel.com/keithyob26/irishpeptides-web → Settings → Environment Variables",
      "Add: ANTHROPIC_API_KEY = <paste key> → Production + Preview + Development",
      "Redeploy: Deployments → top deploy → ⋯ → Redeploy",
    ],
  },
  {
    id: "ga4_json",
    title: "GA4_SERVICE_ACCOUNT_JSON → Vercel",
    category: "Vercel Keys",
    blocks_what: "Analytics panel — GA4 traffic, organic search data",
    url: "https://console.cloud.google.com/iam-admin/serviceaccounts",
    done: false,
    substeps: [
      "Go to console.cloud.google.com → Select project → IAM & Admin → Service Accounts",
      "Create service account: name 'irishpeptides-ga4-reader', role = Viewer",
      "Click service account → Keys tab → Add Key → JSON → download file",
      "Go to analytics.google.com → Admin → Property Access Management → + → add service account email as Viewer",
      "Open the downloaded JSON → copy entire contents",
      "Go to vercel.com/keithyob26/irishpeptides-web → Settings → Environment Variables",
      "Add: GA4_SERVICE_ACCOUNT_JSON = <paste full JSON> (wrap in single-line string if needed)",
      "Also add: GA4_PROPERTY_ID = your GA4 property ID (Admin → Property Settings → Property ID)",
      "Redeploy",
    ],
  },
  // ── GITHUB ───────────────────────────────────────────────────────────────────
  {
    id: "github_pat_workflow",
    title: "GitHub PAT — add workflow scope",
    category: "GitHub",
    blocks_what: "Pushing .github/workflows/*.yml files — agent chaining, archive, CFO commits pending",
    url: "https://github.com/settings/tokens",
    done: false,
    substeps: [
      "Go to github.com/settings/tokens → find token starting ghp_dOb3...",
      "Click token name → check workflow checkbox under Scopes",
      "Update token → copy new value (regenerate if needed)",
      "Update C:\\Projects\\greyhound-dashboard\\tableau_secrets.env → GITHUB_TOKEN=<new value>",
      "Update Vercel: vercel.com/keithyob26/irishpeptides-web → Settings → Env Vars → GITHUB_TOKEN",
      "Run locally: cd C:\\Projects\\irishpeptides_jarvis && git push origin master",
    ],
  },
  {
    id: "git_history_scrub",
    title: "Scrub git history before making jarvis repo public",
    category: "GitHub",
    url: "https://rtyley.github.io/bfg-repo-cleaner/",
    done: false,
    substeps: [
      "Download BFG: java -jar bfg.jar --replace-text secrets.txt irishpeptides-jarvis.git",
      "Create secrets.txt with: all API keys from tableau_secrets.env (one per line)",
      "Run: bfg --replace-text secrets.txt --no-blob-protection",
      "Run: git reflog expire --expire=now --all && git gc --prune=now --aggressive",
      "Force push: git push --force",
      "Then make repo public on github.com/keithyob26/irishpeptides-jarvis → Settings → Danger Zone",
    ],
  },
  // ── EXTERNAL SERVICES ────────────────────────────────────────────────────────
  {
    id: "elevenlabs",
    title: "ElevenLabs — record Keith's voice",
    category: "External Services",
    blocks_what: "Video pipeline — faceless reels with Keith's voice",
    url: "https://elevenlabs.io/app/voice-lab",
    done: false,
    substeps: [
      "Sign up at elevenlabs.io (free tier — 10k chars/month)",
      "Go to Voice Lab → Add Generative Voice → Professional",
      "Record 2 minutes of clear speech — read from irishpeptides.ie blog post",
      "Name it exactly: Keith",
      "Copy Voice ID from settings",
      "Add to Vercel env: ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID",
      "Content Studio video pipeline activates automatically once keys are set",
    ],
  },
  {
    id: "facebook",
    title: "Facebook developer — fix phone number",
    category: "External Services",
    blocks_what: "Instagram Graph API — direct publishing, insights, follower count",
    url: "https://accountscenter.facebook.com/personal_info/phone_numbers/",
    done: false,
    substeps: [
      "Go to accountscenter.facebook.com → Personal details → Contact info → Phone",
      "Update to current Irish number (353896554700)",
      "Verify via SMS",
      "Go to developers.facebook.com → My Apps → Create App → Business type",
      "Add Instagram Graph API product",
      "Go to App Review → Request instagram_basic, instagram_content_publish, pages_read_engagement",
      "Add FACEBOOK_APP_ID + FACEBOOK_APP_SECRET + INSTAGRAM_ACCOUNT_ID to Vercel",
    ],
  },
  {
    id: "google_workspace_mcp",
    title: "Google Workspace MCP OAuth",
    category: "External Services",
    blocks_what: "Gmail/Calendar access in Claude Code sessions",
    url: "https://console.cloud.google.com/apis/credentials",
    done: false,
    substeps: [
      "Go to console.cloud.google.com → APIs & Services → Enable APIs",
      "Enable: Gmail API, Google Calendar API, Google Drive API",
      "Credentials → Create Credentials → OAuth 2.0 Client ID → Desktop app",
      "Download credentials JSON",
      "In Claude Code: Settings → MCP Servers → + → Google Workspace",
      "Paste credentials path",
      "Run auth flow — browser opens → sign in with Google account",
    ],
  },
  {
    id: "tiktok",
    title: "TikTok — rebrand 2000-follower account",
    category: "External Services",
    blocks_what: "TikTok publishing, existing audience",
    url: "https://www.tiktok.com/setting",
    done: false,
    substeps: [
      "Log in to TikTok account with 2000 followers",
      "Settings → Account → Username → change to @irishpeptides",
      "Profile → Edit → Name: Irish Peptides & Nutrition",
      "Bio: Evidence-based peptides, nutrition & coaching for Ireland 🇮🇪",
      "Profile pic: use logo from irishpeptides.ie/images/",
      "Settings → Account → Switch to Business Account → Health & Wellness",
      "TikTok for Business dashboard → apply for Content API access",
    ],
  },
  {
    id: "resend_domain",
    title: "Resend — verify irishpeptides.ie domain",
    category: "External Services",
    blocks_what: "Sending newsletter from keith@irishpeptides.ie",
    url: "https://resend.com/domains",
    done: false,
    substeps: [
      "Go to resend.com/domains → Add Domain → irishpeptides.ie",
      "Copy 3 DNS records (MX, TXT, CNAME)",
      "Add DNS records in your domain registrar (Cloudflare or wherever irishpeptides.ie is managed)",
      "Click Verify in Resend → wait 5-10 minutes",
      "Test send from dashboard",
    ],
  },
  {
    id: "stripe",
    title: "Stripe — when first client pays",
    category: "Business Setup",
    blocks_what: "Payment processing, automated invoicing",
    url: "https://dashboard.stripe.com/register",
    done: false,
    substeps: [
      "Register at stripe.com with business email",
      "Complete identity verification (Irish address, PPS number)",
      "Settings → API Keys → copy Secret Key",
      "Add to Vercel: STRIPE_SECRET_KEY + STRIPE_PUBLISHABLE_KEY",
      "Create Products: Consultation €79, Researcher €149/mo, Elite €299/mo",
      "Stripe → Payment Links → create per product",
      "Add links to coaching.html on irishpeptides.ie",
    ],
  },
  {
    id: "sole_trader",
    title: "Register sole trader — Revenue.ie",
    category: "Business Setup",
    blocks_what: "Legal invoicing to clients",
    url: "https://www.revenue.ie/en/self-assessment-and-self-employment/guide-to-self-assessment/index.aspx",
    done: false,
    substeps: [
      "Go to revenue.ie → MyAccount → Register for Income Tax (Form TR1)",
      "Business name: Irish Peptides & Nutrition",
      "Business type: Sole Trader",
      "Effective date: date of first payment received",
      "Open separate business current account (AIB, BOI, or Revolut Business)",
      "Keep receipts for all expenses from start date",
    ],
  },
  {
    id: "bank",
    title: "Separate bank account for business",
    category: "Business Setup",
    url: "https://www.revolut.com/business/",
    done: false,
    substeps: [
      "Revolut Business: fast setup, no monthly fee on Freelancer plan",
      "OR AIB Start-Up Business account (free for 12 months)",
      "Keep personal and business transactions separate from first payment",
    ],
  },
  // ── CONTENT & BRANDING ───────────────────────────────────────────────────────
  {
    id: "logo",
    title: "Irish Peptides logo — header + favicon",
    category: "Content & Branding",
    url: "https://www.canva.com",
    done: false,
    substeps: [
      "Design in Canva: teal (#14B8A6) shamrock + DNA helix or bicep motif",
      "Export PNG 512×512 (logo) and 32×32 ICO (favicon)",
      "Upload to irishpeptides.ie/images/logo.png",
      "Update index.html: <link rel='icon' href='/images/favicon.ico'>",
      "Update header: replace text logo with <img src='/images/logo.png'>",
      "Commit to keithyob26/irishpeptides-website",
    ],
  },
  {
    id: "cal_com",
    title: "Cal.com — booking links per coaching tier",
    category: "Content & Branding",
    url: "https://cal.com",
    done: false,
    substeps: [
      "Sign up at cal.com with Google account",
      "Create 3 event types: Consultation (45 min), Researcher Check-in (30 min), Elite Weekly (30 min)",
      "Set availability: Mon-Fri 7pm-9pm, Sat 10am-1pm",
      "Copy booking links",
      "Add to coaching.html on irishpeptides.ie",
      "Add CALENDLY_URL (or CAL_LINK) env var to Vercel for dashboard booking widget",
    ],
  },
  // ── MONITORING ───────────────────────────────────────────────────────────────
  {
    id: "cloudflare",
    title: "Cloudflare WAF — protect irishpeptides.ie",
    category: "Monitoring",
    url: "https://dash.cloudflare.com",
    done: false,
    substeps: [
      "Log in to dash.cloudflare.com → select irishpeptides.ie",
      "Security → WAF → Managed Rules → Enable Cloudflare Managed Ruleset",
      "Security → Bots → Bot Fight Mode → On",
      "Speed → Optimization → Auto Minify → CSS + JS + HTML",
      "Takes 5 minutes, free plan sufficient",
    ],
  },
  {
    id: "uptimerobot",
    title: "UptimeRobot — uptime monitoring",
    category: "Monitoring",
    url: "https://uptimerobot.com",
    done: false,
    substeps: [
      "Sign up at uptimerobot.com (free — 50 monitors, 5-min checks)",
      "Add monitor: irishpeptides.ie → HTTP(S) → alert email",
      "Add monitor: irishpeptides-web.vercel.app",
      "Set alert contact: keith.obeirne@greyhoundrecycling.com",
    ],
  },
  // ── MISC ─────────────────────────────────────────────────────────────────────
  {
    id: "buffer",
    title: "Buffer — connect social profiles",
    category: "Monitoring",
    blocks_what: "Social post scheduling to Instagram + Facebook",
    url: "https://buffer.com/developers/apps",
    done: false,
    substeps: [
      "BUFFER_ACCESS_TOKEN already set in Vercel",
      "Go to publish.buffer.com → Connect channels",
      "Connect Instagram Business account (requires Facebook Business page)",
      "Connect Facebook Page",
      "Test: Content Studio → approve a social post → check Buffer queue",
    ],
  },
  {
    id: "manychat",
    title: "ManyChat — comment automation",
    category: "Monitoring",
    blocks_what: "Auto-reply to comments with keywords IRISH, GUIDE, TOOLS, PEPTIDES, COACH",
    url: "https://app.manychat.com",
    done: false,
    substeps: [
      "MANYCHAT_API_KEY already set in Vercel",
      "Go to app.manychat.com → Automation → Keywords",
      "Create flows for: IRISH → free tools link, GUIDE → blog link, COACH → cal.com link",
      "Connect Instagram account (requires Facebook Business page first)",
    ],
  },
  {
    id: "github_emails",
    title: "GitHub — turn off Actions failure emails",
    category: "Monitoring",
    url: "https://github.com/settings/notifications",
    done: false,
    substeps: [
      "Go to github.com/settings/notifications",
      "Actions → uncheck 'Failed workflows only' or set to 'None'",
    ],
  },
  {
    id: "google_gems",
    title: "Google Gems — AI assistants",
    category: "Content & Branding",
    url: "https://gemini.google.com/gems/create",
    done: false,
    substeps: [
      "Go to gemini.google.com/gems/create",
      "Create Gem: Protocol Guard — upload skills/irishpeptides.md + compliance rules",
      "Create Gem: Content Engine — brand voice, post formats, hashtag rules",
      "Create Gem: Client Plan Builder — coaching tiers, supplement protocols",
    ],
  },
  {
    id: "notebooklm",
    title: "NotebookLM — coaching framework knowledge base",
    category: "Content & Branding",
    url: "https://notebooklm.google.com",
    done: false,
    substeps: [
      "Go to notebooklm.google.com → New notebook",
      "Upload: skills/irishpeptides.md, skills/irishpeptides_plan.md",
      "Upload: any peptide research PDFs",
      "Use for generating evidence-backed content without hallucination",
    ],
  },
  {
    id: "tiktok_sounds",
    title: "TikTok trending sounds — manual add before posting",
    category: "Content & Branding",
    done: false,
    substeps: [
      "Cannot be automated via TikTok API",
      "When video is ready in Content Studio: open TikTok → Discover → Trending sounds",
      "Pick trending sound relevant to fitness/wellness",
      "Add sound in TikTok app before publishing (30 seconds)",
      "Note in Content Studio is a reminder on every video post",
    ],
  },
  {
    id: "beacons",
    title: "Beacons.ai — bio link page",
    category: "Content & Branding",
    url: "https://beacons.ai",
    done: false,
    substeps: [
      "Sign up at beacons.ai → username: irishpeptides",
      "Add links: irishpeptides.ie, coaching page, blog, free tools",
      "Set brand colours: teal #14B8A6, dark #0F172A",
      "Put beacons.ai/irishpeptides in all social bios",
    ],
  },
  {
    id: "google_business",
    title: "Google Business Profile",
    category: "Business Setup",
    url: "https://business.google.com",
    done: false,
    substeps: [
      "Go to business.google.com → Add business",
      "Category: Health Consultant",
      "Business name: Irish Peptides & Nutrition",
      "Location: Ireland (service area business — no physical address needed)",
      "Add website: irishpeptides.ie",
      "Verify via postcard or phone",
    ],
  },
  {
    id: "obsidian",
    title: "Obsidian — personal knowledge base",
    category: "Content & Branding",
    url: "https://obsidian.md",
    done: false,
    substeps: [
      "Download Obsidian from obsidian.md",
      "Create vault: C:\\Projects\\irishpeptides-knowledge",
      "Import: all peptide research notes, protocol logs, client notes",
      "Install plugins: Dataview, Templater, Calendar",
      "Link to NotebookLM for AI-assisted research",
    ],
  },
  {
    id: "firefly",
    title: "Firefly III — personal finance tracking (start when revenue comes in)",
    category: "Business Setup",
    url: "https://www.firefly-iii.org",
    done: false,
    substeps: [
      "Wait until first client revenue received",
      "Install via Docker: docker run -d -p 8080:8080 fireflyiii/core",
      "Set up accounts: Irish Peptides business, personal",
      "Import bank CSV exports monthly",
      "Track: coaching income, API costs, domain/hosting expenses",
    ],
  },
];

const CATEGORIES = ["Vercel Keys", "GitHub", "External Services", "Business Setup", "Content & Branding", "Monitoring"];

export default function ManualStepsPage() {
  const [steps, setSteps] = useState<Step[]>(STEPS);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [lastSync, setLastSync] = useState<string>("");
  const [syncing, setSyncing] = useState(false);

  // Load persisted done state from GitHub via /api/complete-step
  async function loadDoneState() {
    try {
      const r = await fetch('/api/complete-step', { cache: 'no-store' });
      if (!r.ok) return;
      const data = await r.json();
      const doneIds: string[] = data.done || [];
      setSteps(prev => prev.map(s => ({ ...s, done: doneIds.includes(s.id) })));
      setLastSync(new Date().toLocaleTimeString('en-IE'));
    } catch { /* use local state */ }
  }

  useEffect(() => {
    loadDoneState();
    // Auto-refresh every 30s — picks up completions from Claude sessions
    const t = setInterval(loadDoneState, 30000);
    return () => clearInterval(t);
  }, []);

  async function toggleDone(id: string) {
    // Optimistic update
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s)));
    setSyncing(true);
    try {
      await fetch('/api/complete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step_id: id }),
      });
      setLastSync(new Date().toLocaleTimeString('en-IE'));
    } catch { /* optimistic update already applied */ }
    setSyncing(false);
  }

  const filtered = steps.filter((s) => filter === "all" || s.category === filter);
  const pending = filtered.filter((s) => !s.done);
  const done = filtered.filter((s) => s.done);
  const totalPending = steps.filter((s) => !s.done).length;

  return (
    <main style={{ minHeight: "100vh", background: "#0F172A", padding: "24px 16px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ color: "#14B8A6", fontSize: "22px", fontWeight: 700, margin: "0 0 4px" }}>
            Manual Steps
          </h1>
          <p style={{ color: "#64748B", fontSize: "13px", margin: "0 0 4px" }}>
            Irish Peptides — {totalPending} steps remaining
          </p>
          <p style={{ color: "#334155", fontSize: "11px", margin: "0 0 16px" }}>
            {syncing ? "Saving…" : lastSync ? `Synced ${lastSync} · auto-refreshes every 30s` : "Loading done state…"}
            {" · "}Tap circle to mark done · Claude marks steps done automatically
          </p>

          {/* Category filter */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {["all", ...CATEGORIES].map((cat) => {
              const count = cat === "all" ? steps.filter(s => !s.done).length : steps.filter(s => s.category === cat && !s.done).length;
              return (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  style={{
                    background: filter === cat ? "#14B8A6" : "#1E293B",
                    color: filter === cat ? "#0F172A" : "#94A3B8",
                    border: "1px solid",
                    borderColor: filter === cat ? "#14B8A6" : "#334155",
                    borderRadius: "20px",
                    padding: "4px 12px",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {cat === "all" ? "All" : cat} {count > 0 ? `(${count})` : "✓"}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pending steps */}
        {pending.map((step) => {
          const isExpanded = expanded === step.id;
          return (
            <div
              key={step.id}
              style={{
                background: "#1E293B",
                border: "1px solid #334155",
                borderRadius: "10px",
                marginBottom: "10px",
                overflow: "hidden",
              }}
            >
              {/* Row */}
              <div style={{ display: "flex", gap: "14px", padding: "14px 16px", alignItems: "flex-start" }}>
                {/* Done toggle */}
                <div
                  onClick={() => toggleDone(step.id)}
                  style={{
                    width: "22px", height: "22px", borderRadius: "50%",
                    border: "2px solid #475569", flexShrink: 0, marginTop: "2px", cursor: "pointer",
                  }}
                />
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                    <span style={{ background: "#0F172A", color: "#64748B", fontSize: "10px", padding: "2px 8px", borderRadius: "10px", border: "1px solid #334155" }}>
                      {step.category}
                    </span>
                    {step.blocks_what && (
                      <span style={{ color: "#F59E0B", fontSize: "11px" }}>
                        ⚠ Blocks: {step.blocks_what}
                      </span>
                    )}
                  </div>
                  <p
                    onClick={() => setExpanded(isExpanded ? null : step.id)}
                    style={{ color: "#E2E8F0", fontSize: "15px", fontWeight: 600, margin: "0 0 2px", cursor: "pointer", lineHeight: "1.4" }}
                  >
                    {step.title}
                  </p>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : step.id)}
                      style={{ background: "none", border: "none", color: "#14B8A6", fontSize: "12px", cursor: "pointer", padding: 0 }}
                    >
                      {isExpanded ? "▲ Hide steps" : `▼ ${step.substeps.length} steps`}
                    </button>
                    {step.url && (
                      <a
                        href={step.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#94A3B8", fontSize: "12px", textDecoration: "none" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Open ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded sub-steps */}
              {isExpanded && (
                <div style={{ padding: "0 16px 16px 52px", borderTop: "1px solid #0F172A" }}>
                  <ol style={{ margin: "12px 0 0", padding: 0, listStyle: "none" }}>
                    {step.substeps.map((sub, i) => {
                      // Detect URLs in substep text
                      const urlMatch = sub.match(/(https?:\/\/[^\s]+)/);
                      const beforeUrl = urlMatch ? sub.slice(0, sub.indexOf(urlMatch[0])) : sub;
                      const afterUrl = urlMatch ? sub.slice(sub.indexOf(urlMatch[0]) + urlMatch[0].length) : "";
                      return (
                        <li key={i} style={{
                          display: "flex", gap: "10px", marginBottom: "8px", alignItems: "flex-start",
                        }}>
                          <span style={{
                            background: "#334155", color: "#94A3B8", fontSize: "10px", fontWeight: 700,
                            borderRadius: "50%", width: "18px", height: "18px", flexShrink: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            {i + 1}
                          </span>
                          <span style={{ color: "#94A3B8", fontSize: "13px", lineHeight: "1.5" }}>
                            {beforeUrl}
                            {urlMatch && (
                              <a href={urlMatch[0]} target="_blank" rel="noopener noreferrer"
                                style={{ color: "#14B8A6", textDecoration: "underline" }}>
                                {urlMatch[0]}
                              </a>
                            )}
                            {afterUrl}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                  {step.url && (
                    <a
                      href={step.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-block", marginTop: "10px",
                        background: "#14B8A6", color: "#0F172A",
                        fontSize: "12px", fontWeight: 700,
                        padding: "8px 16px", borderRadius: "8px", textDecoration: "none",
                      }}
                    >
                      Open {step.url.replace("https://", "").split("/")[0]} ↗
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Done section */}
        {done.length > 0 && (
          <>
            <p style={{ color: "#334155", fontSize: "12px", margin: "24px 0 10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Done ({done.length})
            </p>
            {done.map((step) => (
              <div
                key={step.id}
                style={{
                  background: "#0F172A", border: "1px solid #1E293B", borderRadius: "8px",
                  padding: "10px 16px", marginBottom: "6px", display: "flex", gap: "12px",
                  alignItems: "center", cursor: "pointer",
                }}
                onClick={() => toggleDone(step.id)}
              >
                <div style={{
                  width: "20px", height: "20px", borderRadius: "50%", background: "#14B8A6",
                  flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "11px", color: "#0F172A",
                }}>✓</div>
                <span style={{ color: "#334155", fontSize: "13px", textDecoration: "line-through" }}>
                  {step.title}
                </span>
              </div>
            ))}
          </>
        )}

        <p style={{ color: "#1E293B", fontSize: "11px", textAlign: "center", marginTop: "32px" }}>
          Bookmark this page · Progress saved in session only · Tap circle to mark done
        </p>
      </div>
    </main>
  );
}
