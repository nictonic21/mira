import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

// Writes the plain-language summary shown on a friend's profile.
// Stateless: the client sends the last 30 days of entries and renders the result.

const SYSTEM = `You write a two-to-three sentence summary of someone's recent logs about one friendship, addressed to the writer ("you").
Rules:
- Plain, warm language. Two or three sentences, no lists, no headings.
- Ground it in the numbers you're given (entry count, who initiates, how they tend to feel afterwards).
- Frame everything as observation, never a verdict. Say things like "this one takes more than it gives right now", never anything crueller.
- Never use the word "toxic" and never suggest ending or cutting off the friendship.`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "No API key" }, { status: 500 });
    }

    const { friendName, stats, entries } = await request.json();
    if (!friendName || !Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: "Nothing to summarise" }, { status: 400 });
    }

    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: "claude-opus-5",
      max_tokens: 1500,
      output_config: { effort: "low" },
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            friend_name: friendName,
            stats: stats ?? {},
            // Entries from roughly the last 30 days: date, energy 1-10,
            // who made the effort, tags, and any free text.
            recent_entries: entries.slice(0, 40),
          }),
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ error: "Could not summarise" }, { status: 422 });
    }

    const text = response.content.find((b) => b.type === "text")?.text ?? "";
    return NextResponse.json({ summary: text.trim() });
  } catch (error) {
    console.error("friend-summary error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
