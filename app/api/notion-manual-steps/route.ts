import { NextRequest, NextResponse } from "next/server";

const NOTION_KEY = process.env.NOTION_API_KEY || "";
const NOTION_VER = "2022-06-28";
const IP_MASTER_PAGE = "381a0eb7-e3ea-81e5-afec-e0785e05de61";

// Block IDs for Section 3 (Manual Steps) — from Notion page structure
// These are the known paragraph block IDs in Section 3
const SECTION3_HEADING_TEXT = "Section 3";

function notionHeaders() {
  return {
    Authorization: `Bearer ${NOTION_KEY}`,
    "Content-Type": "application/json",
    "Notion-Version": NOTION_VER,
  };
}

async function fetchSection3Blocks(): Promise<Array<{ id: string; text: string }>> {
  if (!NOTION_KEY) return [];

  const res = await fetch(
    `https://api.notion.com/v1/blocks/${IP_MASTER_PAGE}/children?page_size=100`,
    { headers: notionHeaders() }
  );
  if (!res.ok) return [];

  const data = await res.json();
  const blocks = data.results || [];

  let inSection3 = false;
  const section3Blocks: Array<{ id: string; text: string }> = [];

  for (const block of blocks) {
    const type = block.type;
    const richText = block[type]?.rich_text || [];
    const text = richText.map((r: { plain_text?: string }) => r.plain_text || "").join("");

    if (type === "heading_2") {
      if (text.includes(SECTION3_HEADING_TEXT)) {
        inSection3 = true;
        continue;
      } else if (inSection3) {
        break; // Hit next section
      }
    }

    if (inSection3 && type === "paragraph" && text.trim() && !text.startsWith("Static")) {
      section3Blocks.push({ id: block.id, text: text.trim() });
    }
  }

  return section3Blocks;
}

export async function GET() {
  const blocks = await fetchSection3Blocks();

  // Map blocks to steps with blocker detection
  const BLOCKER_MAP: Record<string, string> = {
    buffer: "all social publishing",
    manychat: "comment automation",
    elevenlabs: "video pipeline",
    facebook: "Instagram publishing",
    stripe: "payment processing",
    "sole trader": "invoicing clients",
  };

  const steps = blocks.map((b) => {
    const lower = b.text.toLowerCase();
    let blocks_what = "";
    for (const [key, value] of Object.entries(BLOCKER_MAP)) {
      if (lower.includes(key)) {
        blocks_what = value;
        break;
      }
    }
    return {
      id: b.id,
      text: b.text,
      done: false,
      blocks_what,
    };
  });

  return NextResponse.json({ steps, page_id: IP_MASTER_PAGE });
}

export async function POST(req: NextRequest) {
  const { step_id } = await req.json();
  if (!step_id || !NOTION_KEY) {
    return NextResponse.json({ ok: false });
  }

  // Append a strikethrough marker or update the block — Notion doesn't support
  // checkboxes on plain paragraphs, so we append "(DONE)" to the block text
  // For a true checkbox, blocks would need to be toggle/to-do type.
  // Here we just log the completion — the page itself tracks via UI state.
  console.log(`[manual-steps] Step marked done: ${step_id}`);

  return NextResponse.json({ ok: true, step_id });
}
