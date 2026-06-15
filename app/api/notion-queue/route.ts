import { NextResponse } from "next/server";

const NOTION_API_KEY = process.env.NOTION_API_KEY || "";
const BUILD_QUEUE_PAGE_ID = "37da0eb7-e3ea-819e-af5b-e76db92a7c8c";

export async function GET() {
  if (!NOTION_API_KEY) {
    return NextResponse.json({ tasks: [], error: "NOTION_API_KEY not set" });
  }

  try {
    // Get page blocks (to-do items)
    const res = await fetch(
      `https://api.notion.com/v1/blocks/${BUILD_QUEUE_PAGE_ID}/children?page_size=100`,
      {
        headers: {
          Authorization: `Bearer ${NOTION_API_KEY}`,
          "Notion-Version": "2022-06-28",
        },
        next: { revalidate: 300 },
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
