import { describe, it, expect, beforeEach } from 'vitest';
import { registerGame, getGameConstructor, getGameInfo, getAllGameInfos, clearRegistry } from '../registry.js';
import type { GameInfo, GameConstructor } from '../types.js';
import type { GameState } from '../types.js';
import type { Game } from '../game.js';

const mockInfo: GameInfo = { id: 'test-game', title: 'Test', category: 'puzzle', description: 'A test game', icon: 'T', wrapperId: 'test-wrapper' };

class TestGame implements Game {
  readonly id = 'test-game';
  state: GameState = 'idle';
  init() {}
  pause() {}
  resume() {}
  destroy() {}
  render() {}
}

class TestGame2 implements Game {
  readonly id = 'test-game-2';
  state: GameState = 'idle';
  init() {}
  pause() {}
  resume() {}
  destroy() {}
  render() {}
}

const mockCtor: GameConstructor = TestGame;

describe('registry', () => {
  beforeEach(() => clearRegistry());

  it('registers and retrieves a game constructor', () => {
    registerGame(mockInfo, mockCtor);
    expect(getGameConstructor('test-game')).toBe(mockCtor);
  });

  it('registers and retrieves game info', () => {
    registerGame(mockInfo, mockCtor);
    expect(getGameInfo('test-game')).toEqual(mockInfo);
  });

  it('returns undefined for unknown game', () => {
    expect(getGameConstructor('unknown')).toBeUndefined();
    expect(getGameInfo('unknown')).toBeUndefined();
  });

  it('returns all registered games', () => {
    registerGame(mockInfo, mockCtor);
    const all = getAllGameInfos();
    expect(all).toHaveLength(1);
    expect(all[0]).toEqual(mockInfo);
  });

  it('handles multiple registrations', () => {
    registerGame(mockInfo, mockCtor);
    const info2: GameInfo = { ...mockInfo, id: 'test-game-2', title: 'Test 2' };
    registerGame(info2, TestGame2);
    expect(getAllGameInfos()).toHaveLength(2);
    expect(getGameConstructor('test-game-2')).toBe(TestGame2);
  });

  it('overwrites duplicate id', () => {
    registerGame(mockInfo, mockCtor);
    registerGame(mockInfo, TestGame2);
    expect(getGameConstructor('test-game')).toBe(TestGame2);
  });

  it('clearRegistry empties all data', () => {
    registerGame(mockInfo, mockCtor);
    clearRegistry();
    expect(getAllGameInfos()).toHaveLength(0);
    expect(getGameConstructor('test-game')).toBeUndefined();
  });
});
