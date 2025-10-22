import { ai } from './geminiClient';
import { Type } from "@google/genai";
import type { WorldMap } from '../types';

interface GameWorldResponse {
    worldName: string;
    mainStoryline: string;
    startingZoneDescription: string;
    worldMap: WorldMap;
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
    Based on this, generate a concise main storyline, a compelling name for the world, and a description of the starting zone. 
    Also, create a 10x10 world map grid. Each cell must have a 'terrain' type (e.g., 'forest', 'plains', 'mountains', 'town', 'dungeon_entrance') and a short 'name'.
    The player will start at coordinate [0,0].
    Return the response as a JSON object.`;

    const response = await ai.models.generateContent({
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
                    worldMap: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    terrain: { type: Type.STRING },
                                    name: { type: Type.STRING },
                                },
                                required: ['terrain', 'name']
                            }
                        }
                    }
                },
                required: ['worldName', 'mainStoryline', 'startingZoneDescription', 'worldMap']
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
