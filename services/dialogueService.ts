import { ai, generateWithRetry } from './geminiService';
import type { NPC, Player, DisplayChatMessage, Quest } from '../types';
import type { Chat, Content } from '@google/genai';

function convertHistoryForSDK(history: DisplayChatMessage[]): Content[] {
    return history.map(msg => ({
        role: msg.author === 'player' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));
}


export function startChatSession(
    npc: NPC,
    worldName: string,
    mainStoryline: string,
    zoneName: string,
    zoneDescription: string,
    zoneTerrain: string,
    player: Player,
    history: DisplayChatMessage[],
    quest: Quest | null,
    otherNpcNames: string[]
): Chat {
    let systemInstruction = `
        You are an NPC in a D&D style game. You must strictly roleplay as this character and never break character.
        Your responses should be concise, in-character, and appropriate for a fantasy world. Do not use modern slang or concepts.
        You are speaking to a player. Respond directly to their messages.

        WORLD CONTEXT: The world is named '${worldName}'. The main story is: '${mainStoryline}'.
        ZONE CONTEXT: You are currently in a ${zoneTerrain} zone named '${zoneName}', which is described as: '${zoneDescription}'. You are aware of other individuals in this area: ${otherNpcNames.join(', ')}.

        YOUR PERSONA:
        - Name: ${npc.name}
        - Role: ${npc.role}
        - Description: ${npc.description}
        - Personality: ${npc.personality}

        PLAYER INFO: The player talking to you is ${player.name}, a ${player.classType}.
    `;

    if (quest) {
        systemInstruction += `
        
        QUEST INFORMATION: You have assigned the following quest to the player. Be prepared to answer questions about it.
        - Quest Title: ${quest.title}
        - Quest Description: ${quest.description}
        - Current Status: ${quest.status}
        - Objective: Find the ${quest.objective.itemName}.
        `;
    }

    systemInstruction += `

        Begin the conversation now.
    `;
    
    const sdkHistory = convertHistoryForSDK(history);
    
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction },
        history: sdkHistory,
    });
}

export async function generateDialogue(
    worldName: string,
    mainStoryline: string,
    zoneName: string,
    zoneDescription: string,
    zoneTerrain: string,
    npc: NPC,
    player: Player,
    otherNpcNames: string[]
): Promise<string> {
    const prompt = `
        You are an NPC in a D&D style game. Your persona is defined below. A player is talking to you. 
        Generate a single, short, in-character line of dialogue (1-2 sentences) as a new thought or observation. This is not a greeting, but a continuation of a conversation.
        Do not break character. Do not add conversational pleasantries like "Certainly, here is a line...". Just provide the dialogue itself.

        WORLD CONTEXT: The world is named '${worldName}'. The main story is: '${mainStoryline}'.
        ZONE CONTEXT: You are currently in a ${zoneTerrain} zone named '${zoneName}', described as: '${zoneDescription}'. You are aware of other individuals in this area: ${otherNpcNames.join(', ')}.

        YOUR PERSONA:
        - Name: ${npc.name}
        - Role: ${npc.role}
        - Description: ${npc.description}
        - Personality: ${npc.personality}

        PLAYER INFO: The player talking to you is ${player.name}, a ${player.classType}.

        Generate the line of dialogue now.
    `;

    try {
        const response = await generateWithRetry({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const text = response.text.trim();
        // Remove potential markdown or quotes that the model might add
        return text.replace(/["*]/g, '');
    } catch (e) {
        console.error("Failed to generate dialogue from Gemini:", e);
        // Provide a generic fallback dialogue on error
        return "Hmmm, let me think...";
    }
}