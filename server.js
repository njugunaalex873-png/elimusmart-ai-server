

import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map(url => url.trim())
    : false
}));

app.use(express.json({ limit: "10kb" }));

app.get("/", (req, res) => {
  res.send("ElimuSmart AI Tutor server is running.");
});

app.post("/ask", async (req, res) => {
  try {
    const question = req.body?.question;

    if (typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        error: "Please enter a question."
      });
    }

    if (question.length > 2000) {
      return res.status(400).json({
        error: "Please keep your question under 2000 characters."
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "The AI Tutor is not configured yet."
      });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: "You are ElimuSmart AI Tutor, a patient tutor for Kenyan learners. Explain concepts clearly and show mathematics step by step."
            }]
          },
          contents: [{
            parts: [{ text: question.trim() }]
          }],
          generationConfig: {
            maxOutputTokens: 700
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", response.status, data.error?.message);
      return res.status(502).json({
        error: "The AI Tutor could not answer right now. Please try again."
      });
    }

    const answer = data.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    if (!answer) {
      return res.status(502).json({
        error: "The AI Tutor returned an empty answer. Please try again."
      });
    }

    res.json({ answer });
  } catch (error) {
    console.error("AI Tutor request failed:", error.message);
    res.status(500).json({
      error: "The AI Tutor could not answer right now. Please try again."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`ElimuSmart AI Tutor server listening on port ${PORT}`);
});

