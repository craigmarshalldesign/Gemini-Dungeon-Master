
import React, { useState, useEffect } from 'react';
import type { GameState, Player, Direction, NPC, Item, Quest } from '../types';
import { QuestStatus, ClassType } from '../types';
import MapView from './MapView';
import Controls from './Controls';
import CharacterSheetModal from './CharacterSheetModal';
import InventoryModal from './InventoryModal';
import AbilitiesModal from './AbilitiesModal';
import QuestsModal from './QuestsModal';
import NpcInfoModal from './NpcInfoModal';
import ItemInfoModal from './ItemInfoModal';
import { CHARACTER_CLASSES } from '../constants';

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

  const { players, currentZone, activePlayerId, quests, mainStoryline, worldName } = gameState;
  const activePlayer = players[activePlayerId];

  useEffect(() => {
    const allQuestsCompleted = quests.length > 0 && quests.every(q => q.status === QuestStatus.COMPLETED);

    if (allQuestsCompleted && !zoneCompleted) { 
      setZoneCompleted(true);
      setGameState(prev => ({...prev, dmMessage: "You've completed all local quests! A path to a new area has opened."}));
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
    if (!activePlayer) return;

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
       setGameState(prev => ({...prev, dmMessage: "You've found the exit! For now, your journey in this area is complete. (More zones coming soon!)"}));
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
    setGameState(prev => ({...prev, activePlayerId: (prev.activePlayerId + 1) % 2}));
  }

  const handleInteract = () => {
    if (!activePlayer) return;

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
          dmMessage: `You picked up: ${itemOnTile.name}.`
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

            setGameState(prev => ({
                ...prev,
                quests: newQuests,
                currentZone: { ...prev.currentZone!, items: newItemsOnMap },
                dmMessage: `Quest Started: ${questInState.title}! ${targetNpc.name} says: "${questInState.description}"`
            }));
        } else if (questInState?.status === QuestStatus.ACTIVE) {
            const hasItem = activePlayer.inventory.some(item => item.id === questInState.objective.itemId);
            if (hasItem) {
                setGameState(prev => {
                    const newQuests = prev.quests.map(q => q.id === questInState.id ? {...q, status: QuestStatus.COMPLETED} : q);
                    const activePlayerInventory = prev.players[activePlayerId]!.inventory.filter(item => item.id !== questInState.objective.itemId);

                    let levelUpMessages: string[] = [];

                    const updatedPlayers = prev.players.map((p, index) => {
                        if (!p) return null;
                        let updatedPlayer = { ...p };
                        
                        if (index === activePlayerId) {
                            updatedPlayer.inventory = activePlayerInventory;
                        }

                        updatedPlayer.stats = { ...updatedPlayer.stats, xp: updatedPlayer.stats.xp + questInState.xpReward };
                        
                        if (updatedPlayer.stats.xp >= updatedPlayer.stats.nextLevelXp) {
                            updatedPlayer = levelUp(updatedPlayer);
                            levelUpMessages.push(`${updatedPlayer.name} leveled up to level ${updatedPlayer.stats.level}!`);
                        }
                        return updatedPlayer;
                    }) as [Player, Player];

                    let dmMessage = `Quest Complete: ${questInState.title}! Both players gained ${questInState.xpReward} XP.`;
                    if (levelUpMessages.length > 0) {
                        dmMessage += ` ${levelUpMessages.join(' ')}`;
                    }

                    return {...prev, players: updatedPlayers, quests: newQuests, dmMessage }
                });
            } else {
                 setGameState(prev => ({...prev, dmMessage: `${targetNpc.name} says: "You don't have the ${questInState.objective.itemName} yet."`}));
            }
        } else {
            setGameState(prev => ({...prev, dmMessage: `${targetNpc.name} has nothing more to say about that.`}));
        }
    } else if (targetNpc) {
        setGameState(prev => ({...prev, dmMessage: `${targetNpc.name} says: "Greetings, traveler."`}));
    }
  };
  
  const isNpc = selectedObject && 'role' in selectedObject;
  const isItem = selectedObject && !('role' in selectedObject);

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
      {showCharSheet && <CharacterSheetModal player={showCharSheet} onClose={() => setShowCharSheet(null)} />}
      {isNpc && <NpcInfoModal npc={selectedObject as NPC} onClose={() => setSelectedObject(null)} />}
      {isItem && <ItemInfoModal item={selectedObject as Item} quest={quests.find(q => q.objective.itemId === (selectedObject as Item).id)} onClose={() => setSelectedObject(null)} />}
      {showInventory && activePlayer && <InventoryModal player={activePlayer} onClose={() => setShowInventory(false)} />}
      {showAbilities && activePlayer && <AbilitiesModal player={activePlayer} onClose={() => setShowAbilities(false)} />}
      {showQuests && <QuestsModal mainStory={mainStoryline} quests={quests} worldName={worldName} onClose={() => setShowQuests(false)} />}
      
      <div className="flex flex-col items-center">
        <div className="flex gap-4 mb-2">
            <button onClick={() => setShowCharSheet(players[0])} className="px-3 py-1 bg-green-700 rounded">{players[0].name}</button>
            <button onClick={() => setShowCharSheet(players[1])} className="px-3 py-1 bg-purple-700 rounded">{players[1].name}</button>
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
        onInventoryClick={() => setShowInventory(true)}
        onAbilitiesClick={() => setShowAbilities(true)}
        onQuestsClick={() => setShowQuests(true)}
        activePlayerName={activePlayer.name}
      />
    </div>
  );
};

export default GameScreen;