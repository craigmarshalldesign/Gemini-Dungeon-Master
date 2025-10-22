export enum GameStatus {
  WORLD_CREATION,
  CHARACTER_CREATION,
  PLAYING,
}

export enum ClassType {
  WIZARD = 'Wizard',
  WARRIOR = 'Warrior',
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Stats {
  hp: number;
  maxHp: number;
  str: number;
  int: number;
  def: number;
  xp: number;
  nextLevelXp: number;
  level: number;
}

export enum DamageType {
    PHYSICAL = 'Physical',
    MAGICAL = 'Magical',
}

export enum EffectType {
    HEAL = 'Heal'
}

export interface AbilityEffect {
    type: EffectType;
    amount: number;
}


export interface Ability {
  level: number;
  name: string;
  description: string;
  damage: number;
  damageType: DamageType | null;
  effect: AbilityEffect | null;
}

export interface Item {
  id: string;
  name:string;
  emoji: string;
  description: string;
  position?: { x: number; y: number };
}

export interface CharacterClass {
  type: ClassType;
  baseStats: Stats;
  abilities: Ability[];
}

export interface Player {
  id: number;
  name: string;
  classType: ClassType;
  stats: Stats;
  abilities: Ability[];
  position: { x: number; y: number };
  direction: Direction;
  inventory: Item[];
}

export interface Tile {
  terrain: string;
  name: string;
}

export type WorldMap = Tile[][];

export enum QuestStatus {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
  COMPLETED = 'completed'
}

export interface QuestObjective {
  type: 'fetch';
  itemName: string;
  itemDescription: string;
  itemEmoji: string;
  itemId: string;
  targetPosition: { x: number; y: number };
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  completionDialogue: string;
  status: QuestStatus;
  objective: QuestObjective;
  xpReward: number;
}

export interface NPC {
  name: string;
  role: string;
  description: string;
  personality: string;
  stats: {
    hp: number;
    str: number;
    int: number;
  };
  position: { x: number; y: number };
  quest: Quest | null;
  initialDialogue: string;
}

export type ZoneMap = string[][];

export interface Zone {
  name: string;
  description: string;
  tileMap: ZoneMap;
  npcs: NPC[];
  items: Item[];
  exitPosition: { x: number; y: number };
}

export interface DialogueState {
  npc: NPC;
  currentText: string;
  menuSelectionIndex: number; // 0 for Talk, 1 for Chat, 2 for Close
}

export interface DisplayChatMessage {
  author: 'player' | 'npc';
  text: string;
}

export interface NPCChatState {
  history: DisplayChatMessage[];
  messagesSent: number;
}

export interface GameState {
  status: GameStatus;
  worldName: string;
  mainStoryline: string;
  dmMessage: string;
  players: [Player | null, Player | null];
  currentZone: Zone | null;
  dialogue: DialogueState | null;
  isChatting: boolean;
  chatStates: Record<string, NPCChatState>; // Key is NPC name
  activePlayerId: number;
  isLoading: boolean;
  loadingProgress: number;
  loadingMessage: string;
  error: string | null;
  quests: Quest[];
  messageQueue: string[] | null;
  hasNewQuest: boolean;
}
