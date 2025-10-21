
import React, { useState, useCallback } from 'react';
import type { GameState, Player, Zone, Item, Quest, ZoneMap } from './types';
import { GameStatus, ClassType, QuestStatus } from './types';
import { generateWorld, generateZone } from './services/geminiService';
import { CHARACTER_CLASSES } from './constants';
import GameCreationScreen from './components/GameCreationScreen';
import CharacterCreationScreen from './components/CharacterCreationScreen';
import GameScreen from './components/GameScreen';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    status: GameStatus.WORLD_CREATION,
    worldName: '',
    mainStoryline: '',
    dmMessage: 'Welcome, adventurer. A new world awaits your story.',
    players: [null, null],
    worldMap: null,
    currentZone: null,
    dialogue: null,
    activePlayerId: 0,
    isLoading: false,
    error: null,
    quests: [],
  });

  const handleWorldCreate = useCallback(async (prompt: string) => {
    setGameState(prev => ({ ...prev, isLoading: true, error: null, dmMessage: 'The cosmos stirs... a new world is being born...' }));
    try {
      const worldData = await generateWorld(prompt);
      const zoneData = await generateZone(worldData.startingZoneDescription, worldData.worldName, worldData.mainStoryline);
      
      const activeQuests: Quest[] = [];

      zoneData.npcs.forEach(npc => {
        if (npc.quest) {
          activeQuests.push(npc.quest);
        }
      });

      const startingZone: Zone = {
        description: worldData.startingZoneDescription,
        tileMap: zoneData.tileMap,
        npcs: zoneData.npcs,
        items: [], // Quest items will be spawned when quests are accepted
        exitPosition: zoneData.exitPosition,
      };

      setGameState(prev => ({
        ...prev,
        status: GameStatus.CHARACTER_CREATION,
        worldName: worldData.worldName,
        mainStoryline: worldData.mainStoryline,
        worldMap: worldData.worldMap,
        currentZone: startingZone,
        quests: activeQuests,
        dmMessage: `Welcome to ${worldData.worldName}. The story is: ${worldData.mainStoryline}`,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setGameState(prev => ({ ...prev, error: errorMessage, dmMessage: 'The creation failed. The ether is unstable. Try again.' }));
    } finally {
      setGameState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const handleCharactersCreate = useCallback((player1Name: string, player1Class: ClassType, player2Name: string, player2Class: ClassType) => {
    
    // Find safe spawn points from the current zone map
    const findSafeSpawnPoints = (tileMap: ZoneMap): [{x:number, y:number}, {x:number, y:number}] => {
        const isSafe = (x: number, y: number) => {
            return y >= 0 && y < tileMap.length && x >= 0 && x < tileMap[0].length && ['grass', 'path'].includes(tileMap[y][x]);
        }

        for (let y = 0; y < tileMap.length; y++) {
            for (let x = 0; x < tileMap[0].length; x++) {
                // Check for horizontal pair
                if (isSafe(x, y) && isSafe(x + 1, y)) {
                    return [{ x, y }, { x: x + 1, y }];
                }
                // Check for vertical pair
                if (isSafe(x, y) && isSafe(x, y + 1)) {
                    return [{ x, y }, { x, y: y + 1 }];
                }
            }
        }
        // Fallback if no adjacent safe spots are found (should be rare)
        return [{ x: 1, y: 1 }, { x: 1, y: 2 }];
    };

    setGameState(prev => {
      if (!prev.currentZone) return prev; // Should not happen

      const [pos1, pos2] = findSafeSpawnPoints(prev.currentZone.tileMap);
      
      const createPlayer = (id: number, name: string, classType: ClassType, position: {x: number, y: number}): Player => {
        const charClass = CHARACTER_CLASSES[classType];
        return {
          id,
          name,
          classType,
          stats: { ...charClass.baseStats },
          abilities: charClass.abilities.filter(a => a.level <= 1),
          position: position,
          direction: 'down',
          inventory: [],
        };
      };

      const player1 = createPlayer(0, player1Name, player1Class, pos1);
      const player2 = createPlayer(1, player2Name, player2Class, pos2);

      return {
        ...prev,
        players: [player1, player2],
        status: GameStatus.PLAYING,
        dmMessage: `${player1.name} the ${player1.classType} and ${player2.name} the ${player2.classType} begin their adventure!`
      }
    });
  }, []);

  const renderContent = () => {
    switch (gameState.status) {
      case GameStatus.WORLD_CREATION:
        return <GameCreationScreen onCreate={handleWorldCreate} isLoading={gameState.isLoading} error={gameState.error} />;
      case GameStatus.CHARACTER_CREATION:
        return <CharacterCreationScreen onCreate={handleCharactersCreate} isLoading={gameState.isLoading} />;
      case GameStatus.PLAYING:
        return <GameScreen gameState={gameState} setGameState={setGameState} />;
      default:
        return <div>Unknown game state!</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl border-4 border-gray-600 bg-gray-800 p-2 shadow-lg">
          <h1 className="text-2xl md:text-3xl text-center mb-2 text-green-400 tracking-widest">{gameState.worldName || 'Gemini Dungeon Master'}</h1>
          <div className="bg-black text-green-300 p-4 border-2 border-green-500 min-h-[6rem] text-sm md:text-base mb-4 whitespace-pre-wrap">
            <p><strong>DM:</strong> {gameState.dmMessage}</p>
          </div>
          {renderContent()}
      </div>
    </div>
  );
};

export default App;