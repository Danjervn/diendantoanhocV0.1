import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request) {
  try {
    const { imageBase64, mimeType, prompt } = await request.json();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType,
            data: imageBase64,
          },
        },
        {
          text:
            prompt ||
            "Hãy mô tả ảnh và nếu ảnh chứa nội dung toán học thì hãy nhận diện đề bài, ký hiệu, công thức và giải thích ngắn gọn.",
        },
      ],
    });

    return Response.json({ text: response.text });
  } catch (error) {
    return Response.json(
      { error: error.message || "Lỗi nhận diện ảnh" },
      { status: 500 }
    );
  }
}
