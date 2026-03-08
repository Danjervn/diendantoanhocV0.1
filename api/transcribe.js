import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request) {
  try {
    const { audioBase64, mimeType = "audio/webm" } = await request.json();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType,
            data: audioBase64,
          },
        },
        {
          text: "Hãy chuyển toàn bộ giọng nói trong audio này thành văn bản tiếng Việt sạch, không thêm giải thích.",
        },
      ],
    });

    return Response.json({ text: response.text });
  } catch (error) {
    return Response.json(
      { error: error.message || "Lỗi speech to text" },
      { status: 500 }
    );
  }
}
