import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    console.log("Speaking:", text);
    console.log("Voice ID:", process.env.ELEVEN_VOICE_ID);
    console.log("API Key exists:", !!process.env.ELEVEN_API_KEY);
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVEN_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVEN_API_KEY || "",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    console.log("ElevenLabs response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs error:", errorText);
      throw new Error("ElevenLabs API error");
    }

    const audioBuffer = await response.arrayBuffer();
    console.log("Audio buffer size:", audioBuffer.byteLength);
    
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("Speech error:", error);
    return NextResponse.json({ error: "Speech failed" }, { status: 500 });
  }
}
