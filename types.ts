
export enum Rarity {
  R = 'R',
  SR = 'SR',
  SSR = 'SSR',
  UR = 'UR',
}

export enum SkillType {
  COIN_BOOST = 'COIN_BOOST',
  TIMER_SLOW = 'TIMER_SLOW',
  HINT_REVEAL = 'HINT_REVEAL',
  AUTO_CLICK = 'AUTO_CLICK',
  // New Skills
  HEALER = 'HEALER',         // Restores HP in battle
  CRIT_BOOST = 'CRIT_BOOST', // Increases damage in battle
  XP_BOOST = 'XP_BOOST',     // Increases bond/mastery gain
  COMBO_MASTER = 'COMBO_MASTER' // Bonus points for streaks
}

export enum CardElement {
  LOGIC = 'LOGIC',     // Blue
  EMOTION = 'EMOTION', // Red
  STRENGTH = 'STRENGTH' // Yellow/Green
}

export type Faction = 'AGENCY' | 'MAFIA' | 'DECAY' | 'HUNTING_DOGS' | 'SPECIAL_DIVISION' | 'THE_GUILD';

export interface Card {
  id: string;
  name: string;
  rarity: Rarity;
  imageUrl: string;
  description: string;
  tags: string[]; 
  element: CardElement;
  skill: {
    type: SkillType;
    value: number; 
    description: string;
  };
  baseStats: {
    attack: number;
    health: number;
  };
  // Stories (Flavor text that unlocks)
  storyChapters?: {
      title: string;
      content: string;
      unlockBondLevel: number;
  }[];
}

export interface UserCard {
  cardId: string;
  level: number;
  duplicates: number;
  isFavorite: boolean;
  bond: number; // Affinity level (0-100)
  obtainedAt: number;
}

export interface Banner {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  rateUpTags: string[];
  theme: 'standard' | 'holiday' | 'au';
}

export interface Question {
  id: string;
  term: string;
  definition: string;
  distractors: string[];
  mastery: number; // 0-100%
}

export interface StudySet {
  id: string;
  title: string;
  content: string;
  questions: Question[];
  type: 'text' | 'pdf' | 'video' | 'image';
  sourceImage?: string; // Base64 of the source image if type is image
  created: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  lastEdited: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface DailyTask {
  id: string;
  description: string;
  reward: number;
  current: number;
  target: number;
  claimed: boolean;
  type: 'CHAT' | 'GAME' | 'PULL' | 'STUDY';
}

export interface SchedulerTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Furniture {
  id: string;
  name: string;
  cost: number;
  icon: string;
  type: 'floor' | 'wall' | 'item';
}

export interface DormState {
  unlockedFurniture: string[];
  placedFurniture: { id: string, x: number, y: number }[];
}