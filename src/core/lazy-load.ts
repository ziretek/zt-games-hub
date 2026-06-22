/// <reference types="vite/client" />
const rawModules = import.meta.glob('../games/*/index.ts');
const gameIdPattern = /\.\.\/games\/([^/]+)\/index\.ts$/;
export const gameChunks: Record<string, () => Promise<void>> = {};
for (const [path, loader] of Object.entries(rawModules)) {
  const match = path.match(gameIdPattern);
  if (match) gameChunks[match[1]] = loader as () => Promise<void>;
}
