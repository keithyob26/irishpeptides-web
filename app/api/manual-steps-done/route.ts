import { NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const REPO = "keithyob26/irishpeptides-jarvis";
const FILE_PATH = "memory/manual_steps_done.json";

async function fetchDoneFile() {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`,
    { headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" }, cache: "no-store" }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function GET() {
  try {
    const file = await fetchDoneFile();
    if (!file) return NextResponse.json({ done: [] });
    const content = Buffer.from(file.content.replace(/\n/g, ""), "base64").toString("utf-8");
    const data = JSON.parse(content);
    return NextResponse.json({ done: data.done || [] });
  } catch {
    return NextResponse.json({ done: [] });
  }
}

export async function POST(req: Request) {
  try {
    const { step_id } = await req.json();
    if (!step_id || !GITHUB_TOKEN) return NextResponse.json({ ok: false });

    const file = await fetchDoneFile();
    if (!file) return NextResponse.json({ ok: false });

    const content = Buffer.from(file.content.replace(/\n/g, ""), "base64").toString("utf-8");
    const data = JSON.parse(content);
    const done: string[] = data.done || [];

    // Toggle
    const idx = done.indexOf(step_id);
    if (idx === -1) {
      done.push(step_id);
    } else {
      done.splice(idx, 1);
    }
    data.done = done;
    data.updated_at = new Date().toISOString();

    const newContent = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");
    const updateRes = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `chore: toggle manual step ${step_id}`,
          content: newContent,
          sha: file.sha,
        }),
      }
    );

    return NextResponse.json({ ok: updateRes.ok, done });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) });
  }
}
