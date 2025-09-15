
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, Service } from '../types';

let ai: GoogleGenAI | null = null;

/**
 * Initializes the GoogleGenAI client with a user-provided API key.
 * This must be called before any other function in this service.
 * @param apiKey - The Google Gemini API key.
 */
export function initializeAi(apiKey: string) {
    if (!apiKey) {
        console.warn("AI initialization skipped: No API key provided.");
        ai = null;
        return;
    }
    try {
        ai = new GoogleGenAI({ apiKey });
        console.log("GoogleGenAI client initialized successfully.");
    } catch (error) {
        console.error("Failed to initialize GoogleGenAI client:", error);
        ai = null;
    }
}

/**
 * Transcribes an audio blob into text using the Gemini API.
 * @param audioBlob - The audio data as a Blob.
 * @returns The transcribed text as a string.
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
    if (!ai) {
        throw new Error("GoogleGenAI is not initialized. Please configure the API Key in the Integrations settings.");
    }
    
    const audioBytes = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
    });

    const audioPart = {
        inlineData: {
            mimeType: audioBlob.type,
            data: audioBytes,
        },
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [audioPart, { text: "Transcribe this audio." }] },
    });
    
    return response.text.trim();
}


/**
 * Generates a streaming response from the Gemini model based on conversation history and salon services.
 * @param history - The list of messages in the current conversation.
 * @param services - The list of available salon services with prices and descriptions.
 * @returns An async generator that yields response chunks.
 */
export async function getBotResponseStream(history: Message[], services: Service[]) {
    if (!ai) {
        throw new Error("GoogleGenAI is not initialized. Please configure the API Key in the Integrations settings.");
    }
    
    const serviceList = services.map(s => `- ${s.name}: ${s.price} (${s.description})`).join('\n');

    const systemInstruction = `You are "Eva," an expert AI sales agent for "MetaLuxe," a high-end beauty salon. Your primary goal is to convert every client interaction into a booked appointment. Be proactive, persuasive, and professional.

**Your Knowledge Base:**
You have access to the salon's full list of services and prices:
${serviceList}

**Your Directives:**
1.  **ALWAYS BE CLOSING:** Your main objective is to book an appointment. After answering a question, always pivot to a booking suggestion (e.g., "I can book that for you, what day works best?", "We have an opening tomorrow at 2 PM, shall I reserve it for you?").
2.  **BE PROACTIVE:** Do not wait for the user to ask to book. If they show interest in a service, assume the sale and guide them to the next step.
3.  **USE YOUR KNOWLEDGE:** When asked about services or prices, answer accurately using the knowledge base provided.
4.  **HANDLE OBJECTIONS:** If a user is unsure, create a sense of urgency (e.g., "Our schedule for this week is filling up fast") or highlight the value ("It's our most popular treatment for a reason!").
5.  **KEEP IT CONCISE:** Maintain a friendly, high-end tone. Use emojis where appropriate. Keep responses focused and under 60 words.`;
    
    // Create a simplified history for the model
    const content = history
        .slice(-8) // Use a slightly longer history for better context
        .map(msg => `${msg.sender === 'user' ? 'Client' : 'Eva'}: ${msg.text}`)
        .join('\n');
        
    const response = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: content,
        config: {
            systemInstruction: systemInstruction,
        }
    });

    return response;
}
