import { loadJson, saveJson } from './storage.js';

const STATS_KEY = 'gameStats';

export interface GameStat {
  plays: number;
  firstPlayedAt?: string;
  lastPlayedAt?: string;
}

export type GameStats = Record<string, GameStat>;

export function getGameStats(): GameStats {
  return loadJson<GameStats>(STATS_KEY, {});
}

export function getGameStat(id: string): GameStat {
  return getGameStats()[id] || { plays: 0 };
}

export function recordGameLaunch(id: string, now = new Date()): GameStat {
  const stats = getGameStats();
  const existing = stats[id] || { plays: 0 };
  const stamp = now.toISOString();
  const next: GameStat = {
    ...existing,
    plays: existing.plays + 1,
    firstPlayedAt: existing.firstPlayedAt || stamp,
    lastPlayedAt: stamp,
  };
  stats[id] = next;
  saveJson(STATS_KEY, stats);
  return next;
}
