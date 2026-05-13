import { GoogleGenerativeAI } from "@google/generative-ai";
import { getDb } from "./db";
import { randomUUID } from "crypto";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const MODERATION_PROMPT = `
You are a content moderation AI for "SocioCipher", a privacy-first, pseudonymous social platform.
Analyze the following text for violations of our core principles:
- Harassment or targeted bullying
- Direct threats or incitement of violence
- Doxxing (revealing personal identifying information)
- Spam or excessive commercial promotion
- Explicit NSFW content or pornography
- Hate speech or severe discrimination

Respond ONLY with a JSON object in this format:
{
  "allowed": boolean,
  "flag": "harassment" | "threat" | "doxxing" | "spam" | "nsfw" | "hate_speech" | null,
  "reason": "short explanation in 10 words or less" | null
}
`;

export interface ModerationResult {
  allowed: boolean;
  flag: string | null;
  reason: string | null;
}

/**
 * Moderates text content using Gemini AI.
 * Falls back to allowed=true if no API key is provided or if an error occurs.
 */
export async function moderateContent(text: string, alias?: string): Promise<ModerationResult> {
  if (!text || text.trim().length === 0) {
    return { allowed: true, flag: null, reason: null };
  }

  let result: ModerationResult = { allowed: true, flag: null, reason: null };

  if (!apiKey) {
    console.warn("[MODERATION] GEMINI_API_KEY is missing. Bypassing moderation.");
    result = { allowed: true, flag: null, reason: "Bypassed: No API Key" };
  } else {
    try {
      const geminiResult = await model.generateContent([MODERATION_PROMPT, `Text to analyze: "${text}"`]);
      const response = await geminiResult.response;
      const rawText = response.text();
      
      const jsonStr = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      result = JSON.parse(jsonStr) as ModerationResult;
    } catch (error: any) {
      console.error("[MODERATION] Gemini Error:", error);
      result = { allowed: true, flag: null, reason: "Moderation Error" };
    }
  }

  // Log to database
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO moderation_logs (id, content, alias, flag, reason, allowed)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      randomUUID(),
      text.substring(0, 1000), // Truncate content for logging
      alias || "anonymous",
      result.flag,
      result.reason,
      result.allowed ? 1 : 0
    );
  } catch (logError) {
    console.error("[MODERATION] Logging failed:", logError);
  }

  return result;
}
