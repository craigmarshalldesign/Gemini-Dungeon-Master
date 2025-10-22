import React, { useState, useEffect } from 'react';
import type { GameState, Player, Direction, NPC, Item, Quest, DialogueState } from '../types';
import { QuestStatus, ClassType } from '../types';
import MapView from './MapView';
import Controls from './Controls';
import CharacterSheetModal from './CharacterSheetModal';
import InventoryModal from './InventoryModal';
import AbilitiesModal from './AbilitiesModal';
import QuestsModal from './QuestsModal';
import NpcInfoModal from './NpcInfoModal';
import ItemInfoModal from './ItemInfoModal';
import ChatModal from './ChatModal';
import { CHARACTER_CLASSES } from '../constants';
import { generateDialogue, startChatSession } from '../services/dialogueService';
import type { Chat } from '@google/genai';


interface GameScreenProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

const GameScreen: React.FC<GameScreenProps> = ({ gameState, setGameState }) => {
  const [showCharSheet, setShowCharSheet] = useState<Player | null>(null);
  const [selectedObject, setSelectedObject] = useState<NPC | Item | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const [showAbilities, setShowAbilities] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [zoneCompleted, setZoneCompleted] = useState(false);
  
  const [activeChatSession, setActiveChatSession] = useState<Chat | null>(null);
  
  const { players, currentZone, activePlayerId, quests, mainStoryline, worldName, dialogue, isChatting, chatStates, messageQueue, hasNewQuest } = gameState;
  const activePlayer = players[activePlayerId];

  useEffect(() => {
    const allQuestsCompleted = quests.length > 0 && quests.every(q => q.status === QuestStatus.COMPLETED);

    if (allQuestsCompleted && !zoneCompleted) { 
      setZoneCompleted(true);
      setGameState(prev => ({...prev, messageQueue: ["You've completed all local quests! A path to a new area has opened."], dmMessage: "You've completed all local quests! A path to a new area has opened."}));
    }
  }, [quests, setGameState, zoneCompleted]);

  if (!currentZone || !players[0] || !players[1]) {
    return <div>Loading game...</div>;
  }
  
  const levelUp = (player: Player): Player => {
    const classData = CHARACTER_CLASSES[player.classType];
    const newLevel = player.stats.level + 1;
    
    const newAbilities = classData.abilities.filter(a => a.level <= newLevel);
    
    const newMaxHp = player.stats.maxHp + 5;
    const newStr = player.stats.str + (player.classType === ClassType.WARRIOR ? 2 : 1);
    const newInt = player.stats.int + (player.classType === ClassType.WIZARD ? 2 : 1);
    const newDef = player.stats.def + 1;

    return {
      ...player,
      abilities: newAbilities,
      stats: {
        ...player.stats,
        level: newLevel,
        xp: player.stats.xp - player.stats.nextLevelXp,
        nextLevelXp: Math.floor(player.stats.nextLevelXp * 1.5),
        maxHp: newMaxHp,
        hp: newMaxHp,
        str: newStr,
        int: newInt,
        def: newDef,
      }
    };
  }

  const handleMove = (dx: number, dy: number) => {
    if (!activePlayer || isChatting || (messageQueue && messageQueue.length > 0)) return;

    if (dialogue) {
        const direction = dy === -1 ? 'up' : (dy === 1 ? 'down' : null);
        if (!direction) return; // Ignore left/right movement

        setGameState(prev => {
            if (!prev.dialogue) return prev;
            const menuOptionsCount = 3;
            const newIndex = direction === 'up'
                ? (prev.dialogue.menuSelectionIndex - 1 + menuOptionsCount) % menuOptionsCount
                : (prev.dialogue.menuSelectionIndex + 1) % menuOptionsCount;
            return { ...prev, dialogue: { ...prev.dialogue, menuSelectionIndex: newIndex } };
        });
        return; // Prevent player movement while in dialogue
    }

    let newDirection: Direction = activePlayer.direction;
    if (dy === -1) newDirection = 'up';
    else if (dy === 1) newDirection = 'down';
    else if (dx === -1) newDirection = 'left';
    else if (dx === 1) newDirection = 'right';

    const newX = activePlayer.position.x + dx;
    const newY = activePlayer.position.y + dy;
    
    const otherPlayer = players[(activePlayerId + 1) % 2]!;
    
    const exitPosition = currentZone.exitPosition;
    if (zoneCompleted && exitPosition && newX === exitPosition.x && newY === exitPosition.y) {
       setGameState(prev => ({...prev, dialogue: null, dmMessage: "You've found the exit! For now, your journey in this area is complete. (More zones coming soon!)"}));
       return;
    }

    const isTraversable = 
      newX >= 0 && newX < currentZone.tileMap[0].length &&
      newY >= 0 && newY < currentZone.tileMap.length &&
      ['grass', 'path'].includes(currentZone.tileMap[newY][newX]);
      
    const isNpcBlocking = currentZone.npcs.some(npc => npc.position.x === newX && npc.position.y === newY);
    const isPlayerBlocking = otherPlayer.position.x === newX && otherPlayer.position.y === newY;

    if (isTraversable && !isNpcBlocking && !isPlayerBlocking) {
      setGameState(prev => {
        const newPlayers = [...prev.players] as [Player, Player];
        newPlayers[activePlayerId] = {
          ...newPlayers[activePlayerId],
          position: { x: newX, y: newY },
          direction: newDirection,
        };
        return { ...prev, players: newPlayers };
      });
    } else {
       setGameState(prev => {
        const newPlayers = [...prev.players] as [Player, Player];
        newPlayers[activePlayerId] = { ...newPlayers[activePlayerId], direction: newDirection };
        return { ...prev, players: newPlayers };
      });
    }
  };

  const switchPlayer = () => {
    if (dialogue || isChatting || (messageQueue && messageQueue.length > 0)) return;
    setGameState(prev => ({...prev, activePlayerId: (prev.activePlayerId + 1) % 2}));
  }
  
  const completeQuestAndApplyRewards = (quest: Quest) => {
    const newQuests = gameState.quests.map(q => q.id === quest.id ? {...q, status: QuestStatus.COMPLETED} : q);
    const activePlayerInventory = activePlayer!.inventory.filter(item => item.id !== quest.objective.itemId);
    
    const levelUpSummary: string[] = [];
    
    const updatedPlayers = gameState.players.map((p, index) => {
        if (!p) return null;
        let updatedPlayer = { ...p };
        
        if (index === activePlayerId) {
            updatedPlayer.inventory = activePlayerInventory;
        }

        updatedPlayer.stats = { ...updatedPlayer.stats, xp: updatedPlayer.stats.xp + quest.xpReward };
        
        while (updatedPlayer.stats.xp >= updatedPlayer.stats.nextLevelXp) {
            const oldLevel = updatedPlayer.stats.level;
            updatedPlayer = levelUp(updatedPlayer);
            levelUpSummary.push(`${updatedPlayer.name} leveled up to level ${updatedPlayer.stats.level}!`);
        }
        return updatedPlayer;
    }) as [Player, Player];
    
    let summaryMessage = `Quest Complete: ${quest.title}! Both players gained ${quest.xpReward} XP.`;
    if (levelUpSummary.length > 0) {
        summaryMessage += ` ${levelUpSummary.join(' ')}`;
    }

    setGameState(prev => ({
        ...prev,
        players: updatedPlayers,
        quests: newQuests,
        dialogue: null,
        dmMessage: summaryMessage,
    }));
};

  const handleDialogueAction = async (action: 'talk' | 'chat' | 'close') => {
    if (!dialogue || !activePlayer) return;

    switch (action) {
      case 'talk':
        setGameState(prev => ({ ...prev, isLoading: true }));
        try {
            const newText = await generateDialogue(worldName, mainStoryline, currentZone.description, dialogue.npc, activePlayer);
            setGameState(prev => prev.dialogue ? {...prev, dialogue: {...prev.dialogue, currentText: newText}} : prev);
        } catch (error) {
            console.error("Dialogue generation failed:", error);
            setGameState(prev => prev.dialogue ? {...prev, dialogue: {...prev.dialogue, currentText: "I... seem to have lost my train of thought."}} : prev);
        } finally {
            setGameState(prev => ({...prev, isLoading: false }));
        }
        break;

      case 'chat':
        const npcName = dialogue.npc.name;
        const existingChatState = chatStates[npcName] || { history: [], messagesSent: 0 };
        
        const npcQuestTemplate = dialogue.npc.quest;
        const associatedQuest = npcQuestTemplate ? quests.find(q => q.id === npcQuestTemplate.id) : null;

        const session = startChatSession(dialogue.npc, worldName, mainStoryline, currentZone.description, activePlayer, existingChatState.history, associatedQuest);
        setActiveChatSession(session);
        setGameState(prev => ({ ...prev, isChatting: true }));
        break;

      case 'close':
         const npc = dialogue.npc;
         const questInState = quests.find(q => q.id === npc.quest?.id && q.status === QuestStatus.ACTIVE);
         const hasItem = activePlayer.inventory.some(item => item.id === questInState?.objective.itemId);

         if (questInState && hasItem) {
            completeQuestAndApplyRewards(questInState);
         } else {
            setGameState(prev => ({...prev, dialogue: null, dmMessage: 'Conversation ended.'}));
         }
        setActiveChatSession(null);
        break;
    }
  };

  const handleInteract = () => {
    if (messageQueue && messageQueue.length > 0) {
        setGameState(prev => {
            const newQueue = prev.messageQueue!.slice(1);
            return {
                ...prev,
                messageQueue: newQueue.length > 0 ? newQueue : null,
                dmMessage: newQueue.length > 0 ? newQueue[0] : 'You may now proceed.'
            };
        });
        return;
    }
      
    if (!activePlayer || isChatting) return;

    if (dialogue) {
        const menuOptions = ['talk', 'chat', 'close'] as const;
        const selectedAction = menuOptions[dialogue.menuSelectionIndex];
        handleDialogueAction(selectedAction);
        return;
    }
    
    const itemOnTile = currentZone.items.find(item => item.position?.x === activePlayer.position.x && item.position?.y === activePlayer.position.y);
    if (itemOnTile) {
      if(activePlayer.inventory.length >= 16) {
        setGameState(prev => ({...prev, dmMessage: "Your inventory is full!"}));
        return;
      }
      const newInventory = [...activePlayer.inventory, { ...itemOnTile, position: undefined }];
      const newItemsOnMap = currentZone.items.filter(item => item.id !== itemOnTile.id);

      setGameState(prev => {
        const newPlayers = [...prev.players] as [Player, Player];
        newPlayers[activePlayerId] = { ...newPlayers[activePlayerId], inventory: newInventory };
        return {
          ...prev,
          players: newPlayers,
          currentZone: { ...prev.currentZone!, items: newItemsOnMap },
          dmMessage: `You picked up: ${itemOnTile.emoji} ${itemOnTile.name}.`
        };
      });
      return;
    }

    const { x, y } = activePlayer.position;
    const { direction } = activePlayer;
    let targetX = x;
    let targetY = y;
    if (direction === 'up') targetY--;
    if (direction === 'down') targetY++;
    if (direction === 'left') targetX--;
    if (direction === 'right') targetX++;

    const targetNpc = currentZone.npcs.find(npc => npc.position.x === targetX && npc.position.y === targetY);
    if (targetNpc?.quest) {
        const questInState = gameState.quests.find(q => q.id === targetNpc.quest!.id);

        if (questInState?.status === QuestStatus.INACTIVE) {
            const newQuests = gameState.quests.map(q => q.id === questInState.id ? {...q, status: QuestStatus.ACTIVE} : q);
            
            let newItemsOnMap = [...currentZone.items];
            if (questInState.objective.type === 'fetch') {
                const questItem: Item = {
                    id: questInState.objective.itemId,
                    name: questInState.objective.itemName,
                    description: questInState.objective.itemDescription,
                    emoji: questInState.objective.itemEmoji,
                    position: questInState.objective.targetPosition,
                };
                newItemsOnMap.push(questItem);
            }
            const newDialogueState: DialogueState = {
                npc: targetNpc,
                currentText: questInState.description,
                menuSelectionIndex: 0,
            };
            setGameState(prev => ({
                ...prev,
                quests: newQuests,
                currentZone: { ...prev.currentZone!, items: newItemsOnMap },
                dialogue: newDialogueState,
                dmMessage: `Quest Started: ${questInState.title}!`,
                hasNewQuest: true,
            }));
        } else if (questInState?.status === QuestStatus.ACTIVE) {
            const hasItem = activePlayer.inventory.some(item => item.id === questInState.objective.itemId);
            if (hasItem) {
                const newDialogueState: DialogueState = {
                    npc: targetNpc,
                    currentText: questInState.completionDialogue,
                    menuSelectionIndex: 0,
                };
                setGameState(prev => ({ ...prev, dialogue: newDialogueState }));
            } else {
                 const newDialogueState: DialogueState = {
                    npc: targetNpc,
                    currentText: `You don't have the ${questInState.objective.itemName} yet.`,
                    menuSelectionIndex: 0,
                 };
                 setGameState(prev => ({...prev, dialogue: newDialogueState}));
            }
        } else { // Quest is COMPLETED
            const newDialogueState: DialogueState = {
                npc: targetNpc,
                currentText: targetNpc.initialDialogue,
                menuSelectionIndex: 0,
            };
            setGameState(prev => ({...prev, dialogue: newDialogueState}));
        }
    } else if (targetNpc) {
        const newDialogueState: DialogueState = {
            npc: targetNpc,
            currentText: targetNpc.initialDialogue,
            menuSelectionIndex: 0,
        };
        setGameState(prev => ({ ...prev, dialogue: newDialogueState }));
    }
  };
  
  const handleSendChatMessage = async (message: string) => {
    if (!dialogue || !activeChatSession) return;
    const npcName = dialogue.npc.name;
    
    const currentMessagesSent = chatStates[npcName]?.messagesSent || 0;
    if (currentMessagesSent >= 5) return;

    setGameState(prev => ({ ...prev, isLoading: true }));
    const playerMessage = { author: 'player' as const, text: message };
    
    // Optimistically add player message for immediate UI feedback
    setGameState(prev => ({
        ...prev,
        chatStates: {
            ...prev.chatStates,
            [npcName]: {
                history: [...(prev.chatStates[npcName]?.history || []), playerMessage],
                messagesSent: prev.chatStates[npcName]?.messagesSent || 0,
            }
        }
    }));
    
    try {
        const response = await activeChatSession.sendMessage({ message });
        const npcResponseText = response.text.trim();
        const npcMessage = { author: 'npc' as const, text: npcResponseText };

        // Update state with NPC response and increment message count
        setGameState(prev => ({
            ...prev,
            chatStates: {
                ...prev.chatStates,
                [npcName]: {
                    ...prev.chatStates[npcName],
                    history: [...(prev.chatStates[npcName]?.history || []), npcMessage],
                    messagesSent: (prev.chatStates[npcName]?.messagesSent || 0) + 1,
                }
            }
        }));
    } catch(error) {
        console.error("Chat failed:", error);
        const errorMessage = { author: 'npc' as const, text: "I... I don't know what to say." };
        setGameState(prev => ({
            ...prev,
            chatStates: {
                ...prev.chatStates,
                [npcName]: {
                   ...prev.chatStates[npcName],
                    history: [...(prev.chatStates[npcName]?.history || []), errorMessage],
                }
            }
        }));
    } finally {
        setGameState(prev => ({ ...prev, isLoading: false }));
    }
  };
  
  const handleCloseChat = () => {
    setGameState(prev => ({...prev, isChatting: false }));
  };

  const handleNewConversation = () => {
    if (!dialogue || !activePlayer) return;
    const npcName = dialogue.npc.name;

    const npcQuestTemplate = dialogue.npc.quest;
    const associatedQuest = npcQuestTemplate ? quests.find(q => q.id === npcQuestTemplate.id) : null;

    setGameState(prev => ({
        ...prev,
        chatStates: {
            ...prev.chatStates,
            [npcName]: { history: [], messagesSent: 0 }
        }
    }));

    const newSession = startChatSession(dialogue.npc, worldName, mainStoryline, currentZone.description, activePlayer, [], associatedQuest);
    setActiveChatSession(newSession);
  }

  const handleBack = () => {
    if (isChatting) {
        handleCloseChat();
    } else if (dialogue) {
        handleDialogueAction('close');
    }
  }

  const handleQuestsClick = () => {
    setShowQuests(true);
    if (hasNewQuest) {
        setGameState(prev => ({ ...prev, hasNewQuest: false }));
    }
  };

  const isNpc = selectedObject && 'role' in selectedObject;
  const isItem = selectedObject && !('role' in selectedObject);
  const currentNpcChatState = (dialogue && chatStates[dialogue.npc.name]) || { history: [], messagesSent: 0 };
  
  const hasActiveMessageQueue = !!messageQueue && messageQueue.length > 0;
  const isDPadDisabled = isChatting || hasActiveMessageQueue;
  const arePanelButtonsDisabled = isChatting || hasActiveMessageQueue;
  const isSwitchPlayerDisabled = isChatting || hasActiveMessageQueue || !!dialogue;
  const isBackButtonDisabled = isChatting || hasActiveMessageQueue;
  const areControlsDimmed = isChatting;


  return (
    <div className="flex flex-col md:flex-row gap-4 items-start justify-center">
      {showCharSheet && <CharacterSheetModal player={showCharSheet} onClose={() => setShowCharSheet(null)} />}
      {isNpc && <NpcInfoModal npc={selectedObject as NPC} onClose={() => setSelectedObject(null)} />}
      {isItem && <ItemInfoModal item={selectedObject as Item} quest={quests.find(q => q.objective.itemId === (selectedObject as Item).id)} onClose={() => setSelectedObject(null)} />}
      {showInventory && activePlayer && <InventoryModal player={activePlayer} onClose={() => setShowInventory(false)} />}
      {showAbilities && activePlayer && <AbilitiesModal player={activePlayer} onClose={() => setShowAbilities(false)} />}
      {showQuests && <QuestsModal mainStory={mainStoryline} quests={quests} worldName={worldName} onClose={() => setShowQuests(false)} />}
      {isChatting && dialogue && (
        <ChatModal 
            npc={dialogue.npc}
            chatHistory={currentNpcChatState.history}
            messagesSent={currentNpcChatState.messagesSent}
            isLoading={gameState.isLoading}
            onClose={handleCloseChat}
            onSend={handleSendChatMessage}
            onNewConversation={handleNewConversation}
        />
      )}
      
      <div className="flex flex-col items-center">
        <div className="flex gap-4 mb-2">
            <button disabled={isChatting} onClick={() => setShowCharSheet(players[0])} className="px-3 py-1 bg-green-700 rounded disabled:opacity-50 disabled:cursor-not-allowed">{players[0].name} Lvl {players[0].stats.level}</button>
            <button disabled={isChatting} onClick={() => setShowCharSheet(players[1])} className="px-3 py-1 bg-purple-700 rounded disabled:opacity-50 disabled:cursor-not-allowed">{players[1].name} Lvl {players[1].stats.level}</button>
        </div>
        <MapView 
            zone={currentZone} 
            players={players as [Player, Player]} 
            activePlayerId={activePlayerId}
            onSelectObject={setSelectedObject}
            exitPosition={zoneCompleted ? currentZone.exitPosition : null}
        />
      </div>

      <Controls 
        onMove={handleMove} 
        onInteract={handleInteract} 
        onSwitchPlayer={switchPlayer}
        onBack={handleBack}
        onInventoryClick={() => setShowInventory(true)}
        onAbilitiesClick={() => setShowAbilities(true)}
        onQuestsClick={handleQuestsClick}
        activePlayerName={activePlayer.name}
        isDPadDisabled={isDPadDisabled}
        arePanelButtonsDisabled={arePanelButtonsDisabled}
        isSwitchPlayerDisabled={isSwitchPlayerDisabled}
        isBackButtonDisabled={isBackButtonDisabled}
        areControlsDimmed={areControlsDimmed}
        hasNewQuest={hasNewQuest}
      />
    </div>
  );
};

export default GameScreen;