import { NextRequest, NextResponse } from "next/server";

const NOTION_API_KEY = process.env.NOTION_API_KEY || "";
const BUILD_QUEUE_PAGE_ID = "37da0eb7-e3ea-819e-af5b-e76db92a7c8c";

export async function GET() {
  if (!NOTION_API_KEY) {
    return NextResponse.json({ tasks: [], error: "NOTION_API_KEY not set" });
  }

  try {
    const res = await fetch(
      `https://api.notion.com/v1/blocks/${BUILD_QUEUE_PAGE_ID}/children?page_size=100`,
      {
        headers: {
          Authorization: `Bearer ${NOTION_API_KEY}`,
          "Notion-Version": "2022-06-28",
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ tasks: [], error: err.message || "Notion API error" });
    }

    const data = await res.json();
    const blocks = data.results || [];

    const tasks = blocks
      .filter((b: Record<string, unknown>) => b.type === "to_do")
      .map((b: Record<string, unknown>) => {
        const todo = b.to_do as Record<string, unknown>;
        const richText = (todo.rich_text as Array<Record<string, unknown>>) || [];
        const title = richText.map((rt: Record<string, unknown>) => (rt.plain_text as string) || "").join("");
        return {
          id: b.id,
          title: title || "(untitled)",
          checked: todo.checked as boolean,
          status: todo.checked ? "done" : "open",
        };
      });

    return NextResponse.json({ tasks, total: tasks.length });
  } catch (e) {
    return NextResponse.json({ tasks: [], error: String(e) });
  }
}

// Add a to_do block to the Build Queue page
export async function POST(req: NextRequest) {
  if (!NOTION_API_KEY) return NextResponse.json({ error: "NOTION_API_KEY not set" }, { status: 500 });
  try {
    const { text, checked = false } = await req.json() as { text: string; checked?: boolean };
    if (!text) return NextResponse.json({ error: "text required" }, { status: 400 });

    const res = await fetch(`https://api.notion.com/v1/blocks/${BUILD_QUEUE_PAGE_ID}/children`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        children: [{
          object: "block",
          type: "to_do",
          to_do: {
            rich_text: [{ type: "text", text: { content: text } }],
            checked,
          },
        }],
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.message || "Notion error" }, { status: 500 });
    }
    const result = await res.json();
    return NextResponse.json({ ok: true, id: result.results?.[0]?.id });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// Check/uncheck a to_do block
export async function PATCH(req: NextRequest) {
  if (!NOTION_API_KEY) return NextResponse.json({ error: "NOTION_API_KEY not set" }, { status: 500 });
  try {
    const { blockId, checked } = await req.json() as { blockId: string; checked: boolean };
    const res = await fetch(`https://api.notion.com/v1/blocks/${blockId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to_do: { checked } }),
    });
    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
