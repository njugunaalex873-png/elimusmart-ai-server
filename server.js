
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map(url => url.trim())
    : false
}));

app.use(express.json({ limit: "10kb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      instructions:
        "You are ElimuSmart AI Tutor, a patient educational assistant for Kenyan learners. Explain concepts clearly at the learner's level, use step-by-step working for mathematics, and encourage learning. Do not simply invent facts. For schoolwork, explain how to reach the answer.",
      input: question.trim(),
      max_output_tokens: 700
    });

    res.json({
      answer: response.output_text
    });
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
