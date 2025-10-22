import type { ZoneMap, NPC, Quest } from './types';
import { QuestStatus } from './types';

interface TestWorldData {
  worldName: string;
  mainStoryline: string;
  startingZoneDescription: string;
  zoneName: string;
  tileMap: ZoneMap;
  npcs: NPC[];
  exitPosition: { x: number, y: number };
  playerSpawnPoints: [{ x: number, y: number }, { x: number, y: number }];
}

const testQuest: Quest = {
    id: 'test_quest_facepaint_01',
    title: 'The Prismatic Primer',
    description: 'Baroness Von Blotch is using her monochromatic magic to drain the joy from this plaza! To counter it, I must create a Prismatic Primer. Please, fetch me a Glimmerlily Petal. It only blooms in moonlight near old stone.',
    completionDialogue: 'The Glimmerlily! Its vibrant essence is perfect! Now I can mix a paint to shield the others. You\'ve done a great service today!',
    status: QuestStatus.INACTIVE,
    xpReward: 75,
    objective: {
        type: 'fetch',
        itemName: 'Glimmerlily Petal',
        itemDescription: 'A flower petal that shimmers with all the colors of the moonbow. It feels warm with latent magic.',
        itemEmoji: '🌸',
        itemId: 'test_item_glimmerlily_01',
        targetPosition: { x: 18, y: 17 },
    }
};

export const testWorldData: TestWorldData = {
  worldName: "The Chroma Dominion",
  mainStoryline: "In a world where face painters have magical powers, the flamboyantly evil Baroness Von Blotch is turning artistically 'drab' citizens into ducks! She must be stopped!",
  startingZoneDescription: "Palette Plaza was the vibrant heart of the city, a canvas of joy and color. Now, under the Baroness's critical eye, a strange silence hangs in the air, broken only by the indignant quacking of former citizens waddling on the cobblestones.",
  zoneName: "Palette Plaza",
  tileMap: [
    ['tree', 'tree', 'tree', 'tree', 'building', 'building', 'building', 'tree', 'tree', 'tree', 'tree', 'tree', 'building', 'building', 'building', 'tree', 'tree', 'tree', 'tree', 'tree'],
    ['tree', 'grass', 'grass', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'grass', 'grass', 'grass', 'tree'],
    ['tree', 'grass', 'path', 'path', 'grass', 'grass', 'grass', 'path', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'path', 'tree', 'grass', 'tree', 'tree'],
    ['tree', 'path', 'path', 'grass', 'grass', 'tree', 'grass', 'path', 'grass', 'tree', 'tree', 'grass', 'grass', 'tree', 'grass', 'path', 'grass', 'grass', 'tree', 'tree'],
    ['building', 'path', 'grass', 'grass', 'tree', 'tree', 'grass', 'path', 'grass', 'tree', 'tree', 'tree', 'grass', 'tree', 'grass', 'path', 'grass', 'tree', 'tree', 'tree'],
    ['building', 'path', 'grass', 'grass', 'grass', 'grass', 'grass', 'path', 'grass', 'tree', 'grass', 'grass', 'grass', 'grass', 'grass', 'path', 'grass', 'grass', 'tree', 'tree'],
    ['building', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'water', 'water', 'water', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'building'],
    ['tree', 'grass', 'grass', 'grass', 'grass', 'grass', 'path', 'water', 'water', 'water', 'water', 'water', 'path', 'grass', 'grass', 'grass', 'grass', 'path', 'grass', 'tree'],
    ['tree', 'grass', 'tree', 'grass', 'tree', 'grass', 'path', 'water', 'water', 'water', 'water', 'water', 'path', 'grass', 'tree', 'grass', 'grass', 'path', 'grass', 'tree'],
    ['tree', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'water', 'water', 'water', 'path', 'path', 'path', 'path', 'path', 'tree', 'path', 'grass', 'tree'],
    ['tree', 'path', 'grass', 'grass', 'grass', 'grass', 'grass', 'path', 'path', 'path', 'path', 'path', 'grass', 'grass', 'grass', 'path', 'path', 'path', 'grass', 'building'],
    ['tree', 'path', 'grass', 'tree', 'tree', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'tree', 'grass', 'path', 'grass', 'grass', 'tree', 'tree'],
    ['tree', 'path', 'grass', 'tree', 'building', 'building', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'building', 'path', 'grass', 'grass', 'tree', 'tree'],
    ['tree', 'path', 'grass', 'tree', 'building', 'building', 'path', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'path', 'building', 'path', 'tree', 'tree', 'tree', 'tree'],
    ['tree', 'path', 'path', 'path', 'path', 'path', 'path', 'grass', 'tree', 'grass', 'tree', 'grass', 'grass', 'path', 'path', 'path', 'grass', 'grass', 'grass', 'tree'],
    ['tree', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'grass', 'tree', 'grass', 'tree', 'grass', 'tree', 'tree', 'grass', 'path', 'grass', 'tree', 'grass', 'tree'],
    ['tree', 'grass', 'tree', 'tree', 'tree', 'tree', 'grass', 'grass', 'path', 'path', 'path', 'path', 'path', 'grass', 'grass', 'path', 'grass', 'tree', 'grass', 'tree'],
    ['tree', 'grass', 'grass', 'grass', 'grass', 'tree', 'grass', 'grass', 'path', 'grass', 'grass', 'grass', 'path', 'grass', 'tree', 'path', 'grass', 'grass', 'path', 'tree'],
    ['tree', 'tree', 'tree', 'grass', 'grass', 'grass', 'grass', 'path', 'path', 'grass', 'tree', 'grass', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'tree'],
    ['tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree', 'tree'],
  ],
  npcs: [
    {
      name: 'Elara',
      role: 'Master Glimmerbrush',
      description: 'A sprightly woman whose laugh sounds like wind chimes. She has a streak of sapphire in her silver hair and her eyes twinkle with rebellious creative energy.',
      personality: 'Wise, eccentric, and fiercely protective of true artistic expression. She speaks in metaphors of color and light.',
      stats: { hp: 20, str: 4, int: 18 },
      position: { x: 4, y: 2 },
      quest: testQuest,
      initialDialogue: 'The plaza\'s colors are muted, its harmony is flat! We must fight this appalling lack of imagination!'
    },
    {
      name: 'Pierre',
      role: 'Panicked Pastrysmith',
      description: 'A man wearing a ridiculously tall chef\'s hat that wobbles when he frets, which is constantly. He gestures wildly with a flour-dusted rolling pin.',
      personality: 'Melodramatic, passionate about pastry, and currently on the verge of a complete breakdown.',
      stats: { hp: 10, str: 10, int: 8 },
      position: { x: 13, y: 12 },
      quest: null,
      initialDialogue: 'My sourdough starter! My beloved Doughseph! She turned him into a duck! The croissants... the town is doomed!'
    },
    {
      name: 'Sir Reginald',
      role: 'Duck of Unusual Dignity',
      description: 'A pristine white duck that stands unnaturally erect. It seems to regard the world with a critical, almost disdainful, eye.',
      personality: 'Aloof, surprisingly intelligent, and carries himself with the air of a disgruntled nobleman who has been grievously inconvenienced.',
      stats: { hp: 5, str: 1, int: 10 },
      position: { x: 17, y: 17 },
      quest: null,
      initialDialogue: '*Quack.* (It\'s a short, sharp, and undeniably judgmental sound. He seems to be gesturing toward a nearby flower with his wing.)'
    }
  ],
  exitPosition: { x: 19, y: 6 },
  playerSpawnPoints: [{ x: 1, y: 9 }, { x: 2, y: 9 }],
};
