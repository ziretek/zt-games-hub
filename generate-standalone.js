const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf-8');

const GAMES = [
    { id: 'checkers', name: 'Checkers', class: "CheckersGame('checkerGame')" },
    { id: 'connect4', name: 'Connect 4', class: 'Connect4Game()' },
    { id: 'minesweeper', name: 'Minesweeper', class: 'MinesweeperGame()' },
    { id: 'memory', name: 'Memory', class: 'MemoryGame()' },
    { id: 'snake', name: 'Snake', class: 'SnakeGame()' },
    { id: 'tictactoe', name: 'Tic-Tac-Toe', class: 'TicTacToeGame()' },
    { id: 'hangman', name: 'Hangman', class: 'HangmanGame()' },
    { id: 'game2048', name: '2048', class: 'Game2048()' },
    { id: 'pong', name: 'Pong', class: 'PongGame()', loop: true },
    { id: 'breakout', name: 'Breakout', class: 'BreakoutGame()', loop: true },
    { id: 'othello', name: 'Othello', class: 'OthelloGame()' },
    { id: 'battleship', name: 'Battleship', class: 'BattleshipGame()' },
    { id: 'gomoku', name: 'Gomoku', class: 'GomokuGame()' },
    { id: 'simon', name: 'Simon', class: 'SimonGame()' },
    { id: 'mastermind', name: 'Mastermind', class: 'MastermindGame()' },
    { id: 'invaders', name: 'Space Invaders', class: 'SpaceInvadersGame()', loop: true },
    { id: 'flappy', name: 'Flappy Bird', class: 'FlappyBirdGame()', loop: true },
    { id: 'dino', name: 'Dino Runner', class: 'DinoRunnerGame()', loop: true },
    { id: 'countmaster', name: 'Count Master', class: 'CountMasterGame()', loop: true },
    { id: 'wordle', name: 'Wordle', class: 'WordleGame()' },
    { id: 'boggle', name: 'Boggle', class: 'BoggleGame()', loop: true },
    { id: 'anagrams', name: 'Anagrams', class: 'AnagramsGame()' },
    { id: 'wordsearch', name: 'Word Search', class: 'WordSearchGame()', loop: true },
    { id: 'typingtest', name: 'Typing Test', class: 'TypingTestGame()', loop: true },
    { id: 'spellingbee', name: 'Spelling Bee', class: 'SpellingBeeGame()' },
    { id: 'penaltykicker', name: 'Penalty Kicker', class: 'PenaltyKickerGame()', loop: true },
    { id: 'basketball', name: 'Basketball', class: 'BasketballGame()', loop: true },
    { id: 'sprint', name: 'Sprint', class: 'SprintGame()', loop: true },
    { id: 'bowling', name: 'Bowling', class: 'BowlingGame()', loop: true },
    { id: 'archery', name: 'Archery', class: 'ArcheryGame()', loop: true },
    { id: 'baseball', name: 'Baseball', class: 'BaseballGame()', loop: true }
];

function extractWrapper(html, id) {
    const startMarker = `<div id="${id}-wrapper" class="gw">`;
    const startIdx = html.indexOf(startMarker);
    if (startIdx === -1) return null;

    // After the wrapper, the next sibling start or game-view closing div
    // Find the next `<div id="X-wrapper"` or `</div>` after game-view
    const afterStart = startIdx + startMarker.length;
    const rest = html.slice(afterStart);

    // Walk through and count div depth
    let depth = 1;
    let pos = 0;
    while (pos < rest.length && depth > 0) {
        // Check for HTML comment
        if (rest.startsWith('<!--', pos)) {
            const endComment = rest.indexOf('-->', pos + 4);
            if (endComment === -1) break;
            pos = endComment + 3;
            continue;
        }
        // Check for tag
        if (rest[pos] === '<') {
            const gt = rest.indexOf('>', pos);
            if (gt === -1) break;
            const tag = rest.slice(pos + 1, gt).split(/\s/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
            const isClosing = rest[pos + 1] === '/';
            const isSelfClosing = rest[gt - 1] === '/' ||
                ['br','hr','img','input','meta','link','area','base','col','embed','source','track','wbr','canvas'].includes(tag);

            if (isClosing) {
                depth--;
            } else if (!isSelfClosing) {
                depth++;
            }
            pos = gt + 1;
        } else {
            pos++;
        }
    }

    return rest.slice(0, pos);
}

// Read GAMES config from script.js for categories
const scriptJs = fs.readFileSync('script.js', 'utf-8');
const gamesMatch = scriptJs.match(/const GAMES = \[([\s\S]*?)\];/);
const gamesData = {};
if (gamesMatch) {
    const idCatMatches = gamesMatch[1].matchAll(/id:\s*'(\w+)'[\s\S]*?category:\s*'(\w+)'/g);
    for (const m of idCatMatches) {
        gamesData[m[1]] = m[2];
    }
}

const catNames = { board: 'Board', puzzle: 'Puzzle', arcade: 'Arcade', word: 'Word', sports: 'Sports' };
const catIcons = { board: '♟️', puzzle: '🧩', arcade: '🕹️', word: '📝', sports: '⚽' };

for (const game of GAMES) {
    const cat = gamesData[game.id] || 'arcade';
    const wrapperHtml = extractWrapper(indexHtml, game.id);
    if (!wrapperHtml) {
        console.error(`Wrapper not found for ${game.id}`);
        continue;
    }

    const needsInit = game.loop ? `window[key].init();` : '';

    const standaloneHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${game.name} - Game Hub</title>
    <meta name="description" content="Play ${game.name} online">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <canvas id="aiBackground"></canvas>

    <div class="standalone-bar">
        <button onclick="location.href='index.html'" class="standalone-back" aria-label="Back to Hub">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5m7-7-7 7 7 7"/></svg>
            Hub
        </button>
        <span class="standalone-title">${catIcons[cat] || '🎮'} ${game.name}</span>
        <span class="standalone-category">${catNames[cat] || 'Game'}</span>
    </div>

    <div id="${game.id}-wrapper" class="gw standalone">
${wrapperHtml.trim()}
</div>

    <script src="script.js"></script>
    <script>
window.addEventListener('load', () => {
    const entry = GAMES.find(g => g.id === '${game.id}');
    if (!entry) return;
    const key = entry.id + 'Game';
    window[key] = entry.create();
    ${needsInit}
    document.getElementById('${game.id}-wrapper').classList.add('active');
    currentBackground = new MarvelBackground('aiBackground');
    document.title = '${game.name} - Game Hub';
});
    </script>
</body>
</html>`;

    const outputPath = `${game.id}.html`;
    fs.writeFileSync(outputPath, standaloneHtml);
    console.log(`Generated ${outputPath}`);
}

console.log('Done! Generated ' + GAMES.length + ' standalone pages.');
