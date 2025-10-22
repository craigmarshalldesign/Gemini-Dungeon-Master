import { GoogleGenAI, GenerateContentParameters, GenerateContentResponse } from "@google/genai";

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Please set it in your environment.");
}

export const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const MAX_RETRIES = 3;

/**
 * A wrapper around the Gemini API's generateContent method that includes retry logic
 * with exponential backoff for handling 503 or overload errors.
 * @param request The generation request object.
 * @returns The API response.
 * @throws An error if the request fails after all retries.
 */
export async function generateWithRetry(request: GenerateContentParameters): Promise<GenerateContentResponse> {
    let attempt = 0;
    while (attempt < MAX_RETRIES) {
        try {
            const response = await ai.models.generateContent(request);
            return response;
        } catch (error) {
            const err = error as Error & { status?: number, message: string };
            const isServerError = err.message.includes('503') || err.message.includes('overloaded') || err.message.includes('UNAVAILABLE');

            if (isServerError && attempt < MAX_RETRIES - 1) {
                attempt++;
                const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000; // Exponential backoff with jitter
                console.warn(`Attempt ${attempt} failed with server error. Retrying in ${delay.toFixed(0)}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error(`Request failed on attempt ${attempt + 1}.`, err);
                throw error; // Rethrow the last error
            }
        }
    }
    // This line should be unreachable, but typescript needs a return path.
    throw new Error("Request failed after maximum retries.");
}
