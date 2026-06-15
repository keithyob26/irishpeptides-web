import { NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const REPO = "keithyob26/irishpeptides-jarvis";
const FILE_PATH = "memory/outcomes.json";

export async function GET() {
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ outcomes: [], pendingApprovals: [] });
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
        },
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      return NextResponse.json({ outcomes: [], pendingApprovals: [], note: "outcomes.json not found in repo" });
    }

    const data = await res.json();
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    const parsed = JSON.parse(content);

    const outcomes = Array.isArray(parsed.outcomes) ? parsed.outcomes : [];
    const pendingApprovals = outcomes.filter(
      (o: Record<string, unknown>) => o.status === "pending_approval"
    );

    return NextResponse.json({ outcomes, pendingApprovals, sha: data.sha });
  } catch (e) {
    return NextResponse.json({ outcomes: [], pendingApprovals: [], error: String(e) });
  }
}

export async function POST(req: Request) {
  // Write updated outcomes.json back to GitHub
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: "GITHUB_TOKEN not set" }, { status: 500 });
  }

  const { outcomes, sha } = await req.json();

  const content = Buffer.from(JSON.stringify({ outcomes }, null, 2)).toString("base64");

  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "chore: update outcomes.json via Jarvis dashboard",
        content,
        sha,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
