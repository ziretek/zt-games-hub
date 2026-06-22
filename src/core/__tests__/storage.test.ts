import { describe, it, expect, beforeEach } from 'vitest';
import { loadScore, saveScore, loadJson, saveJson } from '../../utils/storage.js';

describe('storage', () => {
  beforeEach(() => localStorage.clear());

  it('saveScore and loadScore round-trip', () => {
    saveScore('test-key', 42);
    expect(loadScore('test-key')).toBe(42);
  });

  it('loadScore returns fallback for missing key', () => {
    expect(loadScore('missing', 99)).toBe(99);
  });

  it('loadScore returns 0 fallback by default', () => {
    expect(loadScore('missing')).toBe(0);
  });

  it('saveJson and loadJson round-trip objects', () => {
    const obj = { a: 1, b: 'hello' };
    saveJson('json-key', obj);
    expect(loadJson('json-key', null)).toEqual(obj);
  });

  it('loadJson returns fallback for missing key', () => {
    expect(loadJson('missing', { x: 1 })).toEqual({ x: 1 });
  });

  it('loadJson handles corrupted data gracefully', () => {
    localStorage.setItem('corrupt', 'not-json{{{');
    expect(loadJson('corrupt', 'fallback')).toBe('fallback');
  });

  it('saveScore overwrites existing value', () => {
    saveScore('key', 10);
    saveScore('key', 20);
    expect(loadScore('key')).toBe(20);
  });
});
