import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { GameState, Player, Zone, Item, Quest, ZoneMap } from './types';
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
  playerSpawnPoints: null,
  currentZone: null,
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
  const appRef = useRef<HTMLDivElement>(null);

  const handleFullscreenChange = useCallback(() => {
    setIsFullscreen(!!document.fullscreenElement);
  }, []);

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [handleFullscreenChange]);

  const toggleFullscreen = useCallback(async () => {
    if (!appRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await appRef.current.requestFullscreen();
        // FIX: The 'lock' property is not in the default ScreenOrientation type.
        // Cast to any to bypass the TypeScript error for this experimental feature.
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
      // Step 1: Generate the core world narrative
      const worldData = await generateWorld(prompt);
      setGameState(prev => ({ ...prev, loadingProgress: 33, loadingMessage: 'Drawing the landscape...' }));
      
      // Step 2: Generate the zone layout (map)
      const layoutData = await generateZoneLayout(worldData.startingZoneDescription);
      setGameState(prev => ({ ...prev, loadingProgress: 66, loadingMessage: 'Breathing life into the world...' }));

      // Step 3: Populate the zone with NPCs, quests, and an exit
      const populationData = await populateZone(worldData.worldName, worldData.mainStoryline, layoutData.tileMap);
      setGameState(prev => ({ ...prev, loadingProgress: 95, loadingMessage: 'Finalizing details...' }));

      const activeQuests: Quest[] = [];
      populationData.npcs.forEach(npc => {
        if (npc.quest) {
          activeQuests.push(npc.quest);
        }
      });

      const startingZone: Zone = {
        name: layoutData.zoneName,
        description: worldData.startingZoneDescription,
        tileMap: layoutData.tileMap,
        npcs: populationData.npcs,
        items: [], // Quest items will be spawned when quests are accepted
        exitPosition: populationData.exitPosition,
      };

      setGameState(prev => ({
        ...prev,
        status: GameStatus.CHARACTER_CREATION,
        worldName: worldData.worldName,
        mainStoryline: worldData.mainStoryline,
        currentZone: startingZone,
        quests: activeQuests,
        playerSpawnPoints: populationData.playerSpawnPoints,
        dmMessage: `Welcome to ${worldData.worldName}. The story is: ${worldData.mainStoryline}`,
        isLoading: false,
      }));
    } catch (error) {
      console.error("World/Zone generation failed:", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setGameState(prev => ({ ...prev, error: errorMessage, dmMessage: 'The creation failed. The ether is unstable. Try again.', isLoading: false, loadingProgress: 0, loadingMessage: '' }));
    }
  }, []);

  const handleStartTestWorld = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      dmMessage: 'Loading the Test World...',
      loadingProgress: 50,
      loadingMessage: 'Assembling test data...'
    }));

    setTimeout(() => {
        const activeQuests: Quest[] = [];
        testWorldData.npcs.forEach(npc => {
            if (npc.quest) {
                activeQuests.push(npc.quest);
            }
        });

        const startingZone: Zone = {
            name: testWorldData.zoneName,
            description: testWorldData.startingZoneDescription,
            tileMap: testWorldData.tileMap,
            npcs: testWorldData.npcs,
            items: [],
            exitPosition: testWorldData.exitPosition,
        };

        setGameState(prev => ({
            ...prev,
            status: GameStatus.CHARACTER_CREATION,
            worldName: testWorldData.worldName,
            mainStoryline: testWorldData.mainStoryline,
            currentZone: startingZone,
            quests: activeQuests,
            playerSpawnPoints: testWorldData.playerSpawnPoints,
            dmMessage: `Welcome to the test world: ${testWorldData.worldName}.`,
            isLoading: false,
        }));
    }, 500);
  }, []);

  const handleCharactersCreate = useCallback((player1Name: string, player1Class: ClassType, player2Name: string, player2Class: ClassType) => {
    setGameState(prev => {
      if (!prev.currentZone || !prev.playerSpawnPoints) return prev; // Should not happen

      const [pos1, pos2] = prev.playerSpawnPoints;
      
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
        dmMessage: `${player1.name} the ${player1.classType} and ${player2.name} the ${player2.classType} begin their adventure in ${prev.currentZone.name}!`
      }
    });
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
        return <CharacterCreationScreen onCreate={handleStartGame} isLoading={gameState.isLoading} />;
      case GameStatus.PLAYING:
        return <GameScreen 
            gameState={gameState} 
            setGameState={setGameState} 
            isFullscreen={isFullscreen}
            toggleFullscreen={toggleFullscreen}
            endGame={handleEndGame}
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

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col md:items-center md:justify-center font-sans">
      <div ref={appRef} className="w-full h-[100dvh] md:h-auto md:max-w-sm md:max-h-[900px] border-4 border-gray-600 bg-gray-800 shadow-lg flex flex-col" style={{fontFamily: "'Press Start 2P', cursive"}}>
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