export type GameID = string;

export type GameCategory = 'board' | 'puzzle' | 'arcade' | 'word';

export interface GameInfo {
  id: GameID;
  title: string;
  category: GameCategory;
  description: string;
  icon: string;
  wrapperId: string;
}

export interface GameConstructor {
  new (): import('./game.js').Game;
}

export type GameState = 'playing' | 'paused' | 'won' | 'lost' | 'idle';

