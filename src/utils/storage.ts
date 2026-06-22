export function loadScore(key: string, fallback = 0): number {
  try { return parseInt(localStorage.getItem(key) || String(fallback), 10); } catch { return fallback; }
}

export function saveScore(key: string, value: number): void {
  try { localStorage.setItem(key, String(value)); } catch { /* storage full or unavailable */ }
}

export function loadJson<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

export function saveJson(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full or unavailable */ }
}
