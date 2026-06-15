import { NextRequest, NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const REPO = "keithyob26/irishpeptides-jarvis";
const WORKFLOW_ID = "approve.yml";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") || "";
  const action = searchParams.get("action") || "";
  const reason = searchParams.get("reason") || "";

  if (!token || !["approve", "reject"].includes(action)) {
    return new NextResponse(htmlPage("Invalid request", "Missing token or action.", false), {
      headers: { "Content-Type": "text/html" },
    });
  }

  // Trigger GitHub Actions workflow_dispatch
  if (GITHUB_TOKEN) {
    try {
      await fetch(
        `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW_ID}/dispatches`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ref: "master",
            inputs: { token, action, reason },
          }),
        }
      );
    } catch {
      // Fire-and-forget; surface the confirmation page regardless
    }
  }

  const isApprove = action === "approve";
  const title = isApprove ? "Approved!" : "Rejected";
  const msg = isApprove
    ? `Action approved and queued for execution.`
    : `Action rejected${reason ? `: ${reason}` : ""}.`;

  return new NextResponse(htmlPage(title, msg, isApprove), {
    headers: { "Content-Type": "text/html" },
  });
}

function htmlPage(title: string, msg: string, success: boolean): string {
  const color = success ? "#10B981" : "#EF4444";
  const icon = success ? "✅" : "❌";
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — Irish Peptides Jarvis</title>
  <style>
    body { font-family: -apple-system, sans-serif; background: #0F172A; color: #F1F5F9;
           display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px; padding: 40px; text-align: center; max-width: 400px; }
    .icon { font-size: 64px; margin-bottom: 16px; }
    h1 { color: ${color}; font-size: 28px; margin: 0 0 12px; }
    p { color: #94A3B8; font-size: 16px; margin: 0 0 24px; }
    a { color: #14B8A6; text-decoration: none; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${msg}</p>
    <a href="/">&#8592; Back to irishpeptides.ie</a>
  </div>
</body>
</html>`;
}
