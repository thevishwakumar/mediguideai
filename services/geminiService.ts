import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, HealthProfile } from "../types";

// Initialize the client
// API Key is guaranteed to be in process.env.API_KEY per instructions
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const BASE_SYSTEM_INSTRUCTION = `
You are MediGuide AI, an advanced medical assistant designed to analyze symptoms and visual medical data (like skin conditions).
Your goal is to provide preliminary analysis, potential differential diagnoses, and advice on next steps.

CRITICAL RULES:
1. DISCLAIMER: You MUST always start or end your response with a brief reminder that you are an AI and this is NOT professional medical advice.
2. TONE: Be empathetic, professional, clear, and calm.
3. STRUCTURE: Use Markdown. Break down complex information into bullet points.
   - Potential Causes: List 3-5 possibilities from most likely to least likely.
   - Urgency Assessment: Clearly state if this sounds like something that needs immediate ER attention, a doctor's visit soon, or self-care.
   - Recommendations: Self-care tips (if applicable) and what specialist to see.
4. IMAGES: If an image is provided, analyze it visually. Describe what you see (color, texture, shape) before giving a diagnosis.
5. SAFETY: If the symptoms sound life-threatening (e.g., chest pain, difficulty breathing, stroke symptoms, severe bleeding), urge the user to call emergency services immediately.
`;

const buildSystemInstruction = (healthProfile?: HealthProfile): string => {
  let instruction = BASE_SYSTEM_INSTRUCTION;

  if (healthProfile && (healthProfile.age || healthProfile.gender || healthProfile.preExistingConditions)) {
    instruction += `\n\nUSER HEALTH PROFILE CONTEXT:`;
    if (healthProfile.age) instruction += `\n- Age: ${healthProfile.age}`;
    if (healthProfile.gender) instruction += `\n- Gender/Biological Sex: ${healthProfile.gender}`;
    if (healthProfile.preExistingConditions) instruction += `\n- Pre-existing / Chronic Conditions: ${healthProfile.preExistingConditions}`;
    instruction += `\n\nIMPORTANT: Take this demographic and pre-existing health background into full account when analyzing symptoms, assessing urgency, considering potential drug interactions, or making recommendations.`;
  } else {
    instruction += `\n\nUSER HEALTH PROFILE CONTEXT:\n- No specific age, gender, or pre-existing medical conditions provided.`;
  }

  return instruction;
};

export const sendMessageToGemini = async (
  history: Message[],
  newMessage: string,
  images: string[] = [], // Array of base64 strings
  healthProfile?: HealthProfile
): Promise<string> => {
  try {
    const recentHistory = history.slice(-10);

    const systemInstruction = buildSystemInstruction(healthProfile);

    const chat = ai.chats.create({
      model: 'gemini-3.7-flash',
      config: {
        systemInstruction: systemInstruction,
      },
      history: recentHistory.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      })),
    });

    // Prepare the new message content
    let messageContent: any = { role: 'user', parts: [] };
    
    // Add text
    messageContent.parts.push({ text: newMessage });

    // Add images if any
    if (images.length > 0) {
      images.forEach(base64Data => {
        // Strip the data:image/png;base64, prefix if present
        const cleanBase64 = base64Data.split(',')[1] || base64Data;
        const mimeType = base64Data.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] || 'image/jpeg';
        
        messageContent.parts.push({
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64
          }
        });
      });
    }

    const messagePayload = images.length > 0 
      ? messageContent.parts // Pass array of parts
      : newMessage; // Pass string

    const response: GenerateContentResponse = await chat.sendMessage({
      message: messagePayload
    });

    return response.text || "I apologize, but I couldn't generate a response. Please try again.";

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to analyze symptoms. Please check your connection and try again.");
  }
};