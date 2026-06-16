import { NextRequest, NextResponse } from "next/server";

const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const GH_TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";
const NOTION_KEY = process.env.NOTION_API_KEY || "";
const CB_KEY = process.env.CALLMEBOT_API_KEY || "7883019";
const GH_REPO = "keithyob26/irishpeptides-jarvis";
const CALLMEBOT_PHONE = "353896554700";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("photo") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No photo provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const b64 = Buffer.from(bytes).toString("base64");
    const mime = file.type || "image/jpeg";

    // 1. Gemini Vision — read label
    const product = await analyseWithGemini(b64, mime);

    // 2. Generate social post
    const post = await generateSocialPost(product);

    // 3. Save image to GitHub
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `${ts}_upload.jpg`;
    const imageUrl = await saveImageToGitHub(b64, filename);

    // 4. Append to outcomes.json in GitHub
    await appendToOutcomes(product, post, imageUrl);

    // 5. WhatsApp
    const name = product.product_name || "Product";
    const protein = product.protein_per_100g || "N/A";
    const wa = `New product photo uploaded!\n\nProduct: ${name}\nProtein: ${protein}g/100g\n\nSocial post ready in Content Studio.`;
    await sendWhatsApp(wa);

    return NextResponse.json({
      ok: true,
      product_name: name,
      protein,
      image_url: imageUrl,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[upload-product]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function analyseWithGemini(b64: string, mime: string) {
  if (!GEMINI_KEY) return { product_name: "Unknown", protein_per_100g: "N/A" };

  const prompt = `Look at this product photo/label and extract:
Product name, brand, supermarket (if visible), protein per 100g, calories per 100g, fat per 100g, carbs per 100g, price (if visible).
good_macro_value = true if protein per 100g >= 10g.
Return ONLY valid JSON:
{"product_name":"...","brand":"...","supermarket":"...","protein_per_100g":"...","calories_per_100g":"...","fat_per_100g":"...","carbs_per_100g":"...","price":"...","good_macro_value":true}
Use "N/A" for unreadable values.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: prompt },
          { inline_data: { mime_type: mime, data: b64 } },
        ]}],
        generationConfig: { temperature: 0.1, maxOutputTokens: 400 },
      }),
    }
  );
  if (!res.ok) return { product_name: "Unknown", protein_per_100g: "N/A" };

  try {
    const json = await res.json();
    let text: string = json.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    text = text.replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch {
    return { product_name: "Unknown", protein_per_100g: "N/A" };
  }
}

async function generateSocialPost(product: Record<string, unknown>) {
  if (!GEMINI_KEY) return { instagram_caption: "", hashtags: [], tiktok_sounds_note: "" };

  const prompt = `Write an Instagram post for Irish Peptides & Nutrition about:
Product: ${product.product_name}, Brand: ${product.brand}, Supermarket: ${product.supermarket}
Protein: ${product.protein_per_100g}g/100g, Calories: ${product.calories_per_100g}/100g
Price: ${product.price}, Good macro value: ${product.good_macro_value}
Voice: Keith O'Beirne — Irish, direct, evidence-first, warm.
Return JSON: {"instagram_caption":"...","hashtags":["..."],"blog_mention":"...","tiktok_sound_type":"..."}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
      }),
    }
  );
  if (!res.ok) return { instagram_caption: "", hashtags: [], tiktok_sounds_note: "" };

  try {
    const json = await res.json();
    let text: string = json.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    text = text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(text);
    result.tiktok_sounds_note = `Suggested sound type: ${result.tiktok_sound_type || "upbeat"} — Browse TikTok trending sounds and add before posting (30 seconds).`;
    return result;
  } catch {
    return { instagram_caption: "", hashtags: [], tiktok_sounds_note: "" };
  }
}

async function saveImageToGitHub(b64: string, filename: string): Promise<string> {
  if (!GH_TOKEN) return "";
  const path = `memory/product_images/${filename}`;
  const url = `https://api.github.com/repos/${GH_REPO}/contents/${path}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `token ${GH_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
    },
    body: JSON.stringify({
      message: `chore: product photo upload ${filename}`,
      content: b64,
    }),
  });
  if (res.ok) {
    return `https://raw.githubusercontent.com/${GH_REPO}/master/${path}`;
  }
  return "";
}

async function appendToOutcomes(
  product: Record<string, unknown>,
  post: Record<string, unknown>,
  imageUrl: string
) {
  if (!GH_TOKEN) return;

  const outcomesUrl = `https://api.github.com/repos/${GH_REPO}/contents/memory/outcomes.json`;
  const getRes = await fetch(outcomesUrl, {
    headers: { Authorization: `token ${GH_TOKEN}`, Accept: "application/vnd.github+json" },
  });

  let sha = "";
  let data: { outcomes: unknown[] } = { outcomes: [] };
  if (getRes.ok) {
    const json = await getRes.json();
    sha = json.sha || "";
    try {
      data = JSON.parse(Buffer.from(json.content, "base64").toString("utf-8"));
    } catch { /* start fresh */ }
  }

  const now = new Date().toISOString();
  const entry = {
    id: `product_upload_${now.replace(/[:.]/g, "")}`,
    agent: "product_photo_monitor",
    action: `Product photo upload: ${product.product_name}`,
    title: `Product spotlight — ${product.product_name}`,
    content: `${post.instagram_caption || ""}\n\n${post.tiktok_sounds_note || ""}`,
    type: "social_post",
    channels: ["instagram", "facebook"],
    hashtags: post.hashtags || [],
    image_url: imageUrl,
    product_data: product,
    blog_mention: post.blog_mention || "",
    model: "gemini_vision",
    status: "pending_approval",
    created_at: now,
    source: "mobile_upload",
  };

  if (!data.outcomes) data.outcomes = [];
  data.outcomes.push(entry);

  const encoded = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");
  const putBody: Record<string, string> = {
    message: `chore: product photo upload processed ${now.slice(0, 10)}`,
    content: encoded,
  };
  if (sha) putBody.sha = sha;

  await fetch(outcomesUrl, {
    method: "PUT",
    headers: {
      Authorization: `token ${GH_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
    },
    body: JSON.stringify(putBody),
  });
}

async function sendWhatsApp(text: string) {
  const encoded = encodeURIComponent(text.slice(0, 1500));
  await fetch(
    `https://api.callmebot.com/whatsapp.php?phone=${CALLMEBOT_PHONE}&text=${encoded}&apikey=${CB_KEY}`,
    { method: "GET" }
  ).catch(() => null);
}
