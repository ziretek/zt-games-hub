export interface GameHelp {
  objective: string;
  controls: string[];
  tips: string[];
}

export const GAME_HELP: Record<string, GameHelp> = {
  chess: {
    objective: 'Checkmate the opposing king while keeping your own king safe.',
    controls: ['Select a piece, then select a legal destination square.', 'Use New Game to reset the board.'],
    tips: ['Control the center early.', 'Castle when your king needs safety.', 'Look for checks, captures, and threats before moving.'],
  },
  checkers: {
    objective: 'Capture every opposing piece or block all legal moves.',
    controls: ['Select a piece, then select a highlighted move.', 'Toggle Vs Computer to play against the AI.'],
    tips: ['Forced captures matter.', 'Protect your back row until you can crown pieces.', 'Trade only when it improves your position.'],
  },
  connect4: {
    objective: 'Drop pieces to make four in a row horizontally, vertically, or diagonally.',
    controls: ['Select a column to drop your piece.', 'Toggle Vs Computer to change opponent mode.'],
    tips: ['Control the center columns.', 'Block immediate threats.', 'Build two-way threats when possible.'],
  },
  minesweeper: {
    objective: 'Reveal every safe cell without opening a mine.',
    controls: ['Tap a cell to reveal it.', 'Use Flag mode to mark suspected mines.'],
    tips: ['Numbers show adjacent mines.', 'Clear certain safe cells first.', 'Use flags to reduce guesswork.'],
  },
  memory: {
    objective: 'Match every pair of hidden cards in as few moves as possible.',
    controls: ['Select two cards to reveal them.', 'Matched cards stay face up.'],
    tips: ['Remember positions, not just symbols.', 'Work through the board in sections.'],
  },
  snake: {
    objective: 'Eat food, grow longer, and avoid walls and your own body.',
    controls: ['Use arrow keys on desktop.', 'Swipe or use touch controls on mobile.'],
    tips: ['Plan turns before tight corners.', 'Leave yourself open space as the snake grows.'],
  },
  tictactoe: {
    objective: 'Place three marks in a row before your opponent does.',
    controls: ['Select an empty square to place your mark.', 'Toggle Vs Computer for AI play.'],
    tips: ['Take the center when available.', 'Block forks before they form.'],
  },
  hangman: {
    objective: 'Guess the hidden word before you run out of wrong guesses.',
    controls: ['Select letters from the keyboard.', 'Use New Game for a fresh word.'],
    tips: ['Start with common vowels.', 'Use revealed letter positions to narrow the word.'],
  },
  game2048: {
    objective: 'Merge matching tiles to reach 2048 or the highest score you can.',
    controls: ['Use arrow keys or swipe to slide tiles.', 'Matching tiles merge once per move.'],
    tips: ['Keep your largest tile in one corner.', 'Avoid scattering high-value tiles.'],
  },
  pong: {
    objective: 'Return the ball and outscore your opponent.',
    controls: ['You always control the left paddle.', 'Move with W/S, Arrow Up/Down, mouse, or touch.', 'The right paddle is always controlled by AI.'],
    tips: ['Meet the ball near paddle edges to change angles.', 'Recover to center after each hit.'],
  },
  breakout: {
    objective: 'Clear all bricks by bouncing the ball with your paddle.',
    controls: ['Move the paddle with keyboard, pointer, or touch.', 'Use New Game after losing all lives.'],
    tips: ['Keep the ball above the bricks when possible.', 'Small paddle moves are easier to control.'],
  },
  othello: {
    objective: 'Finish with more pieces than your opponent by flipping lines of pieces.',
    controls: ['Select a legal square that brackets opponent pieces.', 'Use New Game to restart.'],
    tips: ['Corners are powerful.', 'Avoid giving away stable edges too early.'],
  },
  battleship: {
    objective: 'Find and sink the full opposing fleet before yours is sunk.',
    controls: ['Place ships, then select target cells to fire.', 'Toggle Vs Computer for AI mode.'],
    tips: ['After a hit, search neighboring cells.', 'Spread guesses to find large ships first.'],
  },
  gomoku: {
    objective: 'Place five stones in a row before your opponent.',
    controls: ['Select an empty intersection to place a stone.', 'Toggle Vs Computer for AI mode.'],
    tips: ['Block open fours immediately.', 'Build threats that attack in two directions.'],
  },
  simon: {
    objective: 'Repeat the growing color sequence for as many rounds as possible.',
    controls: ['Watch the pattern, then tap the buttons in order.', 'Use New Game to restart the sequence.'],
    tips: ['Say the colors quietly as a rhythm.', 'Focus on the newest step each round.'],
  },
  mastermind: {
    objective: 'Crack the hidden color code before your guesses run out.',
    controls: ['Choose colors for each slot, then submit the guess.', 'Use feedback pegs to refine the next guess.'],
    tips: ['Separate color discovery from position discovery.', 'Do not repeat guesses that feedback already disproves.'],
  },
  invaders: {
    objective: 'Destroy the invaders before they reach you.',
    controls: ['Move left and right, then fire upward.', 'Touch or keyboard controls are supported.'],
    tips: ['Keep moving after firing.', 'Clear lower invaders before they descend too far.'],
  },
  flappy: {
    objective: 'Fly through gaps for as long as possible.',
    controls: ['Tap, click, or press a key to flap.', 'Use New Game to restart after a crash.'],
    tips: ['Use short, steady taps.', 'Watch the next pipe, not only the current one.'],
  },
  dino: {
    objective: 'Run as far as possible while avoiding obstacles.',
    controls: ['Jump with keyboard, click, or touch.', 'Use New Game to restart.'],
    tips: ['Jump early for tall obstacles.', 'Stay calm as speed increases.'],
  },
  countmaster: {
    objective: 'Solve as many counting challenges as possible before time runs out.',
    controls: ['Use the on-screen keypad or keyboard input.', 'Backspace removes the last digit.'],
    tips: ['Prioritize accuracy over speed early.', 'Use the keypad rhythm to avoid mistaps.'],
  },
  wordle: {
    objective: 'Guess the five-letter word in six tries.',
    controls: ['Type or tap letters, then press Enter.', 'Color feedback shows letter accuracy.'],
    tips: ['Open with common letters.', 'Do not reuse gray letters unless you have a reason.'],
  },
  boggle: {
    objective: 'Find as many valid connected words as possible before time expires.',
    controls: ['Tap connected letters to build a word.', 'Submit or clear the current word.'],
    tips: ['Scan for common endings.', 'Look for plural forms and prefixes.'],
  },
  anagrams: {
    objective: 'Unscramble each word and build a streak.',
    controls: ['Type your answer and submit.', 'Use Hint when stuck.'],
    tips: ['Look for prefixes and suffixes.', 'Rearrange consonant clusters first.'],
  },
  wordsearch: {
    objective: 'Find every hidden word in the grid.',
    controls: ['Drag or tap across letters to select a word.', 'Use New Game for a fresh puzzle.'],
    tips: ['Scan rows, columns, and diagonals.', 'Find unusual letters first.'],
  },
  typingtest: {
    objective: 'Type the prompt quickly and accurately.',
    controls: ['Use the keyboard to type the shown text.', 'Use New Game to reset the test.'],
    tips: ['Accuracy protects your final score.', 'Keep a steady pace instead of rushing.'],
  },
  spellingbee: {
    objective: 'Make valid words from the letter set while using the required center letter.',
    controls: ['Tap letters or type, then submit.', 'Use delete to correct the current word.'],
    tips: ['Try common endings.', 'Build longer words from shorter roots.'],
  },
  sudoku: {
    objective: 'Fill the grid so every row, column, and box contains 1 through 9.',
    controls: ['Select a cell, then choose a number.', 'Use New Game for a fresh puzzle.'],
    tips: ['Start with rows or boxes that have many givens.', 'Look for single possible positions.'],
  },
};
