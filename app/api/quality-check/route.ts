import { NextRequest, NextResponse } from "next/server";

const GEMINI_KEY = process.env.GEMINI_API_KEY || "";

const LEGAL_PROMPT = `You are a legal compliance checker for Irish Peptides & Nutrition content.
Check this content against:
- EU Regulation 1924/2006 (health claims)
- ASAI Code of Standards Ireland
- CCPC consumer rights guidelines
- Irish Health Products Regulatory Authority guidelines

Return JSON: { "pass": boolean, "issues": string[], "suggestion": string }
Be strict. Flag any medical claims, disease treatment claims, or missing disclaimers.`;

const PROTOCOL_PROMPT = `You are the Protocol Guard for Irish Peptides & Nutrition.
Check this content for:
- Research-only framing (not medical advice)
- Required disclaimer: "For educational and research purposes only. Not medical advice."
- Brand voice: educational, Irish market, approachable
- No hype or unsubstantiated claims

Return JSON: { "pass": boolean, "issues": string[], "suggestion": string }`;

const QUALITY_PROMPT = `You are a content quality reviewer for Irish Peptides & Nutrition.
Check this content for:
- Tone: educational, conversational, Irish market focus
- SEO: keyword presence, readable structure
- Engagement: hook strength, CTA clarity
- Irish market relevance

Return JSON: { "pass": boolean, "score": number (1-10), "issues": string[], "suggestion": string }`;

async function geminiCheck(content: string, systemPrompt: string) {
  if (!GEMINI_KEY) return { pass: false, issues: ["Gemini API key not set"], suggestion: "" };
  const prompt = `${systemPrompt}\n\nCONTENT TO CHECK:\n${content.slice(0, 3000)}`;
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 400, temperature: 0.2 },
        }),
      }
    );
    const d = await r.json();
    const text = d?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    // Strip markdown code fences if present
    const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(clean);
  } catch (e) {
    return { pass: false, issues: [String(e)], suggestion: "" };
  }
}

export async function POST(req: NextRequest) {
  const { content } = await req.json();
  if (!content) return NextResponse.json({ error: "content required" }, { status: 400 });

  // Run all 3 checks in parallel
  const [legal, protocol, quality] = await Promise.all([
    geminiCheck(content, LEGAL_PROMPT),
    geminiCheck(content, PROTOCOL_PROMPT),
    geminiCheck(content, QUALITY_PROMPT),
  ]);

  const allPass = legal.pass && protocol.pass && quality.pass;

  return NextResponse.json({
    overall_pass: allPass,
    steps: [
      { id: "legal", label: "Legal Compliance", icon: "⚖️", ...legal },
      { id: "protocol", label: "Protocol Guard", icon: "🛡️", ...protocol },
      { id: "quality", label: "Quality Review", icon: "⭐", ...quality },
    ],
  });
}
