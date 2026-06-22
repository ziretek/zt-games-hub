export function loadScore(key: string, fallback = 0): number {
  try { return parseInt(localStorage.getItem(key) || String(fallback), 10); } catch { return fallback; }
}

export function saveScore(key: string, value: number): void {
  localStorage.setItem(key, String(value));
}

export function loadJson<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}

export function saveJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}
