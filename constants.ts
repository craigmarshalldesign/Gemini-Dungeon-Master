
import { CharacterClass, ClassType, DamageType, EffectType, Stats } from './types';

const BASE_WIZARD_STATS: Stats = { hp: 10, maxHp: 10, str: 2, int: 8, def: 2, xp: 0, level: 1, nextLevelXp: 100 };
const BASE_WARRIOR_STATS: Stats = { hp: 15, maxHp: 15, str: 8, int: 2, def: 5, xp: 0, level: 1, nextLevelXp: 100 };

export const CHARACTER_CLASSES: Record<ClassType, CharacterClass> = {
  [ClassType.WIZARD]: {
    type: ClassType.WIZARD,
    baseStats: BASE_WIZARD_STATS,
    abilities: [
      { level: 1, name: 'Firebolt', description: 'Hurl a mote of magical fire.', damage: 8, damageType: DamageType.MAGICAL, effect: null },
      { level: 2, name: 'Magic Missile', description: 'Three darts of magical force strike a target.', damage: 12, damageType: DamageType.MAGICAL, effect: null },
      { level: 4, name: 'Shield', description: 'A barrier of force protects you.', damage: 0, damageType: null, effect: null },
    ],
  },
  [ClassType.WARRIOR]: {
    type: ClassType.WARRIOR,
    baseStats: BASE_WARRIOR_STATS,
    abilities: [
      { level: 1, name: 'Slash', description: 'A basic but reliable sword attack.', damage: 6, damageType: DamageType.PHYSICAL, effect: null },
      { level: 2, name: 'Power Attack', description: 'A mighty swing that can break defenses.', damage: 10, damageType: DamageType.PHYSICAL, effect: null },
      { level: 4, name: 'Second Wind', description: 'Regain a small amount of health.', damage: 0, damageType: null, effect: { type: EffectType.HEAL, amount: 8 } },
    ],
  },
};
