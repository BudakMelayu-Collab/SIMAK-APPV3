import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text, type } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "GEMINI_API_KEY environment variable is missing" });
    }

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const ai = new GoogleGenAI({ apiKey });

    let prompt = "";
    if (type === "tags") {
      prompt = `Generate up to 5 relevant tags for the following description or document details. Return ONLY a comma-separated list of tags in lowercase. Text: "${text}"`;
    } else if (type === "summarize") {
      prompt = `Summarize and improve the following text into a clear, professional description suitable for a document archive (max 2 sentences). Text: "${text}"`;
    } else {
      return res.status(400).json({ error: "Invalid suggestion type" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({ result: response.text?.trim() });
  } catch (e: any) {
    console.error(e);
    res
      .status(500)
      .json({ error: e.message || "Failed to generate AI response" });
  }
}
