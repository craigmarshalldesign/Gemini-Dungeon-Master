import { generateWithRetry } from './geminiService';
import { Type } from "@google/genai";
import { QuestStatus } from '../types';
import type { NPC, ZoneMap, Quest } from '../types';

interface ZoneLayoutResponse {
    zoneName: string;
    tileMap: ZoneMap;
}

interface ZonePopulationResponse {
    npcs: NPC[];
    exitPosition: { x: number, y: number } | null;
    entryPosition: { x: number, y: number } | null;
    initialSpawnPoints?: [{x: number, y: number}, {x: number, y: number}];
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

export async function generateZoneLayout(zoneName: string, zoneTerrain: string): Promise<ZoneLayoutResponse> {
    const prompt = `You are a map designer for a D&D style game.
    Generate a 20x20 tile-based map for a zone named '${zoneName}' which is a ${zoneTerrain} area.
    The aesthetic is like Legend of Zelda on the Gameboy. The map should be a 2D array of strings.
    Valid tile types are: 'grass', 'tree', 'water', 'path', 'building'.
    IMPORTANT: Ensure the map has large, interconnected walkable areas ('grass', 'path') and avoid creating small, isolated pockets.
    Return a valid JSON object with keys 'zoneName' (use the one provided) and 'tileMap'.`;

    const response = await generateWithRetry({
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
                },
                required: ['zoneName', 'tileMap']
            }
        }
    });

    try {
        const jsonText = extractJson(response.text);
        return JSON.parse(jsonText);
    } catch (e) {
        console.error("Failed to parse Gemini response for zone layout:", response.text, e);
        throw new Error("AI failed to generate a valid zone layout. Please try again.");
    }
}

const findLargestConnectedComponent = (tileMap: ZoneMap): {x: number, y: number}[] => {
    if (!tileMap || tileMap.length === 0 || tileMap[0].length === 0) return [];

    const width = tileMap[0].length;
    const height = tileMap.length;
    const visited = new Set<string>();
    let largestComponent: {x: number, y: number}[] = [];

    const isWalkable = (x: number, y: number) => 
        y >= 0 && y < height && x >= 0 && x < width && ['grass', 'path'].includes(tileMap[y][x]);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const key = `${x},${y}`;
            if (isWalkable(x, y) && !visited.has(key)) {
                const currentComponent: {x: number, y: number}[] = [];
                const queue = [{x, y}];
                visited.add(key);
                
                let head = 0;
                while(head < queue.length) {
                    const {x: cx, y: cy} = queue[head++];
                    currentComponent.push({x: cx, y: cy});

                    const neighbors = [
                        {x: cx, y: cy - 1}, {x: cx, y: cy + 1},
                        {x: cx - 1, y: cy}, {x: cx + 1, y: cy},
                    ];

                    for (const neighbor of neighbors) {
                        const nKey = `${neighbor.x},${neighbor.y}`;
                        if (isWalkable(neighbor.x, neighbor.y) && !visited.has(nKey)) {
                            visited.add(nKey);
                            queue.push(neighbor);
                        }
                    }
                }
                if (currentComponent.length > largestComponent.length) {
                    largestComponent = currentComponent;
                }
            }
        }
    }
    return largestComponent;
};

const findPortalPosition = (
    walkableTiles: {x: number, y: number}[],
    tileMap: ZoneMap,
    occupiedCoordinates: Set<string>,
    side: 'left' | 'right' | 'top' | 'bottom'
): {x: number, y: number} | null => {
    const width = tileMap[0].length;
    const height = tileMap.length;

    let edgeTiles = walkableTiles.filter(t => {
        if (side === 'left') return t.x === 0;
        if (side === 'right') return t.x === width - 1;
        if (side === 'top') return t.y === 0;
        if (side === 'bottom') return t.y === height - 1;
        return false;
    });

    edgeTiles.sort(() => Math.random() - 0.5); // Shuffle

    for (const tile of edgeTiles) {
        const key = `${tile.x},${tile.y}`;
        if (occupiedCoordinates.has(key)) continue;

        const neighbors = [
            { x: tile.x + 1, y: tile.y }, { x: tile.x - 1, y: tile.y },
            { x: tile.x, y: tile.y + 1 }, { x: tile.x, y: tile.y - 1 },
        ];

        const hasValidExit = neighbors.some(n =>
            n.x >= 0 && n.x < width && n.y >= 0 && n.y < height &&
            ['grass', 'path'].includes(tileMap[n.y][n.x])
        );
        
        if (hasValidExit) {
            return tile;
        }
    }

    return null; 
}


export async function populateZone(
    worldName: string, 
    mainStoryline: string, 
    tileMap: ZoneMap,
    isStartingZone: boolean,
    previousZoneDescription: string | null,
    hasNextZone: boolean,
    isFinalBossZone: boolean,
    targetCoords?: { x: number, y: number },
    cameFromCoords?: { x: number, y: number },
    nextZoneCoords?: { x: number, y: number } | null
): Promise<ZonePopulationResponse> {
    
    let contextPrompt = '';
    if (isFinalBossZone) {
        contextPrompt = 'This is the final boss zone. It MUST contain the main antagonist. Make this NPC powerful and central to the zone. This NPC should NOT have a quest.';
    } else if (isStartingZone) {
        contextPrompt = 'This is the very first zone of the adventure. Create an introductory quest for one of the NPCs.';
    } else {
        contextPrompt = `The players have just arrived from a zone described as '${previousZoneDescription}'. Create a quest that logically follows their journey.`;
    }

    const questInstruction = isFinalBossZone 
        ? "Do not create any quests." 
        : "For ONE of the NPCs, create a simple 'fetch' quest.";
    
    const prompt = `You are a Dungeon Master for a world named '${worldName}'. The main story is: '${mainStoryline}'.
    You are given this 20x20 zone map: ${JSON.stringify(tileMap)}.
    Your task is to populate this map.
    ${contextPrompt}
    1.  Place 1-3 interesting NPCs. Their names, roles, and personalities should fit the world.
    2.  For each NPC, provide: 'name', 'role', 'description', 'personality', 'initialDialogue', basic 'stats' ({hp, str, int}), their 'position' {x, y}, and a 'quest' (which can be null).
    3.  ${questInstruction}
    IMPORTANT: All positions (NPCs, quest items, entry/exit) MUST be on walkable tiles ('grass' or 'path') and placed in open areas.
    Return a valid JSON object.`;

    const response = await generateWithRetry({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
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
                                    properties: { hp: { type: Type.NUMBER }, str: { type: Type.NUMBER }, int: { type: Type.NUMBER } },
                                    required: ['hp', 'str', 'int']
                                },
                                position: {
                                    type: Type.OBJECT,
                                    properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } },
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
                                                    properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } },
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
                required: ['npcs']
            }
        }
    });

    try {
        const jsonText = extractJson(response.text);
        const responseData = JSON.parse(jsonText);
        
        const walkableTiles = findLargestConnectedComponent(tileMap);
        if (walkableTiles.length < 20) {
             throw new Error("AI generated a map with too few connected walkable tiles.");
        }
        
        const walkableSet = new Set(walkableTiles.map(t => `${t.x},${t.y}`));
        const occupiedCoordinates = new Set<string>();

        const findNewValidPosition = () => {
            const shuffledWalkable = [...walkableTiles].sort(() => 0.5 - Math.random());
            for (const tile of shuffledWalkable) {
                if (!occupiedCoordinates.has(`${tile.x},${tile.y}`)) {
                    return tile;
                }
            }
            throw new Error("Could not find any valid unoccupied spawn points on the map.");
        };
        
        const validatedNpcs = responseData.npcs.map((npc: NPC) => {
            const { x, y } = npc.position;
            const newNpc = { ...npc };
            if (!walkableSet.has(`${x},${y}`) || occupiedCoordinates.has(`${x},${y}`)) {
                newNpc.position = findNewValidPosition();
            }
            occupiedCoordinates.add(`${newNpc.position.x},${newNpc.position.y}`);
            
            if (newNpc.quest) {
                const quest = newNpc.quest;
                const { x: itemX, y: itemY } = quest.objective.targetPosition;
                 if (!walkableSet.has(`${itemX},${itemY}`) || occupiedCoordinates.has(`${itemX},${itemY}`)) {
                    quest.objective.targetPosition = findNewValidPosition();
                }
                occupiedCoordinates.add(`${quest.objective.targetPosition.x},${quest.objective.targetPosition.y}`);
            }
            return newNpc;
        });

        let entrySide: 'left' | 'right' | 'top' | 'bottom' | null = null;
        if (!isStartingZone && targetCoords && cameFromCoords) {
            if (targetCoords.x > cameFromCoords.x) entrySide = 'left';
            else if (targetCoords.x < cameFromCoords.x) entrySide = 'right';
            else if (targetCoords.y > cameFromCoords.y) entrySide = 'top';
            else if (targetCoords.y < cameFromCoords.y) entrySide = 'bottom';
        }

        let exitSide: 'left' | 'right' | 'top' | 'bottom' | null = null;
        if (hasNextZone && targetCoords && nextZoneCoords) {
            if (nextZoneCoords.x > targetCoords.x) exitSide = 'right';
            else if (nextZoneCoords.x < targetCoords.x) exitSide = 'left';
            else if (nextZoneCoords.y > targetCoords.y) exitSide = 'bottom';
            else if (nextZoneCoords.y < targetCoords.y) exitSide = 'top';
        }
        
        let entryPosition = entrySide ? findPortalPosition(walkableTiles, tileMap, occupiedCoordinates, entrySide) : null;
        if (!isStartingZone && !entryPosition) {
            console.warn(`Could not place entry portal on ${entrySide} side, placing randomly.`);
            entryPosition = findNewValidPosition();
        }
        if (entryPosition) occupiedCoordinates.add(`${entryPosition.x},${entryPosition.y}`);

        let exitPosition = exitSide ? findPortalPosition(walkableTiles, tileMap, occupiedCoordinates, exitSide) : null;
        if (hasNextZone && !exitPosition) {
            console.warn(`Could not place exit portal on ${exitSide} side, placing randomly.`);
            exitPosition = findNewValidPosition();
        }
        if (exitPosition) occupiedCoordinates.add(`${exitPosition.x},${exitPosition.y}`);
        
        let result: ZonePopulationResponse = { 
            npcs: validatedNpcs, 
            exitPosition,
            entryPosition
        };
        
        if (isStartingZone) {
            const point1 = findNewValidPosition();
            occupiedCoordinates.add(`${point1.x},${point1.y}`);
            const point2 = findNewValidPosition();
            result.initialSpawnPoints = [point1, point2];
        }

        return result;

    } catch (e) {
        console.error("Failed to parse or validate Gemini response for zone population:", response.text, e);
        throw new Error("AI failed to populate the zone. Please try again.");
    }
}