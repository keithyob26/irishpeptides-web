import { NextResponse } from "next/server";

export const maxDuration = 60;

const GEMINI_KEY  = process.env.GEMINI_API_KEY  || "";
const RESEND_KEY  = process.env.RESEND_API_KEY   || "";
const NOTION_KEY  = process.env.NOTION_API_KEY   || "";
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID || "fe3ebf86-af78-485c-bfe8-96151603d89e";
const FROM        = "Irish Peptides <plans@irishpeptides.ie>";
const NOTION_LEADS_PAGE = "37da0eb7-e3ea-819e-af5b-e76db92a7c8c";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req: Request) {
  const cors = { "Access-Control-Allow-Origin": "*" };

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: cors }); }

  const { email, name, calories, preference, training_days, goal } = body as {
    email: string; name?: string; calories?: number;
    preference: string; training_days: string; goal: string;
  };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400, headers: cors });
  }

  const displayName = name || "there";
  const kcal = calories ? `${calories} kcal/day` : "maintenance calories";
  const days  = training_days ? `${training_days} days/week` : "3 days/week";

  // ── Gemini meal plan generation ─────────────────────────────────────────
  let mealPlan = "";
  if (GEMINI_KEY) {
    const prompt = `You are a nutrition coach specialising in Irish fitness culture. Generate a personalised 7-day meal plan.

User details:
- Name: ${displayName}
- Daily calories: ${kcal}
- Dietary preference: ${preference}
- Training frequency: ${days}
- Primary goal: ${goal}

Rules:
- DIETARY RESTRICTION IS MANDATORY: preference is "${preference}". If Vegetarian — ZERO meat, ZERO fish, ZERO poultry in ANY meal. If Vegan — ZERO animal products. If Omnivore — include meat and fish freely. NEVER put chicken or tuna in a Vegetarian plan under any circumstances.
- SUPERMARKET RULE: ONLY use Tesco, Lidl, and Aldi. NEVER mention SuperValu, Dunnes Stores, or any other retailer.
- NO SELF-CORRECTION: Generate each day correctly on the first attempt. NEVER write "*Self-correction:*", "*Revised Day X:*", or any meta-commentary about fixing previous output. If a day needs more calories, add them silently — do not explain or annotate.
- Name SPECIFIC Irish supermarket brands in brackets after each ingredient. Examples: Flahavan's Progress Oats (Tesco/Lidl/Aldi), Avonmore Semi-Skimmed Milk (Tesco), Lidl Milbona 0% Greek Yogurt, Aldi Kavanagh's Rolled Oats, Pat the Baker Wholemeal Pitta (Tesco), Tesco Finest Salmon Fillets (Omnivore only), Fage 0% Greek Yogurt (Tesco), Aldi The Deli Reduced Fat Hummus, Lidl frozen berry mix, Kerry Gold butter (Tesco/Lidl), Avonmore Protein Milk (Tesco). Vegetarian protein sources: eggs, Greek yogurt, cottage cheese, lentils, chickpeas, tofu, tempeh, edamame, beans, cheese, quorn.
- CALORIE TARGET IS MANDATORY: The user entered ${calories} kcal/day. Every single day MUST total between ${calories ? Math.round(calories * 0.95) : 'target - 5%'} and ${calories ? Math.round(calories * 1.05) : 'target + 5%'} kcal. Build each day to hit this. Do not guess — add up your meals before writing the day total. If a meal is short, increase portions or add a snack BEFORE writing the day total line.
- High protein emphasis — aim 1.6-2g protein per kg bodyweight
- List every ingredient with exact weight/quantity on its own bullet point
- Show kcal and protein per meal in format: "Approx. X kcal, Xg protein"
- Show day total in format: "Day X Total: Approx. X kcal, Xg protein"
- Add one "Practical Tip:" per day (not "Tip of the Day" — just "Practical Tip:")
- Simple meals under 30 minutes
- Include breakfast, lunch, dinner, one snack per day
- End with: "This plan is for educational purposes. Adjust based on your preferences and consult a dietitian for medical advice."

CRITICAL: Output ONLY raw HTML — no markdown, no \`\`\`html fences, no explanation text. Start directly with <h3>Day 1</h3>.
Format: <h3> day headings, <ul> meal lists, <strong> for meal names, <em> for kcal/protein lines. Readable in an email.`;

    try {
      const gr = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      const gd = await gr.json();
      let raw = gd?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      // Strip markdown code fences Gemini wraps around HTML
      raw = raw.replace(/^```html\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
      mealPlan = raw;
      if (!mealPlan) console.error("[nutrition-guide] Gemini returned empty:", JSON.stringify(gd).slice(0, 300));

      // Validate day totals — check each "Day X Total: Approx. X kcal" is within 10% of target
      if (mealPlan && calories) {
        const totalMatches = [...mealPlan.matchAll(/Day\s+\d+\s+Total[^<]*?(\d{3,4})\s*kcal/gi)];
        const offDays: string[] = [];
        const low = Math.round(calories * 0.9);
        const high = Math.round(calories * 1.1);
        for (const m of totalMatches) {
          const dayKcal = parseInt(m[1]);
          if (dayKcal < low || dayKcal > high) {
            offDays.push(`${m[0].slice(0, 20).trim()} (${dayKcal} kcal — target ${calories})`);
          }
        }
        if (offDays.length > 0) {
          console.warn("[nutrition-guide] Calorie mismatch days:", offDays);
          mealPlan += `\n<p style="color:#F59E0B;font-size:12px;margin-top:16px;">&#x26A0; Note: Some days may vary slightly from your ${calories} kcal target. Adjust portions to match your goal.</p>`;
        }
      }
    } catch (e) {
      console.error("[nutrition-guide] Gemini error:", e);
      mealPlan = "";
    }
  }

  // Fallback if Gemini fails
  if (!mealPlan) {
    const proteinSources = preference === "Vegetarian"
      ? "eggs, Greek yogurt, cottage cheese, lentils, chickpeas"
      : preference === "Vegan"
      ? "tofu, tempeh, edamame, lentils, chickpeas, beans"
      : "chicken, eggs, Greek yogurt, tuna, cottage cheese";
    mealPlan = `<p>Your personalised ${preference} plan for <strong>${goal}</strong> on <strong>${kcal}</strong> is being prepared.
    Focus on: high protein (${proteinSources}), complex carbs (oats, rice, sweet potato),
    and plenty of vegetables from your local Lidl or Aldi. Training ${days}.</p>
    <p>For a detailed breakdown, reply to this email and Keith will send you a custom plan within 24 hours.</p>`;
  }

  // ── Email HTML ──────────────────────────────────────────────────────────
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0A0F1E;font-family:Inter,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:32px 24px;">
  <div style="color:#14B8A6;font-size:20px;font-weight:700;margin-bottom:4px;">Irish Peptides & Nutrition</div>
  <div style="color:#475569;font-size:13px;margin-bottom:28px;">irishpeptides.ie</div>

  <h1 style="color:#E2E8F0;font-size:22px;margin:0 0 8px;">Your 7-Day Personalised Plan</h1>
  <p style="color:#94A3B8;margin:0 0 24px;font-size:14px;">
    Hi ${displayName}, here's your personalised nutrition plan based on your details:<br>
    <strong style="color:#E2E8F0;">Goal:</strong> ${goal} ·
    <strong style="color:#E2E8F0;">Calories:</strong> ${kcal} ·
    <strong style="color:#E2E8F0;">Diet:</strong> ${preference} ·
    <strong style="color:#E2E8F0;">Training:</strong> ${days}
  </p>

  <div style="background:#111827;border-radius:12px;padding:24px;color:#CBD5E1;font-size:14px;line-height:1.7;margin-bottom:24px;">
    ${mealPlan}
  </div>

  <div style="background:#111827;border-radius:12px;padding:20px;margin-bottom:24px;">
    <p style="color:#E2E8F0;font-weight:700;margin:0 0 4px;font-size:14px;">&#x1F6D2; Shop the Plan Staples</p>
    <p style="color:#64748B;font-size:12px;margin:0 0 16px;">Find at Tesco, Lidl &amp; Aldi</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr style="border-bottom:1px solid #1E293B;">
        <td style="padding:4px 4px 8px 0;width:34%;font-size:11px;font-weight:700;color:#64748B;">ITEM</td>
        <td style="padding:4px 4px 8px;width:22%;font-size:11px;font-weight:700;color:#00539f;">TESCO</td>
        <td style="padding:4px 4px 8px;width:22%;font-size:11px;font-weight:700;color:#0050AA;">LIDL</td>
        <td style="padding:4px 0 8px 4px;width:22%;font-size:11px;font-weight:700;color:#002A5C;">ALDI</td>
      </tr>
      ${preference !== "Vegetarian" && preference !== "Vegan" ? `
      <tr>
        <td style="padding:8px 4px 4px 0;font-size:12px;font-weight:700;color:#94A3B8;vertical-align:middle;">Chicken Breast</td>
        <td style="padding:8px 4px 4px;vertical-align:middle;"><a href="https://www.tesco.ie/groceries/en-GB/search?query=chicken+breast" style="display:inline-block;background:#00539f;color:#fff;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600;text-decoration:none;">Shop</a></td>
        <td style="padding:8px 4px 4px;vertical-align:middle;"><a href="https://www.lidl.ie/search?query=chicken+breast" style="display:inline-block;background:#0050AA;color:#fff;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600;text-decoration:none;">Shop</a></td>
        <td style="padding:8px 0 4px 4px;vertical-align:middle;"><a href="https://www.aldi.ie/search?query=chicken+breast" style="display:inline-block;background:#002A5C;color:#fff;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600;text-decoration:none;">Shop</a></td>
      </tr>
      <tr>
        <td style="padding:4px 4px 4px 0;font-size:12px;font-weight:700;color:#94A3B8;vertical-align:middle;">Tuna (canned)</td>
        <td style="padding:4px;vertical-align:middle;"><a href="https://www.tesco.ie/groceries/en-GB/search?query=tuna+in+water" style="display:inline-block;background:#00539f;color:#fff;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600;text-decoration:none;">Shop</a></td>
        <td style="padding:4px;vertical-align:middle;"><a href="https://www.lidl.ie/search?query=tuna" style="display:inline-block;background:#0050AA;color:#fff;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600;text-decoration:none;">Shop</a></td>
        <td style="padding:4px 0 4px 4px;vertical-align:middle;"><a href="https://www.aldi.ie/search?query=tuna" style="display:inline-block;background:#002A5C;color:#fff;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600;text-decoration:none;">Shop</a></td>
      </tr>` : ""}
      <tr>
        <td style="padding:8px 4px 4px 0;font-size:12px;font-weight:700;color:#94A3B8;vertical-align:middle;">Free Range Eggs</td>
        <td style="padding:8px 4px 4px;vertical-align:middle;"><a href="https://www.tesco.ie/groceries/en-GB/search?query=free+range+eggs" style="display:inline-block;background:#00539f;color:#fff;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600;text-decoration:none;">Shop</a></td>
        <td style="padding:8px 4px 4px;vertical-align:middle;"><a href="https://www.lidl.ie/search?query=free+range+eggs" style="display:inline-block;background:#0050AA;color:#fff;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600;text-decoration:none;">Shop</a></td>
        <td style="padding:8px 0 4px 4px;vertical-align:middle;"><a href="https://www.aldi.ie/search?query=eggs" style="display:inline-block;background:#002A5C;color:#fff;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600;text-decoration:none;">Shop</a></td>
      </tr>
      <tr>
        <td style="padding:4px 4px 4px 0;font-size:12px;font-weight:700;color:#94A3B8;vertical-align:middle;">Greek Yogurt</td>
        <td style="padding:4px;vertical-align:middle;"><a href="https://www.tesco.ie/groceries/en-GB/search?query=greek+yogurt" style="display:inline-block;background:#00539f;color:#fff;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600;text-decoration:none;">Shop</a></td>
        <td style="padding:4px;vertical-align:middle;"><a href="https://www.lidl.ie/search?query=greek+yogurt" style="display:inline-block;background:#0050AA;color:#fff;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600;text-decoration:none;">Shop</a></td>
        <td style="padding:4px 0 4px 4px;vertical-align:middle;"><a href="https://www.aldi.ie/search?query=greek+yogurt" style="display:inline-block;background:#002A5C;color:#fff;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600;text-decoration:none;">Shop</a></td>
      </tr>
      <tr>
        <td style="padding:4px 4px 4px 0;font-size:12px;font-weight:700;color:#94A3B8;vertical-align:middle;">Porridge Oats</td>
        <td style="padding:4px;vertical-align:middle;"><a href="https://www.tesco.ie/groceries/en-GB/search?query=porridge+oats" style="display:inline-block;background:#00539f;color:#fff;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600;text-decoration:none;">Shop</a></td>
        <td style="padding:4px;vertical-align:middle;"><a href="https://www.lidl.ie/search?query=oats" style="display:inline-block;background:#0050AA;color:#fff;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600;text-decoration:none;">Shop</a></td>
        <td style="padding:4px 0 4px 4px;vertical-align:middle;"><a href="https://www.aldi.ie/search?query=oats" style="display:inline-block;background:#002A5C;color:#fff;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600;text-decoration:none;">Shop</a></td>
      </tr>
      <tr>
        <td style="padding:4px 4px 4px 0;font-size:12px;font-weight:700;color:#94A3B8;vertical-align:middle;">Sweet Potato</td>
        <td style="padding:4px;vertical-align:middle;"><a href="https://www.tesco.ie/groceries/en-GB/search?query=sweet+potato" style="display:inline-block;background:#00539f;color:#fff;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600;text-decoration:none;">Shop</a></td>
        <td style="padding:4px;vertical-align:middle;"><a href="https://www.lidl.ie/search?query=sweet+potato" style="display:inline-block;background:#0050AA;color:#fff;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600;text-decoration:none;">Shop</a></td>
        <td style="padding:4px 0 4px 4px;vertical-align:middle;"><a href="https://www.aldi.ie/search?query=sweet+potato" style="display:inline-block;background:#002A5C;color:#fff;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600;text-decoration:none;">Shop</a></td>
      </tr>
      <tr>
        <td style="padding:4px 4px 4px 0;font-size:12px;font-weight:700;color:#94A3B8;vertical-align:middle;">Cottage Cheese</td>
        <td style="padding:4px;vertical-align:middle;"><a href="https://www.tesco.ie/groceries/en-GB/search?query=cottage+cheese" style="display:inline-block;background:#00539f;color:#fff;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600;text-decoration:none;">Shop</a></td>
        <td style="padding:4px;vertical-align:middle;"><a href="https://www.lidl.ie/search?query=cottage+cheese" style="display:inline-block;background:#0050AA;color:#fff;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600;text-decoration:none;">Shop</a></td>
        <td style="padding:4px 0 4px 4px;vertical-align:middle;"><a href="https://www.aldi.ie/search?query=cottage+cheese" style="display:inline-block;background:#002A5C;color:#fff;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600;text-decoration:none;">Shop</a></td>
      </tr>
      <tr>
        <td style="padding:4px 4px 0 0;font-size:12px;font-weight:700;color:#94A3B8;vertical-align:middle;">Brown Rice</td>
        <td style="padding:4px 4px 0;vertical-align:middle;"><a href="https://www.tesco.ie/groceries/en-GB/search?query=brown+rice" style="display:inline-block;background:#00539f;color:#fff;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600;text-decoration:none;">Shop</a></td>
        <td style="padding:4px 4px 0;vertical-align:middle;"><a href="https://www.lidl.ie/search?query=brown+rice" style="display:inline-block;background:#0050AA;color:#fff;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600;text-decoration:none;">Shop</a></td>
        <td style="padding:4px 0 0 4px;vertical-align:middle;"><a href="https://www.aldi.ie/search?query=rice" style="display:inline-block;background:#002A5C;color:#fff;padding:2px 8px;border-radius:100px;font-size:11px;font-weight:600;text-decoration:none;">Shop</a></td>
      </tr>
    </table>
  </div>

  <div style="background:#0D1F1E;border:1px solid #14B8A630;border-radius:10px;padding:20px;margin-bottom:24px;">
    <p style="color:#14B8A6;font-weight:700;margin:0 0 8px;font-size:14px;">Free Tools at irishpeptides.ie</p>
    <p style="color:#94A3B8;margin:0 0 12px;font-size:13px;">Use these to fine-tune your plan:</p>
    <a href="https://irishpeptides.ie/free-tools" style="display:inline-block;background:#14B8A6;color:#0A0F1E;font-weight:700;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;">
      Open Free Tools →
    </a>
  </div>

  <p style="color:#475569;font-size:12px;margin:0;">
    You're receiving this because you requested a nutrition plan at irishpeptides.ie.<br>
    Questions? Reply to this email.<br>
    <a href="https://irishpeptides.ie" style="color:#14B8A6;">irishpeptides.ie</a>
  </p>
</div>
</body>
</html>`;

  // ── Send email via Resend ────────────────────────────────────────────────
  if (RESEND_KEY) {
    try {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM,
          to: [email],
          subject: `Your 7-Day ${goal} Plan — Irish Peptides`,
          html,
        }),
      });
      if (!resendRes.ok) {
        const errBody = await resendRes.text().catch(() => "");
        console.error("[nutrition-guide] Resend error:", resendRes.status, errBody);
        return NextResponse.json({ error: "Email send failed", detail: errBody }, { status: 500, headers: cors });
      }

      // Add to Resend audience for future newsletters
      if (AUDIENCE_ID) {
        await fetch(`https://api.resend.com/audiences/${AUDIENCE_ID}/contacts`, {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ email, first_name: displayName !== "there" ? displayName : undefined, unsubscribed: false }),
        }).catch(() => {});
      }
    } catch (e) {
      console.error("Resend error:", e);
      return NextResponse.json({ error: "Email send failed" }, { status: 500, headers: cors });
    }
  }

  // ── Log lead to Notion ───────────────────────────────────────────────────
  if (NOTION_KEY) {
    try {
      await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_KEY}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({
          parent: { page_id: NOTION_LEADS_PAGE },
          properties: {
            title: { title: [{ text: { content: `📧 Nutrition Lead: ${email}` } }] },
          },
          children: [{
            object: "block", type: "paragraph",
            paragraph: { rich_text: [{ text: { content:
              `Name: ${name || "N/A"} | Email: ${email} | Goal: ${goal} | Calories: ${kcal} | Diet: ${preference} | Training: ${days}`
            } }] },
          }],
        }),
      }).catch(() => {});
    } catch (_) {}
  }

  return NextResponse.json({ ok: true, plan: mealPlan }, { headers: cors });
}
