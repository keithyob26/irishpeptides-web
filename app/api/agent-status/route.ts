import { NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const REPO = "keithyob26/irishpeptides-jarvis";

export async function GET() {
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: "GITHUB_TOKEN not set" }, { status: 500 });
  }

  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  try {
    // Get all workflow runs (last 100)
    const runsRes = await fetch(
      `https://api.github.com/repos/${REPO}/actions/runs?per_page=100`,
      { headers, next: { revalidate: 120 } }
    );
    const runsData = await runsRes.json();
    const runs = runsData.workflow_runs || [];

    // Get workflows list
    const wfRes = await fetch(
      `https://api.github.com/repos/${REPO}/actions/workflows?per_page=50`,
      { headers, next: { revalidate: 300 } }
    );
    const wfData = await wfRes.json();
    const workflows = wfData.workflows || [];

    // Map workflows with their latest run
    const agentStatus = workflows.map((wf: Record<string, unknown>) => {
      const wfRuns = runs.filter((r: Record<string, unknown>) => r.workflow_id === wf.id);
      const latestRun = wfRuns[0] || null;
      const last5 = wfRuns.slice(0, 5).map((r: Record<string, unknown>) => ({
        id: r.id,
        status: r.status,
        conclusion: r.conclusion,
        created_at: r.created_at,
        updated_at: r.updated_at,
        html_url: r.html_url,
      }));

      return {
        id: wf.id,
        name: wf.name,
        path: wf.path,
        state: wf.state,
        latestRun: latestRun
          ? {
              id: latestRun.id,
              status: latestRun.status,
              conclusion: latestRun.conclusion,
              created_at: latestRun.created_at,
              updated_at: latestRun.updated_at,
              html_url: latestRun.html_url,
            }
          : null,
        last5Runs: last5,
      };
    });

    return NextResponse.json({ agents: agentStatus, total: agentStatus.length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
