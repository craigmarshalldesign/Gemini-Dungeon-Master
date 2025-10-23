import { generateWithRetry } from './geminiService';
import { Type } from "@google/genai";
import type { WorldMap, WorldMapZone } from '../types';

interface GameWorldResponse {
    worldName: string;
    mainStoryline: string;
    worldMap: WorldMap;
    zonePath: { x: number, y: number }[];
    finalBossZoneCoords: { x: number, y: number };
}

const MAP_SIZE = 6;

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

/**
 * Generates a non-repeating path from a start to an end coordinate on a grid.
 */
export function generatePlayerPath(
    start: { x: number; y: number },
    end: { x: number; y: number }
): { x: number; y: number }[] {
    const path: { x: number; y: number }[] = [];
    const visited = new Set<string>();

    function dfs(x: number, y: number): boolean {
        const key = `${x},${y}`;
        if (x < 0 || x >= MAP_SIZE || y < 0 || y >= MAP_SIZE || visited.has(key)) {
            return false;
        }

        visited.add(key);
        path.push({ x, y });

        if (x === end.x && y === end.y) {
            return true;
        }

        // Shuffle neighbors to get random paths
        const neighbors = [
            { x: x + 1, y }, { x: x - 1, y },
            { x, y: y + 1 }, { x, y: y - 1 },
        ].sort(() => Math.random() - 0.5);

        for (const neighbor of neighbors) {
            if (dfs(neighbor.x, neighbor.y)) {
                return true;
            }
        }

        path.pop(); // Backtrack
        return false;
    }

    if (dfs(start.x, start.y)) {
        return path;
    }

    // Fallback for rare cases where DFS fails to find a path (should not happen on an open grid)
    return [{x: 0, y: 0}, {x: 1, y: 0}];
}


export async function generateWorld(prompt: string): Promise<GameWorldResponse> {
    const fullPrompt = `You are a Dungeon Master for a D&D style game. A player wants to start a new adventure. Their initial idea is: '${prompt}'. 
    Based on this, generate:
    1. A concise main storyline.
    2. A compelling name for the world.
    3. A 6x6 grid representing the world map. Each cell should be a JSON object with a 'name' (e.g., "The Whispering Woods"), a 'terrain' (e.g., "forest", "plains", "mountains", "desert", "swamp"), and a one-sentence, flavorful 'description'.
    Return the entire response as a single JSON object.`;

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
                    worldMap: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    terrain: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                },
                                required: ['name', 'terrain', 'description']
                            }
                        }
                    }
                },
                required: ['worldName', 'mainStoryline', 'worldMap']
            }
        }
    });

    try {
        const jsonText = extractJson(response.text);
        const data = JSON.parse(jsonText);

        // Add coordinates to each world map zone object
        const worldMapWithCoords: WorldMap = data.worldMap.map((row: Partial<WorldMapZone>[], y: number) => 
            row.map((zone, x) => ({ ...zone, x, y }))
        );

        // Procedurally determine start, end, and path
        const startX = 0;
        const startY = Math.floor(Math.random() * MAP_SIZE);
        const endX = MAP_SIZE - 1;
        const endY = MAP_SIZE - 1 - startY;
        
        const startCoords = { x: startX, y: startY };
        const finalBossZoneCoords = { x: endX, y: endY };

        const zonePath = generatePlayerPath(startCoords, finalBossZoneCoords);

        return {
            worldName: data.worldName,
            mainStoryline: data.mainStoryline,
            worldMap: worldMapWithCoords,
            zonePath,
            finalBossZoneCoords,
        };

    } catch (e) {
        console.error("Failed to parse Gemini response:", response.text, e);
        throw new Error("AI failed to generate a valid world. Please try again.");
    }
}