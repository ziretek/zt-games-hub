import type { GameState, GameID } from './types.js';

export interface Game {
  readonly id: GameID;
  state: GameState;

  init(): void;
  pause(): void;
  resume(): void;
  destroy(): void;
  render(): void;
}
