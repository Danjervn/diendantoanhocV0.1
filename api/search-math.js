import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

function extractSources(response) {
  const chunks =
    response?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

  const map = new Map();

  for (const chunk of chunks) {
    const web = chunk?.web;
    if (web?.uri && !map.has(web.uri)) {
      map.set(web.uri, {
        title: web.title || web.uri,
        url: web.uri,
      });
    }
  }

  return [...map.values()];
}

export async function POST(request) {
  try {
    const { query, level = "tự động" } = await request.json();

    const prompt = `
Hãy tìm trên web các bài toán phù hợp với nhu cầu sau:

Chủ đề: ${query}
Mức độ: ${level}

Yêu cầu trả lời:
1. Liệt kê 3-5 bài toán phù hợp
2. Mỗi bài gồm:
   - tên/nguồn
   - tóm tắt đề
   - mức độ
   - vì sao phù hợp
3. Ưu tiên nguồn rõ ràng, đáng tin cậy
4. Nếu có thể, gợi ý từ khóa để người học tìm thêm
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    return Response.json({
      text: response.text,
      sources: extractSources(response),
      groundingMetadata: response?.candidates?.[0]?.groundingMetadata || null,
    });
  } catch (error) {
    return Response.json(
      { error: error.message || "Lỗi tìm kiếm bài toán" },
      { status: 500 }
    );
  }
}
