
import { GoogleGenAI, Type } from "@google/genai";
// Fix: 'QuestStatus' is used as a value in the response schema, so it must be imported as a value, not as a type.
import { QuestStatus } from '../types';
import type { NPC, WorldMap, ZoneMap, Quest } from '../types';

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. Please set it in your environment.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

interface GameWorldResponse {
    worldName: string;
    mainStoryline: string;
    startingZoneDescription: string;
    worldMap: WorldMap;
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
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    try {
        const jsonText = response.text.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonText);
    } catch (e) {
        console.error("Failed to parse Gemini response:", response.text);
        throw new Error("AI failed to generate a valid world. Please try again.");
    }
}

interface ZoneResponse {
    tileMap: ZoneMap;
    npcs: NPC[];
    exitPosition: { x: number, y: number };
}

export async function generateZone(zoneDescription: string, worldName: string, mainStoryline: string): Promise<ZoneResponse> {
    const prompt = `You are a Dungeon Master for a world named '${worldName}'. The main story is: '${mainStoryline}'.
    Generate a detailed 20x20 tile-based map for a zone described as: '${zoneDescription}'. 
    The aesthetic is like Legend of Zelda on the Gameboy. The map should be a 2D array of strings representing tiles: 'grass', 'tree', 'water', 'path', 'building'. 
    Place 2-3 interesting and unique NPCs on this map. Their names, roles, and personalities should feel appropriate for the world and story. Do not use generic fantasy names repeatedly.
    For each NPC, provide: a 'name', a one-sentence 'role', a 'description' (physical appearance), a 'personality' (e.g., grumpy, cheerful), basic 'stats' (just {hp: 10, str: 5, int: 5}), their starting 'position' {x, y}, and a potential 'quest'.
    For one of the NPCs, create a simple fetch quest that is thematically linked to the zone or main story. The quest object must have: 'id' (a unique string like 'fetch_herbs'), 'title', 'description', 'status' ('inactive'), an 'xpReward' (a number, e.g., 50), and an 'objective' object. The objective must contain 'type' ('fetch'), 'itemName' ('Glimmering Herb'), 'itemDescription' ('A rare herb that glows faintly.'), 'itemEmoji' (a single, appropriate emoji string like '🌿'), 'itemId' (a unique string like 'glimmering_herb_1'), and a 'targetPosition' {x, y} for the item. For other NPCs, the quest value should be null.
    IMPORTANT: NPC positions and quest item target positions MUST be on 'grass' or 'path' tiles. They can NEVER be on 'tree', 'water', or 'building' tiles.
    Return a valid JSON object.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    tileMap: {
                        type: Type.ARRAY,
                        items: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    npcs: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                role: { type: Type.STRING },
                                description: { type: Type.STRING },
                                personality: { type: Type.STRING },
                                stats: {
                                    type: Type.OBJECT,
                                    properties: {
                                        hp: { type: Type.NUMBER },
                                        str: { type: Type.NUMBER },
                                        int: { type: Type.NUMBER },
                                    }
                                },
                                position: {
                                    type: Type.OBJECT,
                                    properties: {
                                        x: { type: Type.NUMBER },
                                        y: { type: Type.NUMBER }
                                    }
                                },
                                quest: {
                                    type: Type.OBJECT,
                                    nullable: true,
                                    properties: {
                                        id: { type: Type.STRING },
                                        title: { type: Type.STRING },
                                        description: { type: Type.STRING },
                                        status: { type: Type.STRING, enum: [QuestStatus.INACTIVE] },
                                        xpReward: { type: Type.NUMBER },
                                        objective: {
                                            type: Type.OBJECT,
                                            properties: {
                                                type: { type: Type.STRING, enum: ['fetch'] },
                                                itemName: { type: Type.STRING },
                                                itemDescription: { type: Type.STRING },
                                                itemEmoji: { type: Type.STRING },
                                                itemId: { type: Type.STRING },
                                                targetPosition: {
                                                    type: Type.OBJECT,
                                                    properties: {
                                                        x: { type: Type.NUMBER },
                                                        y: { type: Type.NUMBER }
                                                    }

                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });
    
    try {
        const jsonText = response.text.replace(/```json|```/g, '').trim();
        const responseData = JSON.parse(jsonText);
        
        const tileMap = responseData.tileMap as ZoneMap;
        const npcs = responseData.npcs as NPC[];

        // --- VALIDATION AND CORRECTION LOGIC ---

        // 1. Get all valid spawn points
        const walkableTiles: {x: number, y: number}[] = [];
        tileMap.forEach((row, y) => {
            row.forEach((tile, x) => {
                if (['grass', 'path'].includes(tile)) {
                    walkableTiles.push({ x, y });
                }
            });
        });

        if (walkableTiles.length < (npcs.length + 5)) { // Sanity check for a playable map
            throw new Error("AI generated a map with too few walkable tiles.");
        }

        const occupiedCoordinates = new Set<string>();

        // 2. Helper to find a new, unoccupied valid position
        const findNewValidPosition = () => {
            for (let i = 0; i < 50; i++) { // Try random spots first for better distribution
                const randomTile = walkableTiles[Math.floor(Math.random() * walkableTiles.length)];
                if (!occupiedCoordinates.has(`${randomTile.x},${randomTile.y}`)) {
                    return randomTile;
                }
            }
            // Fallback: find the first available spot sequentially
            for (const tile of walkableTiles) {
                 if (!occupiedCoordinates.has(`${tile.x},${tile.y}`)) {
                    return tile;
                }
            }
            throw new Error("Could not find any valid spawn points on the map.");
        };

        // 3. Validate and correct NPC positions
        const correctedNpcs = npcs.map(npc => {
            const { x, y } = npc.position;
            const isPositionValid = y >= 0 && y < tileMap.length && x >= 0 && x < tileMap[y].length && ['grass', 'path'].includes(tileMap[y][x]);
            
            const newNpc = { ...npc };

            if (!isPositionValid || occupiedCoordinates.has(`${x},${y}`)) {
                const newPosition = findNewValidPosition();
                newNpc.position = newPosition;
            }
            
            occupiedCoordinates.add(`${newNpc.position.x},${newNpc.position.y}`);
            return newNpc;
        });

        // 4. Validate and correct quest item position
        const questNpcIndex = correctedNpcs.findIndex(npc => npc.quest);
        if (questNpcIndex !== -1) {
            const quest = correctedNpcs[questNpcIndex].quest!;
            const { x, y } = quest.objective.targetPosition;
            const isPositionValid = y >= 0 && y < tileMap.length && x >= 0 && x < tileMap[y].length && ['grass', 'path'].includes(tileMap[y][x]);

            if (!isPositionValid || occupiedCoordinates.has(`${x},${y}`)) {
                const newPosition = findNewValidPosition();
                quest.objective.targetPosition = newPosition;
            }
            occupiedCoordinates.add(`${quest.objective.targetPosition.x},${quest.objective.targetPosition.y}`);
        }

        // --- END OF VALIDATION ---

        let exitPosition = { x: 19, y: 19 }; // Default fallback

        // Find a valid exit on the right edge of the map
        const exitX = tileMap[0].length - 1;
        for (let y = 0; y < tileMap.length; y++) {
            if (['grass', 'path'].includes(tileMap[y][exitX])) {
                exitPosition = { x: exitX, y: y };
                break; // Found a valid exit, stop searching
            }
        }

        return { ...responseData, npcs: correctedNpcs, exitPosition };
    } catch (e) {
        console.error("Failed to parse or validate Gemini response for zone:", response.text, e);
        throw new Error("AI failed to generate a valid zone. Please try again.");
    }
}
