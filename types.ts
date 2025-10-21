
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
}

export type ZoneMap = string[][];

export interface Zone {
  description: string;
  tileMap: ZoneMap;
  npcs: NPC[];
  items: Item[];
  exitPosition: { x: number; y: number };
}

export interface DialogueState {
  npc: NPC;
  text: string;
  choices: string[];
}

export interface GameState {
  status: GameStatus;
  worldName: string;
  mainStoryline: string;
  dmMessage: string;
  players: [Player | null, Player | null];
  worldMap: WorldMap | null;
  currentZone: Zone | null;
  dialogue: DialogueState | null;
  activePlayerId: number;
  isLoading: boolean;
  error: string | null;
  quests: Quest[];
}