import { NextResponse } from "next/server";

const RESEND_KEY  = process.env.RESEND_API_KEY || "";
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID || "fe3ebf86-af78-485c-bfe8-96151603d89e";

// ponytail: expand when PDFs are hosted — swap null for real URL
const PDF_URLS: Record<string, string | null> = {
  "7day-fat-loss-blueprint": null,
  "3day-gym-split":          null,
  "4day-gym-split":          null,
  "5day-gym-split":          null,
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: cors }); }

  const { email, pdf_id, pdf_name } = body as { email?: string; pdf_id?: string; pdf_name?: string };

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400, headers: cors });
  }

  // Add to audience
  if (RESEND_KEY && AUDIENCE_ID) {
    try {
      await fetch(`https://api.resend.com/audiences/${AUDIENCE_ID}/contacts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email, unsubscribed: false }),
      });
    } catch { /* silent */ }
  }

  const pdf_url = PDF_URLS[pdf_id || ""] ?? undefined;
  console.log(`[download] ${email} requested ${pdf_id}`);
  return NextResponse.json({ ok: true, ...(pdf_url ? { pdf_url } : {}) }, { headers: cors });
}
