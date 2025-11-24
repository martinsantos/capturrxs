import { GoogleGenAI } from "@google/genai";

/**
 * Analyzes the screenshot using Gemini 2.5 Flash.
 * 
 * Note: Since this is a client-side demo, we assume the API KEY is available 
 * in process.env.API_KEY. In a real app, you might proxy this request 
 * or ask the user for a key if it's a "BYOK" (Bring Your Own Key) app.
 */
export const analyzeScreenshot = async (base64Image: string, viewport: string): Promise<string> => {
  if (!process.env.API_KEY) {
    console.warn("API Key missing");
    return "Gemini API Key is missing. Cannot perform analysis.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Extract base64 data from dataURL
    const base64Data = base64Image.split(',')[1];
    
    const prompt = `
      You are a UI/UX Expert. Analyze this ${viewport} screenshot of a website.
      1. Identify the main layout structure.
      2. Critique the spacing and visual hierarchy.
      3. Give 3 short, actionable improvements.
      Keep the response concise (under 100 words).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data
            }
          },
          { text: prompt }
        ]
      }
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Error connecting to Gemini for analysis.";
  }
};