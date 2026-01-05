import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: "No API key" }, { status: 500 });
    }

    const anthropic = new Anthropic({ apiKey });
    
    const { dream } = await request.json();
    
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system: "You are MIRA, a dream analyst. Analyse the dream and return ONLY a JSON object with themes (array of 2-3 words) and interpretation (one sentence). Example: {\"themes\": [\"Water\", \"Fear\"], \"interpretation\": \"This dream reflects hidden emotions.\"}",
      messages: [{ role: "user", content: dream }],
    });
    
    const text = response.content[0].type === "text" ? response.content[0].text : "{}";
    
    try {
      const analysis = JSON.parse(text);
      return NextResponse.json(analysis);
    } catch {
      return NextResponse.json({ themes: ["Dream"], interpretation: "A meaningful dream worth reflecting on." });
    }
    
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
