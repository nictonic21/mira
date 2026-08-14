import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

// Scores a single deep log. Stateless: the client stores the result in
// entry_analysis itself, so this route never needs database credentials.

const SCHEMA = {
  type: "object",
  properties: {
    sentiment_score: {
      type: "number",
      description:
        "Overall emotional tone of the interaction for the writer, from -1 (very negative) to 1 (very positive).",
    },
    themes: {
      type: "array",
      items: { type: "string" },
      description:
        "One to three short lowercase themes, e.g. 'felt heard', 'one sided', 'shared laughter'.",
    },
    ai_note: {
      type: "string",
      description:
        "One warm, neutral sentence observing what this entry suggests about the interaction. Observation, not verdict.",
    },
  },
  required: ["sentiment_score", "themes", "ai_note"],
  additionalProperties: false,
} as const;

const SYSTEM = `You score a single journal entry about a social interaction with a friend.
Read the writer's words and infer the emotional tone for the writer.
Rules for the ai_note:
- Warm, plain language. One sentence only.
- Frame everything as observation, never a verdict about the friend.
- Never use the word "toxic" and never suggest ending or cutting off a friendship.`;

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "No API key" }, { status: 500 });
    }

    const { what_happened, how_i_felt, energy_score, effort, tags } =
      await request.json();

    if (!what_happened && !how_i_felt) {
      return NextResponse.json({ error: "Nothing to analyse" }, { status: 400 });
    }

    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: "claude-opus-5",
      max_tokens: 2000,
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: SCHEMA },
      },
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            what_happened: what_happened ?? null,
            how_i_felt: how_i_felt ?? null,
            energy_after_1_to_10: energy_score ?? null,
            who_made_the_effort: effort ?? null,
            tags: tags ?? [],
          }),
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json({ error: "Could not analyse" }, { status: 422 });
    }

    const text =
      response.content.find((b) => b.type === "text")?.text ?? "";
    const analysis = JSON.parse(text);
    // Numeric bounds aren't enforceable in the schema, so clamp here.
    analysis.sentiment_score = Math.max(-1, Math.min(1, Number(analysis.sentiment_score) || 0));

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("score-entry error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
