import { NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const REPO = "keithyob26/irishpeptides-jarvis";
const FILE = "memory/token_usage.json";

export async function GET() {
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: "GITHUB_TOKEN not set" }, { status: 500 });
  }
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${FILE}`,
      {
        headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" },
        cache: "no-store",
      }
    );
    if (!res.ok) return NextResponse.json({ error: "token_usage.json not found" }, { status: 404 });
    const data = await res.json();
    const parsed = JSON.parse(Buffer.from(data.content, "base64").toString("utf-8"));
    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
