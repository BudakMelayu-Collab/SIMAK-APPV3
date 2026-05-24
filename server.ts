import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route for generating tags or descriptions
  app.post("/api/ai/suggest", async (req, res) => {
    try {
      const { text, type } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is missing" });
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
      res.status(500).json({ error: e.message || "Failed to generate AI response" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
