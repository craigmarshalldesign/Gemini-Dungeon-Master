import { ai } from './geminiClient';
import { Type } from "@google/genai";
import { QuestStatus } from '../types';
import type { NPC, ZoneMap, Quest } from '../types';

interface ZoneResponse {
    zoneName: string;
    tileMap: ZoneMap;
    npcs: NPC[];
    exitPosition: { x: number, y: number };
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

export async function generateZone(zoneDescription: string, worldName: string, mainStoryline: string): Promise<ZoneResponse> {
    const prompt = `You are a Dungeon Master for a world named '${worldName}'. The main story is: '${mainStoryline}'.
    Generate a detailed 20x20 tile-based map for a zone described as: '${zoneDescription}'. 
    The zone needs a short, evocative name (e.g., 'Whispering Glade', 'Grumble-Belly Mine').
    The aesthetic is like Legend of Zelda on the Gameboy. The map should be a 2D array of strings representing tiles: 'grass', 'tree', 'water', 'path', 'building'. 
    Place 2-3 interesting and unique NPCs on this map. Their names, roles, and personalities should feel appropriate for the world and story. Do not use generic fantasy names repeatedly.
    For each NPC, provide: a 'name', a one-sentence 'role', a 'description' (physical appearance), a 'personality' (e.g., grumpy, cheerful), an 'initialDialogue' (a single, short, in-character line they say when first spoken to), basic 'stats' (just {hp: 10, str: 5, int: 5}), their starting 'position' {x, y}, and a potential 'quest'.
    For one of the NPCs, create a simple fetch quest that is thematically linked to the zone or main story. The quest object must have: 'id' (a unique string like 'fetch_herbs'), 'title', 'description', 'completionDialogue' (a short, thankful line for when the player turns in the item), 'status' ('inactive'), an 'xpReward' (a number, e.g., 50), and an 'objective' object. The objective must contain 'type' ('fetch'), 'itemName' ('Glimmering Herb'), 'itemDescription' ('A rare herb that glows faintly.'), 'itemEmoji' (a single, appropriate emoji string like '🌿'), 'itemId' (a unique string like 'glimmering_herb_1'), and a 'targetPosition' {x, y} for the item. For other NPCs, the quest value should be null.
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
                    zoneName: { type: Type.STRING },
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
                                initialDialogue: { type: Type.STRING },
                                stats: {
                                    type: Type.OBJECT,
                                    properties: {
                                        hp: { type: Type.NUMBER },
                                        str: { type: Type.NUMBER },
                                        int: { type: Type.NUMBER },
                                    },
                                    required: ['hp', 'str', 'int']
                                },
                                position: {
                                    type: Type.OBJECT,
                                    properties: {
                                        x: { type: Type.NUMBER },
                                        y: { type: Type.NUMBER }
                                    },
                                    required: ['x', 'y']
                                },
                                quest: {
                                    type: Type.OBJECT,
                                    nullable: true,
                                    properties: {
                                        id: { type: Type.STRING },
                                        title: { type: Type.STRING },
                                        description: { type: Type.STRING },
                                        completionDialogue: { type: Type.STRING },
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
                                                    },
                                                    required: ['x', 'y']
                                                }
                                            },
                                            required: ['type', 'itemName', 'itemDescription', 'itemEmoji', 'itemId', 'targetPosition']
                                        }
                                    },
                                    required: ['id', 'title', 'description', 'completionDialogue', 'status', 'xpReward', 'objective']
                                }
                            },
                            required: ['name', 'role', 'description', 'personality', 'initialDialogue', 'stats', 'position', 'quest']
                        }
                    }
                },
                required: ['zoneName', 'tileMap', 'npcs']
            }
        }
    });
    
    try {
        const jsonText = extractJson(response.text);
        const responseData = JSON.parse(jsonText);
        
        const tileMap = responseData.tileMap as ZoneMap;
        const npcs = responseData.npcs as NPC[];
        const width = tileMap[0].length;
        const height = tileMap.length;

        const isWalkable = (x: number, y: number) => {
             if (x < 0 || x >= width || y < 0 || y >= height) return false;
             return ['grass', 'path'].includes(tileMap[y][x]);
        }

        const walkableTiles: {x: number, y: number}[] = [];
        tileMap.forEach((row, y) => {
            row.forEach((tile, x) => {
                if (isWalkable(x, y)) {
                    walkableTiles.push({ x, y });
                }
            });
        });

        if (walkableTiles.length < (npcs.length + 5)) {
            throw new Error("AI generated a map with too few walkable tiles.");
        }

        const occupiedCoordinates = new Set<string>();

        const findNewValidPosition = () => {
            for (let i = 0; i < 50; i++) {
                const randomTile = walkableTiles[Math.floor(Math.random() * walkableTiles.length)];
                if (!occupiedCoordinates.has(`${randomTile.x},${randomTile.y}`)) {
                    return randomTile;
                }
            }
            for (const tile of walkableTiles) {
                 if (!occupiedCoordinates.has(`${tile.x},${tile.y}`)) {
                    return tile;
                }
            }
            throw new Error("Could not find any valid spawn points on the map.");
        };

        const correctedNpcs = npcs.map(npc => {
            const { x, y } = npc.position;
            const isPositionValid = isWalkable(x, y);
            
            const newNpc = { ...npc };

            if (!isPositionValid || occupiedCoordinates.has(`${x},${y}`)) {
                const newPosition = findNewValidPosition();
                newNpc.position = newPosition;
            }
            
            occupiedCoordinates.add(`${newNpc.position.x},${newNpc.position.y}`);
            return newNpc;
        });

        const questNpcIndex = correctedNpcs.findIndex(npc => npc.quest);
        if (questNpcIndex !== -1) {
            const quest = correctedNpcs[questNpcIndex].quest!;
            const { x, y } = quest.objective.targetPosition;
            const isPositionValid = isWalkable(x, y);

            if (!isPositionValid || occupiedCoordinates.has(`${x},${y}`)) {
                const newPosition = findNewValidPosition();
                quest.objective.targetPosition = newPosition;
            }
            occupiedCoordinates.add(`${quest.objective.targetPosition.x},${quest.objective.targetPosition.y}`);
        }
        
        // --- START: New Exit Placement Logic ---
        const startNode = walkableTiles[0];
        if (!startNode) {
            throw new Error("No walkable tiles found to determine reachability.");
        }

        const queue = [startNode];
        const visited = new Set<string>([`${startNode.x},${startNode.y}`]);
        const reachableTiles = new Set<string>([`${startNode.x},${startNode.y}`]);

        while(queue.length > 0) {
            const {x, y} = queue.shift()!;
            const neighbors = [{x: x+1, y}, {x: x-1, y}, {x, y: y+1}, {x, y: y-1}];

            for (const neighbor of neighbors) {
                const key = `${neighbor.x},${neighbor.y}`;
                if (isWalkable(neighbor.x, neighbor.y) && !visited.has(key)) {
                    visited.add(key);
                    reachableTiles.add(key);
                    queue.push(neighbor);
                }
            }
        }

        const reachableEdgeTiles = Array.from(reachableTiles).map(key => {
            const [x, y] = key.split(',').map(Number);
            return {x, y};
        }).filter(({x, y}) => x === 0 || x === width - 1 || y === 0 || y === height - 1);

        let exitPosition: {x: number, y: number};

        if (reachableEdgeTiles.length > 0) {
            exitPosition = reachableEdgeTiles[Math.floor(Math.random() * reachableEdgeTiles.length)];
        } else {
            // Island map: find closest reachable point to an edge and carve a path
            let closestTile = null;
            let minDistance = Infinity;

            for (const key of reachableTiles) {
                 const [x, y] = key.split(',').map(Number);
                 const distance = Math.min(x, y, width - 1 - x, height - 1 - y);
                 if (distance < minDistance) {
                     minDistance = distance;
                     closestTile = {x, y};
                 }
            }
            
            if (!closestTile) { // Should be impossible if there's any walkable tile
                throw new Error("Could not find a tile to start path carving from.");
            }

            // Find nearest edge point
            const distances = {
                left: closestTile.x,
                right: width - 1 - closestTile.x,
                top: closestTile.y,
                bottom: height - 1 - closestTile.y,
            };

            const nearestEdge = Object.keys(distances).reduce((a, b) => distances[a as keyof typeof distances] < distances[b as keyof typeof distances] ? a : b);

            let targetX = closestTile.x;
            let targetY = closestTile.y;

            switch(nearestEdge) {
                case 'left':   targetX = 0; break;
                case 'right':  targetX = width - 1; break;
                case 'top':    targetY = 0; break;
                case 'bottom': targetY = height - 1; break;
            }
            
            // Carve path horizontally, then vertically
            let currentX = closestTile.x;
            const dx = Math.sign(targetX - currentX);
            if (dx !== 0) {
                while(currentX !== targetX) {
                    currentX += dx;
                    tileMap[closestTile.y][currentX] = 'path';
                }
            }
            
            let currentY = closestTile.y;
            const dy = Math.sign(targetY - currentY);
            if (dy !== 0) {
                 while(currentY !== targetY) {
                    currentY += dy;
                    tileMap[currentY][currentX] = 'path';
                }
            }

            exitPosition = { x: targetX, y: targetY };
        }
        // --- END: New Exit Placement Logic ---
        
        return { ...responseData, npcs: correctedNpcs, exitPosition };
    } catch (e) {
        console.error("Failed to parse or validate Gemini response for zone:", response.text, e);
        throw new Error("AI failed to generate a valid zone. Please try again.");
    }
}
