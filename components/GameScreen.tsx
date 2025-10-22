import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { GameState, Player, Direction, NPC, Item, Quest, DialogueState, Zone } from '../types';
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
import SettingsModal from './SettingsModal';
import { CHARACTER_CLASSES } from '../constants';
import { generateDialogue, startChatSession } from '../services/dialogueService';
import type { Chat } from '@google/genai';


interface GameScreenProps {
  gameState: GameState;
  currentZone: Zone;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  endGame: () => void;
  onZoneTransition: (targetCoords: { x: number; y: number }, cameFromCoords: { x: number; y: number }) => void;
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

const GameScreen: React.FC<GameScreenProps> = ({ gameState, currentZone, setGameState, isFullscreen, toggleFullscreen, endGame, onZoneTransition }) => {
  const [showCharSheet, setShowCharSheet] = useState<Player | null>(null);
  const [selectedObject, setSelectedObject] = useState<NPC | Item | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const [showAbilities, setShowAbilities] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [zoneCompleted, setZoneCompleted] = useState(false);
  const [pressedKeys, setPressedKeys] = React.useState<Set<string>>(new Set());
  
  const [activeChatSession, setActiveChatSession] = useState<Chat | null>(null);
  const lastMoveTimestamp = useRef(0);
  const moveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeMoveKey = useRef<string | null>(null);
  
  const { players, activePlayerId, quests, mainStoryline, worldName, dialogue, isChatting, chatStates, messageQueue, hasNewQuest, currentZoneCoords, zonePath } = gameState;
  const activePlayer = players[activePlayerId];

  const isGamePaused = !!dialogue || isChatting || !!showCharSheet || !!selectedObject || showInventory || showAbilities || showQuests || showSettings || gameState.isLoading;

  useEffect(() => {
    // Check if all quests *for the current zone* are complete.
    const questsForThisZone = quests.filter(q => {
        // A quest belongs to this zone if the NPC who gives it is in this zone.
        const questGiver = currentZone.npcs.find(npc => npc.quest?.id === q.id);
        return !!questGiver;
    });

    const allCurrentQuestsCompleted = questsForThisZone.length > 0 && questsForThisZone.every(q => q.status === QuestStatus.COMPLETED);

    if (allCurrentQuestsCompleted && !zoneCompleted) { 
      setZoneCompleted(true);
      setGameState(prev => ({...prev, messageQueue: ["You've completed all local quests! A path to a new area has opened."], dmMessage: "You've completed all local quests! A path to a new area has opened."}));
    }
  }, [quests, currentZone.npcs, setGameState, zoneCompleted]);
  
  useEffect(() => {
    if (isGamePaused) {
        return; 
    }

    const moveInterval = setInterval(() => {
        setGameState(prev => {
            const allPlayerPositions = new Set(prev.players.map(p => p ? `${p.position.x},${p.position.y}` : ''));
            const key = `${prev.currentZoneCoords!.x},${prev.currentZoneCoords!.y}`;
            const zoneToUpdate = prev.generatedZones[key];
            if (!zoneToUpdate) return prev;

            const nextNpcs = [...zoneToUpdate.npcs];
            const nextNpcPositions = new Set(nextNpcs.map(n => `${n.position.x},${n.position.y}`));

            for (let i = 0; i < nextNpcs.length; i++) {
                if (Math.random() < 0.3) { // 30% chance to move
                    const npc = nextNpcs[i];
                    const directions = [{dx: 0, dy: -1}, {dx: 0, dy: 1}, {dx: -1, dy: 0}, {dx: 1, dy: 0}];
                    const { dx, dy } = directions[Math.floor(Math.random() * directions.length)];
                    
                    const newX = npc.position.x + dx;
                    const newY = npc.position.y + dy;
                    
                    const isTraversable = 
                        newX >= 0 && newX < zoneToUpdate.tileMap[0].length &&
                        newY >= 0 && newY < zoneToUpdate.tileMap.length &&
                        ['grass', 'path'].includes(zoneToUpdate.tileMap[newY][newX]);
                    
                    const targetKey = `${newX},${newY}`;
                    const isOccupiedByPlayer = allPlayerPositions.has(targetKey);
                    const isOccupiedByNpc = nextNpcPositions.has(targetKey);

                    if (isTraversable && !isOccupiedByPlayer && !isOccupiedByNpc) {
                        const oldKey = `${npc.position.x},${npc.position.y}`;
                        nextNpcPositions.delete(oldKey);
                        nextNpcPositions.add(targetKey);
                        nextNpcs[i] = { ...npc, position: { x: newX, y: newY } };
                    }
                }
            }
            
            return {
                ...prev,
                generatedZones: {
                    ...prev.generatedZones,
                    [key]: { ...zoneToUpdate, npcs: nextNpcs }
                }
            };
        });

    }, 3000); // Attempt to move every 3 seconds

    return () => clearInterval(moveInterval);
  }, [isGamePaused, setGameState]);

  useEffect(() => {
    if (isGamePaused) {
        if (moveIntervalRef.current) {
            clearInterval(moveIntervalRef.current);
            moveIntervalRef.current = null;
        }
        activeMoveKey.current = null;
    }
  }, [isGamePaused]);

  if (!players[0] || !players[1] || !currentZoneCoords) {
    return <div>Loading game...</div>;
  }
  
  const handleMove = useCallback((dx: number, dy: number) => {
    const MOVEMENT_COOLDOWN = 200; // 5 steps per second
    const now = Date.now();
    if (now - lastMoveTimestamp.current < MOVEMENT_COOLDOWN) {
        return;
    }
    lastMoveTimestamp.current = now;

    setGameState(prev => {
        const { players, activePlayerId, isChatting, messageQueue, dialogue, currentZoneCoords, zonePath } = prev;
        
        const activePlayer = players[activePlayerId];
        
        if (!activePlayer || isChatting || (messageQueue && messageQueue.length > 0) || !currentZoneCoords) {
            return prev;
        }

        if (dialogue) {
            const direction = dy === -1 ? 'up' : (dy === 1 ? 'down' : null);
            if (!direction) return prev;

            const menuOptionsCount = 3;
            const newIndex = direction === 'up'
                ? (dialogue.menuSelectionIndex - 1 + menuOptionsCount) % menuOptionsCount
                : (dialogue.menuSelectionIndex + 1) % menuOptionsCount;
            return { ...prev, dialogue: { ...dialogue, menuSelectionIndex: newIndex } };
        }

        let newDirection: Direction = activePlayer.direction;
        if (dy === -1) newDirection = 'up';
        else if (dy === 1) newDirection = 'down';
        else if (dx === -1) newDirection = 'left';
        else if (dx === 1) newDirection = 'right';

        const newX = activePlayer.position.x + dx;
        const newY = activePlayer.position.y + dy;
        
        const otherPlayer = players[(activePlayerId + 1) % 2]!;
        
        // Check for zone transition
        const { entryPosition, exitPosition } = currentZone;
        const currentPathIndex = zonePath.findIndex(p => p.x === currentZoneCoords.x && p.y === currentZoneCoords.y);

        if (zoneCompleted && exitPosition && newX === exitPosition.x && newY === exitPosition.y) {
            if (currentPathIndex < zonePath.length - 1) {
                const nextZoneCoords = zonePath[currentPathIndex + 1];
                onZoneTransition(nextZoneCoords, currentZoneCoords);
                return prev; // Stop further processing, let transition handler take over
            } else {
                 return {...prev, dialogue: null, dmMessage: "You've reached the final area! The adventure concludes for now."};
            }
        }
        
        if (entryPosition && newX === entryPosition.x && newY === entryPosition.y) {
            if (currentPathIndex > 0) {
                const prevZoneCoords = zonePath[currentPathIndex - 1];
                onZoneTransition(prevZoneCoords, currentZoneCoords);
                return prev; // Stop further processing
            }
        }

        const isTraversable = 
          newX >= 0 && newX < currentZone.tileMap[0].length &&
          newY >= 0 && newY < currentZone.tileMap.length &&
          ['grass', 'path'].includes(currentZone.tileMap[newY][newX]);
          
        const isNpcBlocking = currentZone.npcs.some(npc => npc.position.x === newX && npc.position.y === newY);
        const isPlayerBlocking = otherPlayer.position.x === newX && otherPlayer.position.y === newY;

        if (isTraversable && !isNpcBlocking && !isPlayerBlocking) {
            const newPlayers = [...prev.players] as [Player, Player];
            newPlayers[activePlayerId] = {
              ...newPlayers[activePlayerId]!,
              position: { x: newX, y: newY },
              direction: newDirection,
            };
            return { ...prev, players: newPlayers };
        } else {
            const newPlayers = [...prev.players] as [Player, Player];
            newPlayers[activePlayerId]! = { ...newPlayers[activePlayerId]!, direction: newDirection };
            return { ...prev, players: newPlayers };
        }
    });
  }, [setGameState, zoneCompleted, currentZone, onZoneTransition]);

  const switchPlayer = () => {
    if (dialogue || isChatting || (messageQueue && messageQueue.length > 0)) return;
    setGameState(prev => ({...prev, activePlayerId: (prev.activePlayerId + 1) % 2}));
  }
  
  const completeQuestAndApplyRewards = useCallback((quest: Quest) => {
    setGameState(prev => {
        const activePlayer = prev.players[prev.activePlayerId];
        if (!activePlayer) return prev;

        const newQuests = prev.quests.map(q => q.id === quest.id ? {...q, status: QuestStatus.COMPLETED} : q);
        const activePlayerInventory = activePlayer.inventory.filter(item => item.id !== quest.objective.itemId);
        
        const levelUpSummary: string[] = [];
        
        const updatedPlayers = prev.players.map((p, index) => {
            if (!p) return null;
            let updatedPlayer = { ...p };
            
            if (index === prev.activePlayerId) {
                updatedPlayer.inventory = activePlayerInventory;
            }

            updatedPlayer.stats = { ...updatedPlayer.stats, xp: updatedPlayer.stats.xp + quest.xpReward };
            
            while (updatedPlayer.stats.xp >= updatedPlayer.stats.nextLevelXp) {
                updatedPlayer = levelUp(updatedPlayer);
                levelUpSummary.push(`${updatedPlayer.name} leveled up to level ${updatedPlayer.stats.level}!`);
            }
            return updatedPlayer;
        }) as [Player, Player];
        
        let summaryMessage = `Quest Complete: ${quest.title}! Both players gained ${quest.xpReward} XP.`;
        if (levelUpSummary.length > 0) {
            summaryMessage += ` ${levelUpSummary.join(' ')}`;
        }

        return {
            ...prev,
            players: updatedPlayers,
            quests: newQuests,
            dialogue: null,
            dmMessage: summaryMessage,
        };
    });
  }, [setGameState]);

  const handleDialogueAction = useCallback(async (action: 'talk' | 'chat' | 'close') => {
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
  }, [activePlayer, chatStates, completeQuestAndApplyRewards, currentZone.description, dialogue, mainStoryline, quests, setGameState, worldName]);

  const handleInteract = useCallback(() => {
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
    
    setGameState(prev => {
        if (!currentZoneCoords) return prev;
        const key = `${currentZoneCoords.x},${currentZoneCoords.y}`;
        const zoneToUpdate = prev.generatedZones[key];

        const activePlayer = prev.players[prev.activePlayerId];
        if (!activePlayer || !zoneToUpdate) return prev;

        const itemOnTile = zoneToUpdate.items.find(item => item.position?.x === activePlayer.position.x && item.position?.y === activePlayer.position.y);
        if (itemOnTile) {
            if(activePlayer.inventory.length >= 16) {
                return {...prev, dmMessage: "Your inventory is full!"};
            }
            const newInventory = [...activePlayer.inventory, { ...itemOnTile, position: undefined }];
            const newItemsOnMap = zoneToUpdate.items.filter(item => item.id !== itemOnTile.id);

            const newPlayers = [...prev.players] as [Player, Player];
            newPlayers[prev.activePlayerId] = { ...newPlayers[prev.activePlayerId], inventory: newInventory };
            
            const newGeneratedZones = { ...prev.generatedZones, [key]: { ...zoneToUpdate, items: newItemsOnMap } };

            return {
                ...prev,
                players: newPlayers,
                generatedZones: newGeneratedZones,
                dmMessage: `You picked up: ${itemOnTile.emoji} ${itemOnTile.name}.`
            };
        }

        const { x, y } = activePlayer.position;
        const { direction } = activePlayer;
        let targetX = x;
        let targetY = y;
        if (direction === 'up') targetY--;
        if (direction === 'down') targetY++;
        if (direction === 'left') targetX--;
        if (direction === 'right') targetX++;

        const targetNpc = zoneToUpdate.npcs.find(npc => npc.position.x === targetX && npc.position.y === targetY);
        if (targetNpc?.quest) {
            const questInState = prev.quests.find(q => q.id === targetNpc.quest!.id);

            if (questInState?.status === QuestStatus.INACTIVE) {
                const newQuests = prev.quests.map(q => q.id === questInState.id ? {...q, status: QuestStatus.ACTIVE} : q);
                
                let newItemsOnMap = [...zoneToUpdate.items];
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
                
                const newGeneratedZones = { ...prev.generatedZones, [key]: { ...zoneToUpdate, items: newItemsOnMap } };
                
                return {
                    ...prev,
                    quests: newQuests,
                    generatedZones: newGeneratedZones,
                    dialogue: newDialogueState,
                    dmMessage: `Quest Started: ${questInState.title}!`,
                    hasNewQuest: true,
                };
            } else if (questInState?.status === QuestStatus.ACTIVE) {
                const hasItem = activePlayer.inventory.some(item => item.id === questInState.objective.itemId);
                if (hasItem) {
                    const newDialogueState: DialogueState = {
                        npc: targetNpc,
                        currentText: questInState.completionDialogue,
                        menuSelectionIndex: 0,
                    };
                    return { ...prev, dialogue: newDialogueState };
                } else {
                    const newDialogueState: DialogueState = {
                        npc: targetNpc,
                        currentText: `You don't have the ${questInState.objective.itemName} yet.`,
                        menuSelectionIndex: 0,
                    };
                    return {...prev, dialogue: newDialogueState};
                }
            } else { // Quest is COMPLETED
                const newDialogueState: DialogueState = {
                    npc: targetNpc,
                    currentText: targetNpc.initialDialogue,
                    menuSelectionIndex: 0,
                };
                return {...prev, dialogue: newDialogueState};
            }
        } else if (targetNpc) {
            const newDialogueState: DialogueState = {
                npc: targetNpc,
                currentText: targetNpc.initialDialogue,
                menuSelectionIndex: 0,
            };
            return { ...prev, dialogue: newDialogueState };
        }
        return prev;
    });
  }, [messageQueue, activePlayer, isChatting, dialogue, setGameState, handleDialogueAction, currentZoneCoords]);
  
  const handleSendChatMessage = async (message: string) => {
    if (!dialogue || !activeChatSession) return;
    const npcName = dialogue.npc.name;
    
    const currentMessagesSent = chatStates[npcName]?.messagesSent || 0;
    if (currentMessagesSent >= 5) return;

    setGameState(prev => ({ ...prev, isLoading: true }));
    const playerMessage = { author: 'player' as const, text: message };
    
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
  
  const handleCloseChat = useCallback(() => {
    setGameState(prev => ({...prev, isChatting: false }));
  }, [setGameState]);

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

  const handleBack = useCallback(() => {
    if (isChatting) {
        handleCloseChat();
    } else if (dialogue) {
        handleDialogueAction('close');
    }
  }, [isChatting, dialogue, handleCloseChat, handleDialogueAction]);

  const handleQuestsClick = () => {
    setShowQuests(true);
    if (hasNewQuest) {
        setGameState(prev => ({ ...prev, hasNewQuest: false }));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isChatting) {
        return;
      }

      const key = e.key.toLowerCase();
      setPressedKeys(prev => new Set(prev).add(key));

      if (dialogue) {
        if (key === 'w') {
          e.preventDefault();
          handleMove(0, -1);
        } else if (key === 's') {
          e.preventDefault();
          handleMove(0, 1);
        } else if (key === 'e') {
          e.preventDefault();
          handleInteract();
        } else if (key === 'r') {
          e.preventDefault();
          handleBack();
        }
        return;
      }
      
      if (isGamePaused) return;

      const moveDirections: { [key: string]: [number, number] } = {
        'w': [0, -1], 'a': [-1, 0], 's': [0, 1], 'd': [1, 0],
      };

      if (moveDirections[key]) {
        e.preventDefault();
        if (key !== activeMoveKey.current) {
          if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
          
          activeMoveKey.current = key;
          const [dx, dy] = moveDirections[key];
          
          handleMove(dx, dy);
          
          moveIntervalRef.current = setInterval(() => {
            handleMove(dx, dy);
          }, 50);
        }
      } else if (key === 'e') {
        e.preventDefault();
        handleInteract();
      } else if (key === 'r') {
        e.preventDefault();
        handleBack();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setPressedKeys(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });

      if (key === activeMoveKey.current) {
        if (moveIntervalRef.current) {
          clearInterval(moveIntervalRef.current);
          moveIntervalRef.current = null;
        }
        activeMoveKey.current = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current);
      }
    };
  }, [isGamePaused, dialogue, isChatting, handleMove, handleInteract, handleBack]);

  const isNpc = selectedObject && 'role' in selectedObject;
  const isItem = selectedObject && !('role' in selectedObject);
  const currentNpcChatState = (dialogue && chatStates[dialogue.npc.name]) || { history: [], messagesSent: 0 };
  
  const hasActiveMessageQueue = !!messageQueue && messageQueue.length > 0;
  const isDPadDisabled = isChatting || hasActiveMessageQueue || gameState.isLoading;
  const arePanelButtonsDisabled = isChatting || hasActiveMessageQueue || !!dialogue || gameState.isLoading;
  const isSwitchPlayerDisabled = isChatting || hasActiveMessageQueue || !!dialogue || gameState.isLoading;
  const isBackButtonDisabled = isChatting;
  const areControlsDimmed = isChatting || gameState.isLoading;

  return (
    <div className="flex flex-col h-full w-full">
      {showCharSheet && <CharacterSheetModal player={showCharSheet} onClose={() => setShowCharSheet(null)} />}
      {isNpc && <NpcInfoModal npc={selectedObject as NPC} onClose={() => setSelectedObject(null)} />}
      {isItem && <ItemInfoModal item={selectedObject as Item} quest={quests.find(q => q.objective.itemId === (selectedObject as Item).id)} onClose={() => setSelectedObject(null)} />}
      {showInventory && activePlayer && <InventoryModal player={activePlayer} onClose={() => setShowInventory(false)} />}
      {showAbilities && activePlayer && <AbilitiesModal player={activePlayer} onClose={() => setShowAbilities(false)} />}
      {showQuests && <QuestsModal mainStory={mainStoryline} quests={quests} worldName={worldName} onClose={() => setShowQuests(false)} />}
      {showSettings && (
        <SettingsModal 
            onClose={() => setShowSettings(false)}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            onEndGame={endGame}
        />
      )}
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
      
      <div className="flex-shrink-0 flex justify-around items-center mb-2">
          <button disabled={areControlsDimmed} onClick={() => setShowCharSheet(players[0])} className={`px-2 py-1 text-[10px] bg-green-700 rounded ${activePlayerId === 0 ? 'ring-2 ring-white' : ''} disabled:opacity-50`}>{players[0]!.name} Lvl {players[0]!.stats.level}</button>
          <button onClick={switchPlayer} disabled={isSwitchPlayerDisabled} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 border-b-2 border-blue-800 active:border-b-0 disabled:opacity-50 text-base">
              🔄
          </button>
          <button disabled={areControlsDimmed} onClick={() => setShowCharSheet(players[1])} className={`px-2 py-1 text-[10px] bg-purple-700 rounded ${activePlayerId === 1 ? 'ring-2 ring-white' : ''} disabled:opacity-50`}>{players[1]!.name} Lvl {players[1]!.stats.level}</button>
      </div>
      
      <div className="flex-grow flex items-center justify-center overflow-hidden relative">
        <MapView 
            zone={currentZone} 
            players={players as [Player, Player]} 
            activePlayerId={activePlayerId}
            onSelectObject={setSelectedObject}
            exitPosition={zoneCompleted ? currentZone.exitPosition : null}
            entryPosition={currentZone.entryPosition}
        />
      </div>

      <div className="flex-shrink-0">
        <Controls 
          onMove={handleMove} 
          onInteract={handleInteract} 
          onBack={handleBack}
          onInventoryClick={() => setShowInventory(true)}
          onAbilitiesClick={() => setShowAbilities(true)}
          onQuestsClick={handleQuestsClick}
          onSettingsClick={() => setShowSettings(true)}
          isDPadDisabled={isDPadDisabled}
          arePanelButtonsDisabled={arePanelButtonsDisabled}
          isBackButtonDisabled={isBackButtonDisabled}
          areControlsDimmed={areControlsDimmed}
          hasNewQuest={hasNewQuest}
          pressedKeys={pressedKeys}
        />
      </div>
    </div>
  );
};

export default GameScreen;
