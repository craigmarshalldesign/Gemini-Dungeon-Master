import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { GameState, Player, Zone, Quest, WorldMap, WorldMapZone } from './types';
import { GameStatus, ClassType, QuestStatus } from './types';
import { generateWorld } from './services/worldService';
import { generateZoneLayout, populateZone } from './services/zoneService';
import { CHARACTER_CLASSES } from './constants';
import { testWorldData } from './testWorldData';
import GameCreationScreen from './components/GameCreationScreen';
import CharacterCreationScreen from './components/CharacterCreationScreen';
import GameScreen from './components/GameScreen';
import DialogueMenu from './components/DialogueMenu';
import ErrorModal from './components/ErrorModal';

const initialGameState: GameState = {
  status: GameStatus.WORLD_CREATION,
  worldName: '',
  mainStoryline: '',
  dmMessage: 'Welcome, adventurer. A new world awaits your story.',
  players: [null, null],
  worldMap: null,
  zonePath: [],
  finalBossZoneCoords: null,
  generatedZones: {},
  currentZoneCoords: null,
  dialogue: null,
  isChatting: false,
  chatStates: {},
  activePlayerId: 0,
  isLoading: false,
  loadingProgress: 0,
  loadingMessage: '',
  error: null,
  quests: [],
  messageQueue: null,
  hasNewQuest: false,
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenWrapperRef = useRef<HTMLDivElement>(null);

  const handleFullscreenChange = useCallback(() => {
    setIsFullscreen(!!document.fullscreenElement);
  }, []);

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [handleFullscreenChange]);

  const toggleFullscreen = useCallback(async () => {
    if (!fullscreenWrapperRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await fullscreenWrapperRef.current.requestFullscreen();
        if ((window.screen?.orientation as any)?.lock) {
          await (window.screen.orientation as any).lock('portrait').catch((err: any) => console.warn("Screen orientation lock failed:", err));
        }
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      const error = err as Error;
      console.error(`Fullscreen API error: ${error.message} (${error.name})`);
      setGameState(prev => ({...prev, error: 'Fullscreen mode is not supported by your browser or was denied.'}));
    }
  }, []);

  const handleEndGame = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => {
        const error = err as Error;
        console.error(`Error exiting fullscreen: ${error.message} (${error.name})`);
      });
    }
    setGameState(initialGameState);
  }, []);

  const handleClearError = () => {
    setGameState(prev => ({ ...prev, error: null }));
  };
  
  const getZoneFromCoords = (state: GameState, coords: { x: number; y: number }): Zone | null => {
      const key = `${coords.x},${coords.y}`;
      return state.generatedZones[key] || null;
  }

  const handleWorldCreate = useCallback(async (prompt: string) => {
    setGameState(prev => ({ 
        ...prev, 
        isLoading: true, 
        error: null, 
        dmMessage: 'The cosmos stirs... a new world is being born...',
        loadingProgress: 0,
        loadingMessage: 'Imagining a new world...'
    }));
    
    try {
      // Step 1: Generate the core world narrative and map structure
      const worldData = await generateWorld(prompt);
      setGameState(prev => ({ ...prev, loadingProgress: 33, loadingMessage: 'Drawing the landscape...' }));
      
      const startingCoords = worldData.zonePath[0];
      const startingZoneConcept = worldData.worldMap[startingCoords.y][startingCoords.x];
      
      // Step 2: Generate the layout for the starting zone
      const layoutData = await generateZoneLayout(startingZoneConcept.name, startingZoneConcept.terrain);
      setGameState(prev => ({ ...prev, loadingProgress: 66, loadingMessage: 'Breathing life into the world...' }));

      // Step 3: Populate the starting zone
      const populationData = await populateZone(
          worldData.worldName, 
          worldData.mainStoryline, 
          layoutData.tileMap,
          true, // isStartingZone
          null, // previousZoneDescription
          worldData.zonePath.length > 1 // hasNextZone
      );
      setGameState(prev => ({ ...prev, loadingProgress: 95, loadingMessage: 'Finalizing details...' }));
      
      const activeQuests: Quest[] = populationData.npcs.reduce((acc: Quest[], npc) => {
          if (npc.quest) acc.push(npc.quest);
          return acc;
      }, []);

      const startingZone: Zone = {
        name: layoutData.zoneName,
        description: `${startingZoneConcept.name} (${startingZoneConcept.terrain})`,
        tileMap: layoutData.tileMap,
        npcs: populationData.npcs,
        items: [],
        entryPosition: null, // First zone has no entry
        exitPosition: populationData.exitPosition,
        initialSpawnPoints: populationData.initialSpawnPoints,
      };
      
      const startingZoneKey = `${startingCoords.x},${startingCoords.y}`;

      setGameState(prev => ({
        ...prev,
        status: GameStatus.CHARACTER_CREATION,
        worldName: worldData.worldName,
        mainStoryline: worldData.mainStoryline,
        worldMap: worldData.worldMap,
        zonePath: worldData.zonePath,
        finalBossZoneCoords: worldData.finalBossZoneCoords,
        generatedZones: { [startingZoneKey]: startingZone },
        currentZoneCoords: startingCoords,
        quests: activeQuests,
        dmMessage: `Welcome to ${worldData.worldName}. The story is: ${worldData.mainStoryline}`,
        isLoading: false,
      }));
    } catch (error) {
      console.error("World/Zone generation failed:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setGameState(prev => ({ ...initialGameState, error: errorMessage, dmMessage: 'The creation failed. The ether is unstable. Try again.' }));
    }
  }, []);

  const handleStartTestWorld = useCallback(() => {
    // This function now sets up a mock world structure for testing purposes.
    setGameState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      dmMessage: 'Loading the Test World...',
      loadingProgress: 50,
      loadingMessage: 'Assembling test data...'
    }));

    setTimeout(() => {
        const testZone: Zone = {
            name: testWorldData.zoneName,
            description: testWorldData.startingZoneDescription,
            tileMap: testWorldData.tileMap,
            npcs: testWorldData.npcs,
            items: [],
            exitPosition: testWorldData.exitPosition,
            entryPosition: null,
            initialSpawnPoints: testWorldData.playerSpawnPoints,
        };
        
        const worldMap: WorldMap = Array.from({ length: 6 }, (_, y) =>
            Array.from({ length: 6 }, (_, x) => ({
                name: x === 0 && y === 0 ? testWorldData.zoneName : 'Unknown Area',
                terrain: x === 0 && y === 0 ? 'grass' : 'tree',
                x, y,
            }))
        );

        setGameState(prev => ({
            ...prev,
            status: GameStatus.CHARACTER_CREATION,
            worldName: testWorldData.worldName,
            mainStoryline: testWorldData.mainStoryline,
            worldMap: worldMap,
            zonePath: [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}], // Mock path
            finalBossZoneCoords: {x: 5, y: 5},
            generatedZones: { '0,0': testZone },
            currentZoneCoords: {x: 0, y: 0},
            quests: testWorldData.npcs.reduce((acc: Quest[], npc) => {
                if (npc.quest) acc.push(npc.quest);
                return acc;
            }, []),
            dmMessage: `Welcome to the test world: ${testWorldData.worldName}.`,
            isLoading: false,
        }));
    }, 500);
  }, []);

  const handleCharactersCreate = useCallback((player1Name: string, player1Class: ClassType, player2Name: string, player2Class: ClassType) => {
    setGameState(prev => {
      if (!prev.currentZoneCoords) return prev;
      
      const currentZone = getZoneFromCoords(prev, prev.currentZoneCoords);
      if (!currentZone || !currentZone.initialSpawnPoints) return prev;

      const [pos1, pos2] = currentZone.initialSpawnPoints;
      
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
        dmMessage: `${player1.name} the ${player1.classType} and ${player2.name} the ${player2.classType} begin their adventure in ${currentZone.name}!`
      }
    });
  }, []);
  
  const handleZoneTransition = useCallback(async (targetCoords: { x: number; y: number }, cameFromCoords: { x: number; y: number }) => {
    let finalState: GameState;
    
    setGameState(prev => {
        finalState = prev;
        return { ...prev, isLoading: true, loadingMessage: 'Traveling to a new zone...' }
    });

    try {
        let targetZone = getZoneFromCoords(finalState!, targetCoords);
        let newQuests = finalState!.quests;

        if (!targetZone) {
            // Zone needs to be generated
            const { worldMap, zonePath, worldName, mainStoryline } = finalState!;
            if (!worldMap || !worldName || !mainStoryline) throw new Error("World state is missing for zone generation.");

            const zoneConcept = worldMap[targetCoords.y][targetCoords.x];
            const prevZoneConcept = worldMap[cameFromCoords.y][cameFromCoords.x];
            
            setGameState(prev => ({...prev, loadingProgress: 33, loadingMessage: 'Drawing the landscape...'}));
            const layoutData = await generateZoneLayout(zoneConcept.name, zoneConcept.terrain);

            const currentIndex = zonePath.findIndex(p => p.x === targetCoords.x && p.y === targetCoords.y);
            const hasNextZone = currentIndex < zonePath.length - 1;

            setGameState(prev => ({...prev, loadingProgress: 66, loadingMessage: 'Breathing life into the world...'}));
            const populationData = await populateZone(
                worldName, mainStoryline, layoutData.tileMap, false,
                `${prevZoneConcept.name} (${prevZoneConcept.terrain})`,
                hasNextZone
            );
            
            const zoneQuests: Quest[] = populationData.npcs.reduce((acc: Quest[], npc) => {
                if (npc.quest) acc.push(npc.quest);
                return acc;
            }, []);
            newQuests = [...finalState!.quests, ...zoneQuests];

            targetZone = {
                name: layoutData.zoneName,
                description: `${zoneConcept.name} (${zoneConcept.terrain})`,
                tileMap: layoutData.tileMap,
                npcs: populationData.npcs,
                items: [],
                entryPosition: populationData.entryPosition,
                exitPosition: populationData.exitPosition,
            };

            const targetZoneKey = `${targetCoords.x},${targetCoords.y}`;
             setGameState(prev => {
                const updatedZones = { ...prev.generatedZones, [targetZoneKey]: targetZone! };
                finalState = { ...prev, generatedZones: updatedZones, quests: newQuests };
                return { ...prev, generatedZones: updatedZones, quests: newQuests };
            });
        }

        // Transition players to the new zone
        setGameState(prev => {
            const currentPathIndex = prev.zonePath.findIndex(p => p.x === cameFromCoords.x && p.y === cameFromCoords.y);
            const targetPathIndex = prev.zonePath.findIndex(p => p.x === targetCoords.x && p.y === targetCoords.y);

            let spawnPosition: { x: number; y: number } | null = null;
            if (targetPathIndex > currentPathIndex) {
                // Moving forward
                spawnPosition = targetZone!.entryPosition;
            } else {
                // Moving backward
                spawnPosition = targetZone!.exitPosition;
            }

            if (!spawnPosition) {
                console.error("Could not determine spawn position in new zone.");
                // Fallback to center
                spawnPosition = { x: 10, y: 10 };
            }
            
            const newPlayers: [Player, Player] = [
                { ...prev.players[0]!, position: spawnPosition },
                { ...prev.players[1]!, position: { x: spawnPosition.x + 1, y: spawnPosition.y } }
            ];

            return {
                ...prev,
                currentZoneCoords: targetCoords,
                players: newPlayers,
                isLoading: false,
                loadingProgress: 0,
                loadingMessage: '',
                dmMessage: `You have arrived in ${targetZone!.name}.`
            };
        });

    } catch (error) {
        console.error("Zone transition failed:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        setGameState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
    }
}, []);


  const handleStartGame = useCallback((p1Name: string, p1Class: ClassType, p2Name: string, p2Class: ClassType) => {
    handleCharactersCreate(p1Name, p1Class, p2Name, p2Class);
    toggleFullscreen();
  }, [handleCharactersCreate, toggleFullscreen]);

  const renderContent = () => {
    switch (gameState.status) {
      case GameStatus.WORLD_CREATION:
        return <GameCreationScreen 
            onCreate={handleWorldCreate} 
            onStartTest={handleStartTestWorld}
            isLoading={gameState.isLoading} 
            error={gameState.error}
            loadingProgress={gameState.loadingProgress}
            loadingMessage={gameState.loadingMessage}
        />;
      case GameStatus.CHARACTER_CREATION:
        if (!gameState.currentZoneCoords) {
          return <div className="flex items-center justify-center h-full">Loading world data...</div>;
        }
        return <CharacterCreationScreen onCreate={handleStartGame} isLoading={gameState.isLoading} />;
      case GameStatus.PLAYING:
        if (!gameState.currentZoneCoords) {
          return <div className="flex items-center justify-center h-full">Error: No active zone.</div>;
        }
        const currentZone = getZoneFromCoords(gameState, gameState.currentZoneCoords);
        if (!currentZone) return <div className="flex items-center justify-center h-full">Loading zone...</div>;
        return <GameScreen 
            gameState={gameState}
            currentZone={currentZone}
            setGameState={setGameState} 
            isFullscreen={isFullscreen}
            toggleFullscreen={toggleFullscreen}
            endGame={handleEndGame}
            onZoneTransition={handleZoneTransition}
        />;
      default:
        return <div>Unknown game state!</div>;
    }
  };

  const getDmMessage = () => {
    if (gameState.messageQueue && gameState.messageQueue.length > 0) {
        return `${gameState.messageQueue[0]} (A to continue)`;
    }
    if (gameState.dialogue) {
      const npcName = gameState.dialogue.npc.name;
      if (gameState.isLoading && !gameState.isChatting) {
        return `${npcName} is thinking...`;
      }
      return `${npcName}: "${gameState.dialogue.currentText}"`;
    }
    return gameState.dmMessage;
  }
  
  const isCharacterCreation = gameState.status === GameStatus.CHARACTER_CREATION;
  
  const dmBoxHeight = isCharacterCreation
    ? ''
    : gameState.status === GameStatus.PLAYING 
    ? 'h-32' 
    : 'h-20';
  
  const dmBoxOverflow = isCharacterCreation ? '' : 'overflow-y-auto';

  const contentOverflow = gameState.status === GameStatus.PLAYING ? 'overflow-hidden' : 'overflow-y-auto';
  
  const containerMaxWidth = gameState.status === GameStatus.PLAYING ? 'md:max-w-sm' : 'md:max-w-xl';

  return (
    <div ref={fullscreenWrapperRef} className="min-h-screen bg-gray-900 text-white flex flex-col md:items-center md:justify-center font-sans">
      <div className={`w-full h-[100dvh] md:h-auto ${containerMaxWidth} md:max-h-[900px] border-4 border-gray-600 bg-gray-800 shadow-lg flex flex-col`} style={{fontFamily: "'Press Start 2P', cursive"}}>
          <div className="flex-shrink-0 p-2">
            <div className="flex gap-2 items-start">
              <div className={`flex-grow bg-black text-green-300 p-2 border-2 border-green-500 ${dmBoxHeight} text-xs whitespace-pre-wrap ${dmBoxOverflow}`}>
                <p><strong>DM:</strong> {getDmMessage()}</p>
              </div>
              {gameState.dialogue && !gameState.isChatting && (
                  <DialogueMenu dialogueState={gameState.dialogue} />
              )}
            </div>
          </div>
          <div className={`flex-grow ${contentOverflow} relative px-2 pb-2`}>
            {renderContent()}
          </div>
      </div>
      {gameState.error && <ErrorModal error={gameState.error} onClose={handleClearError} />}
    </div>
  );
};

export default App;