import type { GameConstructor, GameInfo } from '../core/types.js';

const gameConstructors = new Map<string, GameConstructor>();
const gameInfos = new Map<string, GameInfo>();

export function registerGame(info: GameInfo, ctor: GameConstructor): void {
  gameInfos.set(info.id, info);
  gameConstructors.set(info.id, ctor);
}

export function getGameConstructor(id: string): GameConstructor | undefined {
  return gameConstructors.get(id);
}

export function getGameInfo(id: string): GameInfo | undefined {
  return gameInfos.get(id);
}

export function getAllGameInfos(): GameInfo[] {
  return Array.from(gameInfos.values());
}

export function clearRegistry(): void {
  gameConstructors.clear();
  gameInfos.clear();
}
