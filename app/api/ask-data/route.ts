import { NextRequest, NextResponse } from "next/server";

const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const RESEND_KEY = process.env.RESEND_API_KEY || "";
const REPO = "keithyob26/irishpeptides-jarvis";

async function fetchGitHub(file: string) {
  if (!GITHUB_TOKEN) return null;
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/contents/${file}`, {
      headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" },
      cache: "no-store",
    });
    if (!r.ok) return null;
    const d = await r.json();
    return JSON.parse(Buffer.from(d.content, "base64").toString("utf-8"));
  } catch { return null; }
}

async function geminiAnswer(question: string, context: string): Promise<string> {
  if (!GEMINI_KEY) return "Gemini API key not configured.";
  const prompt = `You are Jarvis, the AI assistant for Irish Peptides & Nutrition. Keith is asking about his business data.

DATA:
${context}

QUESTION: ${question}

Answer in plain English like a smart colleague. 2-4 sentences max. Be specific with numbers. Add one suggestion at the end. No bullet points or markdown.`;

  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 200, temperature: 0.7 },
      }),
    }
  );
  const d = await r.json();
  return d?.candidates?.[0]?.content?.parts?.[0]?.text ?? "No answer generated.";
}

export async function POST(req: NextRequest) {
  const { question, context: ctx } = await req.json();
  if (!question) return NextResponse.json({ error: "question required" }, { status: 400 });

  const parts: string[] = [];

  // Always load outcomes for agent/content context
  const outcomes = await fetchGitHub("memory/outcomes.json");
  if (outcomes?.outcomes?.length) {
    const recent = outcomes.outcomes.slice(-10);
    parts.push(`Recent agent runs:\n${recent.map((o: Record<string,string>) => `- ${o.agent}: ${o.action || o.task} (${o.status})`).join("\n")}`);
  }

  if (ctx === "ga4" || ctx === "analytics") {
    const token = await fetchGitHub("memory/token_usage.json");
    if (token?.summary) {
      parts.push(`Token/cost summary: ${JSON.stringify(token.summary)}`);
    }
    // GA4 data comes from search-console API — summarise what we have
    parts.push("GA4 property: 539754026 (irishpeptides.ie). Data available via Search Console API.");
  }

  if (ctx === "social") {
    const social = await fetchGitHub("memory/social_intel.json");
    if (social) parts.push(`Social intel: ${JSON.stringify(social).slice(0, 800)}`);
    const tracker = await fetchGitHub("memory/post_layout_tracker.json");
    if (tracker) parts.push(`Post tracker: ${JSON.stringify(tracker).slice(0, 400)}`);
  }

  if (ctx === "tokens") {
    const token = await fetchGitHub("memory/token_usage.json");
    if (token) parts.push(`Token usage data: ${JSON.stringify(token)}`);
  }

  const contextStr = parts.join("\n\n") || "No live data available yet.";
  const answer = await geminiAnswer(question, contextStr);

  return NextResponse.json({ answer, context_used: parts.length });
}
