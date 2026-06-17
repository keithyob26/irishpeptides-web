"use client";

const T = ({ children }: { children: React.ReactNode }) => (
  <span style={{ color: "#14B8A6", fontWeight: 700 }}>{children}</span>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: "32px" }}>
    <h2 style={{ color: "#14B8A6", fontSize: "16px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid #1E293B", paddingBottom: "8px", marginBottom: "16px" }}>
      {title}
    </h2>
    {children}
  </div>
);

const Rule = ({ n, title, body }: { n: number; title: string; body: string }) => (
  <div style={{ display: "flex", gap: "14px", marginBottom: "14px" }}>
    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#14B8A620", border: "1px solid #14B8A640", color: "#14B8A6", fontWeight: 700, fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {n}
    </div>
    <div>
      <p style={{ color: "#E2E8F0", fontWeight: 600, margin: "0 0 3px", fontSize: "14px" }}>{title}</p>
      <p style={{ color: "#94A3B8", margin: 0, fontSize: "13px", lineHeight: "1.6" }}>{body}</p>
    </div>
  </div>
);

const Schedule = ({ time, label, detail }: { time: string; label: string; detail: string }) => (
  <div style={{ display: "flex", gap: "12px", padding: "10px 0", borderBottom: "1px solid #1E293B" }}>
    <div style={{ width: "80px", color: "#14B8A6", fontWeight: 700, fontSize: "13px", flexShrink: 0 }}>{time}</div>
    <div>
      <p style={{ color: "#E2E8F0", margin: "0 0 2px", fontWeight: 600, fontSize: "13px" }}>{label}</p>
      <p style={{ color: "#64748B", margin: 0, fontSize: "12px" }}>{detail}</p>
    </div>
  </div>
);

const KW = ({ word, reply }: { word: string; reply: string }) => (
  <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "10px" }}>
    <code style={{ background: "#14B8A620", color: "#14B8A6", padding: "2px 8px", borderRadius: "4px", fontSize: "13px", fontWeight: 700, flexShrink: 0 }}>{word}</code>
    <p style={{ color: "#94A3B8", margin: 0, fontSize: "13px" }}>{reply}</p>
  </div>
);

export default function PlaybookPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#0F172A", padding: "24px 16px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>

        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ color: "#14B8A6", fontSize: "22px", fontWeight: 700, margin: "0 0 4px" }}>Playbook</h1>
          <p style={{ color: "#64748B", fontSize: "13px", margin: 0 }}>All rules, processes and schedules in one place.</p>
        </div>

        {/* ── CONTENT RULES ─────────────────────────────────────────── */}
        <Section title="Content Rules">
          <Rule n={1} title="Tone: Irish, Punchy, Myth-Busting"
            body="Never corporate. Never 'research suggests'. Lead with a fact nobody talks about. Example: 'BPC-157 isn't just for joints — here is what most people miss.'" />
          <Rule n={2} title="Hook Formula"
            body="Hook → 1 fact → 1 myth bust → CTA. Keep it under 150 words for captions. TikTok scripts under 60 seconds." />
          <Rule n={3} title="CTA — always one of these"
            body="Comment IRISH · Comment GUIDE · Comment TOOLS · Comment PEPTIDES · Comment COACH → triggers ManyChat auto-DM with free tools link." />
          <Rule n={4} title="Hashtags"
            body="Max 10. Mix: 2 broad (#peptides #irishfitness), 4 niche (#bpc157 #irishnutrition #peptideeducation #researchpeptides), 4 content-specific. Always include #irishpeptides." />
          <Rule n={5} title="Image Format"
            body="TikTok: template_vertical.png (9:16 dark molecular). Instagram: template_insta_dark.png (1:1 dark molecular). Headline overlaid in white bold. Keep headline under 8 words." />
          <Rule n={6} title="Video Format (when ready)"
            body="Manually filmed by Keith → email to keith@irishpeptides.ie with subject 'IP CONTENT' → agent captions, adds music, queues to Buffer." />
          <Rule n={7} title="Legal / Protocol"
            body="Never make medical claims. Always add 'Educational use only. Not medical advice.' Never promise results. No before/afters without permission. Peptides: always 'for research purposes'." />
          <Rule n={8} title="No AI-generated faces"
            body="All images use the dark brand template or real photos from Keith. No stock AI faces." />
        </Section>

        {/* ── POSTING SCHEDULE ──────────────────────────────────────── */}
        <Section title="Daily Posting Schedule">
          <Schedule time="Mon" label="Protein / Nutrition Post" detail="Irish supermarket finds, macro tips, food myths. Push free tools link." />
          <Schedule time="Tue" label="Free Tool Promo" detail="Drive traffic to irishpeptides.ie/free-tools. Rotate: macro calc, peptide calc, nutrition guide, body fat, recovery score." />
          <Schedule time="Wed" label="Peptide Education" detail="BPC-157, TB-500, GHK-Cu, CJC-1295, Ipamorelin. Myth-bust format. 'Comment PEPTIDES for the guide.'" />
          <Schedule time="Thu" label="Free Tool Promo" detail="Different tool than Tuesday. Add social proof if any (subscriber count, downloads)." />
          <Schedule time="Fri" label="Motivation / Myth-Bust" detail="Bust a common Irish gym myth. Short punchy format. High share potential." />
          <Schedule time="Sat" label="Meal Ideas / Recipes" detail="Irish-friendly high protein meal. Real food, real macros, realistic portions." />
          <Schedule time="Sun" label="Weekly Review / Q&A" detail="What worked this week. Answer a follower question. Preview next week content." />
        </Section>

        {/* ── AGENT SCHEDULE ────────────────────────────────────────── */}
        <Section title="Agent Schedule (GitHub Actions)">
          <Schedule time="07:00 UTC" label="Content Engine" detail="Generates 1 TikTok + 1 Instagram post from templates. Queues to Buffer if token active." />
          <Schedule time="07:05 UTC" label="Social Intel" detail="Scrapes watched Instagram accounts. Extracts trending hooks, topics, hashtags. Saves to memory/social_intel.json. WhatsApp digest." />
          <Schedule time="08:00 UTC" label="SEO Loop" detail="Monitors search rankings, keyword opportunities. Updates content calendar." />
          <Schedule time="08:00 UTC" label="GA4 Monitor" detail="Pulls website traffic, top pages, sources. WhatsApp daily insight." />
          <Schedule time="08:00 UTC" label="Competitor Monitor" detail="Monday only. Scrapes competitor sites + Instagram. WhatsApp digest." />
          <Schedule time="09:00 UTC" label="Affiliate Monitor" detail="Monday only. Checks affiliate commission reports." />
          <Schedule time="10:00 UTC" label="Newsletter Agent" detail="Sunday only. Generates weekly email digest. Requires Resend domain verified." />
          <Schedule time="20:00 UTC" label="Plan Compliance" detail="Sunday only. Checks all agents ran, flags deviations from master plan." />
          <Schedule time="Hourly" label="Email Video Pipeline" detail="Polls keith@irishpeptides.ie for 'IP CONTENT' subject. Processes video, captions, queues. Needs ZOHO_APP_PASSWORD." />
        </Section>

        {/* ── MANYCHAT KEYWORDS ─────────────────────────────────────── */}
        <Section title="ManyChat Comment Keywords">
          <p style={{ color: "#64748B", fontSize: "13px", marginBottom: "14px" }}>When someone comments these words on an Instagram post, they get an auto-DM.</p>
          <KW word="IRISH" reply="'Hey! Here's your free nutrition and peptide guide: irishpeptides.ie/free-tools — built for Irish gym-goers.'" />
          <KW word="GUIDE" reply="Sends free tools link + explains what's available (calculators + PDF downloads)" />
          <KW word="TOOLS" reply="Sends irishpeptides.ie/free-tools direct link" />
          <KW word="PEPTIDES" reply="Sends peptide reconstitution calculator link + educational disclaimer" />
          <KW word="COACH" reply="Sends coaching page link: irishpeptides.ie/coaching" />
        </Section>

        {/* ── EMAIL CAPTURE FUNNEL ──────────────────────────────────── */}
        <Section title="Email Capture Funnel">
          <Rule n={1} title="Free Tool Gate"
            body="All 11 calculators on irishpeptides.ie/free-tools prompt for email on first visit. After submit → unlock all tools forever (localStorage). Email saves to Resend audience." />
          <Rule n={2} title="PDF Download Gate"
            body="4 free PDF downloads (7-day blueprint, 3-day split, 4-day split, 5-day split) require email. PDF sent to inbox via Resend." />
          <Rule n={3} title="Social → Free Tools"
            body="Posts push traffic to free-tools page. Visitors hit email gate. Builds subscriber list automatically." />
          <Rule n={4} title="Newsletter"
            body="Sunday 10am: weekly email digest to all subscribers via Resend. From keith@irishpeptides.ie once domain verified." />
        </Section>

        {/* ── ACCOUNTS TO WATCH ─────────────────────────────────────── */}
        <Section title="Social Intel — Accounts Monitored">
          <p style={{ color: "#94A3B8", fontSize: "13px", marginBottom: "12px" }}>
            Social Intel agent scrapes these public Instagram accounts daily. Edit <code style={{ color: "#14B8A6" }}>agents/social_intel.py → WATCH_ACCOUNTS</code> to add/remove.
          </p>
          <p style={{ color: "#64748B", fontSize: "13px" }}>
            <T>Keith:</T> paste in the handles of accounts you follow that post content you want to learn from. Agent extracts top hooks, topics, hashtags and post ideas daily.
          </p>
          <p style={{ color: "#EF4444", fontSize: "12px", marginTop: "10px" }}>
            Note: Only public accounts can be scraped. Private accounts are skipped.
          </p>
        </Section>

        {/* ── KEY LINKS ─────────────────────────────────────────────── */}
        <Section title="Key Links">
          {[
            ["irishpeptides.ie", "https://irishpeptides.ie", "Main website"],
            ["Free Tools", "https://irishpeptides.ie/free-tools", "Email-gated calculators + downloads"],
            ["Dashboard", "https://irishpeptides-web.vercel.app", "This dashboard"],
            ["Manual Steps", "/manual-steps", "Remaining setup tasks with instructions"],
            ["Buffer", "https://buffer.com", "Social scheduling"],
            ["ManyChat", "https://app.manychat.com", "Comment automation"],
            ["Resend", "https://resend.com", "Email + subscriber list"],
            ["Notion", "https://notion.so", "Task queue and master status"],
            ["Cloudflare", "https://dash.cloudflare.com", "Website + env vars"],
          ].map(([label, href, desc]) => (
            <div key={label} style={{ display: "flex", gap: "12px", padding: "8px 0", borderBottom: "1px solid #1E293B10", alignItems: "center" }}>
              <a href={href} target={href.startsWith("http") ? "_blank" : "_self"} rel="noopener noreferrer"
                style={{ color: "#14B8A6", fontWeight: 600, fontSize: "13px", minWidth: "160px", textDecoration: "none" }}>
                {label} →
              </a>
              <span style={{ color: "#64748B", fontSize: "12px" }}>{desc}</span>
            </div>
          ))}
        </Section>

        <p style={{ color: "#1E293B", fontSize: "11px", textAlign: "center", marginTop: "32px" }}>
          Irish Peptides & Nutrition — Internal Playbook
        </p>
      </div>
    </main>
  );
}
