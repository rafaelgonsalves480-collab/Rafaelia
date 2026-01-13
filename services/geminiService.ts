import { GoogleGenAI } from "@google/genai";
import { GeminiModel, ImageAttachment } from "../types";

const API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateCodeResponseStream = async function* (
  prompt: string,
  images: ImageAttachment[] = [],
  language: string = 'Português'
): AsyncGenerator<string, void, unknown> {
  if (!API_KEY) {
    throw new Error("API Key is missing. Please check your environment variables.");
  }

  try {
    const parts: any[] = [];

    // Add images if they exist
    images.forEach((img) => {
      parts.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.data,
        },
      });
    });

    // Modified system prompt to avoid safety refusals (which can cause empty/stopped responses)
    // while maintaining the persona.
    const systemWrapper = `
      CONTEXT: You are "Rafael IAs Private Architect" (X-ROBO Module), an advanced cybersecurity researcher and full-stack developer.
      MISSION: Generate robust, functional code for educational and security testing purposes.
      STYLE: Professional, "hacker-style", concise, extremely fast.
      LANGUAGE PROTOCOL: Respond strictly in ${language}. Keep standard code keywords (function, const, if, etc.) in English, but explain and comment in ${language}.
      IMPORTANT: If the request involves security concepts, provide the code for the *defensive* or *educational* implementation to ensure compliance and output generation.
      
      USER REQUEST: ${prompt}
    `;
    
    parts.push({ text: systemWrapper });

    const responseStream = await ai.models.generateContentStream({
      model: GeminiModel.PRO,
      contents: {
        parts: parts
      },
      config: {
        temperature: 0.2, // Low temperature for precise code generation
        // removed thinkingConfig to prevent potential hangs with Flash model
      }
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate code.");
  }
};