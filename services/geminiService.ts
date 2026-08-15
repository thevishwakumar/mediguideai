import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, HealthProfile, MedicalArticleSearchResult, MedicalArticleSource } from "../types";

// Initialize the client with User-Agent header for telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

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

export const generateHealthSummary = async (
  messages: Message[],
  healthProfile?: HealthProfile
): Promise<string> => {
  try {
    const conversationText = messages
      .map((m) => `${m.role === 'user' ? 'User' : 'MediGuide AI'}: ${m.content}`)
      .join('\n\n');

    let profileText = 'No specific health profile specified.';
    if (healthProfile && (healthProfile.age || healthProfile.gender || healthProfile.preExistingConditions)) {
      profileText = `Age: ${healthProfile.age || 'N/A'}, Gender: ${healthProfile.gender || 'N/A'}, Pre-existing conditions: ${healthProfile.preExistingConditions || 'None'}`;
    }

    const prompt = `You are a clinical AI medical assistant summarizer.
Below is the medical conversation transcript between a user and MediGuide AI, along with the user's health profile.

User Health Profile: ${profileText}

Conversation Transcript:
${conversationText}

TASK: Synthesize a concise 3-sentence summary of the current session's findings.
RULES:
1. Sentence 1 (Chief Symptoms): Summarize the chief symptom(s), onset, or primary health concern reported by the user.
2. Sentence 2 (Clinical Findings/Causes): Summarize the potential medical causes, observations, or differential diagnoses discussed by MediGuide AI.
3. Sentence 3 (Recommended Action): Summarize the recommended next steps, care plan, specialist referral, or urgency level.
4. Output EXACTLY 3 clear, complete sentences. Do NOT use bullet points, numbered lists, markdown formatting, or introductory tags. Start directly with sentence 1.
5. Keep the language objective, clinical, and clear.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
    });

    return (
      response.text?.trim() ||
      "The user reported initial symptom concerns for clinical review. MediGuide AI evaluated potential differential causes and recommendations. Further assessment or medical evaluation was advised as needed."
    );
  } catch (error) {
    console.error("Error generating health summary:", error);
    return "Summary update failed temporarily. Session findings will refresh automatically on the next response.";
  }
};

export const searchMedicalArticles = async (
  query: string,
  healthProfile?: HealthProfile
): Promise<MedicalArticleSearchResult> => {
  try {
    let profileContext = '';
    if (healthProfile && (healthProfile.age || healthProfile.gender)) {
      profileContext = ` (Demographics: Age ${healthProfile.age || 'N/A'}, Biological Sex: ${healthProfile.gender || 'N/A'})`;
    }

    const prompt = `You are an expert clinical medical educator and healthcare research coordinator.
Search for verified medical articles, clinical guidelines, and peer-reviewed educational literature from authoritative healthcare institutions (such as Mayo Clinic, NIH/PubMed, CDC, WebMD, Healthline, Cleveland Clinic, Harvard Health Publishing, Johns Hopkins Medicine, WHO, BMJ) regarding the following health topic or symptoms:

Query/Symptoms: "${query}"${profileContext}

CRITICAL TASK:
1. Search Google for current, high-authority, peer-reviewed or accredited medical articles detailing these symptoms, conditions, or clinical guidelines.
2. Provide a clear, educational breakdown (3-4 sections) covering:
   - **Educational Summary & Medical Context**: What current medical literature states regarding these symptoms or condition.
   - **Potential Underlying Causes & Mechanisms**: Primary physiological or environmental mechanisms.
   - **Evidence-Based Evaluation & Care Guidelines**: Standard clinical diagnostic steps, self-care measures, or specialist options.
   - **Red Flags & Warning Signs**: When immediate emergency medical evaluation is necessary.
3. Write in clear, accessible, professional English using bullet points and markdown headers.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const summaryText =
      response.text || 'No verified medical literature found for the requested query.';

    // Extract Google Search grounding metadata
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSearchQueries = response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];

    const sources: MedicalArticleSource[] = [];

    groundingChunks.forEach((chunk) => {
      if (chunk.web?.uri && chunk.web?.title) {
        let domain = '';
        try {
          const parsed = new URL(chunk.web.uri);
          domain = parsed.hostname.replace('www.', '');
        } catch (e) {
          domain = 'Medical Institution';
        }

        // Deduplicate sources by URL
        if (!sources.some((s) => s.url === chunk.web?.uri)) {
          sources.push({
            title: chunk.web.title,
            url: chunk.web.uri,
            domain,
            snippet: (chunk.web as any)?.snippet || undefined,
          });
        }
      }
    });

    return {
      query,
      summary: summaryText,
      sources,
      searchQueries: webSearchQueries,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Error in searchMedicalArticles:', error);
    throw new Error('Unable to retrieve verified medical articles. Please check your connection and try again.');
  }
};
