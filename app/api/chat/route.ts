import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.error("No API key found");
      return NextResponse.json({ error: "No API key" }, { status: 500 });
    }

    const anthropic = new Anthropic({ apiKey });
    
    const { messages } = await request.json();
    
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      system: "You are MIRA, a warm and caring AI companion. Keep responses short and supportive.",
      messages: messages,
    });
    
    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ message: text });
    
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
