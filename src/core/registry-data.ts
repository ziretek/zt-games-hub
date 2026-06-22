import type { GameCategory } from './types.js';

export interface GameEntry {
  id: string;
  name: string;
  category: GameCategory;
  icon: string;
  desc: string;
  accent: string;
  needsNewBtn?: boolean;
  needsAiBtn?: boolean;
  needsRecreate?: boolean;
}

export const CATEGORIES: Record<GameCategory, { icon: string; name: string; accent: string }> = {
  board:  { icon: '♟️', name: 'Board Games', accent: '245, 158, 11' },
  puzzle: { icon: '🧩', name: 'Puzzle Games', accent: '34, 197, 94' },
  arcade: { icon: '🕹️', name: 'Arcade Games', accent: '239, 68, 68' },
  word:   { icon: '📝', name: 'Word Games', accent: '59, 130, 246' },
  sports: { icon: '⚽', name: 'Sports Games', accent: '251, 146, 60' },
};

export const GAMES: GameEntry[] = [
  { id: 'checkers',      name: 'Checkers',       category: 'board',  icon: '♟️',  desc: 'Capture all pieces',       accent: '245, 158, 11', needsNewBtn: true, needsAiBtn: true, needsRecreate: false },
  { id: 'connect4',      name: 'Connect 4',       category: 'board',  icon: '🔴🟡', desc: 'Four in a row',            accent: '239, 68, 68', needsNewBtn: false, needsAiBtn: true, needsRecreate: false },
  { id: 'minesweeper',   name: 'Minesweeper',     category: 'puzzle', icon: '💣',  desc: 'Find the mines',          accent: '34, 197, 94', needsNewBtn: false, needsAiBtn: false, needsRecreate: false },
  { id: 'memory',        name: 'Memory',          category: 'puzzle', icon: '🃏',  desc: 'Match the pairs',         accent: '168, 85, 247', needsNewBtn: false, needsAiBtn: false, needsRecreate: false },
  { id: 'snake',         name: 'Snake',           category: 'arcade', icon: '🐍',  desc: 'Grow and survive',        accent: '6, 182, 212', needsNewBtn: false, needsAiBtn: false, needsRecreate: true },
  { id: 'tictactoe',     name: 'Tic-Tac-Toe',     category: 'board',  icon: '❌⭕', desc: 'Three in a row',           accent: '96, 165, 250', needsNewBtn: true, needsAiBtn: true, needsRecreate: false },
  { id: 'hangman',       name: 'Hangman',         category: 'puzzle', icon: '🪢',  desc: 'Guess the word',          accent: '249, 168, 212', needsNewBtn: true, needsAiBtn: false, needsRecreate: false },
  { id: 'game2048',      name: '2048',            category: 'puzzle', icon: '🔢',  desc: 'Merge the tiles',         accent: '242, 177, 121', needsNewBtn: true, needsAiBtn: false, needsRecreate: true },
  { id: 'pong',          name: 'Pong',            category: 'arcade', icon: '🏓',  desc: 'Classic paddle game',     accent: '96, 165, 250', needsNewBtn: true, needsAiBtn: false, needsRecreate: true },
  { id: 'breakout',      name: 'Breakout',        category: 'arcade', icon: '🧱',  desc: 'Break all bricks',        accent: '231, 76, 60', needsNewBtn: true, needsAiBtn: false, needsRecreate: true },
  { id: 'othello',       name: 'Othello',         category: 'board',  icon: '⚫⚪', desc: 'Flip the board',          accent: '45, 90, 39', needsNewBtn: true, needsAiBtn: false, needsRecreate: false },
  { id: 'battleship',    name: 'Battleship',      category: 'board',  icon: '🚢',  desc: 'Sink the fleet',          accent: '100, 180, 255', needsNewBtn: true, needsAiBtn: false, needsRecreate: false },
  { id: 'gomoku',        name: 'Gomoku',          category: 'board',  icon: '⬛⬜', desc: 'Five in a row',            accent: '222, 184, 135', needsNewBtn: true, needsAiBtn: true, needsRecreate: false },
  { id: 'simon',         name: 'Simon',           category: 'puzzle', icon: '🔴🟢', desc: 'Remember the pattern',     accent: '41, 128, 185', needsNewBtn: true, needsAiBtn: false, needsRecreate: false },
  { id: 'mastermind',    name: 'Mastermind',      category: 'puzzle', icon: '🎯',  desc: 'Crack the color code',    accent: '155, 89, 182', needsNewBtn: true, needsAiBtn: false, needsRecreate: false },
  { id: 'invaders',      name: 'Space Invaders',  category: 'arcade', icon: '👾',  desc: 'Defeat the aliens',       accent: '46, 204, 113', needsNewBtn: true, needsAiBtn: false, needsRecreate: true },
  { id: 'flappy',        name: 'Flappy Bird',     category: 'arcade', icon: '🐤',  desc: 'Fly through pipes',       accent: '77, 201, 246', needsNewBtn: true, needsAiBtn: false, needsRecreate: true },
  { id: 'dino',          name: 'Dino Runner',     category: 'arcade', icon: '🦖',  desc: 'Run and jump',            accent: '83, 83, 83', needsNewBtn: true, needsAiBtn: false, needsRecreate: true },
  { id: 'countmaster',   name: 'Count Master',    category: 'arcade', icon: '🔢',  desc: 'Grow and survive',        accent: '52, 152, 219', needsNewBtn: true, needsAiBtn: false, needsRecreate: true },
  { id: 'wordle',        name: 'Wordle',          category: 'word',   icon: '🟩',  desc: 'Guess the 5-letter word', accent: '83, 141, 78', needsNewBtn: true, needsAiBtn: false, needsRecreate: false },
  { id: 'boggle',        name: 'Boggle',          category: 'word',   icon: '🔤',  desc: 'Find words in the grid',  accent: '52, 152, 219', needsNewBtn: true, needsAiBtn: false, needsRecreate: true },
  { id: 'anagrams',      name: 'Anagrams',        category: 'word',   icon: '🔀',  desc: 'Unscramble the word',     accent: '230, 126, 34', needsNewBtn: true, needsAiBtn: false, needsRecreate: false },
  { id: 'wordsearch',    name: 'Word Search',     category: 'word',   icon: '🔍',  desc: 'Find hidden words',       accent: '46, 204, 113', needsNewBtn: true, needsAiBtn: false, needsRecreate: true },
  { id: 'typingtest',    name: 'Typing Test',     category: 'word',   icon: '⌨️',  desc: 'Test your typing speed',  accent: '155, 89, 182', needsNewBtn: true, needsAiBtn: false, needsRecreate: true },
  { id: 'spellingbee',   name: 'Spelling Bee',    category: 'word',   icon: '🐝',  desc: 'Make words from letters',  accent: '232, 184, 0', needsNewBtn: true, needsAiBtn: false, needsRecreate: false },
  { id: 'penaltykicker', name: 'Penalty Kicker',  category: 'sports', icon: '⚽',  desc: 'Score 5 penalties',       accent: '46, 204, 113', needsNewBtn: true, needsAiBtn: false, needsRecreate: true },
  { id: 'basketball',    name: 'Basketball',      category: 'sports', icon: '🏀',  desc: 'Shoot hoops',             accent: '231, 76, 60', needsNewBtn: true, needsAiBtn: false, needsRecreate: true },
  { id: 'sprint',        name: 'Sprint',          category: 'sports', icon: '🏃',  desc: 'Tap to sprint',           accent: '52, 152, 219', needsNewBtn: true, needsAiBtn: false, needsRecreate: true },
  { id: 'bowling',       name: 'Bowling',         category: 'sports', icon: '🎳',  desc: 'Knock down pins',         accent: '155, 89, 182', needsNewBtn: true, needsAiBtn: false, needsRecreate: true },
  { id: 'archery',       name: 'Archery',         category: 'sports', icon: '🏹',  desc: 'Hit the target',          accent: '39, 174, 96', needsNewBtn: true, needsAiBtn: false, needsRecreate: true },
  { id: 'baseball',      name: 'Baseball',        category: 'sports', icon: '⚾',  desc: 'Hit home runs',           accent: '241, 196, 15', needsNewBtn: true, needsAiBtn: false, needsRecreate: true },
];

export const GAME_MAP = new Map<string, GameEntry>();
for (const g of GAMES) {
  GAME_MAP.set(g.id, g);
}
