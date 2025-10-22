import { generateWithRetry } from './geminiService';
import { Type } from "@google/genai";

interface GameWorldResponse {
    worldName: string;
    mainStoryline: string;
    startingZoneDescription: string;
}

/**
 * Extracts the first valid JSON object from a string that might be wrapped in markdown or have extra text.
 * @param text The string to extract JSON from.
 * @returns The clean JSON string.
 * @throws An error if no JSON object is found.
 */
function extractJson(text: string): string {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
        return match[0];
    }
    throw new Error("No valid JSON object found in the AI response.");
}

export async function generateWorld(prompt: string): Promise<GameWorldResponse> {
    const fullPrompt = `You are a Dungeon Master for a D&D style game. A player wants to start a new adventure. Their initial idea is: '${prompt}'. 
    Based on this, generate a concise main storyline, a compelling name for the world, and a one-paragraph description of the starting zone.
    Return the response as a JSON object.`;

    const response = await generateWithRetry({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    worldName: { type: Type.STRING },
                    mainStoryline: { type: Type.STRING },
                    startingZoneDescription: { type: Type.STRING },
                },
                required: ['worldName', 'mainStoryline', 'startingZoneDescription']
            }
        }
    });

    try {
        const jsonText = extractJson(response.text);
        return JSON.parse(jsonText);
    } catch (e) {
        console.error("Failed to parse Gemini response:", response.text, e);
        throw new Error("AI failed to generate a valid world. Please try again.");
    }
}
