// ============================================================
// Global State
// ============================================================
let currentBackground = null;

// ============================================================
// Animated Canvas Backgrounds
// ============================================================
class Background {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.animationId = null;
        this._paused = false;
        this._dpr = window.devicePixelRatio || 1;
        this.resizeCanvas();
        this._onResize = () => this.resizeCanvas();
        window.addEventListener('resize', this._onResize);
        this.createParticles();
        this.animate();
    }
    pause() { this._paused = true; }
    resume() { this._paused = false; }
    resizeCanvas() {
        this._w = window.innerWidth;
        this._h = window.innerHeight;
        this._w = this._w * this._dpr;
        this.canvas.height = this._h * this._dpr;
        this.ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
        if (this.onResize) this.onResize();
    }
    draw() {}
    createParticles() {}
    updateParticle(p) {}
    animate = () => {
        if (!this._paused) this.draw();
        this.animationId = requestAnimationFrame(this.animate);
    };
    destroy() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        window.removeEventListener('resize', this._onResize);
    }
}

class GradientBackground extends Background {
    createParticles() {
        this.particles = Array.from({ length: 80 }, () => ({
            x: Math.random() * this._w,
            y: Math.random() * this._h,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            size: Math.random() * 4 + 1,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            opacity: Math.random() * 0.5 + 0.3
        }));
    }
    updateParticle(p) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = this._w;
        if (p.x > this._w) p.x = 0;
        if (p.y < 0) p.y = this._h;
        if (p.y > this._h) p.y = 0;
    }
    draw() {
        const g = this.ctx.createLinearGradient(0, 0, this._w, this._h);
        g.addColorStop(0, '#1a0033'); g.addColorStop(0.5, '#330066'); g.addColorStop(1, '#1a0033');
        this.ctx.fillStyle = g; this.ctx.fillRect(0, 0, this._w, this._h);
        this.particles.forEach(p => {
            this.updateParticle(p);
            this.ctx.globalAlpha = p.opacity;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;
    }
}

class NeuralNetwork extends Background {
    createParticles() {
        this.nodes = Array.from({ length: 50 }, () => ({
            x: Math.random() * this._w,
            y: Math.random() * this._h,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            size: Math.random() * 3 + 2
        }));
    }
    updateParticle(n) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > this._w) n.vx = -n.vx;
        if (n.y < 0 || n.y > this._h) n.vy = -n.vy;
    }
    draw() {
        this.ctx.fillStyle = '#0a0e27'; this.ctx.fillRect(0, 0, this._w, this._h);
        const cd = 150;
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const dx = this.nodes[i].x - this.nodes[j].x, dy = this.nodes[i].y - this.nodes[j].y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < cd) {
                    this.ctx.strokeStyle = `rgba(102, 126, 234, ${1 - d / cd})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.nodes[i].x, this.nodes[i].y);
                    this.ctx.lineTo(this.nodes[j].x, this.nodes[j].y);
                    this.ctx.stroke();
                }
            }
        }
        this.nodes.forEach(n => {
            this.updateParticle(n);
            this.ctx.fillStyle = '#667eea';
            this.ctx.beginPath();
            this.ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
}

class MarvelBackground extends Background {
    onResize() {
        this.lw = window.innerWidth;
        this.lh = window.innerHeight;
        this.createHalftone();
    }
    createParticles() {
        this.lw = window.innerWidth;
        this.lh = window.innerHeight;
        this.actionLines = Array.from({ length: 25 }, () => ({
            x: Math.random() * this.lw, y: Math.random() * this.lh,
            len: Math.random() * 120 + 40, speed: Math.random() * 2 + 0.5,
            thick: Math.random() * 1.5 + 0.3, alpha: Math.random() * 0.06 + 0.02
        }));
        this.comicParticles = Array.from({ length: 30 }, () => ({
            x: Math.random() * this.lw, y: Math.random() * this.lh,
            vx: (Math.random() - 0.5) * 0.8, vy: (Math.random() - 0.5) * 0.8,
            size: Math.random() * 6 + 3,
            color: ['#EC1C24','#F39200','#FFD700','#1A472A','#003478','#8B0000','#4169E1','#FF4500'][Math.floor(Math.random() * 8)],
            alpha: Math.random() * 0.35 + 0.15, phase: Math.random() * Math.PI * 2
        }));
        this.createHalftone();
    }
    createHalftone() {
        if (!this.lw) return;
        this.halftone = [];
        const spacing = 20;
        for (let x = 0; x < this.lw; x += spacing) {
            for (let y = 0; y < this.lh; y += spacing) {
                this.halftone.push({
                    x: x + Math.random() * 4, y: y + Math.random() * 4,
                    r: Math.random() * 1.2 + 0.4, a: Math.random() * 0.06 + 0.02
                });
            }
        }
    }
    draw() {
        const ctx = this.ctx;
        const w = this.lw || this._w, h = this.lh || this._h;

        // Dark comic background with subtle radial glow
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, w, h);

        // Comic-style radial burst from center
        const glow = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.6);
        glow.addColorStop(0, 'rgba(124, 58, 237, 0.12)');
        glow.addColorStop(0.4, 'rgba(60, 20, 120, 0.06)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);

        // Halftone dots (comic book effect)
        for (const d of this.halftone) {
            ctx.fillStyle = `rgba(255, 255, 255, ${d.a})`;
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Action/speed lines (comic motion effect)
        for (const l of this.actionLines) {
            l.x += l.speed;
            if (l.x - l.len > w) { l.x = -l.len; l.y = Math.random() * h; }
            ctx.strokeStyle = `rgba(255, 255, 255, ${l.alpha})`;
            ctx.lineWidth = l.thick;
            ctx.beginPath();
            ctx.moveTo(l.x, l.y);
            ctx.lineTo(l.x + l.len, l.y);
            ctx.stroke();
        }

        // Hero particles with trails
        for (const p of this.comicParticles) {
            p.x += p.vx; p.y += p.vy;
            p.phase += 0.02;
            if (p.x < -30) p.x = w + 30; if (p.x > w + 30) p.x = -30;
            if (p.y < -30) p.y = h + 30; if (p.y > h + 30) p.y = -30;

            const pulse = 0.7 + 0.3 * Math.sin(p.phase);

            // Glow ring
            ctx.globalAlpha = p.alpha * 0.2 * pulse;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
            ctx.fill();

            // Outer ring
            ctx.globalAlpha = p.alpha * 0.4 * pulse;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 1.8, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.globalAlpha = p.alpha * pulse;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Vignette edges (comic panel feel)
        const vig = ctx.createRadialGradient(w * 0.5, h * 0.5, h * 0.25, w * 0.5, h * 0.5, h * 0.85);
        vig.addColorStop(0, 'rgba(0,0,0,0)');
        vig.addColorStop(1, 'rgba(0,0,0,0.45)');
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, w, h);

        // Comic top/bottom bars (cinematic letterbox)
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(0, 0, w, 2);
        ctx.fillRect(0, h - 2, w, 2);
    }
}



// ============================================================
// Checkers Game (AI with minimax)
// ============================================================
class CheckersGame {
    constructor(elementId) {
        this.el = document.getElementById(elementId);
        this.board = [];
        this.selected = null;
        this.turn = 'red';
        this.vsComputer = false;
        this.computerSide = 'black';
        this.validMoves = [];
        this.capturedRed = 0;
        this.capturedBlack = 0;
        this.gameOver = false;
        this.winner = null;
        this.lastMove = null;
        this.wins = { red: parseInt(localStorage.getItem('ckRedWins') || '0'), black: parseInt(localStorage.getItem('ckBlackWins') || '0') };
        this.init();
    }

    init() {
        this.el.innerHTML = '';
        this.createBoard();
        this.render();
        if (!this._delegates) {
            this._delegates = true;
            this.el.addEventListener('click', (e) => {
                const cell = e.target.closest('[data-r]');
                if (!cell) return;
                this.onCellClick(e, +cell.dataset.r, +cell.dataset.c);
            });
        }
    }

    createBoard() {
        this.board = new Array(8).fill(0).map(() => new Array(8).fill(null));
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 8; c++) {
                if ((r + c) % 2 === 1) this.board[r][c] = 'b';
            }
        }
        for (let r = 5; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if ((r + c) % 2 === 1) this.board[r][c] = 'r';
            }
        }
        this.capturedRed = 0;
        this.capturedBlack = 0;
        this.selected = null;
        this.validMoves = [];
        this.gameOver = false;
        this.winner = null;
        this.lastMove = null;
    }

    getSide(piece) {
        if (!piece) return null;
        return (piece === 'r' || piece === 'R') ? 'red' : 'black';
    }

    isKing(piece) {
        return piece === 'R' || piece === 'B';
    }

    opponent(side) {
        return side === 'red' ? 'black' : 'red';
    }

    render() {
        this.el.innerHTML = '';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = document.createElement('div');
                cell.className = `cell ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
                cell.dataset.r = r;
                cell.dataset.c = c;

                const isSelected = this.selected && this.selected[0] === r && this.selected[1] === c;
                const isValid = this.selected && this.validMoves.some(m => m.tr === r && m.tc === c);
                if (isValid) cell.classList.add('valid-move');
                if (isSelected) cell.classList.add('selected');
                if (this.lastMove && ((this.lastMove[0] === r && this.lastMove[1] === c) || (this.lastMove[2] === r && this.lastMove[3] === c)))
                    cell.classList.add('last-move');

                if (this.board[r][c]) {
                    const piece = document.createElement('span');
                    const p = this.board[r][c];
                    piece.className = `piece ${p === 'r' || p === 'R' ? 'red' : 'black'}`;
                    if (p === 'R' || p === 'B') piece.classList.add('king');
                    cell.appendChild(piece);
                }

                this.el.appendChild(cell);
            }
        }
        this.updateUI();
    }

    onCellClick(e, r, c) {
        if (this.gameOver) return;
        if (this.vsComputer && this.turn === this.computerSide) return;

        const piece = this.board[r][c];
        const pieceSide = this.getSide(piece);

        if (this.selected) {
            const move = this.validMoves.find(m => m.tr === r && m.tc === c);
            if (move) {
                const [sr, sc] = this.selected;
                const hasMoreCaptures = this.doMove(sr, sc, r, c);
                this.lastMove = [sr, sc, r, c];
                if (hasMoreCaptures) {
                    this.selected = [r, c];
                    this.validMoves = this.getCaptureDestinations(r, c);
                } else {
                    this.selected = null;
                    this.validMoves = [];
                    this.completeTurn();
                }
                this.render();
                return;
            }
        }

        if (piece && pieceSide === this.turn && !this.selected) {
            this.selected = [r, c];
            this.validMoves = this.getValidDestinations(r, c);
            this.render();
        } else {
            this.selected = null;
            this.validMoves = [];
            this.render();
        }
    }

    getValidDestinations(r, c) {
        const piece = this.board[r][c];
        if (!piece) return [];
        const side = this.getSide(piece);
        const destinations = [];
        const captures = this.getCaptures(r, c, side);
        if (captures.length > 0) {
            for (const cap of captures) destinations.push({ tr: cap.tr, tc: cap.tc });
        } else if (!this.hasAnyCapture(side)) {
            const simpleMoves = this.getSimpleMoves(r, c, side);
            for (const m of simpleMoves) destinations.push({ tr: m.tr, tc: m.tc });
        }
        return destinations;
    }

    getCaptureDestinations(r, c) {
        const piece = this.board[r][c];
        if (!piece) return [];
        const side = this.getSide(piece);
        return this.getCaptures(r, c, side).map(cap => ({ tr: cap.tr, tc: cap.tc }));
    }

    doMove(sr, sc, tr, tc) {
        const piece = this.board[sr][sc];
        const side = this.getSide(piece);
        const dr = tr - sr;
        const dc = tc - sc;

        this.board[tr][tc] = piece;
        this.board[sr][sc] = null;

        let wasCapture = false;
        if (Math.abs(dr) === 2 && Math.abs(dc) === 2) {
            wasCapture = true;
            const mr = sr + dr / 2;
            const mc = sc + dc / 2;
            const captured = this.board[mr][mc];
            this.board[mr][mc] = null;
            if (captured === 'r' || captured === 'R') this.capturedBlack++;
            else this.capturedRed++;
        }

        if (side === 'red' && tr === 0 && piece === 'r') this.board[tr][tc] = 'R';
        if (side === 'black' && tr === 7 && piece === 'b') this.board[tr][tc] = 'B';

        if (wasCapture && this.getCaptures(tr, tc, side).length > 0) return true;
        return false;
    }

    pause() { if (this._aiTimer) { clearTimeout(this._aiTimer); this._aiTimer = null; } }

    _scheduleAI() {
        this._aiTimer = setTimeout(() => { this._aiTimer = null; this.aiMove(); }, 300);
    }

    completeTurn() {
        this.checkGameOver();
        if (this.gameOver) {
            const w = this.winner === 'Red' ? 'red' : 'black';
            this.wins[w]++;
            localStorage.setItem('ckRedWins', String(this.wins.red));
            localStorage.setItem('ckBlackWins', String(this.wins.black));
            this.render(); return;
        }
        this.switchTurn();
        if (this.vsComputer && this.turn === this.computerSide) {
            this._scheduleAI();
        }
    }

    switchTurn() {
        this.turn = this.turn === 'red' ? 'black' : 'red';
    }

    updateUI() {
        const turnEl = document.getElementById('turnIndicator');
        if (turnEl) {
            if (this.gameOver) {
                turnEl.textContent = '🏆 ' + this.winner + ' wins!';
                turnEl.style.color = '#ffd700';
            } else {
                turnEl.textContent = 'Turn: ' + (this.turn.charAt(0).toUpperCase() + this.turn.slice(1));
                turnEl.style.color = '#ffd700';
            }
        }
        const scoreEl = document.getElementById('scoreDisplay');
        if (scoreEl) {
            scoreEl.textContent = 'Red: ' + (12 - this.capturedRed) + ' | Black: ' + (12 - this.capturedBlack) + '  |  W: ' + this.wins.red + '-' + this.wins.black;
        }
        const overlay = document.getElementById('gameOverOverlay');
        if (overlay) {
            overlay.style.display = this.gameOver ? 'flex' : 'none';
            if (this.gameOver) {
                const wt = overlay.querySelector('.winner-text');
                if (wt) wt.textContent = '🏆 ' + this.winner + ' wins!';
            }
        }
    }

    hasAnyCapture(side, board) {
        board = board || this.board;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.getSide(board[r][c]) !== side) continue;
                if (this.getCaptures(r, c, side, board).length > 0) return true;
            }
        }
        return false;
    }

    getSimpleMoves(r, c, side, board) {
        board = board || this.board;
        const piece = board[r][c];
        const moves = [];
        const forward = side === 'red' ? -1 : 1;
        const dirs = this.isKing(piece) ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : [[forward, 1], [forward, -1]];

        for (const [dr, dc] of dirs) {
            const tr = r + dr;
            const tc = c + dc;
            if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8 && board[tr][tc] === null) {
                moves.push({ sr: r, sc: c, tr, tc, captured: [] });
            }
        }
        return moves;
    }

    getCaptures(r, c, side, board) {
        board = board || this.board;
        const piece = board[r][c];
        const captures = [];
        const forward = side === 'red' ? -1 : 1;
        const isK = piece === 'R' || piece === 'B';
        const dirs = isK ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : [[forward, 1], [forward, -1]];

        for (const [dr, dc] of dirs) {
            const tr = r + dr * 2;
            const tc = c + dc * 2;
            const mr = r + dr;
            const mc = c + dc;
            if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8 && board[tr][tc] === null) {
                const mid = board[mr][mc];
                if (mid && this.getSide(mid) !== side) {
                    captures.push({ sr: r, sc: c, tr, tc, captured: [{ r: mr, c: mc }] });
                }
            }
        }
        return captures;
    }

    getCaptureSequences(r, c, side, board) {
        board = board || this.board;
        const sequences = [];

        const findSequences = (row, col, bd, sequence) => {
            const p = bd[row][col];
            const forward = side === 'red' ? -1 : 1;
            const isK = p === 'R' || p === 'B';
            const dirs = isK ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : [[forward, 1], [forward, -1]];
            let foundCapture = false;

            for (const [dr, dc] of dirs) {
                const tr = row + dr * 2;
                const tc = col + dc * 2;
                const mr = row + dr;
                const mc = col + dc;
                if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8 && bd[tr][tc] === null) {
                    const mid = bd[mr][mc];
                    if (mid && this.getSide(mid) !== side) {
                        foundCapture = true;
                        const newBoard = bd.map(r => [...r]);
                        let newPiece = newBoard[row][col];
                        newBoard[tr][tc] = newPiece;
                        newBoard[row][col] = null;
                        newBoard[mr][mc] = null;
                        if (newPiece === 'r' && tr === 0) newBoard[tr][tc] = 'R';
                        if (newPiece === 'b' && tr === 7) newBoard[tr][tc] = 'B';
                        findSequences(tr, tc, newBoard, [...sequence, { sr: row, sc: col, tr, tc, captured: [{ r: mr, c: mc }] }]);
                    }
                }
            }

            if (!foundCapture && sequence.length > 0) sequences.push([...sequence]);
        };

        findSequences(r, c, board.map(r => [...r]), []);
        return sequences;
    }

    getAllMoves(side, board) {
        board = board || this.board;
        const sequences = [];
        const hasCaptures = this.hasAnyCapture(side, board);

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.getSide(board[r][c]) !== side) continue;
                if (hasCaptures) {
                    const capSeqs = this.getCaptureSequences(r, c, side, board);
                    for (const seq of capSeqs) sequences.push(seq);
                } else {
                    const simple = this.getSimpleMoves(r, c, side, board);
                    for (const m of simple) sequences.push([m]);
                }
            }
        }
        return sequences;
    }

    executeMoveSequence(sequence, board) {
        board = board || this.board;
        for (const step of sequence) {
            const piece = board[step.sr][step.sc];
            board[step.tr][step.tc] = piece;
            board[step.sr][step.sc] = null;
            for (const cpt of step.captured) {
                const cap = board[cpt.r][cpt.c];
                if (board === this.board) {
                    if (cap === 'r' || cap === 'R') this.capturedBlack++;
                    else this.capturedRed++;
                }
                board[cpt.r][cpt.c] = null;
            }
            if (piece === 'r' && step.tr === 0) board[step.tr][step.tc] = 'R';
            if (piece === 'b' && step.tr === 7) board[step.tr][step.tc] = 'B';
        }
    }

    countPieces(board) {
        board = board || this.board;
        let red = 0, black = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (p === 'r' || p === 'R') red++;
                if (p === 'b' || p === 'B') black++;
            }
        }
        return { red, black };
    }

    checkGameOver() {
        const { red, black } = this.countPieces();
        if (red === 0) { this.gameOver = true; this.winner = 'Black'; return true; }
        if (black === 0) { this.gameOver = true; this.winner = 'Red'; return true; }
        const moves = this.getAllMoves(this.turn);
        if (moves.length === 0) { this.gameOver = true; this.winner = this.turn === 'red' ? 'Black' : 'Red'; return true; }
        return false;
    }

    newGame() {
        this.pause();
        this.createBoard();
        this.turn = 'red';
        this.render();
    }

    toggleComputer() {
        this.vsComputer = !this.vsComputer;
        const btn = document.getElementById('vsComputerBtn');
        if (btn) btn.textContent = 'Vs Computer: ' + (this.vsComputer ? 'On' : 'Off');
        if (this.vsComputer && this.turn === this.computerSide && !this.gameOver) {
            this._scheduleAI();
        }
    }

    applySeq(board, seq) {
        const b = board.map(r => [...r]);
        for (const step of seq) {
            const p = b[step.sr][step.sc];
            b[step.tr][step.tc] = p;
            b[step.sr][step.sc] = null;
            for (const cpt of step.captured) b[cpt.r][cpt.c] = null;
            if (p === 'r' && step.tr === 0) b[step.tr][step.tc] = 'R';
            if (p === 'b' && step.tr === 7) b[step.tr][step.tc] = 'B';
        }
        return b;
    }

    aiMove() {
        if (this.gameOver) return;
        const side = this.computerSide;
        const allMoves = this.getAllMoves(side);
        if (allMoves.length === 0) return;

        let bestScore = -Infinity;
        let bestSequence = null;

        for (const sequence of allMoves) {
            const simBoard = this.applySeq(this.board, sequence);
            const oppSide = this.opponent(side);
            const oppMoves = this.getAllMoves(oppSide, simBoard);
            if (oppMoves.length === 0) {
                bestSequence = sequence;
                break;
            }

            const score = this.minimax(simBoard, 3, -Infinity, Infinity, false, oppSide);
            if (score > bestScore) {
                bestScore = score;
                bestSequence = sequence;
            }
        }

        if (bestSequence) {
            this.executeMoveSequence(bestSequence);
            this.render();
            this.completeTurn();
        }
    }

    minimax(board, depth, alpha, beta, isMaximizing, side) {
        const { red, black } = this.countPieces(board);
        const cs = this.computerSide;

        if (red === 0) return cs === 'black' ? 1000 + depth : -1000 - depth;
        if (black === 0) return cs === 'red' ? 1000 + depth : -1000 - depth;

        const moves = this.getAllMoves(side, board);
        if (moves.length === 0) return side === cs ? -1000 - depth : 1000 + depth;
        if (depth === 0) return this.evaluate(board, cs);

        const oppSide = this.opponent(side);

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const seq of moves) {
                const nb = this.applySeq(board, seq);
                const om = this.getAllMoves(oppSide, nb);
                if (om.length === 0) return 1000 + depth;
                const val = this.minimax(nb, depth - 1, alpha, beta, false, oppSide);
                maxEval = Math.max(maxEval, val);
                alpha = Math.max(alpha, val);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const seq of moves) {
                const nb = this.applySeq(board, seq);
                const om = this.getAllMoves(oppSide, nb);
                if (om.length === 0) return -1000 - depth;
                const val = this.minimax(nb, depth - 1, alpha, beta, true, oppSide);
                minEval = Math.min(minEval, val);
                beta = Math.min(beta, val);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    evaluate(board, side) {
        let score = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const p = board[r][c];
                if (!p) continue;
                const value = (p === 'R' || p === 'B') ? 5 : 3;
                const pSide = this.getSide(p);
                const sign = pSide === side ? 1 : -1;
                score += sign * value;
                if (p === 'r') score += sign * (7 - r) * 0.2;
                if (p === 'b') score += sign * r * 0.2;
            }
        }
        return score;
    }
}

// ============================================================
// Minesweeper
class MinesweeperGame {
    constructor(rows = 9, cols = 9, mines = 10) {
        this.rows = rows;
        this.cols = cols;
        this.mineCount = mines;
        this.boardEl = document.getElementById('minesweeper-board');
        this.mineCountEl = document.getElementById('ms-mine-count');
        this.timerEl = document.getElementById('ms-timer');
        this.grid = [];
        this.revealed = [];
        this.flagged = [];
        this.gameOver = false;
        this.won = false;
        this.firstClick = true;
        this.timer = 0;
        this.timerInterval = null;
        this.flagCount = 0;
        this._flagMode = false;
        this.init();
    }

    placeMines(safeR, safeC) {
        let placed = 0;
        while (placed < this.mineCount) {
            const r = Math.floor(Math.random() * this.rows);
            const c = Math.floor(Math.random() * this.cols);
            if (this.grid[r][c] === -1) continue;
            if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
            this.grid[r][c] = -1;
            placed++;
        }
        for (let r = 0; r < this.rows; r++)
            for (let c = 0; c < this.cols; c++)
                if (this.grid[r][c] !== -1)
                    this.grid[r][c] = this.countAdjacentMines(r, c);
    }

    countAdjacentMines(r, c) {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++)
            for (let dc = -1; dc <= 1; dc++) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols && this.grid[nr][nc] === -1)
                    count++;
            }
        return count;
    }

    startTimer() {
        if (this.timerInterval) return;
        this.timerInterval = setInterval(() => {
            this.timer++;
            if (this.timerEl) this.timerEl.textContent = 'Time: ' + this.timer;
        }, 1000);
    }

    pause() { this.stopTimer(); }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    reveal(r, c) {
        if (this.gameOver || this.won) return;
        if (this.revealed[r][c] || this.flagged[r][c]) return;

        if (this.firstClick) {
            this.placeMines(r, c);
            this.firstClick = false;
            this.startTimer();
        }

        this.revealed[r][c] = true;

        if (this.grid[r][c] === -1) {
            this.gameOver = true;
            this.stopTimer();
            this.revealAllMines();
            this.render();
            return;
        }

        if (this.grid[r][c] === 0)
            this.floodFill(r, c);

        this.checkWin();
        this.render();
    }

    floodFill(r, c) {
        for (let dr = -1; dr <= 1; dr++)
            for (let dc = -1; dc <= 1; dc++) {
                const nr = r + dr, nc = c + dc;
                if (nr < 0 || nr >= this.rows || nc < 0 || nc >= this.cols) continue;
                if (this.revealed[nr][nc] || this.flagged[nr][nc]) continue;
                this.revealed[nr][nc] = true;
                if (this.grid[nr][nc] === 0)
                    this.floodFill(nr, nc);
            }
    }

    flag(r, c) {
        if (this.gameOver || this.won) return;
        if (this.revealed[r][c]) return;
        if (!this.flagged[r][c] && this.flagCount >= this.mineCount) return;
        this.flagged[r][c] = !this.flagged[r][c];
        this.flagCount += this.flagged[r][c] ? 1 : -1;
        if (this.mineCountEl)
            this.mineCountEl.textContent = 'Mines: ' + (this.mineCount - this.flagCount);
        this.checkWin();
        this.render();
    }

    revealAllMines() {
        for (let r = 0; r < this.rows; r++)
            for (let c = 0; c < this.cols; c++)
                if (this.grid[r][c] === -1)
                    this.revealed[r][c] = true;
    }

    checkWin() {
        let totalSafe = this.rows * this.cols - this.mineCount;
        let revealedSafe = 0;
        for (let r = 0; r < this.rows; r++)
            for (let c = 0; c < this.cols; c++)
                if (this.grid[r][c] !== -1 && this.revealed[r][c])
                    revealedSafe++;
        if (revealedSafe === totalSafe) {
            this.won = true;
            this.stopTimer();
        }
    }

    init() {
        this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
        this.revealed = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
        this.flagged = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
        this.gameOver = false;
        this.won = false;
        this.firstClick = true;
        this.flagCount = 0;
        this._flagMode = false;
        this.stopTimer();
        this.timer = 0;
        if (this.timerEl) this.timerEl.textContent = 'Time: 0';
        if (this.mineCountEl) this.mineCountEl.textContent = 'Mines: ' + this.mineCount;
        const flagBtn = document.getElementById('ms-flag-btn');
        if (flagBtn) flagBtn.classList.remove('active');
        this.render();
        if (!this._delegates) {
            this._delegates = true;
            this.boardEl.addEventListener('click', (e) => {
                const cell = e.target.closest('[data-r]');
                if (!cell || this.gameOver || this.won) return;
                if (this._flagMode) {
                    this.flag(+cell.dataset.r, +cell.dataset.c);
                } else {
                    this.reveal(+cell.dataset.r, +cell.dataset.c);
                }
            });
            this.boardEl.addEventListener('contextmenu', (e) => {
                const cell = e.target.closest('[data-r]');
                if (!cell) return;
                e.preventDefault();
                this.flag(+cell.dataset.r, +cell.dataset.c);
            });
            if (flagBtn && !flagBtn._listener) {
                flagBtn._listener = true;
                flagBtn.addEventListener('click', () => {
                    this._flagMode = !this._flagMode;
                    flagBtn.classList.toggle('active', this._flagMode);
                    flagBtn.textContent = this._flagMode ? '🚩 Dig' : '🚩 Flag';
                });
            }
        }
    }

    render() {
        this.boardEl.innerHTML = '';
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'ms-cell';

                if (this.revealed[r][c]) {
                    if (this.grid[r][c] === -1) {
                        cell.classList.add('ms-cell-mine');
                        cell.textContent = '💣';
                    } else if (this.grid[r][c] > 0) {
                        cell.classList.add('ms-cell-revealed', 'ms-num-' + this.grid[r][c]);
                        cell.textContent = this.grid[r][c];
                    } else {
                        cell.classList.add('ms-cell-revealed');
                    }
                } else if (this.flagged[r][c]) {
                    cell.classList.add('ms-cell-flagged');
                    cell.textContent = '🚩';
                } else {
                    cell.classList.add('ms-cell-hidden');
                }

                cell.dataset.r = r;
                cell.dataset.c = c;

                this.boardEl.appendChild(cell);
            }
        }

        if (this.gameOver || this.won) {
            const overlay = document.createElement('div');
            overlay.className = 'ms-gameover-overlay';
            const text = document.createElement('div');
            text.className = 'ms-gameover-text';
            text.textContent = this.won ? 'You Win!' : 'Game Over';
            overlay.appendChild(text);
            const btn = document.createElement('button');
            btn.textContent = 'Play Again';
            btn.addEventListener('click', () => this.init());
            overlay.appendChild(btn);
            this.boardEl.appendChild(overlay);
        }
    }
}

// ============================================================
// Memory / Match Game
// ============================================================
const MEMORY_ICONS = ['🐶', '🐱', '🐸', '🦊', '🐻', '🐼', '🐨', '🦁'];

class MemoryGame {
    constructor() {
        this.boardEl = document.getElementById('memory-board');
        this.movesEl = document.getElementById('mem-moves');
        this.scoreEl = document.getElementById('mem-score');
        this.cards = [];
        this.flipped = [];
        this.matchedSet = new Set();
        this.matched = 0;
        this.moves = 0;
        this.locked = false;
        this.init();
    }

    init() {
        this.cards = [...MEMORY_ICONS, ...MEMORY_ICONS];
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
        this.flipped = [];
        this.matchedSet = new Set();
        this.matched = 0;
        this.moves = 0;
        this.locked = false;
        if (this.movesEl) this.movesEl.textContent = 'Moves: 0';
        if (this.scoreEl) this.scoreEl.textContent = 'Pairs: 0 / ' + MEMORY_ICONS.length;
        this.render();
        if (!this._delegates) {
            this._delegates = true;
            this.boardEl.addEventListener('click', (e) => {
                const card = e.target.closest('.mem-card');
                if (!card) return;
                const i = +card.dataset.i;
                if (isNaN(i) || this.matchedSet.has(i)) return;
                this.flip(i);
            });
        }
    }

    flip(index) {
        if (this.locked) return;
        if (this.flipped.includes(index)) return;
        if (this.matchedSet.has(index)) return;
        if (this.flipped.length === 2) return;

        this.flipped.push(index);
        this.render();

        if (this.flipped.length === 2) {
            this.moves++;
            if (this.movesEl) this.movesEl.textContent = 'Moves: ' + this.moves;

            const [i, j] = this.flipped;
            if (this.cards[i] === this.cards[j]) {
                this.matched++;
                this.matchedSet.add(i);
                this.matchedSet.add(j);
                if (this.scoreEl) this.scoreEl.textContent = 'Pairs: ' + this.matched + ' / ' + MEMORY_ICONS.length;
                this.flipped = [];
                this.render();
                this.checkWin();
            } else {
                this.locked = true;
                this._flipTimer = setTimeout(() => {
                    this._flipTimer = null;
                    this.flipped = [];
                    this.locked = false;
                    this.render();
                }, 700);
            }
        }
    }

    pause() { if (this._flipTimer) { clearTimeout(this._flipTimer); this._flipTimer = null; } }

    checkWin() {
        if (this.matched === MEMORY_ICONS.length) {
            this._flipTimer = setTimeout(() => { this._flipTimer = null; this.showWin(); }, 400);
        }
    }

    showWin() {
        const overlay = document.createElement('div');
        overlay.className = 'mem-overlay';
        const text = document.createElement('div');
        text.className = 'mem-overlay-text';
        text.textContent = 'You Win!';
        overlay.appendChild(text);
        const info = document.createElement('div');
        info.className = 'mem-overlay-info';
        info.textContent = this.moves + ' moves';
        overlay.appendChild(info);
        const btn = document.createElement('button');
        btn.className = 'mem-overlay-btn';
        btn.textContent = 'Play Again';
        btn.addEventListener('click', () => { overlay.remove(); this.init(); });
        overlay.appendChild(btn);
        this.boardEl.appendChild(overlay);
    }

    render() {
        this.boardEl.innerHTML = '';
        this.cards.forEach((icon, i) => {
            const card = document.createElement('div');
            card.className = 'mem-card';

            const isMatched = this.matchedSet.has(i);
            const isFlipped = this.flipped.includes(i) || isMatched;

            if (isMatched) card.classList.add('matched');
            if (isFlipped) card.classList.add('flipped');

            const inner = document.createElement('div');
            inner.className = 'mem-card-inner';

            const back = document.createElement('div');
            back.className = 'mem-card-back';

            const front = document.createElement('div');
            front.className = 'mem-card-front';
            front.textContent = icon;

            inner.appendChild(back);
            inner.appendChild(front);
            card.appendChild(inner);
            this.boardEl.appendChild(card);
        });
    }
}

// ============================================================
// Snake Game
// ============================================================
class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('snake-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreEl = document.getElementById('snake-score');
        this.highScoreEl = document.getElementById('snake-high-score');
        this.highScore = parseInt(localStorage.getItem('snakeHighScore') || '0');
        this.gridSize = 20;
        this.tileCount = 20;
        this.animationId = null;
        this._dpr = window.devicePixelRatio || 1;
    }

    init() {
        const base = 400;
        this.canvas.width = base * this._dpr;
        this.canvas.height = base * this._dpr;
        this.gridSize = 20 * this._dpr;
        this.snake = [
            { x: 5, y: 5 },
            { x: 4, y: 5 },
            { x: 3, y: 5 }
        ];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.food = this.spawnFood();
        this.score = 0;
        this.gameOver = false;
        this.won = false;
        this.speed = 280;
        this.lastUpdate = 0;
        if (this.scoreEl) this.scoreEl.textContent = 'Score: 0';
        if (this.highScoreEl) this.highScoreEl.textContent = 'Best: ' + this.highScore;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.lastUpdate = performance.now();
        this.loop = (now) => {
            if (now - this.lastUpdate > this.speed) {
                this.lastUpdate = now;
                this.update();
            }
            this.draw();
            if (!this.gameOver) this.animationId = requestAnimationFrame(this.loop);
        };
        this.animationId = requestAnimationFrame(this.loop);
        this._addTouchControls();
    }

    _addTouchControls() {
        let sx = 0, sy = 0;
        const onStart = (e) => {
            const t = e.touches[0];
            sx = t.clientX; sy = t.clientY;
        };
        const onEnd = (e) => {
            if (this.gameOver) return;
            const t = e.changedTouches[0];
            const dx = t.clientX - sx, dy = t.clientY - sy;
            if (Math.abs(dx) > Math.abs(dy)) {
                this.setDirection(dx > 0 ? 1 : -1, 0);
            } else {
                this.setDirection(0, dy > 0 ? 1 : -1);
            }
        };
        this.canvas.addEventListener('touchstart', onStart, { passive: true });
        this.canvas.addEventListener('touchend', onEnd, { passive: true });
    }

    spawnFood() {
        const maxAttempts = 1000;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const x = Math.floor(Math.random() * this.tileCount);
            const y = Math.floor(Math.random() * this.tileCount);
            if (!this.snake.some(s => s.x === x && s.y === y))
                return { x, y };
        }
        return null;
    }

    setDirection(dx, dy) {
        if (this.direction.x !== -dx || this.direction.y !== -dy)
            this.nextDirection = { x: dx, y: dy };
    }

    update() {
        this.direction = { ...this.nextDirection };
        const head = {
            x: this.snake[0].x + this.direction.x,
            y: this.snake[0].y + this.direction.y
        };

        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.endGame();
            return;
        }

        if (this.snake.some(s => s.x === head.x && s.y === head.y)) {
            this.endGame();
            return;
        }

        this.snake.unshift(head);

        if (this.food && head.x === this.food.x && head.y === this.food.y) {
            this.score++;
            if (this.scoreEl) this.scoreEl.textContent = 'Score: ' + this.score;
            this.food = this.spawnFood();
            if (!this.food) { this.won = true; this.endGame(); return; }
            if (this.speed > 120) this.speed -= 5;
        } else {
            this.snake.pop();
        }
    }

    endGame() {
        this.gameOver = true;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', String(this.highScore));
            if (this.highScoreEl) this.highScoreEl.textContent = 'Best: ' + this.highScore;
        }
        this.draw();
    }

    draw() {
        const ctx = this.ctx;
        const ts = this.gridSize;
        const dpr = this._dpr;
        ctx.fillStyle = '#0a0e27';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let x = 0; x < this.tileCount; x++)
            for (let y = 0; y < this.tileCount; y++)
                if ((x + y) % 2 === 0) {
                    ctx.fillStyle = 'rgba(255,255,255,0.02)';
                    ctx.fillRect(x * ts, y * ts, ts, ts);
                }

        if (this.food) {
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(this.food.x * ts + ts / 2, this.food.y * ts + ts / 2, ts / 2 - 2 * dpr, 0, Math.PI * 2);
            ctx.fill();
        }

        this.snake.forEach((s, i) => {
            const t = i / this.snake.length;
            const r = Math.round(46 + t * 80);
            const g = Math.round(204 - t * 80);
            const b = Math.round(113 - t * 40);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            const pad = (i === 0 ? 1 : 2) * dpr;
            ctx.fillRect(s.x * ts + pad, s.y * ts + pad, ts - pad * 2, ts - pad * 2);
            if (i === 0) {
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(s.x * ts + ts * 0.35, s.y * ts + ts * 0.35, 2 * dpr, 0, Math.PI * 2);
                ctx.arc(s.x * ts + ts * 0.65, s.y * ts + ts * 0.65, 2 * dpr, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        if (this.gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.fillStyle = '#ffd700';
            ctx.font = `bold ${28 * dpr}px Segoe UI, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.won ? 'You Win!' : 'Game Over', this.canvas.width / 2, this.canvas.height / 2 - 16 * dpr);
            ctx.fillStyle = '#fff';
            ctx.font = `${14 * dpr}px Segoe UI, sans-serif`;
            ctx.fillText('Score: ' + this.score, this.canvas.width / 2, this.canvas.height / 2 + 16 * dpr);
        }
    }

    pause() { this.destroy(); }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

// ============================================================
// Connect 4
// ============================================================
class Connect4Game {
    constructor() {
        this.ROWS = 6;
        this.COLS = 7;
        this.aiEnabled = false;
        this.reset();
    }

    reset() {
        this.pause();
        this.board = Array.from({ length: this.ROWS }, () => Array(this.COLS).fill(null));
        this.currentPlayer = 'red';
        this.gameOver = false;
        this.winner = null;
        this.previewCol = -1;
        this.render();
        const btn = document.getElementById('c4-ai-btn');
        if (btn) btn.textContent = this.aiEnabled ? 'Vs Computer: On' : 'Vs Computer: Off';
    }

    toggleAI() {
        this.aiEnabled = !this.aiEnabled;
        this.reset();
    }

    drop(col) {
        if (this.gameOver) return false;
        if (this.board[0][col] !== null) return false;
        let row = this.ROWS - 1;
        while (row >= 0 && this.board[row][col] !== null) row--;
        if (row < 0) return false;
        this.board[row][col] = this.currentPlayer;
        if (this.checkWin(row, col, this.currentPlayer)) {
            this.gameOver = true;
            this.winner = this.currentPlayer;
            this.render();
            return true;
        }
        if (this.board[0].every(c => c !== null)) {
            this.gameOver = true;
            this.winner = 'draw';
            this.render();
            return true;
        }
        this.currentPlayer = this.currentPlayer === 'red' ? 'yellow' : 'red';
        this.render();
        if (this.aiEnabled && !this.gameOver && this.currentPlayer === 'yellow') {
            this._scheduleAI();
        }
        return true;
    }

    pause() { if (this._aiTimer) { clearTimeout(this._aiTimer); this._aiTimer = null; } }
    _scheduleAI() { this._aiTimer = setTimeout(() => { this._aiTimer = null; this.aiMove(); }, 300); }

    checkWin(row, col, player) {
        const directions = [[0,1],[1,0],[1,1],[1,-1]];
        for (const [dr, dc] of directions) {
            let count = 1;
            for (let sign of [-1, 1]) {
                let r = row + dr * sign, c = col + dc * sign;
                while (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS && this.board[r][c] === player) {
                    count++;
                    r += dr * sign;
                    c += dc * sign;
                }
            }
            if (count >= 4) return true;
        }
        return false;
    }

    aiMove() {
        if (this.gameOver || this.currentPlayer !== 'yellow') return;
        // Try to win
        for (let c = 0; c < this.COLS; c++) {
            let r = this.getDropRow(c);
            if (r < 0) continue;
            this.board[r][c] = 'yellow';
            if (this.checkWin(r, c, 'yellow')) { this.board[r][c] = null; this.drop(c); return; }
            this.board[r][c] = null;
        }
        // Block red win
        for (let c = 0; c < this.COLS; c++) {
            let r = this.getDropRow(c);
            if (r < 0) continue;
            this.board[r][c] = 'red';
            if (this.checkWin(r, c, 'red')) { this.board[r][c] = null; this.drop(c); return; }
            this.board[r][c] = null;
        }
        // Center preference
        const order = [3, 2, 4, 1, 5, 0, 6];
        for (const c of order) {
            if (this.board[0][c] === null) { this.drop(c); return; }
        }
    }

    getDropRow(col) {
        let r = this.ROWS - 1;
        while (r >= 0 && this.board[r][col] !== null) r--;
        return r;
    }

    render() {
        const board = document.getElementById('connect4-board');
        if (!board) return;
        board.innerHTML = '';
        for (let r = 0; r < this.ROWS; r++) {
            const rowEl = document.createElement('div');
            rowEl.className = 'c4-row';
            for (let c = 0; c < this.COLS; c++) {
                const cell = document.createElement('div');
                cell.className = 'c4-cell';
                const val = this.board[r][c];
                if (val === 'red') cell.classList.add('c4-cell-red');
                else if (val === 'yellow') cell.classList.add('c4-cell-yellow');
                if (this.gameOver && this.winner && this.winner !== 'draw' && val === this.winner) {
                    cell.classList.add('c4-win');
                }
                if (this.gameOver) {
                    cell.style.cursor = 'default';
                } else {
                    cell.addEventListener('click', () => this.drop(c));
                    cell.addEventListener('mouseenter', () => {
                        this.previewCol = c;
                        this.renderPreview();
                    });
                    cell.addEventListener('mouseleave', () => {
                        this.previewCol = -1;
                        this.renderPreview();
                    });
                }
                rowEl.appendChild(cell);
            }
            board.appendChild(rowEl);
        }
        const turnEl = document.getElementById('c4-turn');
        if (turnEl) {
            if (this.gameOver) {
                if (this.winner === 'draw') turnEl.textContent = 'Draw!';
                else turnEl.textContent = `${this.winner.charAt(0).toUpperCase() + this.winner.slice(1)} wins!`;
                turnEl.style.color = '#ffd700';
            } else {
                turnEl.textContent = `Turn: ${this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)}`;
                turnEl.style.color = this.currentPlayer === 'red' ? '#ff6b6b' : '#ffe66d';
            }
        }
    }

    renderPreview() {
        document.querySelectorAll('.c4-preview-red, .c4-preview-yellow').forEach(c => {
            c.classList.remove('c4-preview-red', 'c4-preview-yellow');
        });
        if (this.gameOver || this.previewCol < 0) return;
        const col = this.previewCol;
        let row = this.ROWS - 1;
        while (row >= 0 && this.board[row][col] !== null) row--;
        if (row < 0) return;
        const cell = document.querySelector(`.c4-row:nth-child(${row + 1}) .c4-cell:nth-child(${col + 1})`);
        if (cell) cell.classList.add(this.currentPlayer === 'red' ? 'c4-preview-red' : 'c4-preview-yellow');
    }
}

// ============================================================
// Tic-Tac-Toe
// ============================================================
class TicTacToeGame {
    constructor() {
        this.boardEl = document.getElementById('tictactoe-board');
        this.board = Array(9).fill(null);
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.winner = null;
        this.aiEnabled = true;
        this.winCombo = null;
        this.render();
        if (!this._delegates) {
            this._delegates = true;
            this.boardEl.addEventListener('click', (e) => {
                const cell = e.target.closest('[data-i]');
                if (!cell) return;
                if (this.aiEnabled && this.currentPlayer === 'O') return;
                this.makeMove(+cell.dataset.i);
            });
        }
    }

    init() {
        this.board = Array(9).fill(null);
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.winner = null;
        this.winCombo = null;
        this.render();
    }

    getWinCombo() {
        const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        for (const [a,b,c] of lines) {
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c])
                return [a,b,c];
        }
        return null;
    }

    makeMove(i) {
        if (this.gameOver || this.board[i]) return;
        this.board[i] = this.currentPlayer;
        this.winCombo = this.getWinCombo();
        if (this.winCombo) {
            this.gameOver = true;
            this.winner = this.currentPlayer;
            this.render();
            return;
        }
        if (this.board.every(c => c)) {
            this.gameOver = true;
            this.render();
            return;
        }
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.render();
        if (this.aiEnabled && !this.gameOver && this.currentPlayer === 'O') {
            this._aiTimer = setTimeout(() => { this._aiTimer = null; this.aiMove(); }, 200);
        }
    }

    aiMove() {
        if (this.gameOver || this.currentPlayer !== 'O') return;
        for (let i = 0; i < 9; i++) {
            if (!this.board[i]) {
                this.board[i] = 'O';
                if (this.getWinCombo()) { this.board[i] = null; this.makeMove(i); return; }
                this.board[i] = null;
            }
        }
        for (let i = 0; i < 9; i++) {
            if (!this.board[i]) {
                this.board[i] = 'X';
                if (this.getWinCombo()) { this.board[i] = null; this.makeMove(i); return; }
                this.board[i] = null;
            }
        }
        if (!this.board[4]) { this.makeMove(4); return; }
        const empty = this.board.map((c,i) => c === null ? i : null).filter(i => i !== null);
        if (empty.length > 0) this.makeMove(empty[Math.floor(Math.random() * empty.length)]);
    }

    toggleAI() {
        this.aiEnabled = !this.aiEnabled;
        const btn = document.getElementById('ttt-ai-btn');
        if (btn) btn.textContent = 'Vs Computer: ' + (this.aiEnabled ? 'On' : 'Off');
        this.init();
    }

    render() {
        this.boardEl.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.className = 'ttt-cell';
            cell.dataset.i = i;
            if (this.board[i]) {
                cell.classList.add(this.board[i] === 'X' ? 'ttt-x' : 'ttt-o');
                cell.textContent = this.board[i];
            }
            if (this.winCombo && this.winCombo.includes(i)) cell.classList.add('ttt-win');
            this.boardEl.appendChild(cell);
        }
        const turnEl = document.getElementById('ttt-turn');
        if (turnEl) {
            if (this.gameOver) {
                turnEl.textContent = this.winner ? this.winner + ' wins!' : 'Draw!';
                turnEl.style.color = '#ffd700';
            } else {
                turnEl.textContent = 'Turn: ' + this.currentPlayer;
                turnEl.style.color = this.currentPlayer === 'X' ? '#60a5fa' : '#f472b6';
            }
        }
    }

    pause() {
        if (this._aiTimer) { clearTimeout(this._aiTimer); this._aiTimer = null; }
    }
}

// ============================================================
// Hangman
// ============================================================
class HangmanGame {
    constructor() {
        this.canvas = document.getElementById('hangman-canvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.wordEl = document.getElementById('hang-word-display');
        this.statusEl = document.getElementById('hang-status');
        this.guessesEl = document.getElementById('hang-guesses');
        this.kbEl = document.querySelector('.hang-keyboard');
        this.words = ['JAVASCRIPT','PYTHON','ALGORITHM','FUNCTION','VARIABLE','DATABASE','NETWORK','PROCESSOR','MEMORY','KEYBOARD','MONITOR','BROWSER','SERVER','CLIENT','PROTOCOL','COMPUTER','SCIENCE','ENGINEERING','DEVELOPER','DESIGN','PATTERN','MODULE','COMPONENT','INTERFACE','LIBRARY'];
        this.wins = parseInt(localStorage.getItem('hangWins') || '0');
        this.losses = parseInt(localStorage.getItem('hangLosses') || '0');
        this.init();
    }

    init() {
        this.word = this.words[Math.floor(Math.random() * this.words.length)];
        this.guessed = new Set();
        this.wrongGuesses = 0;
        this.maxWrong = 6;
        this.gameOver = false;
        this._buildKeyboard();
        this.render();
    }

    guess(letter) {
        if (this.gameOver || this.guessed.has(letter)) return;
        this.guessed.add(letter);
        if (!this.word.includes(letter)) this.wrongGuesses++;
        this.checkState();
        this.render();
    }

    checkState() {
        if (this.wrongGuesses >= this.maxWrong) { this.gameOver = true; this.losses++; localStorage.setItem('hangLosses', String(this.losses)); return; }
        if (this.word.split('').every(l => this.guessed.has(l))) { this.gameOver = true; this.wins++; localStorage.setItem('hangWins', String(this.wins)); return; }
    }

    _drawGallows() {
        const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
        ctx.clearRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const gx = 30, gy = 20;
        // Base
        ctx.beginPath(); ctx.moveTo(gx, h - 20); ctx.lineTo(gx + 80, h - 20); ctx.stroke();
        // Pole
        ctx.beginPath(); ctx.moveTo(gx + 20, h - 20); ctx.lineTo(gx + 20, gy); ctx.stroke();
        // Top
        ctx.beginPath(); ctx.moveTo(gx + 20, gy); ctx.lineTo(gx + 70, gy); ctx.stroke();
        // Rope
        ctx.beginPath(); ctx.moveTo(gx + 70, gy); ctx.lineTo(gx + 70, gy + 20); ctx.stroke();

        if (this.wrongGuesses === 0) return;

        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2.5;
        const cx = gx + 70, cy = gy + 20;

        if (this.wrongGuesses >= 1) {
            // Head
            ctx.beginPath(); ctx.arc(cx, cy + 12, 12, 0, Math.PI * 2); ctx.stroke();
        }
        if (this.wrongGuesses >= 2) {
            // Body
            ctx.beginPath(); ctx.moveTo(cx, cy + 24); ctx.lineTo(cx, cy + 60); ctx.stroke();
        }
        if (this.wrongGuesses >= 3) {
            // Left arm
            ctx.beginPath(); ctx.moveTo(cx, cy + 30); ctx.lineTo(cx - 20, cy + 50); ctx.stroke();
        }
        if (this.wrongGuesses >= 4) {
            // Right arm
            ctx.beginPath(); ctx.moveTo(cx, cy + 30); ctx.lineTo(cx + 20, cy + 50); ctx.stroke();
        }
        if (this.wrongGuesses >= 5) {
            // Left leg
            ctx.beginPath(); ctx.moveTo(cx, cy + 60); ctx.lineTo(cx - 18, cy + 85); ctx.stroke();
        }
        if (this.wrongGuesses >= 6) {
            // Right leg
            ctx.beginPath(); ctx.moveTo(cx, cy + 60); ctx.lineTo(cx + 18, cy + 85); ctx.stroke();
        }
    }

    _buildKeyboard() {
        if (!this.kbEl) return;
        this.kbEl.innerHTML = '';
        for (let i = 65; i <= 90; i++) {
            const l = String.fromCharCode(i);
            const btn = document.createElement('button');
            btn.className = 'hang-key';
            btn.textContent = l;
            btn.dataset.letter = l;
            this.kbEl.appendChild(btn);
        }
    }

    render() {
        this._drawGallows();

        if (this.wordEl) {
            this.wordEl.textContent = this.word.split('').map(l => this.guessed.has(l) ? l : '_').join(' ');
        }

        const keys = this.kbEl ? this.kbEl.querySelectorAll('.hang-key') : [];
        for (const btn of keys) {
            const l = btn.dataset.letter;
            btn.className = 'hang-key';
            if (this.guessed.has(l)) {
                btn.classList.add('used', this.word.includes(l) ? 'correct' : 'wrong');
            }
            if (!this.gameOver && !this.guessed.has(l)) {
                btn.onclick = () => this.guess(l);
            } else {
                btn.onclick = null;
            }
        }

        if (this.statusEl) {
            if (this.gameOver) {
                this.statusEl.textContent = this.wrongGuesses >= this.maxWrong ? '💀 You lost! Word: ' + this.word : '🎉 You won!';
                this.statusEl.style.color = '#ffd700';
            } else {
                this.statusEl.textContent = 'Guess the word';
                this.statusEl.style.color = 'var(--text-secondary)';
            }
        }
        if (this.guessesEl) this.guessesEl.textContent = 'Wrong: ' + this.wrongGuesses + ' / ' + this.maxWrong + '  |  W: ' + this.wins + ' L: ' + this.losses;
    }

    pause() {
        if (this._keyHandler) {
            document.removeEventListener('keydown', this._keyHandler);
            this._keyHandler = null;
        }
    }
}

// ============================================================
// 2048
// ============================================================
class Game2048 {
    constructor() {
        this.boardEl = document.getElementById('game2048-board');
        this.scoreEl = document.getElementById('g2048-score');
        this.bestEl = document.getElementById('g2048-best');
        this.best = parseInt(localStorage.getItem('g2048Best') || '0');
        this.size = 4;
        this.init();
    }

    init() {
        this.grid = Array.from({ length: this.size }, () => Array(this.size).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.won = false;
        this.addTile();
        this.addTile();
        if (this.bestEl) this.bestEl.textContent = 'Best: ' + this.best;
        this.render();
        if (!this._keyHandler) {
            this._keyHandler = (e) => {
                if (this.gameOver) return;
                const map = { ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right' };
                const dir = map[e.key];
                if (dir) { e.preventDefault(); this.move(dir); }
            };
            document.addEventListener('keydown', this._keyHandler);
        }
        if (!this._swipeHandler) {
            let sx = 0, sy = 0;
            this._swipeHandler = true;
            this.boardEl.addEventListener('touchstart', (e) => {
                const t = e.touches[0];
                sx = t.clientX; sy = t.clientY;
            }, { passive: true });
            this.boardEl.addEventListener('touchend', (e) => {
                if (this.gameOver) return;
                const t = e.changedTouches[0];
                const dx = t.clientX - sx, dy = t.clientY - sy;
                const absDx = Math.abs(dx), absDy = Math.abs(dy);
                if (Math.max(absDx, absDy) < 20) return;
                if (absDx > absDy) {
                    this.move(dx > 0 ? 'right' : 'left');
                } else {
                    this.move(dy > 0 ? 'down' : 'up');
                }
            }, { passive: true });
        }
    }

    addTile() {
        const empty = [];
        for (let r = 0; r < this.size; r++)
            for (let c = 0; c < this.size; c++)
                if (this.grid[r][c] === 0) empty.push([r,c]);
        if (empty.length === 0) return;
        const [r,c] = empty[Math.floor(Math.random() * empty.length)];
        this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    }

    slideRow(row) {
        let arr = row.filter(v => v !== 0);
        let result = [];
        let score = 0;
        for (let i = 0; i < arr.length; i++) {
            if (i + 1 < arr.length && arr[i] === arr[i+1]) {
                result.push(arr[i] * 2);
                score += arr[i] * 2;
                i++;
            } else {
                result.push(arr[i]);
            }
        }
        while (result.length < this.size) result.push(0);
        return { row: result, score };
    }

    move(dir) {
        let grid = this.grid.map(r => [...r]);
        let totalScore = 0;

        const getCol = (g, c) => g.map(r => r[c]);
        const setCol = (g, c, vals) => { g.forEach((r, i) => r[c] = vals[i]); };

        if (dir === 'left') {
            for (let r = 0; r < this.size; r++) {
                const { row, score } = this.slideRow(grid[r]);
                grid[r] = row; totalScore += score;
            }
        } else if (dir === 'right') {
            for (let r = 0; r < this.size; r++) {
                const { row, score } = this.slideRow(grid[r].reverse());
                grid[r] = row.reverse(); totalScore += score;
            }
        } else if (dir === 'up') {
            for (let c = 0; c < this.size; c++) {
                const { row, score } = this.slideRow(getCol(grid, c));
                setCol(grid, c, row); totalScore += score;
            }
        } else if (dir === 'down') {
            for (let c = 0; c < this.size; c++) {
                const col = getCol(grid, c).reverse();
                const { row, score } = this.slideRow(col);
                setCol(grid, c, row.reverse()); totalScore += score;
            }
        }

        let changed = false;
        for (let r = 0; r < this.size; r++)
            for (let c = 0; c < this.size; c++)
                if (this.grid[r][c] !== grid[r][c]) changed = true;
        if (!changed) return;

        this.grid = grid;
        this.score += totalScore;
        if (this.scoreEl) this.scoreEl.textContent = 'Score: ' + this.score;
        this.addTile();
        this.checkGameOver();
        this.render();
    }

    checkGameOver() {
        for (let r = 0; r < this.size; r++)
            for (let c = 0; c < this.size; c++)
                if (this.grid[r][c] === 2048) { this.won = true; this.gameOver = true; this.saveBest(); return; }
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === 0) return;
                if (c + 1 < this.size && this.grid[r][c] === this.grid[r][c+1]) return;
                if (r + 1 < this.size && this.grid[r][c] === this.grid[r+1][c]) return;
            }
        }
        this.gameOver = true;
        this.saveBest();
    }

    saveBest() {
        if (this.score > this.best) {
            this.best = this.score;
            localStorage.setItem('g2048Best', String(this.best));
            if (this.bestEl) this.bestEl.textContent = 'Best: ' + this.best;
        }
    }

    render() {
        this.boardEl.innerHTML = '';
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const v = this.grid[r][c];
                const cell = document.createElement('div');
                cell.className = 'g2048-cell g2048-cell-' + v;
                if (v > 0) cell.textContent = v;
                this.boardEl.appendChild(cell);
            }
        }
    }

    pause() {}
}

// ============================================================
// Pong
// ============================================================
class PongGame {
    constructor() {
        this.canvas = document.getElementById('pong-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreEl = document.getElementById('pong-score');
        this.animationId = null;
        this.particles = [];
        this.winScore = 7;
        this.init();
    }

    init() {
        this.ball = { x: 300, y: 200, vx: 4, vy: 3, r: 6 };
        this.paddleW = 8;
        this.paddleH = 60;
        this.player = { x: 20, y: 170, score: 0 };
        this.ai = { x: 572, y: 170, score: 0 };
        this.gameOver = false;
        this.winner = null;
        this.player.dir = 0;
        this.particles = [];
        if (this.scoreEl) this.scoreEl.textContent = '0 - 0';
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.loop = () => {
            this.update();
            this.draw();
            if (!this.gameOver) this.animationId = requestAnimationFrame(this.loop);
        };
        this.animationId = requestAnimationFrame(this.loop);
        this.ball.stuck = true;
        if (!this._keyHandler) {
            const pongWrapper = document.getElementById('pong-wrapper');
            this._keyHandler = (e) => {
                if (!pongWrapper || !pongWrapper.classList.contains('active')) return;
                if (e.key === 'ArrowUp') { this.player.dir = -1; e.preventDefault(); }
                if (e.key === 'ArrowDown') { this.player.dir = 1; e.preventDefault(); }
            };
            this._keyUpHandler = (e) => {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') this.player.dir = 0;
            };
            this._clickLaunch = () => {
                if (this.ball.stuck && !this.gameOver) this.launchBall();
            };
            document.addEventListener('keydown', this._keyHandler);
            document.addEventListener('keyup', this._keyUpHandler);
            this.canvas.addEventListener('click', this._clickLaunch);
            this._mouseMoveHandler = (e) => {
                const rect = this.canvas.getBoundingClientRect();
                this.player.y = (e.clientY - rect.top) / rect.height * (this.canvas.height - 40);
                this.player.dir = 0;
            };
            this.canvas.addEventListener('mousemove', this._mouseMoveHandler);
            enableTouchOnCanvas(this.canvas);
        }
    }

    _spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            this.particles.push({
                x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                life: 1, decay: Math.random() * 0.03 + 0.02, size: Math.random() * 3 + 2, color
            });
        }
    }

    launchBall() {
        if (this.ball.stuck) {
            this.ball.stuck = false;
            this.ball.vx = (Math.random() > 0.5 ? 1 : -1) * 4;
            this.ball.vy = (Math.random() - 0.5) * 4;
        }
    }

    update() {
        if (this.ball.stuck) {
            this.ball.x = this.player.x + this.paddleW + this.ball.r + 5;
            this.ball.y = this.player.y + this.paddleH / 2;
            return;
        }

        this.player.y += this.player.dir * 5;
        this.player.y = Math.max(0, Math.min(this.canvas.height - this.paddleH, this.player.y));

        const speed = Math.min(5, 3.5 + (this.player.score + this.ai.score) * 0.05);
        if (this.ai.y + this.paddleH / 2 < this.ball.y - 5) this.ai.y += speed;
        else if (this.ai.y + this.paddleH / 2 > this.ball.y + 5) this.ai.y -= speed;
        this.ai.y = Math.max(0, Math.min(this.canvas.height - this.paddleH, this.ai.y));

        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;

        if (this.ball.y - this.ball.r <= 0 || this.ball.y + this.ball.r >= this.canvas.height)
            this.ball.vy = -this.ball.vy;

        const hitPaddle = (paddle, side) => {
            if (this.ball.x - this.ball.r <= paddle.x + this.paddleW &&
                this.ball.x - this.ball.r >= paddle.x &&
                this.ball.y >= paddle.y && this.ball.y <= paddle.y + this.paddleH) {
                this.ball.vx = -this.ball.vx;
                const offset = (this.ball.y - (paddle.y + this.paddleH / 2)) / (this.paddleH / 2);
                this.ball.vy += offset * 2;
                this.ball.x = paddle.x + this.paddleW + this.ball.r;
                this._spawnParticles(this.ball.x, this.ball.y, side === 'player' ? '#60a5fa' : '#f472b6', 8);
                return true;
            }
            return false;
        };

        if (this.ball.vx < 0) hitPaddle(this.player, 'player');
        else if (this.ball.vx > 0) hitPaddle(this.ai, 'ai');

        if (this.ball.x < 0) { this.ai.score++; this._spawnParticles(10, this.ball.y, '#f472b6', 15); this.resetBall(); }
        else if (this.ball.x > this.canvas.width) { this.player.score++; this._spawnParticles(this.canvas.width - 10, this.ball.y, '#60a5fa', 15); this.resetBall(); }

        if (this.scoreEl) this.scoreEl.textContent = this.player.score + ' - ' + this.ai.score;

        if (this.player.score >= this.winScore) { this.gameOver = true; this.winner = 'Player'; }
        else if (this.ai.score >= this.winScore) { this.gameOver = true; this.winner = 'AI'; }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.05;
            p.life -= p.decay;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    resetBall() {
        this.ball.stuck = true;
        this.ball.x = this.player.x + this.paddleW + this.ball.r + 5;
        this.ball.y = this.player.y + this.paddleH / 2;
        this.ball.vx = 0; this.ball.vy = 0;
    }

    draw() {
        const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
        ctx.fillStyle = '#0a0e27';
        ctx.fillRect(0, 0, w, h);

        // Particles
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;

        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 2; ctx.setLineDash([8, 8]);
        ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke();
        ctx.setLineDash([]);

        // Ball glow
        const grad = ctx.createRadialGradient(this.ball.x, this.ball.y, 0, this.ball.x, this.ball.y, this.ball.r * 3);
        grad.addColorStop(0, 'rgba(255,255,255,0.3)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(this.ball.x, this.ball.y, this.ball.r * 3, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#60a5fa';
        ctx.fillRect(this.player.x, this.player.y, this.paddleW, this.paddleH);
        ctx.fillStyle = '#f472b6';
        ctx.fillRect(this.ai.x, this.ai.y, this.paddleW, this.paddleH);

        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.font = 'bold 48px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(this.player.score, w / 4, 60);
        ctx.fillText(this.ai.score, w * 3 / 4, 60);

        if (this.ball.stuck && !this.gameOver) {
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '16px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Click to start', w / 2, 50);
        }

        if (this.gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 36px Segoe UI, sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(this.winner + ' Wins!', w / 2, h / 2 - 20);
            ctx.fillStyle = '#fff';
            ctx.font = '18px Segoe UI, sans-serif';
            ctx.fillText(this.player.score + ' - ' + this.ai.score, w / 2, h / 2 + 20);
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '14px Segoe UI, sans-serif';
            ctx.fillText('Click "New Game" to play again', w / 2, h / 2 + 55);
        }
    }

    pause() {
        if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
    }
}

// ============================================================
// Breakout
// ============================================================
class BreakoutGame {
    constructor() {
        this.canvas = document.getElementById('breakout-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreEl = document.getElementById('break-score');
        this.livesEl = document.getElementById('break-lives');
        this.animationId = null;
        this.particles = [];
        this.best = parseInt(localStorage.getItem('breakBest') || '0');
        this.init();
    }

    init() {
        this.paddle = { x: 204, y: 300, w: 72, h: 10 };
        this.ball = { x: 240, y: 290, r: 5, vx: 4, vy: -4, stuck: true };
        this.bricks = [];
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.won = false;
        this.particles = [];
        const rows = 5, cols = 8, bw = 50, bh = 16, gap = 4;
        const colors = ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db'];
        for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols; c++)
                this.bricks.push({ x: c * (bw + gap) + 28, y: r * (bh + gap) + 30, w: bw, h: bh, alive: true, color: colors[r % colors.length] });
        if (this.scoreEl) this.scoreEl.textContent = 'Score: 0' + (this.best ? ' | Best: ' + this.best : '');
        if (this.livesEl) this.livesEl.textContent = 'Lives: ' + this.lives;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.loop = () => {
            this.update();
            this.draw();
            if (!this.gameOver) this.animationId = requestAnimationFrame(this.loop);
        };
        this.animationId = requestAnimationFrame(this.loop);
        if (!this._mousHandler) {
            this._mousHandler = (e) => {
                const rect = this.canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
                this.paddle.x = Math.max(0, Math.min(this.canvas.width - this.paddle.w, x - this.paddle.w / 2));
                if (this.ball.stuck) { this.ball.x = this.paddle.x + this.paddle.w / 2; this.ball.y = this.paddle.y - this.ball.r; }
            };
            this._clickHandler = () => {
                if (this.ball.stuck && !this.gameOver) {
                    this.ball.stuck = false;
                    this.ball.vx = (Math.random() > 0.5 ? 1 : -1) * 4;
                    this.ball.vy = -4;
                }
            };
            this.canvas.addEventListener('mousemove', this._mousHandler);
            this.canvas.addEventListener('click', this._clickHandler);
            enableTouchOnCanvas(this.canvas);
        }
    }

    _spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            this.particles.push({
                x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                life: 1, decay: Math.random() * 0.025 + 0.015, size: Math.random() * 3 + 2, color
            });
        }
    }

    update() {
        if (this.ball.stuck || this.gameOver) return;
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;
        if (this.ball.x - this.ball.r <= 0 || this.ball.x + this.ball.r >= this.canvas.width) this.ball.vx = -this.ball.vx;
        if (this.ball.y - this.ball.r <= 0) this.ball.vy = -this.ball.vy;
        if (this.ball.vy > 0 &&
            this.ball.y + this.ball.r >= this.paddle.y &&
            this.ball.y + this.ball.r <= this.paddle.y + this.paddle.h &&
            this.ball.x >= this.paddle.x && this.ball.x <= this.paddle.x + this.paddle.w) {
            this.ball.vy = -this.ball.vy;
            this.ball.y = this.paddle.y - this.ball.r;
        }
        for (const brick of this.bricks) {
            if (!brick.alive) continue;
            if (this.ball.x + this.ball.r > brick.x && this.ball.x - this.ball.r < brick.x + brick.w &&
                this.ball.y + this.ball.r > brick.y && this.ball.y - this.ball.r < brick.y + brick.h) {
                brick.alive = false;
                this.ball.vy = -this.ball.vy;
                this.score += 10;
                this._spawnParticles(brick.x + brick.w / 2, brick.y + brick.h / 2, brick.color, 12);
                if (this.scoreEl) this.scoreEl.textContent = 'Score: ' + this.score + (this.best ? ' | Best: ' + this.best : '');
                break;
            }
        }
        if (this.ball.y + this.ball.r >= this.canvas.height) {
            this.lives--;
            if (this.livesEl) this.livesEl.textContent = 'Lives: ' + this.lives;
            if (this.lives <= 0) { this.gameOver = true; this._saveBest(); }
            else { this.ball.stuck = true; this.ball.x = this.paddle.x + this.paddle.w / 2; this.ball.y = this.paddle.y - this.ball.r; }
        }
        if (this.bricks.every(b => !b.alive)) { this.won = true; this.gameOver = true; this._saveBest(); }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += 0.05;
            p.life -= p.decay;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    _saveBest() {
        if (this.score > this.best) {
            this.best = this.score;
            localStorage.setItem('breakBest', String(this.best));
        }
    }

    draw() {
        const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
        ctx.fillStyle = '#0a0e27';
        ctx.fillRect(0, 0, w, h);

        // Particles
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;

        for (const brick of this.bricks) {
            if (!brick.alive) continue;
            ctx.fillStyle = brick.color;
            ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
            ctx.fillStyle = 'rgba(255,255,255,0.12)';
            ctx.fillRect(brick.x + 2, brick.y + 2, brick.w - 4, 3);
        }

        // Paddle glow
        ctx.shadowColor = 'rgba(96, 165, 250, 0.3)';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#60a5fa';
        ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.w, this.paddle.h);
        ctx.shadowBlur = 0;

        // Ball glow
        const grad = ctx.createRadialGradient(this.ball.x, this.ball.y, 0, this.ball.x, this.ball.y, this.ball.r * 4);
        grad.addColorStop(0, 'rgba(255,255,255,0.25)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(this.ball.x, this.ball.y, this.ball.r * 4, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2); ctx.fill();

        if (this.gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 28px Segoe UI, sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(this.won ? 'You Win!' : 'Game Over', w / 2, h / 2 - 20);
            ctx.fillStyle = '#fff';
            ctx.font = '16px Segoe UI, sans-serif';
            ctx.fillText('Score: ' + this.score + (this.best ? '  |  Best: ' + this.best : ''), w / 2, h / 2 + 16);
            if (this.score >= this.best && this.score > 0) {
                ctx.fillStyle = '#ffd700';
                ctx.font = '14px Segoe UI, sans-serif';
                ctx.fillText('⭐ New Best!', w / 2, h / 2 + 48);
            }
        }
    }

    pause() {
        if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
    }
}

// ============================================================
// Othello (Reversi)
// ============================================================
class OthelloGame {
    constructor() {
        this.boardEl = document.getElementById('othello-board');
        this.turnEl = document.getElementById('oth-turn');
        this.scoreEl = document.getElementById('oth-score');
        this.size = 8;
        this.init();
        if (!this._delegates) {
            this._delegates = true;
            this.boardEl.addEventListener('click', (e) => {
                const cell = e.target.closest('[data-r]');
                if (!cell) return;
                this.makeMove(+cell.dataset.r, +cell.dataset.c);
            });
        }
    }

    init() {
        this.board = Array.from({ length: this.size }, () => Array(this.size).fill(null));
        const m = Math.floor(this.size / 2);
        this.board[m-1][m-1] = 'white'; this.board[m-1][m] = 'black';
        this.board[m][m-1] = 'black'; this.board[m][m] = 'white';
        this.currentPlayer = 'black';
        this.gameOver = false;
        this.render();
    }

    inBounds(r, c) { return r >= 0 && r < this.size && c >= 0 && c < this.size; }

    getValidMoves(player) {
        const moves = [];
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c] !== null) continue;
                if (this.isValidMove(r, c, player)) moves.push([r, c]);
            }
        }
        return moves;
    }

    isValidMove(r, c, player) {
        if (this.board[r][c] !== null) return false;
        const opp = player === 'black' ? 'white' : 'black';
        const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
        for (const [dr, dc] of dirs) {
            let nr = r + dr, nc = c + dc;
            if (!this.inBounds(nr, nc) || this.board[nr][nc] !== opp) continue;
            nr += dr; nc += dc;
            while (this.inBounds(nr, nc) && this.board[nr][nc] === opp) { nr += dr; nc += dc; }
            if (this.inBounds(nr, nc) && this.board[nr][nc] === player) return true;
        }
        return false;
    }

    makeMove(r, c) {
        if (this.gameOver) return;
        if (!this.isValidMove(r, c, this.currentPlayer)) return;
        const opp = this.currentPlayer === 'black' ? 'white' : 'black';
        const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
        this.board[r][c] = this.currentPlayer;
        for (const [dr, dc] of dirs) {
            let nr = r + dr, nc = c + dc;
            if (!this.inBounds(nr, nc) || this.board[nr][nc] !== opp) continue;
            const toFlip = [];
            while (this.inBounds(nr, nc) && this.board[nr][nc] === opp) { toFlip.push([nr, nc]); nr += dr; nc += dc; }
            if (this.inBounds(nr, nc) && this.board[nr][nc] === this.currentPlayer) {
                for (const [fr, fc] of toFlip) this.board[fr][fc] = this.currentPlayer;
            }
        }
        const oppMoves = this.getValidMoves(opp);
        if (oppMoves.length > 0) {
            this.currentPlayer = opp;
        } else {
            const myMoves = this.getValidMoves(this.currentPlayer);
            if (myMoves.length === 0) this.gameOver = true;
        }
        this.render();
        if (!this.gameOver && this.currentPlayer === 'black') {
            this._aiTimer = setTimeout(() => { this._aiTimer = null; this.aiMove(); }, 300);
        }
    }

    aiMove() {
        if (this.gameOver || this.currentPlayer !== 'black') return;
        const moves = this.getValidMoves('black');
        if (moves.length === 0) return;
        // Prefer corners, then edges, then maximize flips
        let bestScore = -1;
        let bestMove = moves[0];
        for (const [r, c] of moves) {
            let score = 0;
            // Corner bonus
            if ((r === 0 || r === 7) && (c === 0 || c === 7)) score += 20;
            else if (r === 0 || r === 7 || c === 0 || c === 7) score += 8;
            // Count flips
            const opp = 'white';
            const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
            let flips = 0;
            for (const [dr, dc] of dirs) {
                let nr = r + dr, nc = c + dc;
                if (!this.inBounds(nr, nc) || this.board[nr][nc] !== opp) continue;
                while (this.inBounds(nr, nc) && this.board[nr][nc] === opp) { flips++; nr += dr; nc += dc; }
            }
            score += flips;
            // Avoid squares next to corners
            if ((r === 0 || r === 7) && (c === 1 || c === 6)) score -= 10;
            if ((r === 1 || r === 6) && (c === 0 || c === 7)) score -= 10;
            if ((r === 1 || r === 6) && (c === 1 || c === 6)) score -= 8;
            if (score > bestScore) { bestScore = score; bestMove = [r, c]; }
        }
        this.makeMove(bestMove[0], bestMove[1]);
    }

    render() {
        this.boardEl.innerHTML = '';
        const valid = this.getValidMoves(this.currentPlayer);
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const cell = document.createElement('div');
                cell.className = 'oth-cell';
                cell.dataset.r = r; cell.dataset.c = c;
                if (this.board[r][c]) {
                    const piece = document.createElement('div');
                    piece.className = 'oth-piece ' + this.board[r][c];
                    cell.appendChild(piece);
                } else if (!this.gameOver && valid.some(([vr, vc]) => vr === r && vc === c)) {
                    cell.classList.add('oth-valid');
                }
                this.boardEl.appendChild(cell);
            }
        }
        let black = 0, white = 0;
        for (let r = 0; r < this.size; r++)
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c] === 'black') black++;
                else if (this.board[r][c] === 'white') white++;
            }
        if (this.turnEl) {
            if (this.gameOver) {
                const winner = black > white ? 'Black' : white > black ? 'White' : 'Draw';
                this.turnEl.textContent = winner + (winner !== 'Draw' ? ' wins!' : '');
                this.turnEl.style.color = '#ffd700';
            } else {
                this.turnEl.textContent = 'Turn: ' + (this.currentPlayer === 'black' ? 'Black' : 'White');
                this.turnEl.style.color = this.currentPlayer === 'black' ? '#888' : '#eee';
            }
        }
        if (this.scoreEl) this.scoreEl.textContent = 'Black: ' + black + ' | White: ' + white;
    }

    pause() {
        if (this._aiTimer) { clearTimeout(this._aiTimer); this._aiTimer = null; }
    }
}

// ============================================================
// Battleship
// ============================================================
class BattleshipGame {
    constructor() {
        this.boardEl = document.getElementById('battleship-board');
        this.turnEl = document.getElementById('bs-turn');
        this.size = 10;
        this.ships = [5, 4, 3, 3, 2];
        this.init();
    }

    init() {
        this.phase = 'place';
        this.placingShip = 0;
        this.placingDir = 0; // 0=horizontal, 1=vertical
        this.playerGrid = Array.from({ length: this.size }, () => Array(this.size).fill(0));
        this.enemyGrid = Array.from({ length: this.size }, () => Array(this.size).fill(0));
        this.enemyShips = this.placeShipsRandom();
        this.playerShipsPlaced = 0;
        this.playerHits = 0;
        this.enemyHits = 0;
        this.playerTargets = Array.from({ length: this.size }, () => Array(this.size).fill(false));
        this.enemyTargets = Array.from({ length: this.size }, () => Array(this.size).fill(false));
        this.gameOver = false;
        this._aiTargets = [];
        this._aiLastHit = null;
        this.render();
    }

    placeShipsRandom() {
        const grid = Array.from({ length: this.size }, () => Array(this.size).fill(0));
        for (const len of this.ships) {
            let placed = false;
            for (let attempt = 0; attempt < 200 && !placed; attempt++) {
                const r = Math.floor(Math.random() * this.size);
                const c = Math.floor(Math.random() * this.size);
                const dir = Math.random() < 0.5 ? 0 : 1;
                if (this.canPlace(grid, r, c, len, dir)) {
                    this.doPlace(grid, r, c, len, dir);
                    placed = true;
                }
            }
        }
        return grid;
    }

    canPlace(grid, r, c, len, dir) {
        if (dir === 0 && c + len > this.size) return false;
        if (dir === 1 && r + len > this.size) return false;
        for (let i = 0; i < len; i++) {
            const nr = dir === 0 ? r : r + i;
            const nc = dir === 0 ? c + i : c;
            if (grid[nr][nc] !== 0) return false;
            for (let dr = -1; dr <= 1; dr++)
                for (let dc = -1; dc <= 1; dc++) {
                    const ar = nr + dr, ac = nc + dc;
                    if (ar >= 0 && ar < this.size && ac >= 0 && ac < this.size && grid[ar][ac] !== 0) return false;
                }
        }
        return true;
    }

    doPlace(grid, r, c, len, dir, val) {
        val = val || 1;
        for (let i = 0; i < len; i++) {
            const nr = dir === 0 ? r : r + i;
            const nc = dir === 0 ? c + i : c;
            grid[nr][nc] = val;
        }
    }

    placePlayerShip(r, c) {
        if (this.phase !== 'place') return;
        const len = this.ships[this.placingShip];
        if (this.canPlace(this.playerGrid, r, c, len, this.placingDir)) {
            this.doPlace(this.playerGrid, r, c, len, this.placingDir);
            this.playerShipsPlaced++;
            if (this.playerShipsPlaced >= this.ships.length) {
                this.phase = 'play';
                if (this.turnEl) this.turnEl.textContent = 'Your turn';
                this.render();
                return;
            }
            this.placingShip++;
            this.render();
        }
    }

    playerMove(r, c) {
        if (this.phase !== 'play' || this.gameOver) return;
        if (this.playerTargets[r][c]) return;
        this.playerTargets[r][c] = true;
        if (this.enemyShips[r][c] > 0) {
            this.enemyGrid[r][c] = 2; // hit
            this.playerHits++;
            this.checkWin();
        } else {
            this.enemyGrid[r][c] = 1; // miss
        }
        this.render();
        if (!this.gameOver) {
            if (this.turnEl) this.turnEl.textContent = 'Computer thinking...';
            this._aiTimer = setTimeout(() => { this._aiTimer = null; this.aiMove(); }, 400);
        }
    }

    aiMove() {
        if (this.gameOver) return;
        // Smart targeting
        let targets = [];
        if (this._aiLastHit) {
            const [lr, lc] = this._aiLastHit;
            const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
            for (const [dr, dc] of dirs) {
                let nr = lr + dr, nc = lc + dc;
                if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size && !this.enemyTargets[nr][nc])
                    targets.push([nr, nc]);
            }
        }
        if (targets.length === 0) {
            for (let r = 0; r < this.size; r++)
                for (let c = 0; c < this.size; c++)
                    if (!this.enemyTargets[r][c]) targets.push([r, c]);
        }
        if (targets.length === 0) return;
        const [r, c] = targets[Math.floor(Math.random() * targets.length)];
        this.enemyTargets[r][c] = true;
        if (this.playerGrid[r][c] > 0) {
            this.playerGrid[r][c] = 2;
            this.enemyHits++;
            this._aiLastHit = [r, c];
            this.checkWin();
        } else {
            this.playerGrid[r][c] = 1;
            this._aiLastHit = null;
        }
        this.render();
        if (!this.gameOver && this.turnEl) this.turnEl.textContent = 'Your turn';
    }

    checkWin() {
        if (this.playerHits >= 17) { this.gameOver = true; if (this.turnEl) this.turnEl.textContent = 'You win!'; this.turnEl.style.color = '#ffd700'; }
        if (this.enemyHits >= 17) { this.gameOver = true; if (this.turnEl) this.turnEl.textContent = 'Computer wins!'; this.turnEl.style.color = '#ff6b6b'; }
        if (this.gameOver) this.render();
    }

    rotateShip() {
        this.placingDir = this.placingDir === 0 ? 1 : 0;
        this.render();
    }

    render() {
        this.boardEl.innerHTML = '';
        const sections = [
            { id: 'bs-player-grid', label: 'Your Fleet', grid: this.playerGrid, clickable: false },
            { id: 'bs-enemy-grid', label: 'Enemy Waters', grid: this.enemyGrid, clickable: this.phase === 'play' && !this.gameOver }
        ];
        for (const sec of sections) {
            const div = document.createElement('div');
            div.className = 'bs-section';
            const lbl = document.createElement('div');
            lbl.className = 'bs-label';
            lbl.textContent = sec.label;
            div.appendChild(lbl);
            const grid = document.createElement('div');
            grid.className = 'bs-grid';
            for (let r = 0; r < this.size; r++) {
                for (let c = 0; c < this.size; c++) {
                    const cell = document.createElement('div');
                    cell.className = 'bs-cell';
                    cell.dataset.r = r; cell.dataset.c = c;
                    const val = sec.grid[r][c];
                    if (val === 0) cell.classList.add('bs-water');
                    else if (val === 1) cell.classList.add('bs-miss');
                    else if (val === 2) cell.classList.add('bs-hit');
                    if (sec.id === 'bs-player-grid') {
                        if (val >= 1 && val <= 2) cell.classList.add('bs-ship');
                        if (val === 2) cell.classList.add('bs-sunk', 'bs-hit');
                        else if (val === 1) cell.classList.add('bs-miss');
                    }
                    if (sec.clickable) {
                        cell.addEventListener('click', () => this.playerMove(r, c));
                    }
                    grid.appendChild(cell);
                }
            }
            div.appendChild(grid);
            this.boardEl.appendChild(div);
        }
        if (this.phase === 'place') {
            const rotateBtn = document.createElement('button');
            rotateBtn.textContent = 'Rotate (R)';
            rotateBtn.style.cssText = 'padding:6px 12px;border:1px solid var(--border);border-radius:8px;background:var(--glass);color:var(--text);font-size:12px;font-weight:600;cursor:pointer;';
            rotateBtn.addEventListener('click', () => this.rotateShip());
            this.boardEl.appendChild(rotateBtn);
            if (this.turnEl) this.turnEl.textContent = 'Place ship: ' + this.ships[this.placingShip] + ' (click grid, R to rotate)';
            // Keyboard rotate
            if (!this._keyHandler) {
                this._keyHandler = (e) => {
                    if (e.key === 'r' || e.key === 'R') { e.preventDefault(); this.rotateShip(); }
                };
                document.addEventListener('keydown', this._keyHandler);
            }
        }
    }

    pause() {
        if (this._aiTimer) { clearTimeout(this._aiTimer); this._aiTimer = null; }
    }
}

// ============================================================
// Gomoku (Five in a Row)
// ============================================================
class GomokuGame {
    constructor() {
        this.boardEl = document.getElementById('gomoku-board');
        this.turnEl = document.getElementById('gom-turn');
        this.size = 15;
        this.aiEnabled = true;
        this.init();
        if (!this._delegates) {
            this._delegates = true;
            this.boardEl.addEventListener('click', (e) => {
                const cell = e.target.closest('[data-r]');
                if (!cell) return;
                if (this.aiEnabled && this.currentPlayer === 'black') return;
                this.makeMove(+cell.dataset.r, +cell.dataset.c);
            });
        }
    }

    init() {
        this.board = Array.from({ length: this.size }, () => Array(this.size).fill(null));
        this.currentPlayer = 'black';
        this.gameOver = false;
        this.winner = null;
        this.render();
        if (this.aiEnabled && this.currentPlayer === 'black') {
            this._aiTimer = setTimeout(() => { this._aiTimer = null; if (!this.gameOver) this.makeMove(7, 7); }, 200);
        }
    }

    inBounds(r, c) { return r >= 0 && r < this.size && c >= 0 && c < this.size; }

    makeMove(r, c) {
        if (this.gameOver || this.board[r][c] !== null) return;
        this.board[r][c] = this.currentPlayer;
        if (this.checkWin(r, c, this.currentPlayer)) {
            this.gameOver = true;
            this.winner = this.currentPlayer;
            this._winCells = this.getWinCells(r, c, this.currentPlayer);
            this.render();
            return;
        }
        let empty = false;
        for (let i = 0; i < this.size && !empty; i++)
            for (let j = 0; j < this.size && !empty; j++)
                if (this.board[i][j] === null) empty = true;
        if (!empty) { this.gameOver = true; this.render(); return; }
        this.currentPlayer = this.currentPlayer === 'black' ? 'white' : 'black';
        this.render();
        if (this.aiEnabled && !this.gameOver && this.currentPlayer === 'black') {
            this._aiTimer = setTimeout(() => { this._aiTimer = null; this.aiMove(); }, 300);
        }
    }

    checkWin(r, c, player) {
        const dirs = [[1,0],[0,1],[1,1],[1,-1]];
        for (const [dr, dc] of dirs) {
            let count = 1;
            for (let sign = -1; sign <= 1; sign += 2) {
                let nr = r + dr * sign, nc = c + dc * sign;
                while (this.inBounds(nr, nc) && this.board[nr][nc] === player) { count++; nr += dr * sign; nc += dc * sign; }
            }
            if (count >= 5) return true;
        }
        return false;
    }

    getWinCells(r, c, player) {
        const cells = [[r, c]];
        const dirs = [[1,0],[0,1],[1,1],[1,-1]];
        for (const [dr, dc] of dirs) {
            let count = 1;
            const line = [[r, c]];
            for (let sign = -1; sign <= 1; sign += 2) {
                let nr = r + dr * sign, nc = c + dc * sign;
                while (this.inBounds(nr, nc) && this.board[nr][nc] === player) { line.push([nr, nc]); nr += dr * sign; nc += dc * sign; }
            }
            if (line.length >= 5) return line;
        }
        return cells;
    }

    aiMove() {
        if (this.gameOver || this.currentPlayer !== 'black') return;
        // Try to win
        for (let r = 0; r < this.size; r++)
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c] !== null) continue;
                this.board[r][c] = 'black';
                if (this.checkWin(r, c, 'black')) { this.board[r][c] = null; this.makeMove(r, c); return; }
                this.board[r][c] = null;
            }
        // Block opponent
        for (let r = 0; r < this.size; r++)
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c] !== null) continue;
                this.board[r][c] = 'white';
                if (this.checkWin(r, c, 'white')) { this.board[r][c] = null; this.makeMove(r, c); return; }
                this.board[r][c] = null;
            }
        // Score each cell
        let bestScore = -1, bestMove = null;
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c] !== null) continue;
                let score = Math.random() * 0.1; // small randomness
                // Center preference
                const dist = Math.abs(r - 7) + Math.abs(c - 7);
                score += Math.max(0, 14 - dist) * 0.5;
                // Evaluate patterns
                const dirs = [[1,0],[0,1],[1,1],[1,-1]];
                for (const [dr, dc] of dirs) {
                    for (const player of ['black', 'white']) {
                        let count = 1;
                        for (let sign = -1; sign <= 1; sign += 2) {
                            let nr = r + dr * sign, nc = c + dc * sign;
                            while (this.inBounds(nr, nc) && this.board[nr][nc] === player) { count++; nr += dr * sign; nc += dc * sign; }
                        }
                        if (player === 'black') score += Math.pow(2, count);
                        else score += Math.pow(1.5, count);
                    }
                }
                if (score > bestScore) { bestScore = score; bestMove = [r, c]; }
            }
        }
        if (bestMove) this.makeMove(bestMove[0], bestMove[1]);
    }

    toggleAI() {
        this.aiEnabled = !this.aiEnabled;
        document.getElementById('gom-ai-btn').textContent = 'Vs Computer: ' + (this.aiEnabled ? 'On' : 'Off');
        this.init();
    }

    render() {
        this.boardEl.innerHTML = '';
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const cell = document.createElement('div');
                cell.className = 'gom-cell';
                cell.dataset.r = r; cell.dataset.c = c;
                if (this.board[r][c]) {
                    const stone = document.createElement('div');
                    stone.className = 'gom-stone ' + this.board[r][c];
                    if (this._winCells && this._winCells.some(([wr, wc]) => wr === r && wc === c))
                        stone.classList.add('gom-win');
                    cell.appendChild(stone);
                } else if (!this.gameOver && this.board[r][c] === null) {
                    cell.classList.add('gom-valid');
                }
                this.boardEl.appendChild(cell);
            }
        }
        if (this.turnEl) {
            if (this.gameOver) {
                this.turnEl.textContent = this.winner === 'black' ? 'Black wins!' : 'White wins!';
                this.turnEl.style.color = '#ffd700';
            } else {
                this.turnEl.textContent = 'Turn: ' + (this.currentPlayer === 'black' ? 'Black' : 'White');
                this.turnEl.style.color = this.currentPlayer === 'black' ? '#aaa' : '#eee';
            }
        }
    }

    pause() {
        if (this._aiTimer) { clearTimeout(this._aiTimer); this._aiTimer = null; }
    }
}

// ============================================================
// Simon Says
// ============================================================
class SimonGame {
    constructor() {
        this.boardEl = document.getElementById('simon-board');
        this.roundEl = document.getElementById('sim-round');
        this.statusEl = document.getElementById('sim-status');
        this.colors = ['red', 'green', 'blue', 'yellow'];
        this.init();
        if (!this._delegates) {
            this._delegates = true;
            this.boardEl.addEventListener('click', (e) => {
                const btn = e.target.closest('.sim-btn');
                if (!btn) return;
                this.playerInput(btn.dataset.color);
            });
        }
    }

    init() {
        this.sequence = [];
        this.playerIndex = 0;
        this.round = 0;
        this.gameOver = false;
        this._playing = false;
        this._acceptInput = false;
        this._timeout = null;
        this.nextRound();
    }

    nextRound() {
        this.round++;
        this.playerIndex = 0;
        this._acceptInput = false;
        if (this.roundEl) this.roundEl.textContent = 'Round: ' + this.round;
        if (this.statusEl) this.statusEl.textContent = 'Watch...';
        this.sequence.push(this.colors[Math.floor(Math.random() * 4)]);
        this.playSequence();
    }

    playSequence() {
        this._playing = true;
        let i = 0;
        const playNext = () => {
            if (!this._playing) return;
            if (i >= this.sequence.length) {
                this._playing = false;
                this._acceptInput = true;
                if (this.statusEl) this.statusEl.textContent = 'Your turn!';
                return;
            }
            const color = this.sequence[i];
            const btn = this.boardEl.querySelector('[data-color="' + color + '"]');
            if (btn) {
                btn.classList.add('active');
                setTimeout(() => {
                    if (!this._playing) return;
                    btn.classList.remove('active');
                    i++;
                    setTimeout(playNext, 120);
                }, 400);
            }
        };
        setTimeout(playNext, 400);
    }

    playerInput(color) {
        if (this._playing || !this._acceptInput || this.gameOver) return;
        if (color !== this.sequence[this.playerIndex]) {
            this.gameOver = true;
            this._acceptInput = false;
            if (this.statusEl) { this.statusEl.textContent = 'Game Over - Round ' + this.round; this.statusEl.style.color = '#ff6b6b'; }
            return;
        }
        this.playerIndex++;
        if (this.playerIndex >= this.sequence.length) {
            this._acceptInput = false;
            if (this.statusEl) this.statusEl.textContent = 'Correct!';
            setTimeout(() => this.nextRound(), 600);
        }
    }

    render() {
        this.boardEl.innerHTML = '';
        const colorNames = { red: '#c0392b', green: '#27ae60', blue: '#2980b9', yellow: '#f39c12' };
        for (const color of this.colors) {
            const btn = document.createElement('button');
            btn.className = 'sim-btn sim-' + color;
            btn.dataset.color = color;
            this.boardEl.appendChild(btn);
        }
    }

    pause() {
        this._playing = false;
        this._acceptInput = false;
        if (this._timeout) { clearTimeout(this._timeout); this._timeout = null; }
    }
}

// ============================================================
// Mastermind
// ============================================================
class MastermindGame {
    constructor() {
        this.boardEl = document.getElementById('mastermind-board');
        this.statusEl = document.getElementById('mm-status');
        this.colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
        this.codeLen = 4;
        this.maxGuesses = 10;
        this.init();
    }

    init() {
        this.code = [];
        for (let i = 0; i < this.codeLen; i++)
            this.code.push(this.colors[Math.floor(Math.random() * this.colors.length)]);
        this.guesses = [];
        this.currentGuess = [];
        this.currentPos = 0;
        this.gameOver = false;
        this.won = false;
        if (this.statusEl) { this.statusEl.textContent = 'Pick 4 colors'; this.statusEl.style.color = 'var(--text-secondary)'; }
        this.render();
    }

    pickColor(color) {
        if (this.gameOver) return;
        if (this.currentPos >= this.codeLen) return;
        this.currentGuess[this.currentPos] = color;
        this.currentPos++;
        this.render();
        if (this.currentPos === this.codeLen) {
            this.submitGuess();
        }
    }

    submitGuess() {
        if (this.currentPos !== this.codeLen) return;
        const guess = [...this.currentGuess];
        this.guesses.push(guess);
        const feedback = this.getFeedback(guess);
        const black = feedback.filter(f => f === 'black').length;
        if (black === this.codeLen) {
            this.won = true;
            this.gameOver = true;
            if (this.statusEl) { this.statusEl.textContent = 'You cracked the code!'; this.statusEl.style.color = '#ffd700'; }
            this.currentGuess = [];
            this.currentPos = 0;
            this.render();
            return;
        }
        if (this.guesses.length >= this.maxGuesses) {
            this.gameOver = true;
            if (this.statusEl) { this.statusEl.textContent = 'Out of guesses! Code: ' + this.code.join(', '); this.statusEl.style.color = '#ff6b6b'; }
            this.currentGuess = [];
            this.currentPos = 0;
            this.render();
            return;
        }
        // Show hint in status
        const w = feedback.filter(f => f === 'white').length;
        if (this.statusEl) this.statusEl.textContent = black + ' correct, ' + w + ' misplaced';
        this.currentGuess = [];
        this.currentPos = 0;
        this.render();
    }

    getFeedback(guess) {
        const codeCopy = [...this.code];
        const result = [];
        const used = Array(this.codeLen).fill(false);
        for (let i = 0; i < this.codeLen; i++) {
            if (guess[i] === this.code[i]) {
                result[i] = 'black';
                used[i] = true;
            }
        }
        for (let i = 0; i < this.codeLen; i++) {
            if (result[i]) continue;
            for (let j = 0; j < this.codeLen; j++) {
                if (used[j]) continue;
                if (guess[i] === this.code[j]) {
                    result[i] = 'white';
                    used[j] = true;
                    break;
                }
            }
        }
        const blacks = result.filter(r => r === 'black').length;
        const whites = result.filter(r => r === 'white').length;
        return [...Array(blacks).fill('black'), ...Array(whites).fill('white')];
    }

    render() {
        this.boardEl.innerHTML = '';
        for (let i = 0; i < this.maxGuesses; i++) {
            const row = document.createElement('div');
            row.className = 'mm-row';
            if (i === this.guesses.length && !this.gameOver) row.classList.add('current');
            if (i < this.guesses.length) {
                const guess = this.guesses[i];
                for (const color of guess) {
                    const slot = document.createElement('div');
                    slot.className = 'mm-slot ' + color;
                    row.appendChild(slot);
                }
                // Fill remaining
                for (let j = guess.length; j < this.codeLen; j++) {
                    const slot = document.createElement('div');
                    slot.className = 'mm-slot empty';
                    row.appendChild(slot);
                }
                const feedback = this.getFeedback(guess);
                const fb = document.createElement('div');
                fb.className = 'mm-feedback';
                for (const f of feedback) {
                    const peg = document.createElement('div');
                    peg.className = 'mm-feed-peg ' + f;
                    fb.appendChild(peg);
                }
                row.appendChild(fb);
            } else if (i === this.guesses.length && !this.gameOver) {
                // Current row
                for (let j = 0; j < this.codeLen; j++) {
                    const slot = document.createElement('div');
                    slot.className = 'mm-slot' + (this.currentGuess[j] ? ' ' + this.currentGuess[j] : ' empty');
                    row.appendChild(slot);
                }
                const fb = document.createElement('div');
                fb.className = 'mm-feedback';
                row.appendChild(fb);
            } else {
                // Empty future row
                for (let j = 0; j < this.codeLen; j++) {
                    const slot = document.createElement('div');
                    slot.className = 'mm-slot empty';
                    row.appendChild(slot);
                }
                const fb = document.createElement('div');
                fb.className = 'mm-feedback';
                row.appendChild(fb);
            }
            this.boardEl.appendChild(row);
        }
        if (!this.gameOver) {
            const palette = document.createElement('div');
            palette.className = 'mm-palette';
            for (const color of this.colors) {
                const btn = document.createElement('button');
                btn.className = 'mm-palette-btn';
                btn.style.background = 
                    color === 'red' ? '#e74c3c' :
                    color === 'blue' ? '#3498db' :
                    color === 'green' ? '#2ecc71' :
                    color === 'yellow' ? '#f1c40f' :
                    color === 'purple' ? '#9b59b6' : '#e67e22';
                btn.addEventListener('click', () => this.pickColor(color));
                palette.appendChild(btn);
            }
            this.boardEl.appendChild(palette);
        }
    }

    pause() {}
}

// ============================================================
// Space Invaders
// ============================================================
class SpaceInvadersGame {
    constructor() {
        this.canvas = document.getElementById('invaders-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreEl = document.getElementById('inv-score');
        this.livesEl = document.getElementById('inv-lives');
        this.animationId = null;
        this.particles = [];
        this.stars = [];
        this.best = parseInt(localStorage.getItem('invBest') || '0');
        this.init();
    }

    init() {
        this.w = this.canvas.width;
        this.h = this.canvas.height;
        this.player = { x: this.w / 2 - 20, y: this.h - 40, w: 40, h: 20 };
        this.bullets = [];
        this.enemyBullets = [];
        this.aliens = [];
        this.score = 0;
        this.lives = 3;
        this.dir = 1;
        this.speed = 1;
        this.gameOver = false;
        this.won = false;
        this.keys = {};
        this.shootCooldown = 0;
        this.particles = [];
        this.explosions = [];
        this.frame = 0;

        // Star field
        if (this.stars.length === 0) {
            for (let i = 0; i < 80; i++) {
                this.stars.push({
                    x: Math.random() * this.w, y: Math.random() * this.h,
                    r: Math.random() * 1.5 + 0.5, a: Math.random() * 0.5 + 0.3
                });
            }
        }

        const rows = 5, cols = 11;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                this.aliens.push({
                    x: 50 + c * 35, y: 30 + r * 30, w: 28, h: 20,
                    alive: true, color: ['#e74c3c','#e67e22','#f1c40f','#2ecc71','#3498db'][r]
                });
            }
        }

        if (this.scoreEl) this.scoreEl.textContent = 'Score: 0' + (this.best ? ' | Best: ' + this.best : '');
        if (this.livesEl) this.livesEl.textContent = 'Lives: ' + this.lives;

        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.loop = () => {
            this.update();
            this.draw();
            if (!this.gameOver) this.animationId = requestAnimationFrame(this.loop);
        };
        this.animationId = requestAnimationFrame(this.loop);

        if (!this._keyHandler) {
            this._keyHandler = (e) => {
                this.keys[e.key] = true;
                if (['ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
            };
            this._keyUpHandler = (e) => { this.keys[e.key] = false; };
            document.addEventListener('keydown', this._keyHandler);
            document.addEventListener('keyup', this._keyUpHandler);
            this.canvas.addEventListener('click', () => { this.keys[' '] = true; });
            this.canvas.addEventListener('touchstart', (e) => {
                const t = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                const x = t.clientX - rect.left;
                const mid = rect.width / 2;
                if (x < mid) {
                    this.keys['ArrowLeft'] = true;
                } else {
                    this.keys['ArrowRight'] = true;
                }
                this.keys[' '] = true;
            }, { passive: true });
            this.canvas.addEventListener('touchmove', (e) => {
                const t = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                const x = t.clientX - rect.left;
                const mid = rect.width / 2;
                this.keys['ArrowLeft'] = x < mid;
                this.keys['ArrowRight'] = x >= mid;
            }, { passive: true });
            this.canvas.addEventListener('touchend', () => {
                this.keys['ArrowLeft'] = false;
                this.keys['ArrowRight'] = false;
            }, { passive: true });
        }
    }

    _drawAlien(ctx, a) {
        const cx = a.x + a.w / 2, cy = a.y + a.h / 2;
        ctx.fillStyle = a.color;
        // Body
        ctx.beginPath();
        ctx.ellipse(cx, cy, a.w / 2, a.h / 2 - 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head bumps
        const t = this.frame * 0.03;
        ctx.fillRect(cx - 6, a.y - 2, 4, 6);
        ctx.fillRect(cx + 2, a.y - 2, 4, 6);
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(cx - 5, cy - 2, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 5, cy - 2, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(cx - 5 + Math.sin(t) * 1, cy - 2, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + 5 + Math.sin(t) * 1, cy - 2, 1.5, 0, Math.PI * 2); ctx.fill();
    }

    _drawPlayer(ctx) {
        const px = this.player.x, py = this.player.y, w = this.player.w, h = this.player.h;
        ctx.fillStyle = '#2ecc71';
        // Ship body
        ctx.beginPath();
        ctx.moveTo(px + w / 2, py - 4);
        ctx.lineTo(px + w, py + h);
        ctx.lineTo(px, py + h);
        ctx.closePath(); ctx.fill();
        // Cockpit
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.moveTo(px + w / 2, py + 2);
        ctx.lineTo(px + w / 2 + 6, py + h - 4);
        ctx.lineTo(px + w / 2 - 6, py + h - 4);
        ctx.closePath(); ctx.fill();
    }

    _spawnExplosion(x, y, color) {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 1;
            this.particles.push({
                x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                life: 1, decay: Math.random() * 0.03 + 0.015, size: Math.random() * 3 + 2, color
            });
        }
    }

    update() {
        if (this.gameOver) return;
        this.frame++;
        this.shootCooldown--;

        if (this.keys['ArrowLeft']) this.player.x -= 4;
        if (this.keys['ArrowRight']) this.player.x += 4;
        this.player.x = Math.max(0, Math.min(this.w - this.player.w, this.player.x));

        if (this.keys[' '] && this.shootCooldown <= 0) {
            this.bullets.push({ x: this.player.x + this.player.w / 2 - 2, y: this.player.y - 10, w: 4, h: 10 });
            this.shootCooldown = 15;
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].y -= 6;
            if (this.bullets[i].y < 0) this.bullets.splice(i, 1);
        }

        let edge = false;
        for (const a of this.aliens) {
            if (!a.alive) continue;
            a.x += this.dir * this.speed;
            if (a.x <= 10 || a.x + a.w >= this.w - 10) edge = true;
        }
        if (edge) {
            this.dir = -this.dir;
            for (const a of this.aliens) { a.y += 8; }
            this.speed += 0.05;
        }

        const alive = this.aliens.filter(a => a.alive);
        if (alive.length > 0 && Math.random() < 0.02) {
            const a = alive[Math.floor(Math.random() * alive.length)];
            this.enemyBullets.push({ x: a.x + a.w / 2 - 2, y: a.y + a.h, w: 4, h: 8 });
        }

        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            this.enemyBullets[i].y += 4;
            if (this.enemyBullets[i].y > this.h) this.enemyBullets.splice(i, 1);
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            for (const a of this.aliens) {
                if (!a.alive) continue;
                if (b.x < a.x + a.w && b.x + b.w > a.x && b.y < a.y + a.h && b.y + b.h > a.y) {
                    a.alive = false;
                    this._spawnExplosion(a.x + a.w / 2, a.y + a.h / 2, a.color);
                    this.bullets.splice(i, 1);
                    this.score += 10;
                    if (this.scoreEl) this.scoreEl.textContent = 'Score: ' + this.score + (this.best ? ' | Best: ' + this.best : '');
                    break;
                }
            }
        }

        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            const b = this.enemyBullets[i];
            if (b.x < this.player.x + this.player.w && b.x + b.w > this.player.x &&
                b.y < this.player.y + this.player.h && b.y + b.h > this.player.y) {
                this._spawnExplosion(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, '#2ecc71');
                this.enemyBullets.splice(i, 1);
                this.lives--;
                if (this.livesEl) this.livesEl.textContent = 'Lives: ' + this.lives;
                if (this.lives <= 0) { this.gameOver = true; this._saveBest(); return; }
            }
        }

        for (const a of this.aliens) {
            if (!a.alive) continue;
            if (a.y + a.h >= this.player.y) { this.gameOver = true; this._saveBest(); return; }
        }

        if (this.aliens.every(a => !a.alive)) { this.won = true; this.gameOver = true; this._saveBest(); }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx; p.y += p.vy;
            p.life -= p.decay;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    _saveBest() {
        if (this.score > this.best) {
            this.best = this.score;
            localStorage.setItem('invBest', String(this.best));
        }
    }

    draw() {
        const ctx = this.ctx;
        ctx.fillStyle = '#0a0e27';
        ctx.fillRect(0, 0, this.w, this.h);

        // Stars
        for (const s of this.stars) {
            ctx.globalAlpha = s.a * (0.7 + 0.3 * Math.sin(this.frame * 0.02 + s.x));
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Particles
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Aliens
        for (const a of this.aliens) {
            if (!a.alive) continue;
            this._drawAlien(ctx, a);
        }

        // Player
        this._drawPlayer(ctx);

        // Bullets
        ctx.fillStyle = '#f1c40f';
        for (const b of this.bullets) ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = '#e74c3c';
        for (const b of this.enemyBullets) ctx.fillRect(b.x, b.y, b.w, b.h);

        if (this.gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, this.w, this.h);
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 28px Segoe UI, sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(this.won ? 'You Win!' : 'Game Over', this.w / 2, this.h / 2 - 20);
            ctx.fillStyle = '#fff';
            ctx.font = '16px Segoe UI, sans-serif';
            ctx.fillText('Score: ' + this.score + (this.best ? '  |  Best: ' + this.best : ''), this.w / 2, this.h / 2 + 16);
            if (this.score >= this.best && this.score > 0) {
                ctx.fillStyle = '#ffd700';
                ctx.font = '14px Segoe UI, sans-serif';
                ctx.fillText('⭐ New Best!', this.w / 2, this.h / 2 + 48);
            }
        }
    }

    pause() {
        this.keys = {};
        if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
    }
}

// ============================================================
// Flappy Bird
// ============================================================
class FlappyBirdGame {
    constructor() {
        this.canvas = document.getElementById('flappy-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreEl = document.getElementById('flap-score');
        this.bestEl = document.getElementById('flap-best');
        this.animationId = null;
        this.best = parseInt(localStorage.getItem('flappyBest') || '0');
        if (this.bestEl) this.bestEl.textContent = 'Best: ' + this.best;
        this.init();
    }

    init() {
        this.w = this.canvas.width;
        this.h = this.canvas.height;
        this.bird = { x: 60, y: 200, vy: 0, r: 12 };
        this.pipes = [];
        this.score = 0;
        this.gameOver = false;
        this.gravity = 0.35;
        this.flapForce = -6;
        this.pipeSpeed = 2.5;
        this.pipeGap = 120;
        this.pipeW = 40;
        this.frameCount = 0;
        this.started = false;

        if (this.scoreEl) this.scoreEl.textContent = 'Score: 0';
        if (this.bestEl) this.bestEl.textContent = 'Best: ' + this.best;

        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.loop = () => {
            this.update();
            this.draw();
            if (!this.gameOver) this.animationId = requestAnimationFrame(this.loop);
        };
        this.animationId = requestAnimationFrame(this.loop);

        if (!this._handler) {
            this._handler = (e) => {
                if (e.key === ' ' || e.type === 'click') {
                    e.preventDefault();
                    if (!this.started) { this.started = true; return; }
                    if (!this.gameOver) this.bird.vy = this.flapForce;
                }
            };
            document.addEventListener('keydown', this._handler);
            this.canvas.addEventListener('click', this._handler);
            enableTouchOnCanvas(this.canvas);
        }
    }

    update() {
        if (!this.started || this.gameOver) return;
        this.frameCount++;

        // Gravity
        this.bird.vy += this.gravity;
        this.bird.y += this.bird.vy;

        if (this.bird.y - this.bird.r <= 0 || this.bird.y + this.bird.r >= this.h) {
            this.endGame();
            return;
        }

        if (this.frameCount % 80 === 0) {
            const gapY = 80 + Math.random() * (this.h - 80 - this.pipeGap - 80);
            this.pipes.push({
                x: this.w, gapY: gapY, w: this.pipeW, gapH: this.pipeGap, passed: false
            });
        }

        for (let i = this.pipes.length - 1; i >= 0; i--) {
            this.pipes[i].x -= this.pipeSpeed;
            if (this.pipes[i].x + this.pipeW < 0) { this.pipes.splice(i, 1); continue; }
            const p = this.pipes[i];
            // Collision
            if (this.bird.x + this.bird.r > p.x && this.bird.x - this.bird.r < p.x + p.w) {
                if (this.bird.y - this.bird.r < p.gapY || this.bird.y + this.bird.r > p.gapY + p.gapH) {
                    this.endGame(); return;
                }
            }
            // Score
            if (!p.passed && p.x + p.w < this.bird.x) {
                p.passed = true;
                this.score++;
                if (this.scoreEl) this.scoreEl.textContent = 'Score: ' + this.score;
            }
        }
    }

    endGame() {
        this.gameOver = true;
        if (this.score > this.best) {
            this.best = this.score;
            localStorage.setItem('flappyBest', String(this.best));
            if (this.bestEl) this.bestEl.textContent = 'Best: ' + this.best;
        }
    }

    draw() {
        const ctx = this.ctx, w = this.w, h = this.h;
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#4dc9f6'); grad.addColorStop(1, '#87ceeb');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        for (const p of this.pipes) {
            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(p.x, 0, p.w, p.gapY);
            ctx.fillRect(p.x, p.gapY + p.gapH, p.w, h - p.gapY - p.gapH);
            ctx.fillStyle = '#27ae60';
            ctx.fillRect(p.x - 3, p.gapY - 20, p.w + 6, 20);
            ctx.fillRect(p.x - 3, p.gapY + p.gapH, p.w + 6, 20);
        }

        // Bird
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(this.bird.x, this.bird.y, this.bird.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e67e22';
        ctx.beginPath();
        ctx.arc(this.bird.x + 5, this.bird.y - 4, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.bird.x + 7, this.bird.y - 5, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.moveTo(this.bird.x + 8, this.bird.y);
        ctx.lineTo(this.bird.x + 16, this.bird.y - 2);
        ctx.lineTo(this.bird.x + 8, this.bird.y + 2);
        ctx.fill();

        if (!this.started) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.font = 'bold 20px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Click or Press Space', w / 2, h / 2);
        }

        if (this.gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 28px Segoe UI, sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('Game Over', w / 2, h / 2 - 16);
            ctx.fillStyle = '#fff';
            ctx.font = '16px Segoe UI, sans-serif';
            ctx.fillText('Score: ' + this.score, w / 2, h / 2 + 16);
        }
    }

    pause() {
        if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
    }
}

// ============================================================
// Dino Runner
// ============================================================
class DinoRunnerGame {
    constructor() {
        this.canvas = document.getElementById('dino-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreEl = document.getElementById('dino-score');
        this.bestEl = document.getElementById('dino-best');
        this.animationId = null;
        this.best = parseInt(localStorage.getItem('dinoBest') || '0');
        if (this.bestEl) this.bestEl.textContent = 'Best: ' + this.best;
        this.init();
    }

    init() {
        this.w = this.canvas.width;
        this.h = this.canvas.height;
        this.dino = { x: 50, y: this.h - 50, w: 30, h: 40, vy: 0 };
        this.obstacles = [];
        this.score = 0;
        this.gameOver = false;
        this.gravity = 0.6;
        this.jumpForce = -12;
        this.groundY = this.h - 10;
        this.speed = 5;
        this.frameCount = 0;
        this.onGround = true;

        if (this.scoreEl) this.scoreEl.textContent = 'Score: 0';
        if (this.bestEl) this.bestEl.textContent = 'Best: ' + this.best;

        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.loop = () => {
            this.update();
            this.draw();
            if (!this.gameOver) this.animationId = requestAnimationFrame(this.loop);
        };
        this.animationId = requestAnimationFrame(this.loop);

        if (!this._handler) {
            this._handler = (e) => {
                if ((e.key === ' ' || e.key === 'ArrowUp' || e.type === 'click') && this.onGround && !this.gameOver) {
                    e.preventDefault();
                    this.dino.vy = this.jumpForce;
                    this.onGround = false;
                }
            };
            document.addEventListener('keydown', this._handler);
            this.canvas.addEventListener('click', this._handler);
            enableTouchOnCanvas(this.canvas);
        }
    }

    update() {
        if (this.gameOver) return;
        this.frameCount++;

        this.dino.vy += this.gravity;
        this.dino.y += this.dino.vy;

        if (this.dino.y + this.dino.h >= this.groundY) {
            this.dino.y = this.groundY - this.dino.h;
            this.dino.vy = 0;
            this.onGround = true;
        }

        this.speed = 5 + Math.floor(this.score / 100);
        this.score++;
        if (this.scoreEl) this.scoreEl.textContent = 'Score: ' + this.score;

        if (this.frameCount % (Math.max(30, 80 - this.score / 5)) === 0) {
            const type = Math.random() < 0.5 ? 'cactus' : 'cactus2';
            this.obstacles.push({
                x: this.w, y: this.groundY - 35, w: type === 'cactus' ? 16 : 30, h: 35
            });
        }

        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            this.obstacles[i].x -= this.speed;
            if (this.obstacles[i].x + this.obstacles[i].w < 0) { this.obstacles.splice(i, 1); continue; }
            const o = this.obstacles[i];
            if (this.dino.x < o.x + o.w && this.dino.x + this.dino.w > o.x &&
                this.dino.y < o.y + o.h && this.dino.y + this.dino.h > o.y) {
                this.endGame();
            }
        }
    }

    endGame() {
        this.gameOver = true;
        if (this.score > this.best) {
            this.best = this.score;
            localStorage.setItem('dinoBest', String(this.best));
            if (this.bestEl) this.bestEl.textContent = 'Best: ' + this.best;
        }
    }

    draw() {
        const ctx = this.ctx, w = this.w, h = this.h;
        ctx.fillStyle = '#f7f7f7';
        ctx.fillRect(0, 0, w, h);

        // Ground
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(0, this.groundY, w, h - this.groundY);

        // Dino
        ctx.fillStyle = '#535353';
        ctx.fillRect(this.dino.x, this.dino.y, this.dino.w, this.dino.h);
        // Eye
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.dino.x + 20, this.dino.y + 6, 6, 6);
        ctx.fillStyle = '#222';
        ctx.fillRect(this.dino.x + 23, this.dino.y + 6, 3, 6);

        for (const o of this.obstacles) {
            ctx.fillStyle = '#535353';
            ctx.fillRect(o.x, o.y, o.w, o.h);
        }

        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.font = 'bold 14px Segoe UI, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(Math.floor(this.score / 5), w - 16, 24);

        if (this.gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 24px Segoe UI, sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('Game Over', w / 2, h / 2 - 12);
            ctx.fillStyle = '#fff';
            ctx.font = '14px Segoe UI, sans-serif';
            ctx.fillText('Score: ' + Math.floor(this.score / 5), w / 2, h / 2 + 16);
        }
    }

    pause() {
        if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
    }
}

// ============================================================
// Count Master
// ============================================================
class CountMasterGame {
    constructor() {
        this.canvas = document.getElementById('countmaster-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.numEl = document.getElementById('cm-number');
        this.scoreEl = document.getElementById('cm-score');
        this.animationId = null;
        this.init();
    }

    init() {
        this.w = this.canvas.width;
        this.h = this.canvas.height;
        this.player = { x: this.w / 2, y: this.h - 60, r: 18, number: 0, targetX: this.w / 2 };
        this.items = [];
        this.score = 0;
        this.speed = 2;
        this.spawnTimer = 0;
        this.gameOver = false;
        this.won = false;
        this.frame = 0;
        this.absorbParticles = [];
        if (this.numEl) this.numEl.textContent = 'Number: 0';
        if (this.scoreEl) this.scoreEl.textContent = 'Score: 0';
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.loop = () => {
            this.update();
            this.draw();
            if (!this.gameOver) this.animationId = requestAnimationFrame(this.loop);
        };
        this.animationId = requestAnimationFrame(this.loop);
        if (!this._keyHandler) {
            this._keyHandler = (e) => {
                if (e.key === 'ArrowLeft') this.player.targetX = this.player.x - 30;
                if (e.key === 'ArrowRight') this.player.targetX = this.player.x + 30;
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.preventDefault();
            };
            document.addEventListener('keydown', this._keyHandler);
        }
        if (!this._touchHandler) {
            this._touchHandler = true;
            this.canvas.addEventListener('touchstart', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                const t = e.touches[0];
                const x = t.clientX - rect.left;
                if (x < rect.width / 2) {
                    this.player.targetX = this.player.x - 30;
                } else {
                    this.player.targetX = this.player.x + 30;
                }
            }, { passive: true });
        }
    }

    spawnItem() {
        const type = Math.random();
        const x = 40 + Math.random() * (this.w - 80);
        if (type < 0.35) {
            const vals = [2, 3, 5, 10];
            const v = vals[Math.floor(Math.random() * vals.length)];
            this.items.push({ x, y: -30, type: 'gate', op: '+', val: v, w: 50, h: 26 });
        } else if (type < 0.55) {
            const vals = [2, 3];
            const v = vals[Math.floor(Math.random() * vals.length)];
            this.items.push({ x, y: -30, type: 'gate', op: '×', val: v, w: 50, h: 26 });
        } else {
            const maxEnemy = Math.min(50 + this.frame * 0.3, 500);
            const v = Math.floor(Math.random() * maxEnemy) + 1;
            const size = 20 + Math.min(v / 10, 20);
            this.items.push({ x, y: -30, type: 'enemy', val: v, w: size, h: size, drawn: false });
        }
    }

    update() {
        if (this.gameOver) return;
        this.frame++;

        this.player.x += (this.player.targetX - this.player.x) * 0.12;
        this.player.x = Math.max(this.player.r, Math.min(this.w - this.player.r, this.player.x));

        this.speed = 2 + this.frame / 600;
        this.spawnTimer++;
        const spawnInterval = Math.max(20, 50 - this.frame / 40);
        if (this.spawnTimer >= spawnInterval) {
            this.spawnTimer = 0;
            this.spawnItem();
        }

        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.y += this.speed;

            // Collision with player
            const dx = this.player.x - item.x;
            const dy = this.player.y - item.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const threshold = this.player.r + (item.w / 2 || item.h / 2);

            if (dist < threshold) {
                if (item.type === 'gate') {
                    if (item.op === '+') this.player.number += item.val;
                    else if (item.op === '×') this.player.number *= item.val;
                    if (this.numEl) this.numEl.textContent = 'Number: ' + this.player.number;
                    this.score += 5;
                    this.spawnAbsorb(item.x, item.y, '#2ecc71');
                    this.items.splice(i, 1);
                    continue;
                } else if (item.type === 'enemy') {
                    if (this.player.number >= item.val) {
                        this.player.number += Math.floor(item.val / 2);
                        if (this.numEl) this.numEl.textContent = 'Number: ' + this.player.number;
                        this.score += item.val;
                        this.spawnAbsorb(item.x, item.y, '#f1c40f');
                        this.items.splice(i, 1);
                        continue;
                    } else {
                        this.gameOver = true;
                        this.spawnAbsorb(this.player.x, this.player.y, '#e74c3c');
                        return;
                    }
                }
            }

            // Remove off-screen
            if (item.y > this.h + 40) {
                if (item.type === 'enemy' && !item.drawn) {
                    this.gameOver = true;
                    return;
                }
                this.items.splice(i, 1);
            }
        }

        // Update absorb particles
        for (let i = this.absorbParticles.length - 1; i >= 0; i--) {
            const p = this.absorbParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            if (p.life <= 0) this.absorbParticles.splice(i, 1);
        }

        if (this.scoreEl) this.scoreEl.textContent = 'Score: ' + this.score;
    }

    spawnAbsorb(x, y, color) {
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.absorbParticles.push({
                x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3, color, life: 30 + Math.random() * 20
            });
        }
    }

    draw() {
        const ctx = this.ctx;
        const w = this.w, h = this.h;

        // Background
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#0a0e27');
        grad.addColorStop(0.5, '#1a1040');
        grad.addColorStop(1, '#0a0e27');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Ground line
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, this.player.y + this.player.r + 20);
        ctx.lineTo(w, this.player.y + this.player.r + 20);
        ctx.stroke();

        // Items
        for (const item of this.items) {
            if (item.type === 'gate') {
                const color = item.op === '+' ? 'rgba(46, 204, 113, 0.85)' : 'rgba(52, 152, 219, 0.85)';
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.roundRect(item.x - item.w / 2, item.y - item.h / 2, item.w, item.h, 6);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 14px Segoe UI, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(item.op + item.val, item.x, item.y);
                item.drawn = true;
            } else if (item.type === 'enemy') {
                const intensity = Math.min(item.val / 100, 1);
                const r = Math.round(200 + 55 * (1 - intensity));
                const g = Math.round(60 - 40 * intensity);
                ctx.fillStyle = `rgb(${r}, ${g}, 60)`;
                ctx.beginPath();
                ctx.arc(item.x, item.y, item.w / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = `rgba(255,255,255,${0.15 + intensity * 0.2})`;
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.fillStyle = '#fff';
                ctx.font = `bold ${Math.max(10, 14 - item.w / 20)}px Segoe UI, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(item.val, item.x, item.y);
                item.drawn = true;
            }
        }

        // Absorb particles
        for (const p of this.absorbParticles) {
            ctx.globalAlpha = p.life / 50;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Player
        const pGlow = ctx.createRadialGradient(this.player.x, this.player.y, 0, this.player.x, this.player.y, this.player.r * 1.5);
        const hue = Math.min(this.player.number * 2, 240);
        pGlow.addColorStop(0, `rgba(100, ${200 - hue * 0.3}, 255, 0.3)`);
        pGlow.addColorStop(1, 'rgba(100, 200, 255, 0)');
        ctx.fillStyle = pGlow;
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, this.player.r * 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(this.player.x, this.player.y, this.player.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.player.number, this.player.x, this.player.y);

        // Game over
        if (this.gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 28px Segoe UI, sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('Game Over', w / 2, h / 2 - 20);
            ctx.fillStyle = '#fff';
            ctx.font = '16px Segoe UI, sans-serif';
            ctx.fillText('Number: ' + this.player.number + ' | Score: ' + this.score, w / 2, h / 2 + 14);
        }
    }

    pause() {
        if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
    }
}

// ============================================================
// Penalty Kicker (Soccer)
// ============================================================
class PenaltyKickerGame {
    constructor() {
        this.canvas = document.getElementById('penaltykicker-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreEl = document.getElementById('penaltykicker-score');
        this.msgEl = document.getElementById('penaltykicker-msg');
        this.animationId = null;
        this.init();
    }
    init() {
        this.w = this.canvas.width;
        this.h = this.canvas.height;
        this.goal = { x: 50, y: 30, w: this.w - 100, h: 120 };
        this.ball = { x: this.w / 2, y: this.h - 80, r: 12, vx: 0, vy: 0, moving: false };
        this.goalkeeper = { x: this.w / 2, y: this.goal.y + this.goal.h / 2, r: 25, dir: 1, speed: 2 };
        this.shotsLeft = 5;
        this.shotsTaken = 0;
        this.goals = 0;
        this.phase = 'aim';
        this.aimX = this.w / 2;
        this.aimY = this.goal.y + 30;
        this.result = null;
        this.resultTimer = 0;
        this.gameOver = false;
        this._looping = false;
        if (this.scoreEl) this.scoreEl.textContent = 'Goals: 0 / 5';
        if (this.msgEl) this.msgEl.textContent = 'Aim with mouse, click to shoot';
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.loop = () => {
            this.update();
            this.draw();
            if (!this.gameOver && this._looping) this.animationId = requestAnimationFrame(this.loop);
        };
        this._looping = true;
        this.animationId = requestAnimationFrame(this.loop);
        if (!this._mousemove) {
            this._mousemove = (e) => {
                if (this.phase !== 'aim') return;
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = this.w / rect.width;
                const scaleY = this.h / rect.height;
                const mx = (e.clientX - rect.left) * scaleX;
                const my = (e.clientY - rect.top) * scaleY;
                this.aimX = Math.max(this.goal.x + 10, Math.min(this.goal.x + this.goal.w - 10, mx));
                this.aimY = Math.max(this.goal.y + 10, Math.min(this.goal.y + this.goal.h - 10, my));
            };
            this._click = () => {
                if (this.phase !== 'aim' || this.gameOver) return;
                this.shoot();
            };
            this.canvas.addEventListener('mousemove', this._mousemove);
            this.canvas.addEventListener('click', this._click);
            enableTouchOnCanvas(this.canvas);
        }
    }
    shoot() {
        this.phase = 'shoot';
        const dx = this.aimX - this.ball.x;
        const dy = this.aimY - this.ball.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 12;
        this.ball.vx = (dx / dist) * speed;
        this.ball.vy = (dy / dist) * speed;
        this.ball.moving = true;
        if (this.msgEl) this.msgEl.textContent = '';
    }
    update() {
        if (this.gameOver) return;
        if (this.phase === 'aim') {
            this.goalkeeper.x += this.goalkeeper.dir * this.goalkeeper.speed;
            if (this.goalkeeper.x < this.goal.x + this.goalkeeper.r) this.goalkeeper.dir = 1;
            if (this.goalkeeper.x > this.goal.x + this.goal.w - this.goalkeeper.r) this.goalkeeper.dir = -1;
        }
        if (this.phase === 'shoot') {
            this.ball.x += this.ball.vx;
            this.ball.y += this.ball.vy;
            if (this.ball.y < this.goal.y + this.goal.h) {
                this.ball.moving = false;
                this.shotsTaken++;
                // Check if saved by goalkeeper
                const gkdx = this.ball.x - this.goalkeeper.x;
                const gkdy = this.ball.y - this.goalkeeper.y;
                const gkDist = Math.sqrt(gkdx * gkdx + gkdy * gkdy);
                const inGoal = this.ball.x > this.goal.x && this.ball.x < this.goal.x + this.goal.w;
                if (inGoal && gkDist > this.goalkeeper.r + this.ball.r) {
                    this.goals++;
                    this.result = 'GOAL!';
                } else {
                    this.result = inGoal ? 'SAVED!' : 'MISS!';
                }
                if (this.scoreEl) this.scoreEl.textContent = `Goals: ${this.goals} / ${this.shotsLeft}`;
                this.resultTimer = 60;
                this.phase = 'result';
            }
        }
        if (this.phase === 'result') {
            this.resultTimer--;
            if (this.resultTimer <= 0) {
                if (this.shotsTaken >= this.shotsLeft) {
                    this.gameOver = true;
                    if (this.msgEl) this.msgEl.textContent = this.goals >= 3 ? 'Great shooting!' : 'Keep practicing!';
                } else {
                    this.phase = 'aim';
                    this.ball.x = this.w / 2;
                    this.ball.y = this.h - 80;
                    this.ball.vx = 0;
                    this.ball.vy = 0;
                    if (this.msgEl) this.msgEl.textContent = 'Aim with mouse, click to shoot';
                }
            }
        }
    }
    draw() {
        const ctx = this.ctx;
        ctx.fillStyle = '#0a0e27';
        ctx.fillRect(0, 0, this.w, this.h);
        // Field
        ctx.fillStyle = '#1a472a';
        ctx.fillRect(0, 0, this.w, this.h);
        // Goal
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.goal.x, this.goal.y, this.goal.w, this.goal.h);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(this.goal.x, this.goal.y, this.goal.w, this.goal.h);
        // Net lines
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < this.goal.w; i += 20) {
            ctx.beginPath();
            ctx.moveTo(this.goal.x + i, this.goal.y);
            ctx.lineTo(this.goal.x + i, this.goal.y + this.goal.h);
            ctx.stroke();
        }
        for (let i = 0; i < this.goal.h; i += 20) {
            ctx.beginPath();
            ctx.moveTo(this.goal.x, this.goal.y + i);
            ctx.lineTo(this.goal.x + this.goal.w, this.goal.y + i);
            ctx.stroke();
        }
        // Goalkeeper
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(this.goalkeeper.x, this.goalkeeper.y, this.goalkeeper.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Segoe UI, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GK', this.goalkeeper.x, this.goalkeeper.y);
        // Ball
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Ball pentagons
        ctx.fillStyle = '#333';
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2;
            const px = this.ball.x + Math.cos(a) * 5;
            const py = this.ball.y + Math.sin(a) * 5;
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        // Aim crosshair
        if (this.phase === 'aim') {
            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.aimX - 15, this.aimY);
            ctx.lineTo(this.aimX + 15, this.aimY);
            ctx.moveTo(this.aimX, this.aimY - 15);
            ctx.lineTo(this.aimX, this.aimY + 15);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.beginPath();
            ctx.arc(this.aimX, this.aimY, 30, 0, Math.PI * 2);
            ctx.stroke();
        }
        // Result
        if (this.phase === 'result' && this.result) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(this.w / 2 - 80, this.h / 2 - 30, 160, 60);
            ctx.fillStyle = this.result === 'GOAL!' ? '#2ecc71' : '#e74c3c';
            ctx.font = 'bold 28px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.result, this.w / 2, this.h / 2);
        }
        if (this.gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, this.w, this.h);
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 28px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`Final: ${this.goals} / ${this.shotsLeft}`, this.w / 2, this.h / 2 - 16);
            ctx.fillStyle = '#fff';
            ctx.font = '16px Segoe UI, sans-serif';
            ctx.fillText(this.goals >= 3 ? 'You Win!' : 'Try Again', this.w / 2, this.h / 2 + 16);
        }
    }
    pause() {
        this._looping = false;
        if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
    }
}

// ============================================================
// Basketball — improved with arc preview, rim physics, timed mode
// ============================================================
class BasketballGame {
    constructor() {
        this.canvas = document.getElementById('basketball-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreEl = document.getElementById('basketball-score');
        this.streakEl = document.getElementById('basketball-streak');
        this.timerEl = document.getElementById('basketball-timer');
        this.bestEl = document.getElementById('basketball-best');
        this.accEl = document.getElementById('basketball-acc');
        this.animationId = null;
        this.best = parseInt(localStorage.getItem('hoopsBest') || '0');
        if (this.bestEl) this.bestEl.textContent = 'Best: ' + this.best;
        this.init();
    }

    init() {
        this.w = this.canvas.width;
        this.h = this.canvas.height;
        this.hoopX = this.w / 2;
        this.hoopY = 85;
        this.hoopW = 62;
        this.rimR = 2.5;
        this.backboardX = this.hoopX;
        this.backboardY = this.hoopY - 30;
        this.backboardW = 8;
        this.backboardH = 50;
        this.ball = { x: this.w - 80, y: this.h - 50, r: 13, vx: 0, vy: 0, active: false, rotation: 0 };
        this.aimAngle = -Math.PI / 4;
        this.power = 0;
        this.powerDir = 1;
        this.charging = false;
        this.phase = 'aim';
        this.score = 0;
        this.streak = 0;
        this.bestStreak = 0;
        this.shots = 0;
        this.made = 0;
        this.result = null;
        this.resultTimer = 0;
        this.gameOver = false;
        this.timer = 30;
        this.timerAccum = 0;
        this.particles = [];
        this.rimShake = 0;
        this.netSway = 0;
        this.rallyMode = false;

        if (this.scoreEl) this.scoreEl.textContent = 'Score: 0';
        if (this.streakEl) this.streakEl.textContent = 'Streak: 0';
        if (this.timerEl) this.timerEl.textContent = 'Time: 30';
        if (this.accEl) this.accEl.textContent = 'FG: 0/0';

        if (this.animationId) cancelAnimationFrame(this.animationId);
        this._looping = false;
        this.loop = (now) => {
            this.update(now);
            this.draw();
            if (this._looping) this.animationId = requestAnimationFrame(this.loop);
        };
        this._looping = true;
        this.lastTime = performance.now();
        this.animationId = requestAnimationFrame(this.loop);
        if (!this._mousemove) {
            this._mousemove = (e) => {
                if (this.phase !== 'aim') return;
                const rect = this.canvas.getBoundingClientRect();
                const sx = this.w / rect.width;
                const sy = this.h / rect.height;
                const mx = (e.clientX - rect.left) * sx;
                const my = (e.clientY - rect.top) * sy;
                const dx = mx - this.ball.x;
                const dy = my - this.ball.y;
                if (dx >= 0) return;
                this.aimAngle = Math.atan2(dy, dx);
                if (this.aimAngle > -0.15) this.aimAngle = -0.15;
                if (this.aimAngle < -Math.PI / 2 + 0.15) this.aimAngle = -Math.PI / 2 + 0.15;
            };
            this._mousedown = () => {
                if (this.phase !== 'aim' || this.gameOver) return;
                this.charging = true;
                this.power = 0;
                this.powerDir = 1;
            };
            this._mouseup = () => {
                if (this.phase !== 'aim' || !this.charging || this.gameOver) return;
                this.charging = false;
                this.shoot();
            };
            this.canvas.addEventListener('mousemove', this._mousemove);
            this.canvas.addEventListener('mousedown', this._mousedown);
            this.canvas.addEventListener('mouseup', this._mouseup);
            enableTouchOnCanvas(this.canvas);
        }
    }

    shoot() {
        this.phase = 'shoot';
        const power = 0.25 + this.power * 0.75;
        const speed = 13 * power;
        this.ball.vx = Math.cos(this.aimAngle) * speed;
        this.ball.vy = Math.sin(this.aimAngle) * speed;
        this.ball.active = true;
        this.ball.rotation = 0;
        this.shots++;
        if (this.accEl) this.accEl.textContent = 'FG: ' + this.made + '/' + this.shots;
    }

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const spd = 1 + Math.random() * 4;
            this.particles.push({
                x, y,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd - 2,
                life: 30 + Math.random() * 30,
                maxLife: 60,
                color,
                size: 2 + Math.random() * 4
            });
        }
    }

    update(now) {
        // Timer
        if (this.phase !== 'gameover' && !this.gameOver) {
            const dt = Math.min((now - this.lastTime) / 1000, 0.05);
            this.lastTime = now;
            if (this.ball.active || this.phase === 'aim' || this.charging) {
                this.timerAccum += dt;
                if (this.timerAccum >= 1) {
                    this.timerAccum -= 1;
                    this.timer--;
                    if (this.timerEl) this.timerEl.textContent = 'Time: ' + this.timer;
                    if (this.timer <= 0) {
                        this.endGame();
                    }
                }
            }
        }

        // Charge power
        if (this.charging) {
            this.power += 0.025 * this.powerDir;
            if (this.power > 1) { this.power = 1; this.powerDir = -1; }
            if (this.power < 0) { this.power = 0; this.powerDir = 1; }
        }

        // Ball physics
        if (this.ball.active) {
            const gravity = 0.35;
            this.ball.vy += gravity;
            this.ball.x += this.ball.vx;
            this.ball.y += this.ball.vy;
            this.ball.rotation += this.ball.vx * 0.03;

            const r = this.ball.r;

            // Floor bounce
            if (this.ball.y + r > this.h) {
                this.ball.y = this.h - r;
                this.ball.vy = -this.ball.vy * 0.45;
                this.ball.vx *= 0.85;
                if (Math.abs(this.ball.vy) < 0.8) {
                    this.ball.vy = 0;
                    if (Math.abs(this.ball.vx) < 0.3) {
                        this.ball.vx = 0;
                        this.ball.active = false;
                        this.finishShot(false);
                        return;
                    }
                }
            }

            // Wall bounce
            if (this.ball.x - r < 0) {
                this.ball.x = r;
                this.ball.vx = -this.ball.vx * 0.6;
            }
            if (this.ball.x + r > this.w) {
                this.ball.x = this.w - r;
                this.ball.vx = -this.ball.vx * 0.6;
            }
            if (this.ball.y - r < 0) {
                this.ball.y = r;
                this.ball.vy = -this.ball.vy * 0.6;
            }

            // Backboard collision
            const bbLeft = this.backboardX - this.backboardW / 2;
            const bbRight = this.backboardX + this.backboardW / 2;
            const bbTop = this.backboardY;
            const bbBottom = this.backboardY + this.backboardH;

            if (this.ball.x + r > bbLeft && this.ball.x - r < bbRight &&
                this.ball.y + r > bbTop && this.ball.y - r < bbBottom) {
                const overlapLeft = (this.ball.x + r) - bbLeft;
                const overlapRight = bbRight - (this.ball.x - r);
                const overlapTop = (this.ball.y + r) - bbTop;
                const overlapBottom = bbBottom - (this.ball.y - r);
                const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

                if (minOverlap === overlapLeft || minOverlap === overlapRight) {
                    this.ball.vx = -this.ball.vx * 0.5;
                    this.ball.x += (minOverlap === overlapLeft ? -1 : 1) * 2;
                } else {
                    this.ball.vy = -this.ball.vy * 0.5;
                    this.ball.y += (minOverlap === overlapTop ? -1 : 1) * 2;
                }
            }

            // Rim collision — left rim
            const rimLX = this.hoopX - this.hoopW / 2;
            const rimRX = this.hoopX + this.hoopW / 2;
            const rimY = this.hoopY;

            for (const rim of [{ x: rimLX, y: rimY }, { x: rimRX, y: rimY }]) {
                const dx = this.ball.x - rim.x;
                const dy = this.ball.y - rim.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = r + this.rimR + 2;
                if (dist < minDist && dist > 0) {
                    const overlap = minDist - dist;
                    const nx = dx / dist;
                    const ny = dy / dist;
                    this.ball.x += nx * overlap;
                    this.ball.y += ny * overlap;
                    const dot = this.ball.vx * nx + this.ball.vy * ny;
                    this.ball.vx -= 2 * dot * nx * 0.6;
                    this.ball.vy -= 2 * dot * ny * 0.6;
                    this.ball.vx += nx * 1.5;
                    this.ball.vy += ny * 1.5;
                    this.rimShake = 8;
                }
            }

            // Net collision — check if ball is passing through hoop area
            const hoopLeft = this.hoopX - this.hoopW / 2 + 5;
            const hoopRight = this.hoopX + this.hoopW / 2 - 5;
            const prevY = this.ball.y - this.ball.vy - gravity;

            if (this.ball.vy > 0 &&
                prevY <= rimY + 4 && this.ball.y >= rimY - 4 &&
                this.ball.x > hoopLeft && this.ball.x < hoopRight) {
                // Ball passed through the hoop — SCORE
                this.made++;
                this.score += this.getPoints();
                this.streak++;
                if (this.streak > this.bestStreak) this.bestStreak = this.streak;
                if (this.scoreEl) this.scoreEl.textContent = 'Score: ' + this.score;
                if (this.streakEl) this.streakEl.textContent = 'Streak: ' + this.streak;
                if (this.accEl) this.accEl.textContent = 'FG: ' + this.made + '/' + this.shots;
                this.netSway = 15;
                this.spawnParticles(this.ball.x, this.ball.y, '#f1c40f', 20);
                this.spawnParticles(this.ball.x, this.ball.y, '#fff', 12);
                const streakBonus = Math.floor(this.streak / 3);
                const msgs = ['Swish!', 'Nothing but net!', 'Splash!', 'Drain!', 'Wet!'];
                const idx = Math.min(Math.floor(this.streak / 2), msgs.length - 1);
                this.result = msgs[idx] + (streakBonus > 0 ? ' x' + (1 + streakBonus) : '');
                this.resultTimer = 40;
                this.ball.active = false;
                this.phase = 'result';
                this.checkBest();
                return;
            }

            // Shot died (rolling on floor or stopped)
            if (!this.ball.active) return;

            // Fell below hoop significantly without scoring — miss
            if (this.ball.y > this.hoopY + 180 && this.ball.vy > 1) {
                if (Math.abs(this.ball.vx) < 0.5 && Math.abs(this.ball.vy) < 0.5) {
                    this.ball.active = false;
                    this.finishShot(false);
                }
            }

            // Ball went off screen bottom
            if (this.ball.y > this.h + 50) {
                this.ball.active = false;
                this.finishShot(false);
            }
        }

        // Result timer
        if (this.phase === 'result' && this.resultTimer > 0) {
            this.resultTimer--;
            if (this.resultTimer <= 0 && !this.gameOver) {
                this.phase = 'aim';
                this.resetBall();
            }
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life--;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Decay
        if (this.rimShake > 0) this.rimShake *= 0.85;
        if (this.netSway > 0) this.netSway *= 0.92;
        if (this.netSway < 0.1) this.netSway = 0;
    }

    getPoints() {
        const streakBonus = Math.floor(this.streak / 3);
        return 2 + streakBonus;
    }

    finishShot(scored) {
        this.ball.active = false;
        if (!scored) {
            this.streak = 0;
            if (this.streakEl) this.streakEl.textContent = 'Streak: 0';
            this.result = 'Missed';
            this.resultTimer = 25;
            this.spawnParticles(this.ball.x, this.ball.y, '#e74c3c', 8);
        } else {
            this.result = 'Score!';
            this.resultTimer = 25;
        }
        this.phase = 'result';
    }

    resetBall() {
        this.ball.x = this.w - 80;
        this.ball.y = this.h - 50;
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.ball.active = false;
        this.ball.rotation = 0;
        this.power = 0;
        this.result = null;
    }

    endGame() {
        this.gameOver = true;
        this.phase = 'gameover';
        if (this.timerEl) this.timerEl.textContent = 'Time: 0';
        this.checkBest();
    }

    checkBest() {
        if (this.score > this.best) {
            this.best = this.score;
            localStorage.setItem('hoopsBest', String(this.best));
            if (this.bestEl) this.bestEl.textContent = 'Best: ' + this.best;
        }
    }

    draw() {
        const ctx = this.ctx;
        const w = this.w, h = this.h;
        const grd = ctx.createLinearGradient(0, 0, 0, h);

        // Court background
        grd.addColorStop(0, '#1a1a2e');
        grd.addColorStop(0.3, '#1e1e38');
        grd.addColorStop(1, '#16213e');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);

        // Wood floor
        const floorY = h * 0.45;
        ctx.fillStyle = '#c4956a';
        ctx.fillRect(0, floorY, w, h - floorY);
        ctx.fillStyle = '#b8875e';
        for (let i = 0; i < w; i += 12) {
            ctx.fillRect(i, floorY, 1, h - floorY);
        }

        // Court lines
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 2;
        // Three-point arc
        ctx.beginPath();
        ctx.arc(this.hoopX, floorY, 130, Math.PI, 0);
        ctx.stroke();
        // Free-throw circle
        ctx.beginPath();
        ctx.arc(this.hoopX, floorY, 40, 0, Math.PI * 2);
        ctx.stroke();
        // Key / paint
        ctx.strokeRect(this.hoopX - 60, floorY, 120, h - floorY);

        // Pole
        ctx.fillStyle = '#666';
        ctx.fillRect(this.hoopX - 3, this.hoopY + 12, 6, h - this.hoopY - 12);

        // Backboard
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(this.backboardX - this.backboardW / 2, this.backboardY, this.backboardW, this.backboardH);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.backboardX - this.backboardW / 2, this.backboardY, this.backboardW, this.backboardH);
        // Target square on backboard
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.backboardX - 6, this.hoopY - 12, 12, 24);

        // Rim with shake
        const shakeX = Math.sin(this.rimShake * 2) * this.rimShake * 0.3;
        const rimLX = this.hoopX - this.hoopW / 2 + shakeX;
        const rimRX = this.hoopX + this.hoopW / 2 + shakeX;
        const rimY = this.hoopY;

        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(rimLX, rimY);
        ctx.lineTo(rimRX, rimY);
        ctx.stroke();

        // Rim pegs
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(rimLX - 2, rimY - 3, 4, 6);
        ctx.fillRect(rimRX - 2, rimY - 3, 4, 6);

        // Net with sway
        const sway = this.netSway;
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        const netSegs = 7;
        for (let i = 0; i <= netSegs; i++) {
            const t = (i / netSegs) - 0.5;
            const topX = this.hoopX + t * this.hoopW * 0.85 + shakeX;
            const botX = this.hoopX + t * this.hoopW * 1.1 + shakeX + sway * Math.sin(i * 0.8);
            ctx.beginPath();
            ctx.moveTo(topX, rimY + 1);
            ctx.lineTo(botX, rimY + 28);
            ctx.stroke();
        }
        // Net horizontal links
        for (let row = 1; row <= 3; row++) {
            const rowT = row / 4;
            const swayFac = sway * 0.6 * rowT;
            ctx.beginPath();
            for (let i = 0; i <= netSegs; i++) {
                const t = (i / netSegs) - 0.5;
                const x = this.hoopX + t * (this.hoopW * 0.85 + rowT * this.hoopW * 0.25) + shakeX + swayFac * Math.sin(i * 0.8 + row);
                const y = rimY + 1 + rowT * 27;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // Trajectory arc preview
        if (this.phase === 'aim' && !this.charging) {
            const previewPower = 0.25 + 0.5 * 0.75;
            const pSpeed = 13 * previewPower;
            const pvx = Math.cos(this.aimAngle) * pSpeed;
            const pvy = Math.sin(this.aimAngle) * pSpeed;
            let px = this.ball.x, py = this.ball.y;

            ctx.strokeStyle = 'rgba(255,255,255,0.08)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 6]);
            ctx.beginPath();
            ctx.moveTo(px, py);
            for (let i = 0; i < 40; i++) {
                pvy !== undefined;
                px += pvx;
                py += pvy;
                pvy += 0.35;
                if (py > h || px > w || px < 0) break;
                ctx.lineTo(px, py);
            }
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Power bar
        if (this.charging) {
            const barW = 100, barH = 10, barX = (w - barW) / 2, barY = h - 40;
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.roundRect(barX - 2, barY - 2, barW + 4, barH + 4, 4);
            ctx.fill();
            const hue = 120 - this.power * 120;
            ctx.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
            ctx.beginPath();
            ctx.roundRect(barX, barY, barW * this.power, barH, 3);
            ctx.fill();
        }

        // Ball
        if (this.ball.active || this.phase === 'aim') {
            const bx = this.ball.x, by = this.ball.y, br = this.ball.r;
            const rot = this.ball.rotation;

            ctx.save();
            ctx.translate(bx, by);
            ctx.rotate(rot);

            // Glow
            const glow = ctx.createRadialGradient(0, 0, br * 0.5, 0, 0, br * 1.8);
            glow.addColorStop(0, 'rgba(230, 126, 34, 0.15)');
            glow.addColorStop(1, 'rgba(230, 126, 34, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(0, 0, br * 1.8, 0, Math.PI * 2);
            ctx.fill();

            // Ball body
            const ballGrd = ctx.createRadialGradient(-br * 0.3, -br * 0.3, br * 0.1, 0, 0, br);
            ballGrd.addColorStop(0, '#f5a623');
            ballGrd.addColorStop(0.6, '#e67e22');
            ballGrd.addColorStop(1, '#c0392b');
            ctx.fillStyle = ballGrd;
            ctx.beginPath();
            ctx.arc(0, 0, br, 0, Math.PI * 2);
            ctx.fill();

            // Ball seam lines
            ctx.strokeStyle = 'rgba(0,0,0,0.25)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(0, 0, br, -Math.PI / 3, Math.PI / 3);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(0, 0, br, 2 * Math.PI / 3, 4 * Math.PI / 3);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, -br);
            ctx.lineTo(0, br);
            ctx.stroke();

            ctx.restore();

            // Aim arrow (when aiming, not charging)
            if (this.phase === 'aim' && !this.charging) {
                ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                ctx.lineWidth = 1.5;
                const al = 50;
                const ax = bx + Math.cos(this.aimAngle) * (br + 5);
                const ay = by + Math.sin(this.aimAngle) * (br + 5);
                ctx.beginPath();
                ctx.moveTo(ax, ay);
                ctx.lineTo(ax + Math.cos(this.aimAngle) * al, ay + Math.sin(this.aimAngle) * al);
                ctx.stroke();
            }
        }

        // Particles
        for (const p of this.particles) {
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * ctx.globalAlpha, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Result text
        if (this.phase === 'result' && this.result) {
            const alpha = Math.min(1, this.resultTimer / 15);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = 'rgba(0,0,0,0.55)';
            ctx.beginPath();
            ctx.roundRect(w / 2 - 100, h / 2 - 28, 200, 56, 10);
            ctx.fill();
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 22px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.result, w / 2, h / 2 - 2);
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '12px Segoe UI, sans-serif';
            ctx.fillText('Streak: ' + this.streak, w / 2, h / 2 + 20);
            ctx.globalAlpha = 1;
        }

        // Game over
        if (this.gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.65)';
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 30px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Game Over', w / 2, h / 2 - 50);
            ctx.fillStyle = '#fff';
            ctx.font = '18px Segoe UI, sans-serif';
            ctx.fillText('Score: ' + this.score, w / 2, h / 2);
            const pct = this.shots > 0 ? Math.round(this.made / this.shots * 100) : 0;
            ctx.fillText('FG: ' + this.made + '/' + this.shots + ' (' + pct + '%)', w / 2, h / 2 + 30);
            ctx.fillText('Best Streak: ' + this.bestStreak, w / 2, h / 2 + 56);

            if (this.score >= this.best && this.score > 0) {
                ctx.fillStyle = '#f1c40f';
                ctx.font = 'bold 14px Segoe UI, sans-serif';
                ctx.fillText('★ New Best! ★', w / 2, h / 2 + 84);
            }

            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '13px Segoe UI, sans-serif';
            ctx.fillText('Click "New Game" to play again', w / 2, h / 2 + 116);
        }

        // Instruction
        if (this.phase === 'aim' && !this.charging && !this.gameOver) {
            ctx.fillStyle = 'rgba(255,255,255,0.12)';
            ctx.font = '12px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Aim · Hold to power · Release to shoot', w / 2, h - 12);
        }
    }

    pause() {
        this._looping = false;
        if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
    }
}

// ============================================================
// Sprint Race
// ============================================================
class SprintGame {
    constructor() {
        this.canvas = document.getElementById('sprint-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.distEl = document.getElementById('sprint-dist');
        this.timeEl = document.getElementById('sprint-time');
        this.bestEl = document.getElementById('sprint-best');
        this.animationId = null;
        this.best = parseInt(localStorage.getItem('sprintBest') || '0');
        if (this.bestEl) this.bestEl.textContent = 'Best: ' + (this.best / 10).toFixed(1) + 's';
        this.init();
    }
    init() {
        this.w = this.canvas.width;
        this.h = this.canvas.height;
        this.player = { x: 50, y: this.h / 2 - 30, w: 30, h: 50, speed: 0, distance: 0 };
        this.opponent = { x: 50, y: this.h / 2 + 30, w: 30, h: 50, speed: 0, distance: 0, baseSpeed: 3 + Math.random() * 1.5 };
        this.raceLength = 500;
        this.time = 0;
        this.gameOver = false;
        this.won = false;
        this.started = false;
        this.tapCount = 0;
        this.finishLineX = 50 + this.raceLength;
        this.opponent.legPhase = 0;
        this.player.legPhase = 0;
        if (this.distEl) this.distEl.textContent = 'Distance: 0m';
        if (this.timeEl) this.timeEl.textContent = 'Time: 0.0s';
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.loop = () => {
            this.update();
            this.draw();
            if (!this.gameOver) this.animationId = requestAnimationFrame(this.loop);
        };
        this.animationId = requestAnimationFrame(this.loop);
        if (!this._handler) {
            this._handler = (e) => {
                if (e.type === 'keydown' && e.key !== ' ' && e.key !== 'ArrowUp') return;
                e.preventDefault();
                if (!this.started) { this.started = true; return; }
                if (!this.gameOver) {
                    this.player.speed = Math.min(this.player.speed + 1.2, 12);
                    this.tapCount++;
                }
            };
            document.addEventListener('keydown', this._handler);
            this.canvas.addEventListener('click', this._handler);
            enableTouchOnCanvas(this.canvas);
        }
    }
    update() {
        if (!this.started || this.gameOver) return;
        this.time += 1 / 60;
        // Player deceleration
        this.player.speed *= 0.97;
        if (this.player.speed < 0.1) this.player.speed = 0;
        // Opponent
        this.opponent.speed = this.opponent.baseSpeed + Math.sin(this.time * 3) * 0.5;
        // Move
        this.player.distance += this.player.speed;
        this.opponent.distance += this.opponent.speed;
        // Leg animation
        this.player.legPhase += this.player.speed * 0.1;
        this.opponent.legPhase += this.opponent.speed * 0.1;
        // Clamp
        this.player.x = 50 + this.player.distance;
        this.opponent.x = 50 + this.opponent.distance;
        // Check finish
        if (this.player.distance >= this.raceLength || this.opponent.distance >= this.raceLength) {
            this.gameOver = true;
            this.won = this.player.distance >= this.raceLength && this.player.distance >= this.opponent.distance;
            if (!this.won && this.opponent.distance >= this.raceLength) this.won = false;
            // If both finish same frame, player wins
            if (this.player.distance >= this.raceLength) this.won = true;
            const timeCs = Math.floor(this.time * 10);
            if (this.won && timeCs > 0 && (this.best === 0 || timeCs < this.best)) {
                this.best = timeCs;
                localStorage.setItem('sprintBest', String(this.best));
                if (this.bestEl) this.bestEl.textContent = 'Best: ' + (this.best / 10).toFixed(1) + 's';
            }
        }
        if (this.distEl) this.distEl.textContent = 'Distance: ' + Math.floor(this.player.distance) + 'm';
        if (this.timeEl) this.timeEl.textContent = 'Time: ' + (Math.floor(this.time * 10) / 10).toFixed(1) + 's';
    }
    draw() {
        const ctx = this.ctx;
        ctx.fillStyle = '#f7f7f7';
        ctx.fillRect(0, 0, this.w, this.h);
        // Track
        ctx.fillStyle = '#e8d5b7';
        ctx.fillRect(0, this.h / 2 - 60, this.w, 120);
        // Track lines
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, this.h / 2 - 60);
        ctx.lineTo(this.w, this.h / 2 - 60);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, this.h / 2 + 60);
        ctx.lineTo(this.w, this.h / 2 + 60);
        ctx.stroke();
        // Lane lines
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(0, this.h / 2);
        ctx.lineTo(this.w, this.h / 2);
        ctx.stroke();
        ctx.setLineDash([]);
        // Distance markers
        for (let d = 0; d <= this.raceLength; d += 50) {
            const x = 50 + d;
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            ctx.fillRect(x - 1, this.h / 2 - 60, 2, 120);
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.font = '9px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(d + 'm', x, this.h / 2 + 75);
        }
        // Finish line
        ctx.fillStyle = '#333';
        ctx.fillRect(this.finishLineX - 3, this.h / 2 - 60, 6, 120);
        // Checkerboard
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                ctx.fillStyle = (i + j) % 2 === 0 ? '#fff' : '#333';
                ctx.fillRect(this.finishLineX + i * 3, this.h / 2 - 60 + j * 15, 3, 15);
            }
        }
        // Draw runner
        const drawRunner = (x, y, color, legPhase, isPlayer) => {
            const cy = y + 25;
            // Body
            ctx.fillStyle = color;
            ctx.fillRect(x + 5, cy - 20, 20, 25);
            // Head
            ctx.beginPath();
            ctx.arc(x + 15, cy - 26, 10, 0, Math.PI * 2);
            ctx.fill();
            // Arms
            ctx.fillStyle = color;
            const armSwing = Math.sin(legPhase) * 8;
            ctx.fillRect(x - 2, cy - 15, 8, 5);
            ctx.fillRect(x + 24, cy - 15 + armSwing, 8, 5);
            // Legs
            const legSwing = Math.sin(legPhase) * 10;
            ctx.fillRect(x + 7, cy + 5, 6, 20 + legSwing);
            ctx.fillRect(x + 17, cy + 5, 6, 20 - legSwing);
            // Shoes
            ctx.fillStyle = '#fff';
            ctx.fillRect(x + 5, cy + 22 + legSwing, 10, 5);
            ctx.fillRect(x + 15, cy + 22 - legSwing, 10, 5);
            // Number
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(isPlayer ? 'P' : 'AI', x + 15, cy - 5);
        };
        drawRunner(this.opponent.x, this.opponent.y, '#e74c3c', this.opponent.legPhase, false);
        drawRunner(this.player.x, this.player.y, '#3498db', this.player.legPhase, true);
        // Instructions
        if (!this.started) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(this.w / 2 - 130, 10, 260, 36);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Tap Space/Click to Sprint!', this.w / 2, 34);
        }
        if (this.gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, this.w, this.h);
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 28px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.won ? 'You Win!' : 'You Lose!', this.w / 2, this.h / 2 - 16);
            ctx.fillStyle = '#fff';
            ctx.font = '16px Segoe UI, sans-serif';
            ctx.fillText('Time: ' + (Math.floor(this.time * 10) / 10).toFixed(1) + 's', this.w / 2, this.h / 2 + 16);
        }
    }
    pause() {
        if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
    }
}

// ============================================================
// Bowling
// ============================================================
class BowlingGame {
    constructor() {
        this.canvas = document.getElementById('bowling-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.frameEl = document.getElementById('bowling-frame');
        this.scoreEl = document.getElementById('bowling-score');
        this.msgEl = document.getElementById('bowling-msg');
        this.animationId = null;
        this.init();
    }
    init() {
        this.w = this.canvas.width;
        this.h = this.canvas.height;
        this.laneW = 160;
        this.laneX = (this.w - this.laneW) / 2;
        this.pins = [];
        this.ball = { x: this.w / 2, y: this.h - 50, r: 12, vx: 0, vy: 0, active: false };
        this.frame = 1;
        this.roll = 1;
        this.score = 0;
        this.framePins = 10;
        this.knockedDown = 0;
        this.phase = 'aim';
        this.aimX = this.w / 2;
        this.power = 0;
        this.charging = false;
        this.powerDir = 1;
        this.result = '';
        this.resultTimer = 0;
        this.gameOver = false;
        this.frames = [];
        this.setupPins();
        if (this.frameEl) this.frameEl.textContent = 'Frame: 1 / 10';
        if (this.scoreEl) this.scoreEl.textContent = 'Score: 0';
        if (this.msgEl) this.msgEl.textContent = 'Click and drag down to bowl';
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this._looping = false;
        this.loop = () => {
            this.update();
            this.draw();
            if (this._looping) this.animationId = requestAnimationFrame(this.loop);
        };
        this._looping = true;
        this.animationId = requestAnimationFrame(this.loop);
        if (!this._mousemove) {
            this._mousemove = (e) => {
                if (this.phase !== 'aim') return;
                const rect = this.canvas.getBoundingClientRect();
                const sx = this.w / rect.width;
                this.aimX = ((e.clientX - rect.left) * sx);
                this.aimX = Math.max(this.laneX + 10, Math.min(this.laneX + this.laneW - 10, this.aimX));
            };
            this._mousedown = () => {
                if (this.phase !== 'aim') return;
                this.charging = true;
                this.power = 0;
                this.powerDir = 1;
            };
            this._mouseup = () => {
                if (this.phase !== 'aim' || !this.charging) return;
                this.charging = false;
                this.phase = 'bowl';
                const speed = 2 + this.power * 6;
                this.ball.vx = (this.aimX - this.ball.x) * 0.05;
                this.ball.vy = -speed;
                this.ball.active = true;
                if (this.msgEl) this.msgEl.textContent = '';
            };
            this.canvas.addEventListener('mousemove', this._mousemove);
            this.canvas.addEventListener('mousedown', this._mousedown);
            this.canvas.addEventListener('mouseup', this._mouseup);
            enableTouchOnCanvas(this.canvas);
        }
    }
    setupPins() {
        this.pins = [];
        const pinR = 10;
        const spacing = 22;
        const startX = this.laneX + this.laneW / 2;
        const startY = 80;
        const rows = [1, 2, 3, 4];
        let idx = 0;
        for (let r = 0; r < rows.length; r++) {
            const count = rows[r];
            for (let c = 0; c < count; c++) {
                const px = startX + (c - (count - 1) / 2) * spacing;
                const py = startY + r * spacing * 0.8;
                this.pins.push({ x: px, y: py, r: pinR, standing: true, origX: px, origY: py, fallAngle: 0 });
                idx++;
            }
        }
        this.framePins = 10;
        this.knockedDown = 0;
    }
    update() {
        if (this.charging) {
            this.power += 0.02 * this.powerDir;
            if (this.power > 1) this.powerDir = -1;
            if (this.power < 0) this.powerDir = 1;
        }
        if (this.ball.active) {
            this.ball.x += this.ball.vx;
            this.ball.y += this.ball.vy;
            // Lane bounds
            if (this.ball.x < this.laneX + this.ball.r) { this.ball.x = this.laneX + this.ball.r; this.ball.vx = 0; }
            if (this.ball.x > this.laneX + this.laneW - this.ball.r) { this.ball.x = this.laneX + this.laneW - this.ball.r; this.ball.vx = 0; }
            // Pin collision
            for (const pin of this.pins) {
                if (!pin.standing) continue;
                const dx = this.ball.x - pin.x;
                const dy = this.ball.y - pin.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < this.ball.r + pin.r) {
                    pin.standing = false;
                    pin.fallAngle = Math.atan2(dy, dx);
                    this.knockedDown++;
                    this.ball.vx += (dx / dist) * 0.5;
                }
            }
            // Ball off screen
            if (this.ball.y < -30) {
                this.ball.active = false;
                this.evaluateRoll();
            }
        }
        if (this.phase === 'result') {
            this.resultTimer--;
            if (this.resultTimer <= 0) {
                if (this.frame > 10) {
                    this.gameOver = true;
                    if (this.msgEl) this.msgEl.textContent = 'Final Score: ' + this.score;
                } else {
                    this.phase = 'aim';
                    this.ball.x = this.w / 2;
                    this.ball.y = this.h - 50;
                    this.ball.vx = 0;
                    this.ball.vy = 0;
                    this.setupPins();
                    if (this.msgEl) this.msgEl.textContent = 'Click and drag down to bowl';
                }
            }
        }
    }
    evaluateRoll() {
        this.frames.push({ roll1: this.knockedDown, roll2: 0 });
        this.score += this.knockedDown;
        if (this.scoreEl) this.scoreEl.textContent = 'Score: ' + this.score;
        const isStrike = this.knockedDown === 10;
        this.result = isStrike ? 'STRIKE!' : this.knockedDown + ' pins';
        this.resultTimer = 60;
        this.phase = 'result';
        this.frame++;
        if (this.frameEl) this.frameEl.textContent = 'Frame: ' + Math.min(this.frame, 10) + ' / 10';
    }
    draw() {
        const ctx = this.ctx;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.w, this.h);
        // Lane
        ctx.fillStyle = '#c4956a';
        ctx.fillRect(this.laneX, 0, this.laneW, this.h);
        ctx.fillStyle = '#b8875e';
        ctx.fillRect(this.laneX + 10, 0, this.laneW - 20, this.h);
        // Gutters
        ctx.fillStyle = '#2a2a3e';
        ctx.fillRect(0, 0, this.laneX, this.h);
        ctx.fillRect(this.laneX + this.laneW, 0, this.w - this.laneX - this.laneW, this.h);
        // Arrows
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        for (let i = 0; i < 7; i++) {
            const ax = this.laneX + 20 + i * (this.laneW - 40) / 6;
            ctx.beginPath();
            ctx.moveTo(ax, this.h * 0.4);
            ctx.lineTo(ax - 5, this.h * 0.4 + 10);
            ctx.lineTo(ax + 5, this.h * 0.4 + 10);
            ctx.fill();
        }
        // Power bar
        if (this.charging) {
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(this.w / 2 - 50, 10, 100, 12);
            ctx.fillStyle = this.power < 0.5 ? '#2ecc71' : this.power < 0.8 ? '#f1c40f' : '#e74c3c';
            ctx.fillRect(this.w / 2 - 49, 11, 98 * this.power, 10);
        }
        // Pins
        for (const pin of this.pins) {
            if (pin.standing) {
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(pin.x, pin.y, pin.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ddd';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.fillStyle = '#e74c3c';
                ctx.font = 'bold 9px Segoe UI, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('•', pin.x, pin.y + 0.5);
            } else {
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.beginPath();
                ctx.arc(pin.x + Math.cos(pin.fallAngle) * 2, pin.y + 5, pin.r * 0.8, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        // Ball
        ctx.fillStyle = '#34495e';
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Finger holes
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.arc(this.ball.x - 4, this.ball.y - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.ball.x + 4, this.ball.y - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y + 4, 3, 0, Math.PI * 2);
        ctx.fill();
        // Aim guide
        if (this.phase === 'aim' && !this.charging) {
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(this.ball.x, this.ball.y);
            ctx.lineTo(this.aimX, this.ball.y - 80);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        // Result
        if (this.phase === 'result' && this.result) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(this.w / 2 - 80, this.h / 2 - 25, 160, 50);
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 24px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.result, this.w / 2, this.h / 2);
        }
        if (this.gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, this.w, this.h);
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 28px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Final Score: ' + this.score, this.w / 2, this.h / 2);
        }
    }
    pause() {
        this._looping = false;
        if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
    }
}

// ============================================================
// Archery
// ============================================================
class ArcheryGame {
    constructor() {
        this.canvas = document.getElementById('archery-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreEl = document.getElementById('archery-score');
        this.roundEl = document.getElementById('archery-round');
        this.windEl = document.getElementById('archery-wind');
        this.animationId = null;
        this.init();
    }
    init() {
        this.w = this.canvas.width;
        this.h = this.canvas.height;
        this.target = { x: this.w - 80, y: this.h / 2, r: 60 };
        this.arrow = { x: 60, y: this.h / 2, vx: 0, vy: 0, active: false, angle: 0 };
        this.bowY = this.h / 2;
        this.score = 0;
        this.round = 1;
        this.maxRounds = 10;
        this.wind = (Math.random() - 0.5) * 2;
        this.phase = 'aim';
        this.power = 0;
        this.charging = false;
        this.powerDir = 1;
        this.result = '';
        this.resultTimer = 0;
        this.gameOver = false;
        this.arrows = [];
        this.aimAngle = -0.3;
        if (this.scoreEl) this.scoreEl.textContent = 'Score: 0';
        if (this.roundEl) this.roundEl.textContent = 'Round: 1 / 10';
        if (this.windEl) this.windEl.textContent = 'Wind: ' + this.wind.toFixed(1);
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this._looping = false;
        this.loop = () => {
            this.update();
            this.draw();
            if (this._looping) this.animationId = requestAnimationFrame(this.loop);
        };
        this._looping = true;
        this.animationId = requestAnimationFrame(this.loop);
        if (!this._mousemove) {
            this._mousemove = (e) => {
                if (this.phase !== 'aim' || this.charging) return;
                const rect = this.canvas.getBoundingClientRect();
                const sx = this.w / rect.width;
                const sy = this.h / rect.height;
                const mx = (e.clientX - rect.left) * sx;
                const my = (e.clientY - rect.top) * sy;
                this.aimAngle = Math.atan2(my - this.bowY, mx - 60);
                if (this.aimAngle > 0.5) this.aimAngle = 0.5;
                if (this.aimAngle < -1.2) this.aimAngle = -1.2;
            };
            this._mousedown = () => {
                if (this.phase !== 'aim') return;
                this.charging = true;
                this.power = 0;
                this.powerDir = 1;
            };
            this._mouseup = () => {
                if (this.phase !== 'aim' || !this.charging) return;
                this.charging = false;
                this.fire();
            };
            this.canvas.addEventListener('mousemove', this._mousemove);
            this.canvas.addEventListener('mousedown', this._mousedown);
            this.canvas.addEventListener('mouseup', this._mouseup);
            enableTouchOnCanvas(this.canvas);
        }
    }
    fire() {
        const speed = 4 + this.power * 8;
        this.arrow.vx = Math.cos(this.aimAngle) * speed;
        this.arrow.vy = Math.sin(this.aimAngle) * speed;
        this.arrow.active = true;
        this.arrow.angle = this.aimAngle;
        this.phase = 'fly';
    }
    update() {
        if (this.charging) {
            this.power += 0.02 * this.powerDir;
            if (this.power > 1) this.powerDir = -1;
            if (this.power < 0) this.powerDir = 1;
        }
        if (this.arrow.active) {
            this.arrow.vy += 0.08; // gravity
            this.arrow.x += this.arrow.vx;
            this.arrow.y += this.arrow.vy;
            // Wind
            this.arrow.x += this.wind * 0.3;
            // Rotate arrow to trajectory
            this.arrow.angle = Math.atan2(this.arrow.vy, this.arrow.vx);
            // Check if passes target zone
            const dx = this.arrow.x - this.target.x;
            const dy = this.arrow.y - this.target.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (this.arrow.x > this.target.x - this.target.r - 20 && this.arrow.x < this.target.x + this.target.r + 20 &&
                this.arrow.y > 20 && this.arrow.y < this.h - 20) {
                // Check stuck in target
                if (dist < this.target.r + 5) {
                    this.arrow.active = false;
                    this.arrows.push({ x: this.arrow.x, y: this.arrow.y });
                    let points = 0;
                    if (dist < 8) points = 10;
                    else if (dist < 20) points = 8;
                    else if (dist < 35) points = 5;
                    else if (dist < 50) points = 3;
                    else points = 1;
                    this.score += points;
                    this.result = points + ' points!';
                    if (points === 10) this.result = 'BULLSEYE!';
                    if (this.scoreEl) this.scoreEl.textContent = 'Score: ' + this.score;
                    this.resultTimer = 50;
                    this.phase = 'result';
                }
            }
            if (this.arrow.x > this.w + 50 || this.arrow.y > this.h + 50 || this.arrow.x < -50) {
                this.arrow.active = false;
                this.result = 'Miss!';
                this.resultTimer = 50;
                this.phase = 'result';
            }
        }
        if (this.phase === 'result') {
            this.resultTimer--;
            if (this.resultTimer <= 0) {
                if (this.round >= this.maxRounds) {
                    this.gameOver = true;
                } else {
                    this.round++;
                    this.wind = (Math.random() - 0.5) * 2.5;
                    if (this.windEl) this.windEl.textContent = 'Wind: ' + this.wind.toFixed(1);
                    if (this.roundEl) this.roundEl.textContent = 'Round: ' + this.round + ' / ' + this.maxRounds;
                    this.phase = 'aim';
                    this.arrow.x = 60;
                    this.arrow.y = this.bowY;
                    this.arrow.vx = 0;
                    this.arrow.vy = 0;
                    this.power = 0;
                }
            }
        }
    }
    draw() {
        const ctx = this.ctx;
        ctx.fillStyle = '#87ceeb';
        ctx.fillRect(0, 0, this.w, this.h);
        // Ground
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(0, this.h - 30, this.w, 30);
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(0, this.h - 30, this.w, 5);
        // Target stand
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.target.x - 3, this.target.y + this.target.r, 6, this.h - this.target.r - 30);
        ctx.fillRect(this.target.x - 25, this.target.y + this.target.r, 50, 6);
        // Target
        const rings = [
            { r: 60, c: '#fff' },
            { r: 50, c: '#e74c3c' },
            { r: 40, c: '#fff' },
            { r: 30, c: '#e74c3c' },
            { r: 20, c: '#fff' },
            { r: 10, c: '#e74c3c' },
            { r: 4, c: '#ffd700' },
        ];
        for (const ring of rings) {
            ctx.fillStyle = ring.c;
            ctx.beginPath();
            ctx.arc(this.target.x, this.target.y, ring.r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.target.x, this.target.y - 60);
        ctx.lineTo(this.target.x, this.target.y + 60);
        ctx.moveTo(this.target.x - 60, this.target.y);
        ctx.lineTo(this.target.x + 60, this.target.y);
        ctx.stroke();
        // Bow
        if (this.phase === 'aim') {
            const bx = 60;
            const by = this.bowY;
            // Bow arc
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(bx + 30, by, 30, -Math.PI / 2 - this.aimAngle + 1, -Math.PI / 2 - this.aimAngle - 1, true);
            ctx.stroke();
            // Bowstring
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 1;
            const stringEnd1 = { x: bx + 30 * Math.cos(-Math.PI / 2 - this.aimAngle + 1), y: by + 30 * Math.sin(-Math.PI / 2 - this.aimAngle + 1) };
            const stringEnd2 = { x: bx + 30 * Math.cos(-Math.PI / 2 - this.aimAngle - 1), y: by + 30 * Math.sin(-Math.PI / 2 - this.aimAngle - 1) };
            ctx.beginPath();
            ctx.moveTo(bx + stringEnd1.x, stringEnd1.y);
            const pull = this.charging ? 10 + this.power * 15 : 10;
            ctx.lineTo(bx, by);
            ctx.lineTo(bx + stringEnd2.x, stringEnd2.y);
            ctx.stroke();
        }
        // Arrow
        if (this.arrow.active || this.phase === 'aim') {
            ctx.save();
            ctx.translate(this.arrow.x, this.arrow.y);
            ctx.rotate(this.arrow.angle);
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(0, -1.5, 40, 3);
            ctx.fillStyle = '#555';
            ctx.beginPath();
            ctx.moveTo(40, 0);
            ctx.lineTo(44, -5);
            ctx.lineTo(44, 5);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(-4, -4);
            ctx.lineTo(2, 0);
            ctx.lineTo(-4, 4);
            ctx.fill();
            ctx.restore();
        }
        // Stuck arrows
        for (const a of this.arrows) {
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(a.x + 25, a.y);
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(a.x + 25, a.y - 4);
            ctx.lineTo(a.x + 30, a.y);
            ctx.lineTo(a.x + 25, a.y + 4);
            ctx.fill();
        }
        // Power bar
        if (this.charging) {
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(10, 10, 100, 12);
            ctx.fillStyle = this.power < 0.5 ? '#2ecc71' : this.power < 0.8 ? '#f1c40f' : '#e74c3c';
            ctx.fillRect(11, 11, 98 * this.power, 10);
        }
        // Aim text
        if (this.phase === 'aim' && !this.charging) {
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.font = '13px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Aim with mouse, hold & release to fire', this.w / 2, this.h - 5);
        }
        // Result
        if (this.phase === 'result' && this.result) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(this.w / 2 - 80, 20, 160, 40);
            ctx.fillStyle = this.result === 'BULLSEYE!' ? '#ffd700' : '#fff';
            ctx.font = 'bold 20px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.result, this.w / 2, 40);
        }
        if (this.gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, this.w, this.h);
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 28px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Final Score: ' + this.score, this.w / 2, this.h / 2);
        }
    }
    pause() {
        this._looping = false;
        if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
    }
}

// ============================================================
// Baseball
// ============================================================
class BaseballGame {
    constructor() {
        this.canvas = document.getElementById('baseball-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreEl = document.getElementById('baseball-score');
        this.outsEl = document.getElementById('baseball-outs');
        this.inningEl = document.getElementById('baseball-inning');
        this.animationId = null;
        this.init();
    }
    init() {
        this.w = this.canvas.width;
        this.h = this.canvas.height;
        this.ball = { x: 80, y: this.h / 2 - 20, r: 8, vx: 0, vy: 0, active: false };
        this.pitchZone = { x: this.w - 150, y: this.h / 2 - 40, w: 30, h: 60 };
        this.batAngle = 0;
        this.phase = 'ready';
        this.runs = 0;
        this.outs = 0;
        this.inning = 1;
        this.maxOuts = 3;
        this.maxInnings = 3;
        this.pitchSpeed = 6 + Math.random() * 3;
        this.pitchDir = (Math.random() - 0.5) * 1.5;
        this.swingTiming = 0;
        this.swingWindow = 0;
        this.result = '';
        this.resultTimer = 0;
        this.gameOver = false;
        this.hits = 0;
        this.pitches = 0;
        if (this.scoreEl) this.scoreEl.textContent = 'Runs: 0';
        if (this.outsEl) this.outsEl.textContent = 'Outs: 0 / 3';
        if (this.inningEl) this.inningEl.textContent = 'Inning: 1';
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this._looping = false;
        this.loop = () => {
            this.update();
            this.draw();
            if (this._looping) this.animationId = requestAnimationFrame(this.loop);
        };
        this._looping = true;
        this.animationId = requestAnimationFrame(this.loop);
        if (!this._keyHandler) {
            this._keyHandler = (e) => {
                if (e.key === ' ' && !this.gameOver) {
                    e.preventDefault();
                    if (this.phase === 'ready') this.startPitch();
                    else if (this.phase === 'pitch') this.swing();
                }
            };
            this._clickHandler = () => {
                if (!this.gameOver) {
                    if (this.phase === 'ready') this.startPitch();
                    else if (this.phase === 'pitch') this.swing();
                }
            };
            document.addEventListener('keydown', this._keyHandler);
            this.canvas.addEventListener('click', this._clickHandler);
            enableTouchOnCanvas(this.canvas);
        }
    }
    startPitch() {
        this.phase = 'pitch';
        this.ball.x = 80;
        this.ball.y = this.h / 2 - 20;
        this.pitchSpeed = 6 + Math.random() * 4;
        this.pitchDir = (Math.random() - 0.5) * 2;
        this.swingTiming = 0;
        this.swingWindow = 0;
        this.ball.active = true;
        this.pitches++;
    }
    swing() {
        if (this.phase !== 'pitch') return;
        // Check if ball is in the zone
        const bx = this.ball.x;
        const by = this.ball.y;
        const inZone = bx > this.pitchZone.x - 15 && bx < this.pitchZone.x + this.pitchZone.w + 15 &&
                       by > this.pitchZone.y - 10 && by < this.pitchZone.y + this.pitchZone.h + 10;
        const timing = 1 - Math.min(Math.abs(bx - (this.pitchZone.x + this.pitchZone.w / 2)) / 100, 1);
        const hitQuality = inZone ? Math.max(0, timing) : 0;
        if (hitQuality > 0.3) {
            this.hits++;
            if (Math.random() < hitQuality * 0.8) {
                this.runs += Math.random() < 0.3 ? 2 : 1;
                this.result = 'HIT!';
            } else {
                this.runs++;
                this.result = 'Single!';
            }
            if (this.result === 'HIT!' && Math.random() < 0.15) {
                this.runs += 2;
                this.result = 'HOME RUN!';
            }
            if (this.scoreEl) this.scoreEl.textContent = 'Runs: ' + this.runs;
        } else if (inZone) {
            this.result = 'Foul';
            this.resultTimer = 20;
            this.phase = 'result';
            this.ball.active = false;
            return;
        } else {
            this.outs++;
            this.result = 'Strikeout!';
            if (this.outsEl) this.outsEl.textContent = 'Outs: ' + this.outs + ' / ' + this.maxOuts;
        }
        this.resultTimer = 50;
        this.phase = 'result';
        this.ball.active = false;
    }
    update() {
        if (this.phase === 'pitch' && this.ball.active) {
            this.ball.x += this.pitchSpeed;
            this.ball.y += this.pitchDir;
            // Check if ball reaches zone
            if (this.ball.x > this.w) {
                this.outs++;
                this.result = 'Strike!';
                if (this.outsEl) this.outsEl.textContent = 'Outs: ' + this.outs + ' / ' + this.maxOuts;
                this.resultTimer = 40;
                this.phase = 'result';
                this.ball.active = false;
                return;
            }
            // Show swing hint when near
            if (this.ball.x > this.pitchZone.x - 60 && this.ball.x < this.pitchZone.x + 30) {
                this.swingWindow = 1 - Math.abs(this.ball.x - (this.pitchZone.x + this.pitchZone.w / 2)) / 80;
            }
        }
        if (this.phase === 'result') {
            this.resultTimer--;
            if (this.resultTimer <= 0) {
                if (this.outs >= this.maxOuts) {
                    this.outs = 0;
                    if (this.outsEl) this.outsEl.textContent = 'Outs: 0 / ' + this.maxOuts;
                    this.inning++;
                    if (this.inningEl) this.inningEl.textContent = 'Inning: ' + this.inning;
                    if (this.inning > this.maxInnings) {
                        this.gameOver = true;
                    }
                }
                if (!this.gameOver) {
                    this.phase = 'ready';
                    this.result = '';
                }
            }
        }
    }
    draw() {
        const ctx = this.ctx;
        ctx.fillStyle = '#87ceeb';
        ctx.fillRect(0, 0, this.w, this.h);
        // Field
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(0, this.h * 0.6, this.w, this.h * 0.4);
        // Diamond
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        const cx = this.w - 80;
        const cy = this.h * 0.7;
        const size = 45;
        ctx.beginPath();
        ctx.moveTo(cx, cy - size);
        ctx.lineTo(cx + size, cy);
        ctx.lineTo(cx, cy + size);
        ctx.lineTo(cx - size, cy);
        ctx.closePath();
        ctx.stroke();
        // Bases
        const bases = [
            { x: cx, y: cy - size },
            { x: cx + size, y: cy },
            { x: cx, y: cy + size },
            { x: cx - size, y: cy }
        ];
        for (const b of bases) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(b.x - 4, b.y - 4, 8, 8);
        }
        // Home plate
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(cx, cy + size + 5);
        ctx.lineTo(cx - 10, cy + size - 5);
        ctx.lineTo(cx + 10, cy + size - 5);
        ctx.closePath();
        ctx.fill();
        // Strike zone
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(this.pitchZone.x, this.pitchZone.y, this.pitchZone.w, this.pitchZone.h);
        ctx.setLineDash([]);
        // Ball
        if (this.ball.active) {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#c0392b';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.ball.x - 5, this.ball.y - 3);
            ctx.lineTo(this.ball.x + 5, this.ball.y + 3);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(this.ball.x - 5, this.ball.y + 3);
            ctx.lineTo(this.ball.x + 5, this.ball.y - 3);
            ctx.stroke();
        }
        // Bat
        if (this.phase === 'ready') {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(30, this.h / 2 - 5, 50, 10);
            ctx.fillRect(25, this.h / 2 - 3, 10, 6);
        }
        // Instructions
        if (this.phase === 'ready') {
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.font = '14px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Press Space or Click to pitch', this.w / 2, 20);
        }
        // Pitch phase - show click to swing
        if (this.phase === 'pitch') {
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.font = '14px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Click to Swing!', this.w / 2, 20);
            // Swing timing indicator
            if (this.swingWindow > 0) {
                ctx.fillStyle = `rgba(46, 204, 113, ${this.swingWindow * 0.5})`;
                ctx.fillRect(this.pitchZone.x - 5, this.pitchZone.y - 5, this.pitchZone.w + 10, this.pitchZone.h + 10);
            }
        }
        // Result
        if (this.phase === 'result' && this.result) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(this.w / 2 - 100, this.h / 2 - 25, 200, 50);
            ctx.fillStyle = this.result.includes('HOME') || this.result.includes('HIT') ? '#ffd700' : '#e74c3c';
            ctx.font = 'bold 22px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.result, this.w / 2, this.h / 2);
        }
        if (this.gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, this.w, this.h);
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 28px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Final: ' + this.runs + ' Runs', this.w / 2, this.h / 2);
            ctx.fillStyle = '#fff';
            ctx.font = '16px Segoe UI, sans-serif';
            ctx.fillText('Hits: ' + this.hits + ' | Pitches: ' + this.pitches, this.w / 2, this.h / 2 + 30);
        }
    }
    pause() {
        this._looping = false;
        if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
    }
}

// ============================================================
// Wordle
// ============================================================
const WORDLE_WORDS = ['ABOUT','ABOVE','ABUSE','ACTOR','ACUTE','ADMIT','ADOPT','ADULT','AFTER','AGAIN','AGENT','AGREE','AHEAD','ALARM','ALBUM','ALERT','ALIKE','ALIVE','ALLOW','ALONE','ALONG','ALTER','ANGEL','ANGER','ANGLE','ANGRY','APART','APPLE','APPLY','ARENA','ARGUE','ARISE','ARRAY','ASIDE','ASSET','AVOID','AWARD','AWARE','BADLY','BAKER','BASES','BASIC','BEACH','BEGAN','BEING','BELOW','BENCH','BILLY','BIRTH','BLACK','BLADE','BLAME','BLAND','BLANK','BLAST','BLAZE','BLEED','BLEND','BLESS','BLIND','BLINK','BLISS','BLOCK','BLOOD','BLOOM','BOARD','BONUS','BOOST','BOUND','BRAIN','BRAND','BRAVE','BREAD','BREAK','BREED','BRIEF','BRING','BROAD','BROKE','BROWN','BUILD','BUILT','BUYER','CABIN','CABLE','CALIF','CARRY','CATCH','CAUSE','CEASE','CHAIN','CHAIR','CHAOS','CHARM','CHART','CHASE','CHEAP','CHECK','CHEEK','CHESS','CHEST','CHIEF','CHILD','CHINA','CHUNK','CIVIL','CLAIM','CLASS','CLEAN','CLEAR','CLERK','CLIMB','CLING','CLOCK','CLONE','CLOSE','CLOTH','CLOUD','COACH','COAST','COLOR','COMET','COMMA','CORPS','COUCH','COUNT','COURT','COVER','CRACK','CRAFT','CRASH','CRAZY','CREAM','CREEK','CRIME','CRISP','CROSS','CROWD','CROWN','CRUDE','CRUSH','CURVE','CYCLE','DAIRY','DANCE','DEALT','DEATH','DEBUT','DELAY','DELTA','DENSE','DEPOT','DEPTH','DERBY','DESERT','DESIGN','DESK','DIARY','DIGIT','DIRTY','DOZEN','DRAFT','DRAMA','DRAWN','DREAM','DRESS','DRIED','DRINK','DRIVE','DROVE','DYING','EAGER','EARLY','EARTH','EIGHT','EITHER','ELECT','ELITE','EMPTY','ENEMY','ENJOY','ENTER','ENTRY','EQUAL','ERROR','EVENT','EVERY','EXACT','EXILE','EXIST','EXTRA','FAINT','FAITH','FALSE','FANCY','FAULT','FEAST','FEBRUARY','FICUS','FIFTY','FIGHT','FINAL','FIRST','FIXED','FLAME','FLASH','FLEET','FLESH','FLOAT','FLOCK','FLOOD','FLOOR','FLOUR','FLUID','FLUSH','FOCUS','FORCE','FORGE','FORTH','FORUM','FOUND','FRAME','FRANK','FRAUD','FRESH','FRONT','FROST','FROZE','FRUIT','FULLY','FUNGI','GAIN','GAMES','GAMMA','GAUGE','GHOST','GIANT','GIVEN','GLASS','GLEAM','GLOBE','GLOOM','GLORY','GLOVE','GRACE','GRADE','GRAIN','GRAND','GRANT','GRAPE','GRAPH','GRASP','GRASS','GRAVE','GREAT','GREEN','GREET','GRIEF','GRIND','GROAN','GROOM','GROSS','GROUP','GROVE','GUARD','GUESS','GUEST','GUIDE','GUILT','HABIT','HAPPY','HARSH','HAVEN','HEART','HEAVY','HEDGE','HELLO','HENCE','HERO','HIDDEN','HOCKEY','HOMES','HONOR','HOOD','HORSE','HOTEL','HOUSE','HUMAN','HUMOR','HURRY','IDEAL','IMAGE','IMPLY','INDEX','INDIAN','INFER','INNER','INPUT','IRONY','ISSUE','IVORY','JEWEL','JOINT','JOKER','JUDGE','JUICE','JUICY','JULY','JUMBO','JUNE','JURY','JUSTICE','KEEPS','KEYS','KNIFE','KNOCK','KNOWN','LABEL','LASER','LATER','LAUGH','LAYER','LEARN','LEASE','LEAVE','LEGAL','LEMON','LEVEL','LEVER','LIGHT','LIMIT','LINER','LIVER','LOCAL','LOGIC','LOOSE','LOVER','LOWER','LOYAL','LUCKY','LUNAR','LUNCH','MAGIC','MAJOR','MAKER','MANOR','MAPLE','MARCH','MARRY','MATCH','MAYOR','MEDIA','MERCY','MERGE','MERIT','METAL','METER','MIGHT','MINOR','MINUS','MIRTH','MODEL','MONEY','MONTH','MORAL','MOTOR','MOUNT','MOUSE','MOUTH','MOVED','MOVIE','MUSIC','NAIVE','NERVE','NEUTRAL','NIGHT','NOBLE','NODES','NOISE','NORTH','NOTED','NOVEL','NURSE','NYLON','OCCUR','OCEAN','OFFER','OFTEN','OLIVE','ONSET','OPERA','ORBIT','ORDER','ORGAN','OTHER','OUGHT','OUTER','OWNER','OXIDE','OZONE','PAINT','PANEL','PANIC','PAPER','PARTY','PASTE','PATCH','PAUSE','PEACE','PEARL','PENAL','PENCIL','PENNY','PHASE','PHONE','PHOTO','PIANO','PIECE','PILOT','PITCH','PIXEL','PIZZA','PLACE','PLAIN','PLANE','PLANT','PLATE','PLAZA','PLEAD','PLUCK','PLUMB','PLUME','PLUMP','PLUNGE','POINT','POLAR','POLICE','PONDS','POPPY','PORCH','POSER','POUND','POWER','PRESS','PRICE','PRIDE','PRIME','PRINT','PRIOR','PRIZE','PROBE','PROOF','PROSE','PROUD','PROVE','PSALM','PULSE','PUNCH','PUPIL','PURSE','QUEEN','QUEST','QUEUE','QUICK','QUIET','QUOTA','QUOTE','RADAR','RADIO','RAISE','RALLY','RANCH','RANGE','RAPID','RATIO','REACH','REACT','READY','REALM','REBEL','REFER','REIGN','RELAX','REPLY','RIDER','RIDGE','RIFLE','RIGHT','RIGID','RISKY','RIVAL','RIVER','ROBIN','ROBOT','ROCKY','ROGER','ROMAN','ROUGE','ROUGH','ROUND','ROUTE','ROYAL','RUGBY','RULER','RURAL','SAINT','SALAD','SAUCE','SCALE','SCARE','SCARF','SCENE','SCENT','SCOPE','SCORE','SCOUT','SCRAP','SEIZE','SENSE','SERVE','SEVEN','SHADE','SHAKE','SHALL','SHAME','SHAPE','SHARE','SHARK','SHARP','SHAVE','SHAWL','SHEAR','SHEER','SHEET','SHELF','SHELL','SHIFT','SHINE','SHIRT','SHOCK','SHORE','SHORT','SHOUT','SIGHT','SILLY','SINCE','SIXTH','SIXTY','SIZED','SKATE','SKETCH','SKILL','SKULL','SLAVE','SLEEP','SLICE','SLIDE','SLOPE','SMALL','SMART','SMELL','SMILE','SMITH','SMOKE','SNACK','SNAKE','SOLAR','SOLID','SOLVE','SORRY','SOUND','SOUTH','SPACE','SPARE','SPARK','SPEAK','SPEED','SPELL','SPEND','SPICE','SPINE','SPITE','SPLIT','SPOKE','SPORT','SPRAY','SQUAD','STACK','STAFF','STAGE','STAKE','STALE','STALL','STAMP','STAND','STARK','START','STATE','STAYS','STEAK','STEAL','STEAM','STEEL','STEEP','STEER','STERN','STICK','STIFF','STILL','STOCK','STONE','STOOD','STOOL','STORE','STORM','STORY','STOVE','STRAP','STRAW','STRAY','STRIP','STUCK','STUFF','STUMP','STYLE','SUGAR','SUITE','SUNNY','SUPER','SURGE','SWAMP','SWARM','SWEAT','SWEEP','SWEET','SWEPT','SWIFT','SWING','SWIRL','SWORE','SWORD','SWORN','SYRUP','TABLE','TASTE','TAXES','TEACH','TEETH','TEMPLE','TENOR','TERM','THEFT','THEIR','THEME','THERE','THESE','THICK','THIEF','THING','THINK','THIRD','THORN','THOSE','THREE','THREW','THROW','THUMB','TIDAL','TIGER','TIGHT','TIMER','TITLE','TODAY','TOKEN','TOPIC','TORCH','TOTAL','TOUCH','TOUGH','TOWEL','TOWER','TOXIC','TRACE','TRACK','TRADE','TRAIL','TRAIN','TRASH','TREAT','TREND','TRIAL','TRIBE','TRICK','TRIED','TRILL','TROOP','TRUCK','TRULY','TRUMP','TRUNK','TRUST','TRUTH','TUMOR','TWICE','TWIST','ULTRA','UNCLE','UNDER','UNION','UNITE','UNITY','UNTIL','UPPER','UPSET','URBAN','USAGE','USUAL','VALID','VALUE','VALVE','VAULT','VERSE','VIDEO','VIGOR','VINYL','VIOLA','VIRAL','VIRUS','VISIT','VITAL','VIVID','VOCAL','VODKA','VOICE','VOTER','WAGON','WASTE','WATCH','WATER','WEARY','WEAVE','WEDGE','WEIGH','WEIRD','WHALE','WHEAT','WHEEL','WHERE','WHICH','WHILE','WHITE','WHOLE','WHOSE','WIDEN','WIDER','WIDOW','WIDTH','WITCH','WOMAN','WORLD','WORRY','WORSE','WORST','WORTH','WOULD','WOUND','WRATH','WRITE','WRONG','WROTE','YACHT','YIELD','YOUNG','YOUTH','ZEBRA','ZONES'];

class WordleGame {
    constructor() {
        this.gridEl = document.getElementById('wordle-grid');
        this.kbdEl = document.getElementById('wordle-keyboard');
        this.msgEl = document.getElementById('wordle-message');
        this.statsEl = document.getElementById('wordle-stats');
        this.init();
        if (!this._handler) {
            this._handler = (e) => {
                if (e.key === 'Backspace') { e.preventDefault(); this.deleteLetter(); }
                if (e.key === 'Enter') { e.preventDefault(); this.submitGuess(); }
                if (/^[a-zA-Z]$/.test(e.key)) { e.preventDefault(); this.addLetter(e.key.toUpperCase()); }
            };
            document.addEventListener('keydown', this._handler);
            this.kbdEl.addEventListener('click', (e) => {
                const key = e.target.closest('.wrd-key');
                if (!key) return;
                const val = key.dataset.key;
                if (val === 'ENTER') this.submitGuess();
                else if (val === 'BACK') this.deleteLetter();
                else this.addLetter(val);
            });
        }
    }
    init() {
        this.word = WORDLE_WORDS[Math.floor(Math.random() * WORDLE_WORDS.length)];
        this.guesses = [];
        this.currentGuess = '';
        this.row = 0;
        this.gameOver = false;
        this.usedKeys = {};
        if (this.msgEl) this.msgEl.textContent = '';
        if (this.statsEl) this.statsEl.textContent = '';
        this.render();
    }
    addLetter(l) {
        if (this.gameOver || this.currentGuess.length >= 5) return;
        this.currentGuess += l;
        this.render();
    }
    deleteLetter() {
        if (this.gameOver || this.currentGuess.length === 0) return;
        this.currentGuess = this.currentGuess.slice(0, -1);
        this.render();
    }
    submitGuess() {
        if (this.gameOver) return;
        if (this.currentGuess.length !== 5) {
            if (this.msgEl) this.msgEl.textContent = 'Not enough letters';
            return;
        }
        if (!WORDLE_WORDS.includes(this.currentGuess)) {
            if (this.msgEl) this.msgEl.textContent = 'Not in word list';
            return;
        }
        this.guesses.push(this.currentGuess);
        const result = this.evaluateGuess(this.currentGuess);
        for (let i = 0; i < 5; i++) {
            const letter = this.currentGuess[i];
            const status = result[i];
            if (!this.usedKeys[letter] || status === 'correct' || (status === 'present' && this.usedKeys[letter] !== 'correct')) {
                this.usedKeys[letter] = status;
            }
        }
        if (this.currentGuess === this.word) {
            this.gameOver = true;
            if (this.msgEl) this.msgEl.textContent = 'You got it!';
            if (this.statsEl) this.statsEl.textContent = 'Guesses: ' + (this.row + 1) + '/6';
        } else if (this.row >= 5) {
            this.gameOver = true;
            if (this.msgEl) this.msgEl.textContent = 'Word: ' + this.word;
        }
        this.row++;
        this.currentGuess = '';
        this.render();
    }
    evaluateGuess(guess) {
        const result = Array(5).fill('absent');
        const wordChars = this.word.split('');
        const used = Array(5).fill(false);
        for (let i = 0; i < 5; i++) {
            if (guess[i] === wordChars[i]) {
                result[i] = 'correct';
                used[i] = true;
            }
        }
        for (let i = 0; i < 5; i++) {
            if (result[i] === 'correct') continue;
            for (let j = 0; j < 5; j++) {
                if (used[j]) continue;
                if (guess[i] === wordChars[j]) {
                    result[i] = 'present';
                    used[j] = true;
                    break;
                }
            }
        }
        return result;
    }
    render() {
        this.gridEl.innerHTML = '';
        for (let r = 0; r < 6; r++) {
            for (let c = 0; c < 5; c++) {
                const cell = document.createElement('div');
                cell.className = 'wrd-cell';
                if (r < this.guesses.length) {
                    const guess = this.guesses[r];
                    const result = this.evaluateGuess(guess);
                    cell.textContent = guess[c];
                    cell.classList.add(result[c]);
                } else if (r === this.guesses.length) {
                    if (c < this.currentGuess.length) {
                        cell.textContent = this.currentGuess[c];
                        cell.classList.add('active');
                    }
                }
                this.gridEl.appendChild(cell);
            }
        }
        this.kbdEl.innerHTML = '';
        const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
        for (let i = 0; i < rows.length; i++) {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'wrd-kbd-row';
            if (i === 2) {
                const enter = document.createElement('button');
                enter.className = 'wrd-key wide';
                enter.dataset.key = 'ENTER';
                enter.textContent = 'Enter';
                rowDiv.appendChild(enter);
            }
            for (const ch of rows[i]) {
                const btn = document.createElement('button');
                btn.className = 'wrd-key' + (this.usedKeys[ch] ? ' ' + this.usedKeys[ch] : '');
                btn.dataset.key = ch;
                btn.textContent = ch;
                rowDiv.appendChild(btn);
            }
            if (i === 2) {
                const back = document.createElement('button');
                back.className = 'wrd-key wide';
                back.dataset.key = 'BACK';
                back.textContent = 'Del';
                rowDiv.appendChild(back);
            }
            this.kbdEl.appendChild(rowDiv);
        }
    }
    pause() {
        if (this._handler) {
            document.removeEventListener('keydown', this._handler);
        }
    }
}

// ============================================================
// Boggle
// ============================================================
const BOGGLE_DICE = [
    ['R','I','F','O','B','X'], ['I','F','E','H','E','Y'], ['D','E','N','O','W','S'],
    ['U','T','O','K','N','D'], ['H','M','S','R','A','O'], ['L','U','P','E','T','S'],
    ['A','C','I','T','O','A'], ['Y','L','G','K','U','E'], ['Q','B','M','J','O','A'],
    ['E','H','I','S','P','N'], ['V','E','T','I','G','N'], ['B','A','L','I','Y','T'],
    ['E','Z','A','V','N','D'], ['R','A','L','E','S','C'], ['W','O','R','G','H','T'],
    ['S','E','T','U','P','L']
];

class BoggleGame {
    constructor() {
        this.canvas = document.getElementById('boggle-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.timerEl = document.getElementById('boggle-timer');
        this.scoreEl = document.getElementById('boggle-score');
        this.wordsEl = document.getElementById('boggle-words');
        this.input = document.getElementById('boggle-word-input');
        this.submitBtn = document.getElementById('boggle-submit-btn');
        this.animationId = null;
        this.init();
        if (!this._handler) {
            this._clickHandler = () => this.submitWord();
            this._keyHandler = (e) => { if (e.key === 'Enter') this.submitWord(); };
            this.submitBtn.addEventListener('click', this._clickHandler);
            this.input.addEventListener('keydown', this._keyHandler);
        }
    }
    init() {
        this.w = 360; this.h = 360;
        this.size = 4;
        this.cellSize = 80;
        this.grid = [];
        this.found = [];
        this.score = 0;
        this.timeLeft = 180;
        this.timerRunning = false;
        this.timerAccum = 0;
        this.gameOver = false;
        this.selectedCells = [];
        this.mouseDown = false;
        if (this.timerEl) this.timerEl.textContent = 'Time: 3:00';
        if (this.scoreEl) this.scoreEl.textContent = 'Score: 0';
        if (this.wordsEl) this.wordsEl.textContent = 'Words: ';
        this.input.value = '';
        this.generateBoard();
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this._looping = false;
        this.loop = (now) => {
            this.update(now);
            this.draw();
            if (this._looping) this.animationId = requestAnimationFrame(this.loop);
        };
        this._looping = true;
        this.lastTime = performance.now();
        this.animationId = requestAnimationFrame(this.loop);
        if (!this._dragHandler) {
            this._dragHandler = true;
            this.canvas.addEventListener('mousedown', (e) => {
                if (this.gameOver) return;
                this.mouseDown = true;
                this.selectedCells = [];
                const { r, c } = this.getCellFromPos(e);
                if (r >= 0 && r < 4 && c >= 0 && c < 4) {
                    this.selectedCells.push({ r, c });
                }
            });
            this.canvas.addEventListener('mousemove', (e) => {
                if (!this.mouseDown || this.gameOver) return;
                const { r, c } = this.getCellFromPos(e);
                if (r < 0 || r >= 4 || c < 0 || c >= 4) return;
                const last = this.selectedCells[this.selectedCells.length - 1];
                if (last && last.r === r && last.c === c) return;
                const dr = r - last.r, dc = c - last.c;
                if (Math.abs(dr) > 1 || Math.abs(dc) > 1) { this.selectedCells = []; return; }
                if (this.selectedCells.some(s => s.r === r && s.c === c)) return;
                this.selectedCells.push({ r, c });
            });
            this.canvas.addEventListener('mouseup', () => {
                this.mouseDown = false;
                if (this.selectedCells.length >= 3) {
                    const word = this.selectedCells.map(s => this.grid[s.r][s.c]).join('');
                    if (!this.found.includes(word) && word.length >= 3) {
                        const wordList = this.getWordList();
                        if (wordList.includes(word)) {
                            this.found.push(word);
                            const pts = word.length === 3 ? 1 : word.length === 4 ? 1 : word.length === 5 ? 2 : word.length === 6 ? 3 : word.length === 7 ? 5 : 11;
                            this.score += pts;
                            if (this.scoreEl) this.scoreEl.textContent = 'Score: ' + this.score;
                            if (this.wordsEl) this.wordsEl.textContent = 'Words: ' + this.found.join(', ');
                            if (!this.timerRunning) {
                                this.timerRunning = true;
                                this.lastTime = performance.now();
                            }
                        }
                    }
                }
                this.selectedCells = [];
            });
            enableTouchOnCanvas(this.canvas);
        }
    }
    getCellFromPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const sx = this.w / rect.width;
        const sy = this.h / rect.height;
        const mx = (e.clientX - rect.left) * sx;
        const my = (e.clientY - rect.top) * sy;
        const c = Math.floor(mx / this.cellSize);
        const r = Math.floor(my / this.cellSize);
        return { r, c };
    }
    generateBoard() {
        const indices = Array.from({ length: 16 }, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        let idx = 0;
        for (let r = 0; r < 4; r++) {
            this.grid[r] = [];
            for (let c = 0; c < 4; c++) {
                const die = BOGGLE_DICE[indices[idx++]];
                this.grid[r][c] = die[Math.floor(Math.random() * die.length)];
            }
        }
    }
    getWordList() {
        return WORDLE_WORDS.filter(w => w.length >= 3);
    }
    update(now) {
        if (this.timerRunning && !this.gameOver) {
            const dt = Math.min((now - this.lastTime) / 1000, 0.05);
            this.lastTime = now;
            this.timerAccum += dt;
            if (this.timerAccum >= 1) {
                this.timerAccum -= 1;
                this.timeLeft--;
                const m = Math.floor(this.timeLeft / 60);
                const s = this.timeLeft % 60;
                if (this.timerEl) this.timerEl.textContent = 'Time: ' + m + ':' + (s < 10 ? '0' : '') + s;
                if (this.timeLeft <= 0) {
                    this.gameOver = true;
                    if (this.timerEl) this.timerEl.textContent = 'Time: 0:00';
                }
            }
        }
    }
    submitWord() {
        if (this.gameOver) return;
        const word = this.input.value.trim().toUpperCase();
        this.input.value = '';
        if (word.length < 3) return;
        if (this.found.includes(word)) return;
        const wordList = this.getWordList();
        if (wordList.includes(word)) {
            this.found.push(word);
            const pts = word.length === 3 ? 1 : word.length === 4 ? 1 : word.length === 5 ? 2 : word.length === 6 ? 3 : word.length === 7 ? 5 : 11;
            this.score += pts;
            if (this.scoreEl) this.scoreEl.textContent = 'Score: ' + this.score;
            if (this.wordsEl) this.wordsEl.textContent = 'Words: ' + this.found.join(', ');
            if (!this.timerRunning) {
                this.timerRunning = true;
                this.lastTime = performance.now();
            }
        }
    }
    draw() {
        const ctx = this.ctx;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.w, this.h);
        const cs = this.cellSize;
        const ox = (this.w - cs * 4) / 2;
        const oy = (this.h - cs * 4) / 2;
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const x = ox + c * cs;
                const y = oy + r * cs;
                const isSelected = this.selectedCells.some(s => s.r === r && s.c === c);
                ctx.fillStyle = isSelected ? 'rgba(52, 152, 219, 0.4)' : 'rgba(255,255,255,0.05)';
                ctx.beginPath();
                ctx.roundRect(x + 2, y + 2, cs - 4, cs - 4, 8);
                ctx.fill();
                if (isSelected) {
                    ctx.strokeStyle = '#3498db';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.roundRect(x + 2, y + 2, cs - 4, cs - 4, 8);
                    ctx.stroke();
                }
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 28px Segoe UI, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.grid[r][c], x + cs / 2, y + cs / 2);
            }
        }
        if (this.gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.65)';
            ctx.fillRect(0, 0, this.w, this.h);
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 28px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Time\'s Up!', this.w / 2, this.h / 2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '18px Segoe UI, sans-serif';
            ctx.fillText('Score: ' + this.score + ' | Words: ' + this.found.length, this.w / 2, this.h / 2 + 10);
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '12px Segoe UI, sans-serif';
            ctx.fillText('Click "New Game" to play again', this.w / 2, this.h / 2 + 40);
        }
    }
    pause() {
        this._looping = false;
        if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
    }
}

// ============================================================
// Anagrams
// ============================================================
const ANAGRAM_WORDS = [
    { word: 'JOURNEY', hint: 'A trip or travel' },
    { word: 'MYSTERY', hint: 'Something unknown or puzzling' },
    { word: 'NATURE', hint: 'The physical world around us' },
    { word: 'FREEDOM', hint: 'The power to act without restraint' },
    { word: 'HARMONY', hint: 'Peaceful agreement or balance' },
    { word: 'WISDOM', hint: 'Knowledge and good judgment' },
    { word: 'COURAGE', hint: 'Strength to face difficulty' },
    { word: 'FORTUNE', hint: 'Wealth or good luck' },
    { word: 'GALAXY', hint: 'A vast system of stars' },
    { word: 'HARBOR', hint: 'A safe place for ships' },
    { word: 'ISLAND', hint: 'Land surrounded by water' },
    { word: 'KITTEN', hint: 'A young cat' },
    { word: 'LANTERN', hint: 'A portable light source' },
    { word: 'MEADOW', hint: 'A field of grass' },
    { word: 'NEBULA', hint: 'A cloud of gas in space' },
    { word: 'ORACLE', hint: 'A source of prophecy' },
    { word: 'PALACE', hint: 'A royal residence' },
    { word: 'RADIANT', hint: 'Shining brightly' },
    { word: 'SAILOR', hint: 'One who navigates ships' },
    { word: 'TEMPLE', hint: 'A place of worship' },
    { word: 'UMBRELLA', hint: 'Protection from rain' },
    { word: 'VOYAGE', hint: 'A long journey' },
    { word: 'WHISTLE', hint: 'A sound produced by blowing' },
    { word: 'ANCHOR', hint: 'A device that holds a ship in place' },
    { word: 'BLOSSOM', hint: 'A flower on a tree' },
    { word: 'CANDLE', hint: 'A source of light with a wick' },
    { word: 'DIAMOND', hint: 'A precious gemstone' },
    { word: 'EMERALD', hint: 'A green gemstone' },
    { word: 'FLAMINGO', hint: 'A pink wading bird' },
    { word: 'GONDOLA', hint: 'A Venetian boat' },
    { word: 'HURRICANE', hint: 'A powerful storm' },
    { word: 'JASMINE', hint: 'A fragrant flower' },
    { word: 'KEYBOARD', hint: 'An input device for typing' },
    { word: 'LIBRARY', hint: 'A collection of books' },
    { word: 'MAGNET', hint: 'An object that attracts metal' },
    { word: 'NOCTURN', hint: 'A musical composition for night' },
    { word: 'ORCHARD', hint: 'A plantation of fruit trees' },
    { word: 'PANTHER', hint: 'A large wild cat' },
    { word: 'QUARTZ', hint: 'A hard mineral crystal' },
    { word: 'RAINBOW', hint: 'An arc of colors in the sky' },
    { word: 'SCORPION', hint: 'A venomous arachnid' },
    { word: 'TORNADO', hint: 'A violent rotating column of air' },
    { word: 'VANILLA', hint: 'A flavoring from orchids' },
    { word: 'WALNUT', hint: 'A type of nut' },
    { word: 'YAWNING', hint: 'Opening the mouth wide from tiredness' },
    { word: 'BALLOON', hint: 'An inflatable toy' },
    { word: 'CROCODILE', hint: 'A large aquatic reptile' },
    { word: 'DRAGON', hint: 'A mythical fire-breathing creature' },
    { word: 'ELEPHANT', hint: 'A large mammal with a trunk' },
    { word: 'FLAMINGO', hint: 'A pink wading bird' }
];

class AnagramsGame {
    constructor() {
        this.wordEl = document.getElementById('anagrams-word');
        this.hintEl = document.getElementById('anagrams-hint');
        this.input = document.getElementById('anagrams-input');
        this.submitBtn = document.getElementById('anagrams-submit');
        this.hintBtn = document.getElementById('anagrams-hint-btn');
        this.resultEl = document.getElementById('anagrams-result');
        this.scoreEl = document.getElementById('anagrams-score');
        this.streakEl = document.getElementById('anagrams-streak');
        this.best = parseInt(localStorage.getItem('anagramsBest') || '0');
        this.init();
        if (!this._handler) {
            this._handler = true;
            this.submitBtn.addEventListener('click', () => this.checkAnswer());
            this.hintBtn.addEventListener('click', () => this.showHint());
            this.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.checkAnswer(); });
        }
    }
    init() {
        this.current = ANAGRAM_WORDS[Math.floor(Math.random() * ANAGRAM_WORDS.length)];
        this.scrambled = this.scramble(this.current.word);
        this.hintShown = 0;
        this.score = 0;
        this.streak = 0;
        this.timeLeft = 60;
        this.gameOver = false;
        this.timerRunning = false;
        if (this.wordEl) {
            this.wordEl.textContent = this.scrambled;
            this.wordEl.style.animation = 'none';
            this.wordEl.offsetHeight;
            this.wordEl.style.animation = 'anagReveal 0.4s ease';
        }
        if (this.hintEl) this.hintEl.textContent = '';
        if (this.resultEl) { this.resultEl.textContent = ''; this.resultEl.className = ''; }
        this.input.value = '';
        this.input.disabled = false;
        this.input.focus();
        if (this.scoreEl) this.scoreEl.textContent = 'Score: 0' + (this.best ? ' | Best: ' + this.best : '');
        if (this.streakEl) this.streakEl.textContent = 'Streak: 0';
        this._updateTimer();
        this._startTimer();
    }
    _updateTimer() {
        const m = Math.floor(this.timeLeft / 60);
        const s = this.timeLeft % 60;
        if (this.streakEl) {
            this.streakEl.textContent = 'Time: ' + m + ':' + (s < 10 ? '0' : '') + s + ' | Streak: ' + this.streak;
        }
    }
    _startTimer() {
        if (this._timerInterval) clearInterval(this._timerInterval);
        this.timerRunning = true;
        this._timerInterval = setInterval(() => {
            if (this.gameOver) { clearInterval(this._timerInterval); return; }
            this.timeLeft--;
            this._updateTimer();
            if (this.timeLeft <= 0) { this.endGame(); }
        }, 1000);
    }
    endGame() {
        this.gameOver = true;
        this.timerRunning = false;
        this.input.disabled = true;
        if (this._timerInterval) clearInterval(this._timerInterval);
        const isBest = this.score > this.best;
        if (isBest) { this.best = this.score; localStorage.setItem('anagramsBest', String(this.best)); }
        if (this.resultEl) {
            this.resultEl.className = 'anag-gameover';
            this.resultEl.innerHTML = '⏰ Time\'s Up!<br>Score: ' + this.score + '<br>Words solved: ' + this._getSolvedCount() + (isBest ? '<br>⭐ New Best!' : '');
        }
        if (this.scoreEl) this.scoreEl.textContent = 'Score: ' + this.score + (this.best ? ' | Best: ' + this.best : '');
    }
    _getSolvedCount() {
        return this.foundCount || 0;
    }
    scramble(word) {
        const arr = word.split('');
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr.join('');
    }
    checkAnswer() {
        if (this.gameOver) return;
        const guess = this.input.value.trim().toUpperCase();
        this.input.value = '';
        if (!guess) return;
        if (guess === this.current.word) {
            this.score += this.current.word.length + (3 - this.hintShown) * 2;
            this.streak++;
            if (this.scoreEl) this.scoreEl.textContent = 'Score: ' + this.score + (this.best ? ' | Best: ' + this.best : '');
            if (!this.foundCount) this.foundCount = 0;
            this.foundCount++;
            if (this.resultEl) {
                this.resultEl.textContent = 'Correct! +' + (this.current.word.length + (3 - this.hintShown) * 2);
                this.resultEl.style.color = '#2ecc71';
                this.resultEl.style.animation = 'none';
                this.resultEl.offsetHeight;
                this.resultEl.style.animation = 'anagPop 0.35s ease';
            }
            this.wordEl.style.animation = 'none';
            this.wordEl.offsetHeight;
            this.wordEl.style.animation = 'anagReveal 0.4s ease';
            setTimeout(() => this.nextRound(), 1200);
        } else {
            this.streak = 0;
            if (this.streakEl) this._updateTimer();
            if (this.resultEl) {
                this.resultEl.textContent = 'Wrong, try again!';
                this.resultEl.style.color = '#e74c3c';
                this.resultEl.style.animation = 'none';
                this.resultEl.offsetHeight;
                this.resultEl.style.animation = 'anagShake 0.4s ease';
            }
            this.input.classList.add('anag-shake');
            setTimeout(() => this.input.classList.remove('anag-shake'), 400);
        }
    }
    showHint() {
        if (this.gameOver) return;
        if (this.hintShown >= 3) {
            if (this.hintEl) this.hintEl.textContent = 'No more hints! The word is: ' + this.current.word;
            return;
        }
        this.hintShown++;
        if (this.hintEl) this.hintEl.textContent = 'Hint ' + this.hintShown + '/3: ' + this.current.hint;
    }
    nextRound() {
        if (this.gameOver) return;
        this.current = ANAGRAM_WORDS[Math.floor(Math.random() * ANAGRAM_WORDS.length)];
        this.scrambled = this.scramble(this.current.word);
        this.hintShown = 0;
        if (this.wordEl) this.wordEl.textContent = this.scrambled;
        if (this.hintEl) this.hintEl.textContent = '';
        if (this.resultEl) { this.resultEl.textContent = ''; this.resultEl.style.animation = ''; }
        this.input.value = '';
        this.input.focus();
    }
    pause() { if (this._timerInterval) clearInterval(this._timerInterval); }
}

// ============================================================
// Word Search
// ============================================================
class WordSearchGame {
    constructor() {
        this.canvas = document.getElementById('wordsearch-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.foundEl = document.getElementById('wordsearch-found');
        this.scoreEl = document.getElementById('wordsearch-score');
        this.wordsListEl = document.getElementById('wordsearch-words');
        this.animationId = null;
        this.init();
    }
    init() {
        this.w = 360; this.h = 360;
        this.size = 12;
        this.cellSize = Math.floor(this.w / this.size);
        this.grid = [];
        this.words = [];
        this.found = [];
        this.score = 0;
        this.selecting = false;
        this.selectStart = null;
        this.selectEnd = null;
        this.gameOver = false;
        this.highlighted = [];
        if (this.foundEl) this.foundEl.textContent = 'Found: 0/0';
        if (this.scoreEl) this.scoreEl.textContent = 'Score: 0';
        this.generate();
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.loop = () => { this.draw(); this.animationId = requestAnimationFrame(this.loop); };
        this.animationId = requestAnimationFrame(this.loop);
        if (!this._handler) {
            this._mousedown = (e) => {
                if (this.gameOver) return;
                const pos = this.getCell(e);
                if (pos) { this.selecting = true; this.selectStart = pos; this.selectEnd = null; }
            };
            this._mousemove = (e) => {
                if (!this.selecting || this.gameOver) return;
                const pos = this.getCell(e);
                if (pos) this.selectEnd = pos;
            };
            this._mouseup = () => {
                if (!this.selecting || this.gameOver) return;
                this.selecting = false;
                this.checkSelection();
                this.selectStart = null;
                this.selectEnd = null;
            };
            this.canvas.addEventListener('mousedown', this._mousedown);
            this.canvas.addEventListener('mousemove', this._mousemove);
            this.canvas.addEventListener('mouseup', this._mouseup);
            enableTouchOnCanvas(this.canvas);
        }
    }
    getCell(e) {
        const rect = this.canvas.getBoundingClientRect();
        const sx = this.w / rect.width;
        const sy = this.h / rect.height;
        const mx = (e.clientX - rect.left) * sx;
        const my = (e.clientY - rect.top) * sy;
        const c = Math.floor(mx / this.cellSize);
        const r = Math.floor(my / this.cellSize);
        if (r >= 0 && r < this.size && c >= 0 && c < this.size) return { r, c };
        return null;
    }
    generate() {
        this.grid = Array.from({ length: this.size }, () => Array(this.size).fill(''));
        const wordPool = WORDLE_WORDS.filter(w => w.length >= 4 && w.length <= 8);
        const shuffled = [...wordPool].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, 8);
        this.words = selected;
        const dirs = [
            [0,1],[1,0],[1,1],[1,-1],
            [0,-1],[-1,0],[-1,-1],[-1,1]
        ];
        for (const word of selected) {
            let placed = false;
            for (let attempt = 0; attempt < 100 && !placed; attempt++) {
                const dir = dirs[Math.floor(Math.random() * dirs.length)];
                const sr = Math.floor(Math.random() * this.size);
                const sc = Math.floor(Math.random() * this.size);
                let ok = true;
                for (let i = 0; i < word.length; i++) {
                    const nr = sr + dir[0] * i, nc = sc + dir[1] * i;
                    if (nr < 0 || nr >= this.size || nc < 0 || nc >= this.size) { ok = false; break; }
                    if (this.grid[nr][nc] !== '' && this.grid[nr][nc] !== word[i]) { ok = false; break; }
                }
                if (ok) {
                    for (let i = 0; i < word.length; i++) {
                        this.grid[sr + dir[0] * i][sc + dir[1] * i] = word[i];
                    }
                    placed = true;
                }
            }
            if (!placed) {
                const sr = Math.floor(Math.random() * (this.size - word.length));
                const sc = Math.floor(Math.random() * this.size);
                for (let i = 0; i < word.length; i++) {
                    this.grid[sr + i][sc] = word[i];
                }
            }
        }
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === '') this.grid[r][c] = letters[Math.floor(Math.random() * 26)];
            }
        }
        if (this.foundEl) this.foundEl.textContent = 'Found: 0/' + this.words.length;
        this.renderWordList();
    }
    getSelectionWord() {
        if (!this.selectStart || !this.selectEnd) return null;
        const dr = this.selectEnd.r - this.selectStart.r;
        const dc = this.selectEnd.c - this.selectStart.c;
        const len = Math.max(Math.abs(dr), Math.abs(dc)) + 1;
        if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;
        const sd = dr === 0 ? 0 : dr / Math.abs(dr);
        const cd = dc === 0 ? 0 : dc / Math.abs(dc);
        let word = '';
        const cells = [];
        for (let i = 0; i < len; i++) {
            const r = this.selectStart.r + sd * i;
            const c = this.selectStart.c + cd * i;
            if (r < 0 || r >= this.size || c < 0 || c >= this.size) return null;
            word += this.grid[r][c];
            cells.push({ r, c });
        }
        return { word, cells };
    }
    checkSelection() {
        const result = this.getSelectionWord();
        if (!result) return;
        const { word, cells } = result;
        const revWord = word.split('').reverse().join('');
        const match = this.words.find(w => (w === word || w === revWord) && !this.found.includes(w));
        if (match) {
            this.found.push(match);
            this.score += match.length;
            this.highlighted.push(...cells);
            if (this.foundEl) this.foundEl.textContent = 'Found: ' + this.found.length + '/' + this.words.length;
            if (this.scoreEl) this.scoreEl.textContent = 'Score: ' + this.score;
            this.renderWordList();
            if (this.found.length === this.words.length) {
                this.gameOver = true;
            }
        }
    }
    renderWordList() {
        this.wordsListEl.innerHTML = '';
        for (const w of this.words) {
            const el = document.createElement('div');
            el.className = 'ws-word' + (this.found.includes(w) ? ' found' : '');
            el.textContent = w;
            this.wordsListEl.appendChild(el);
        }
    }
    draw() {
        const ctx = this.ctx;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.w, this.h);
        const cs = this.cellSize;
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const x = c * cs, y = r * cs;
                const isHL = this.highlighted.some(h => h.r === r && h.c === c);
                const isSel = this.selectStart && this.selectEnd && (() => {
                    const dr = this.selectEnd.r - this.selectStart.r;
                    const dc = this.selectEnd.c - this.selectStart.c;
                    const sd = dr === 0 ? 0 : dr / Math.abs(dr);
                    const cd = dc === 0 ? 0 : dc / Math.abs(dc);
                    const len = Math.max(Math.abs(dr), Math.abs(dc)) + 1;
                    for (let i = 0; i < len; i++) {
                        const nr = this.selectStart.r + sd * i;
                        const nc = this.selectStart.c + cd * i;
                        if (nr === r && nc === c) return true;
                    }
                    return false;
                })();
                ctx.fillStyle = isHL ? 'rgba(46, 204, 113, 0.3)' : isSel ? 'rgba(52, 152, 219, 0.3)' : (r + c) % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)';
                ctx.fillRect(x, y, cs, cs);
                if (isHL) {
                    ctx.strokeStyle = '#2ecc71';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x + 1, y + 1, cs - 2, cs - 2);
                }
                ctx.fillStyle = isHL ? '#2ecc71' : '#fff';
                ctx.font = 'bold ' + Math.floor(cs * 0.45) + 'px Segoe UI, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.grid[r][c], x + cs / 2, y + cs / 2);
            }
        }
        if (this.gameOver) {
            ctx.fillStyle = 'rgba(0,0,0,0.65)';
            ctx.fillRect(0, 0, this.w, this.h);
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 26px Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('All Found!', this.w / 2, this.h / 2 - 20);
            ctx.fillStyle = '#fff';
            ctx.font = '16px Segoe UI, sans-serif';
            ctx.fillText('Score: ' + this.score, this.w / 2, this.h / 2 + 14);
        }
    }
    pause() {
        this._looping = false;
        if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
    }
}

// ============================================================
// Typing Test
// ============================================================
const TYPING_WORDS = ['the','be','to','of','and','a','in','that','have','it','for','not','on','with','he','as','you','do','at','this','but','his','by','from','they','we','say','her','she','or','an','will','my','one','all','would','there','their','what','so','up','out','if','about','who','get','which','go','me','when','make','can','like','time','no','just','him','know','take','people','into','year','your','good','some','could','them','see','other','than','then','now','look','only','come','its','over','think','also','back','after','use','two','how','our','work','first','well','way','even','new','want','because','any','these','give','day','most','us','great','between','own','yet','both','under','never','same','another','much','long','find','here','thing','ask','through','very','still','place','world','just','also','old','should','house','get','high','every','near','add','between','own','below','country','plant','last','school','father','keep','tree','never','start','city','earth','eye','light','thought','head','under','story','saw','left','few','while','along','might','close','something','seem','next','hard','open','example','begin','life','always','those','both','paper','together','got','group','often','run','important','until','children','side','feet','car','mile','night','walk','white','sea','began','grow','took','river','four','carry','state','once','book','hear','stop','without','second','late','miss','idea','enough','eat','face','watch','far','indian','really','almost','let','above','girl','sometimes','mountain','cut','young','talk','soon','list','song','being','leave','family','it\'s'];

class TypingTestGame {
    constructor() {
        this.displayEl = document.getElementById('typingtest-words-display');
        this.input = document.getElementById('typingtest-input');
        this.timerEl = document.getElementById('typingtest-timer');
        this.wpmEl = document.getElementById('typingtest-wpm');
        this.accEl = document.getElementById('typingtest-accuracy');
        this.init();
        if (!this._handler) {
            this.input.addEventListener('input', () => this.onInput());
            this.input.addEventListener('keydown', (e) => {
                if (e.key === ' ' && !this.started) {
                    this.startTest();
                }
            });
        }
    }
    init() {
        this.words = [];
        this.currentIndex = 0;
        this.wordElements = [];
        this.correctChars = 0;
        this.totalChars = 0;
        this.errors = 0;
        this.timeLeft = 30;
        this.timerRunning = false;
        this.timerAccum = 0;
        this.started = false;
        this.gameOver = false;
        this.lastTime = 0;
        this.input.value = '';
        this.input.disabled = false;
        if (this.timerEl) this.timerEl.textContent = 'Time: 30';
        if (this.wpmEl) this.wpmEl.textContent = 'WPM: 0';
        if (this.accEl) this.accEl.textContent = 'Acc: 100%';
        this.generateWords();
        this.renderWords();
        this.input.focus();
    }
    generateWords() {
        this.words = [];
        const shuffled = [...TYPING_WORDS].sort(() => Math.random() - 0.5);
        for (let i = 0; i < 50; i++) {
            this.words.push(shuffled[i % shuffled.length]);
        }
    }
    renderWords() {
        this.displayEl.innerHTML = '';
        this.wordElements = [];
        for (let i = 0; i < this.words.length; i++) {
            const wordSpan = document.createElement('span');
            wordSpan.style.marginRight = '8px';
            wordSpan.style.display = 'inline-block';
            for (let j = 0; j < this.words[i].length; j++) {
                const charSpan = document.createElement('span');
                charSpan.className = 'tt-char pending';
                charSpan.textContent = this.words[i][j];
                wordSpan.appendChild(charSpan);
            }
            const spaceSpan = document.createElement('span');
            spaceSpan.className = 'tt-char pending';
            spaceSpan.textContent = ' ';
            wordSpan.appendChild(spaceSpan);
            this.displayEl.appendChild(wordSpan);
            this.wordElements.push(wordSpan);
        }
        this.updateActiveWord();
    }
    updateActiveWord() {
        for (let i = 0; i < this.wordElements.length; i++) {
            const chars = this.wordElements[i].querySelectorAll('.tt-char');
            if (i === this.currentIndex) {
                if (chars[0]) chars[0].classList.add('current');
            }
        }
    }
    startTest() {
        this.started = true;
        this.timerRunning = true;
        this.lastTime = performance.now();
        this.loop = (now) => {
            if (this.timerRunning && !this.gameOver) {
                const dt = Math.min((now - this.lastTime) / 1000, 0.05);
                this.lastTime = now;
                this.timerAccum += dt;
                if (this.timerAccum >= 1) {
                    this.timerAccum -= 1;
                    this.timeLeft--;
                    if (this.timerEl) this.timerEl.textContent = 'Time: ' + this.timeLeft;
                    if (this.timeLeft <= 0) {
                        this.endTest();
                        return;
                    }
                }
            }
            if (!this.gameOver) this._animId = requestAnimationFrame(this.loop);
        };
        this._animId = requestAnimationFrame(this.loop);
    }
    onInput() {
        if (this.gameOver) return;
        const val = this.input.value;

        if (!this.started && val.length > 0) {
            this.startTest();
        }

        const currentWord = this.words[this.currentIndex] || '';
        const typed = val.replace(/\s/g, '');

        const wordEl = this.wordElements[this.currentIndex];
        if (!wordEl) return;
        const chars = wordEl.querySelectorAll('.tt-char');

        for (let i = 0; i < chars.length - 1; i++) {
            chars[i].classList.remove('done', 'wrong', 'current', 'pending');
            if (i < typed.length) {
                if (typed[i] === currentWord[i]) {
                    chars[i].classList.add('done');
                } else {
                    chars[i].classList.add('wrong');
                }
            } else if (i === typed.length) {
                chars[i].classList.add('current');
            } else {
                chars[i].classList.add('pending');
            }
        }

        // Track accuracy
        const lastChar = val[val.length - 1];
        if (lastChar === ' ' || val.length > currentWord.length + 1) {
            const wordTyped = val.trim();
            if (wordTyped.length > 0) {
                this.totalChars += currentWord.length;
                if (wordTyped === currentWord) {
                    this.correctChars += currentWord.length;
                } else {
                    this.errors++;
                }
                this.currentIndex++;
                this.input.value = '';
                if (this.currentIndex >= this.words.length) {
                    this.endTest();
                    return;
                }
                this.updateActiveWord();
                this.updateStats();
            }
        }
    }
    updateStats() {
        const elapsed = 30 - this.timeLeft;
        const minutes = elapsed / 60;
        const wpm = minutes > 0 ? Math.round((this.correctChars / 5) / minutes) : 0;
        if (this.wpmEl) this.wpmEl.textContent = 'WPM: ' + wpm;
        const total = this.correctChars + this.errors;
        const acc = total > 0 ? Math.round(this.correctChars / total * 100) : 100;
        if (this.accEl) this.accEl.textContent = 'Acc: ' + acc + '%';
    }
    endTest() {
        this.gameOver = true;
        this.timerRunning = false;
        this.input.disabled = true;
        if (this._animId) { cancelAnimationFrame(this._animId); this._animId = null; }
        this.updateStats();
        if (this.timerEl) this.timerEl.textContent = 'Time: 0';
        const elapsed = 30 - this.timeLeft;
        const minutes = elapsed / 60 || 0.5;
        const wpm = Math.round((this.correctChars / 5) / minutes);
        const total = this.correctChars + this.errors;
        const acc = total > 0 ? Math.round(this.correctChars / total * 100) : 100;
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.65);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;border-radius:8px;z-index:10;';
        const title = document.createElement('div');
        title.style.cssText = 'font-size:24px;font-weight:bold;color:#ffd700;';
        title.textContent = 'Test Complete!';
        overlay.appendChild(title);
        const stats = document.createElement('div');
        stats.style.cssText = 'font-size:16px;color:#fff;';
        stats.innerHTML = 'WPM: ' + wpm + ' | Accuracy: ' + acc + '% | Words: ' + this.currentIndex;
        overlay.appendChild(stats);
        const btn = document.createElement('button');
        btn.textContent = 'Play Again';
        btn.style.cssText = 'padding:8px 20px;border:none;border-radius:8px;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;cursor:pointer;font-size:13px;font-weight:600;margin-top:8px;';
        btn.addEventListener('click', () => { overlay.remove(); this.init(); });
        overlay.appendChild(btn);
        this.displayEl.parentElement.style.position = 'relative';
        this.displayEl.parentElement.appendChild(overlay);
    }
    pause() {
        if (this._animId) { cancelAnimationFrame(this._animId); this._animId = null; }
    }
}

// ============================================================
// Spelling Bee
// ============================================================
class SpellingBeeGame {
    constructor() {
        this.lettersEl = document.getElementById('spellingbee-letters');
        this.input = document.getElementById('spellingbee-input');
        this.submitBtn = document.getElementById('spellingbee-submit');
        this.shuffleBtn = document.getElementById('spellingbee-shuffle-btn');
        this.msgEl = document.getElementById('spellingbee-message');
        this.wordListEl = document.getElementById('spellingbee-word-list');
        this.scoreEl = document.getElementById('spellingbee-score');
        this.foundEl = document.getElementById('spellingbee-found');
        this.best = parseInt(localStorage.getItem('sbbest') || '0');
        this.init();
        if (!this._handler) {
            this._handler = true;
            this.submitBtn.addEventListener('click', () => this.submitWord());
            this.shuffleBtn.addEventListener('click', () => this.shuffleLetters());
            this.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.submitWord(); });
        }
    }
    init() {
        this.centerLetter = '';
        this.outerLetters = [];
        this.foundWords = [];
        this.score = 0;
        this.gameOver = false;
        this.allLetters = [];
        this.validWordsList = [];
        this.selectLetters();
        this.renderLetters();
        this.renderWordList();
        this.input.value = '';
        this.input.disabled = false;
        this.input.focus();
        this.msgEl.className = '';
        if (this.msgEl) this.msgEl.textContent = 'Form words using the center letter';
        if (this.scoreEl) this.scoreEl.textContent = 'Score: 0' + (this.best ? ' | Best: ' + this.best : '');
        if (this.foundEl) this.foundEl.textContent = 'Words: 0';
    }
    selectLetters() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const validWords = WORDLE_WORDS.filter(w => w.length >= 4);
        const shuffled = [...validWords].sort(() => Math.random() - 0.5);

        for (const word of shuffled) {
            const unique = [...new Set(word.split(''))];
            if (unique.length <= 7) {
                this.centerLetter = word[Math.floor(Math.random() * word.length)];
                this.outerLetters = unique.filter(l => l !== this.centerLetter).sort(() => Math.random() - 0.5).slice(0, 6);
                while (this.outerLetters.length < 6) {
                    const ch = letters[Math.floor(Math.random() * 26)];
                    if (ch !== this.centerLetter && !this.outerLetters.includes(ch)) {
                        this.outerLetters.push(ch);
                    }
                }
                this.allLetters = [this.centerLetter, ...this.outerLetters];
                // Precompute valid words for this puzzle
                this.validWordsList = validWords.filter(w =>
                    w.includes(this.centerLetter) &&
                    w.split('').every(l => this.allLetters.includes(l))
                );
                this.maxScore = this.validWordsList.length * 5;
                return;
            }
        }
        this.centerLetter = 'A';
        this.outerLetters = ['B','C','D','E','F','G'];
        this.allLetters = [this.centerLetter, ...this.outerLetters];
        this.validWordsList = [];
        this.maxScore = 100;
    }
    submitWord() {
        if (this.gameOver) return;
        const word = this.input.value.trim().toUpperCase();
        this.input.value = '';
        if (word.length < 4) {
            if (this.msgEl) { this.msgEl.textContent = 'Minimum 4 letters'; this.msgEl.style.color = '#f59e0b'; }
            return;
        }
        if (!word.includes(this.centerLetter)) {
            if (this.msgEl) { this.msgEl.textContent = 'Must include the center letter!'; this.msgEl.style.color = '#f59e0b'; }
            return;
        }
        for (const ch of word) {
            if (!this.allLetters.includes(ch)) {
                if (this.msgEl) { this.msgEl.textContent = 'Invalid letter: ' + ch; this.msgEl.style.color = '#e74c3c'; }
                return;
            }
        }
        if (this.foundWords.includes(word)) {
            if (this.msgEl) { this.msgEl.textContent = 'Already found!'; this.msgEl.style.color = '#f59e0b'; }
            return;
        }
        if (!WORDLE_WORDS.includes(word)) {
            if (this.msgEl) { this.msgEl.textContent = 'Not in word list'; this.msgEl.style.color = '#e74c3c'; }
            return;
        }
        this.foundWords.push(word);
        const pts = word.length === 4 ? 1 : word.length === 5 ? 2 : word.length === 6 ? 3 : word.length === 7 ? 5 : word.length >= 8 ? 8 + (word.length - 8) * 2 : 1;
        const isPangram = new Set(word.split('')).size === 7;
        const bonus = isPangram ? 10 : 0;
        this.score += pts + bonus;
        if (this.scoreEl) this.scoreEl.textContent = 'Score: ' + this.score + (this.best ? ' | Best: ' + this.best : '');
        if (this.foundEl) this.foundEl.textContent = 'Words: ' + this.foundWords.length;
        if (this.msgEl) {
            this.msgEl.textContent = (isPangram ? 'PANGRAM! +' : '+') + (pts + bonus);
            this.msgEl.style.color = '#2ecc71';
            this.msgEl.style.animation = 'none';
            this.msgEl.offsetHeight;
            this.msgEl.style.animation = 'anagPop 0.35s ease';
        }
        this.renderWordList();
        this.checkGameOver();
        this.input.focus();
    }
    checkGameOver() {
        const remaining = this.validWordsList.filter(w => !this.foundWords.includes(w));
        if (remaining.length === 0 || this.foundWords.length >= 50) {
            this.gameOver = true;
            this.input.disabled = true;
            const isBest = this.score > this.best;
            if (isBest) { this.best = this.score; localStorage.setItem('sbbest', String(this.best)); }
            if (this.msgEl) {
                this.msgEl.innerHTML = '🎉 All words found! Score: ' + this.score + (isBest ? ' ⭐ New Best!' : '');
                this.msgEl.style.color = '#ffd700';
            }
            if (this.scoreEl) this.scoreEl.textContent = 'Score: ' + this.score + (this.best ? ' | Best: ' + this.best : '');
        }
    }
    shuffleLetters() {
        for (let i = this.outerLetters.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.outerLetters[i], this.outerLetters[j]] = [this.outerLetters[j], this.outerLetters[i]];
        }
        this.renderLetters();
    }
    renderLetters() {
        this.lettersEl.innerHTML = '';
        const center = document.createElement('div');
        center.className = 'sb-letter center';
        center.textContent = this.centerLetter;
        center.addEventListener('click', () => {
            this.input.value += this.centerLetter;
            this.input.focus();
        });
        this.lettersEl.appendChild(center);
        for (const ch of this.outerLetters) {
            const el = document.createElement('div');
            el.className = 'sb-letter';
            el.textContent = ch;
            el.addEventListener('click', () => {
                this.input.value += ch;
                this.input.focus();
            });
            this.lettersEl.appendChild(el);
        }
    }
    renderWordList() {
        this.wordListEl.innerHTML = '';
        for (const w of this.foundWords) {
            const el = document.createElement('div');
            el.className = 'sb-found-word' + (new Set(w.split('')).size === 7 ? ' pangram' : '');
            el.textContent = w;
            this.wordListEl.appendChild(el);
        }
    }
    pause() {}
}

// ============================================================
// Game Registry
// ============================================================
const CATEGORIES = {
    board:  { icon: '♟️', name: 'Board Games', accent: '245, 158, 11' },
    puzzle: { icon: '🧩', name: 'Puzzle Games', accent: '34, 197, 94' },
    arcade: { icon: '🕹️', name: 'Arcade Games', accent: '239, 68, 68' },
    word:   { icon: '📝', name: 'Word Games', accent: '59, 130, 246' },
    sports: { icon: '⚽', name: 'Sports Games', accent: '251, 146, 60' }
};

const GAMES = [
    {
        id: 'checkers', name: 'Checkers', category: 'board',
        icon: '♟️', desc: 'Capture all pieces', accent: '245, 158, 11',
        create() {
            const g = new CheckersGame('checkerGame');
            document.getElementById('newGameBtn').addEventListener('click', () => g.newGame());
            document.getElementById('vsComputerBtn').addEventListener('click', () => g.toggleComputer());
            return g;
        }
    },
    {
        id: 'connect4', name: 'Connect 4', category: 'board',
        icon: '🔴🟡', desc: 'Four in a row', accent: '239, 68, 68',
        create() {
            const g = new Connect4Game();
            const aiBtn = document.getElementById('c4-ai-btn');
            if (aiBtn && !aiBtn._listenerAttached) {
                aiBtn.addEventListener('click', () => g.toggleAI());
                aiBtn._listenerAttached = true;
            }
            return g;
        }
    },
    {
        id: 'minesweeper', name: 'Minesweeper', category: 'puzzle',
        icon: '💣', desc: 'Find the mines', accent: '34, 197, 94',
        create() { return new MinesweeperGame(); }
    },
    {
        id: 'memory', name: 'Memory', category: 'puzzle',
        icon: '🃏', desc: 'Match the pairs', accent: '168, 85, 247',
        create() { return new MemoryGame(); }
    },
    {
        id: 'snake', name: 'Snake', category: 'arcade',
        icon: '🐍', desc: 'Grow and survive', accent: '6, 182, 212',
        create() {
            const g = new SnakeGame();
            g.init();
            return g;
        }
    },
    {
        id: 'tictactoe', name: 'Tic-Tac-Toe', category: 'board',
        icon: '❌⭕', desc: 'Three in a row', accent: '96, 165, 250',
        create() {
            const g = new TicTacToeGame();
            document.getElementById('ttt-new-btn').addEventListener('click', () => g.init());
            document.getElementById('ttt-ai-btn').addEventListener('click', () => g.toggleAI());
            return g;
        }
    },
    {
        id: 'hangman', name: 'Hangman', category: 'puzzle',
        icon: '🪢', desc: 'Guess the word', accent: '249, 168, 212',
        create() {
            const g = new HangmanGame();
            document.getElementById('hang-new-btn').addEventListener('click', () => g.init());
            return g;
        }
    },
    {
        id: 'game2048', name: '2048', category: 'puzzle',
        icon: '🔢', desc: 'Merge the tiles', accent: '242, 177, 121',
        create() {
            const g = new Game2048();
            document.getElementById('g2048-new-btn').addEventListener('click', () => g.init());
            return g;
        }
    },
    {
        id: 'pong', name: 'Pong', category: 'arcade',
        icon: '🏓', desc: 'Classic paddle game', accent: '96, 165, 250',
        create() {
            const g = new PongGame();
            document.getElementById('pong-new-btn').addEventListener('click', () => { g.pause(); g.init(); });
            return g;
        }
    },
    {
        id: 'breakout', name: 'Breakout', category: 'arcade',
        icon: '🧱', desc: 'Break all bricks', accent: '231, 76, 60',
        create() {
            const g = new BreakoutGame();
            document.getElementById('break-new-btn').addEventListener('click', () => { g.pause(); g.init(); });
            return g;
        }
    },
    {
        id: 'othello', name: 'Othello', category: 'board',
        icon: '⚫⚪', desc: 'Flip the board', accent: '45, 90, 39',
        create() {
            const g = new OthelloGame();
            document.getElementById('oth-new-btn').addEventListener('click', () => g.init());
            return g;
        }
    },
    {
        id: 'battleship', name: 'Battleship', category: 'board',
        icon: '🚢', desc: 'Sink the fleet', accent: '100, 180, 255',
        create() {
            const g = new BattleshipGame();
            document.getElementById('bs-new-btn').addEventListener('click', () => g.init());
            return g;
        }
    },
    {
        id: 'gomoku', name: 'Gomoku', category: 'board',
        icon: '⬛⬜', desc: 'Five in a row', accent: '222, 184, 135',
        create() {
            const g = new GomokuGame();
            document.getElementById('gom-new-btn').addEventListener('click', () => g.init());
            document.getElementById('gom-ai-btn').addEventListener('click', () => g.toggleAI());
            return g;
        }
    },
    {
        id: 'simon', name: 'Simon', category: 'puzzle',
        icon: '🔴🟢', desc: 'Remember the pattern', accent: '41, 128, 185',
        create() {
            const g = new SimonGame();
            document.getElementById('sim-new-btn').addEventListener('click', () => g.init());
            return g;
        }
    },
    {
        id: 'mastermind', name: 'Mastermind', category: 'puzzle',
        icon: '🎯', desc: 'Crack the color code', accent: '155, 89, 182',
        create() {
            const g = new MastermindGame();
            document.getElementById('mm-new-btn').addEventListener('click', () => g.init());
            return g;
        }
    },
    {
        id: 'invaders', name: 'Space Invaders', category: 'arcade',
        icon: '👾', desc: 'Defeat the aliens', accent: '46, 204, 113',
        create() {
            const g = new SpaceInvadersGame();
            document.getElementById('inv-new-btn').addEventListener('click', () => { g.pause(); g.init(); });
            return g;
        }
    },
    {
        id: 'flappy', name: 'Flappy Bird', category: 'arcade',
        icon: '🐤', desc: 'Fly through pipes', accent: '77, 201, 246',
        create() {
            const g = new FlappyBirdGame();
            document.getElementById('flap-new-btn').addEventListener('click', () => { g.pause(); g.init(); });
            return g;
        }
    },
    {
        id: 'dino', name: 'Dino Runner', category: 'arcade',
        icon: '🦖', desc: 'Run and jump', accent: '83, 83, 83',
        create() {
            const g = new DinoRunnerGame();
            document.getElementById('dino-new-btn').addEventListener('click', () => { g.pause(); g.init(); });
            return g;
        }
    },
    {
        id: 'countmaster', name: 'Count Master', category: 'arcade',
        icon: '🔢', desc: 'Grow and survive', accent: '52, 152, 219',
        create() {
            const g = new CountMasterGame();
            document.getElementById('cm-new-btn').addEventListener('click', () => { g.pause(); g.init(); });
            return g;
        }
    },
    {
        id: 'wordle', name: 'Wordle', category: 'word',
        icon: '🟩', desc: 'Guess the 5-letter word', accent: '83, 141, 78',
        create() {
            const g = new WordleGame();
            document.getElementById('wordle-new-btn').addEventListener('click', () => g.init());
            return g;
        }
    },
    {
        id: 'boggle', name: 'Boggle', category: 'word',
        icon: '🔤', desc: 'Find words in the grid', accent: '52, 152, 219',
        create() {
            const g = new BoggleGame();
            document.getElementById('boggle-new-btn').addEventListener('click', () => { g.pause(); g.init(); });
            return g;
        }
    },
    {
        id: 'anagrams', name: 'Anagrams', category: 'word',
        icon: '🔀', desc: 'Unscramble the word', accent: '230, 126, 34',
        create() {
            const g = new AnagramsGame();
            document.getElementById('anagrams-new-btn').addEventListener('click', () => g.init());
            return g;
        }
    },
    {
        id: 'wordsearch', name: 'Word Search', category: 'word',
        icon: '🔍', desc: 'Find hidden words', accent: '46, 204, 113',
        create() {
            const g = new WordSearchGame();
            document.getElementById('wordsearch-new-btn').addEventListener('click', () => { g.pause(); g.init(); });
            return g;
        }
    },
    {
        id: 'typingtest', name: 'Typing Test', category: 'word',
        icon: '⌨️', desc: 'Test your typing speed', accent: '155, 89, 182',
        create() {
            const g = new TypingTestGame();
            document.getElementById('typingtest-new-btn').addEventListener('click', () => { g.pause(); g.init(); });
            return g;
        }
    },
    {
        id: 'spellingbee', name: 'Spelling Bee', category: 'word',
        icon: '🐝', desc: 'Make words from letters', accent: '232, 184, 0',
        create() {
            const g = new SpellingBeeGame();
            document.getElementById('spellingbee-new-btn').addEventListener('click', () => g.init());
            return g;
        }
    },
    {
        id: 'penaltykicker', name: 'Penalty Kicker', category: 'sports',
        icon: '⚽', desc: 'Score 5 penalties', accent: '46, 204, 113',
        create() {
            const g = new PenaltyKickerGame();
            document.getElementById('penaltykicker-new-btn').addEventListener('click', () => { g.pause(); g.init(); });
            return g;
        }
    },
    {
        id: 'basketball', name: 'Basketball', category: 'sports',
        icon: '🏀', desc: 'Shoot hoops', accent: '231, 76, 60',
        create() {
            const g = new BasketballGame();
            document.getElementById('basketball-new-btn').addEventListener('click', () => { g.pause(); g.init(); });
            return g;
        }
    },
    {
        id: 'sprint', name: 'Sprint', category: 'sports',
        icon: '🏃', desc: 'Tap to sprint', accent: '52, 152, 219',
        create() {
            const g = new SprintGame();
            document.getElementById('sprint-new-btn').addEventListener('click', () => { g.pause(); g.init(); });
            return g;
        }
    },
    {
        id: 'bowling', name: 'Bowling', category: 'sports',
        icon: '🎳', desc: 'Knock down pins', accent: '155, 89, 182',
        create() {
            const g = new BowlingGame();
            document.getElementById('bowling-new-btn').addEventListener('click', () => { g.pause(); g.init(); });
            return g;
        }
    },
    {
        id: 'archery', name: 'Archery', category: 'sports',
        icon: '🏹', desc: 'Hit the target', accent: '39, 174, 96',
        create() {
            const g = new ArcheryGame();
            document.getElementById('archery-new-btn').addEventListener('click', () => { g.pause(); g.init(); });
            return g;
        }
    },
    {
        id: 'baseball', name: 'Baseball', category: 'sports',
        icon: '⚾', desc: 'Hit home runs', accent: '241, 196, 15',
        create() {
            const g = new BaseballGame();
            document.getElementById('baseball-new-btn').addEventListener('click', () => { g.pause(); g.init(); });
            return g;
        }
    }
];

const GAME_MAP = {};
GAMES.forEach(g => GAME_MAP[g.id] = g);

function _buildHub() {
    const hub = document.getElementById('game-hub');

    const bg = document.createElement('div');
    bg.className = 'hub-bg';
    hub.appendChild(bg);

    Object.entries(CATEGORIES).forEach(([key, cat]) => {
        const section = document.createElement('div');
        section.className = 'category';
        section.dataset.category = key;
        section.style.setProperty('--category-accent', cat.accent);

        const label = document.createElement('div');
        label.className = 'category-label';
        label.innerHTML = `<span class="category-accent-dot"></span><span class="category-icon">${cat.icon}</span><span>${cat.name}</span>`;
        section.appendChild(label);

        const inner = document.createElement('div');
        inner.className = 'category-inner';

        const cards = document.createElement('div');
        cards.className = 'game-cards';

        GAMES.filter(g => g.category === key).forEach((g, idx) => {
            const card = document.createElement('div');
            card.className = 'game-card';
            card.dataset.game = g.id;
            card.style.setProperty('--card-accent', g.accent);
            card.style.animationDelay = (0.04 * (idx + 1)) + 's';
            card.innerHTML = `
                <div class="game-card-accent"></div>
                <div class="game-card-bg"></div>
                <div class="game-card-content">
                    <div class="game-card-icon">${g.icon}</div>
                    <div class="game-card-title">${g.name}</div>
                    <div class="game-card-desc">${g.desc}</div>
                </div>
                <a href="${g.id}.html" class="game-card-standalone" onclick="event.stopPropagation()" title="Open standalone page" target="_blank">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6m4-3h6v6m-11 5L21 3"/></svg>
                </a>
            `;
            card.addEventListener('click', () => showGame(g.id));
            cards.appendChild(card);
        });

        inner.appendChild(cards);
        section.appendChild(inner);
        hub.appendChild(section);
    });
}

// ============================================================
// Navigation
// ============================================================
function _pauseAll() {
    GAMES.forEach(g => {
        const inst = window[g.id + 'Game'];
        if (inst && inst.pause) inst.pause();
    });
}

function showHub() {
    _pauseAll();
    if (window.snakeGame) window.snakeGame.destroy();
    document.getElementById('game-hub').style.display = 'flex';
    document.getElementById('game-view').style.display = 'none';
    document.querySelectorAll('.gw').forEach(el => el.classList.remove('active'));
    updateRecentDisplay();
    // Reset search/filter
    const searchInput = document.getElementById('hub-search-input');
    if (searchInput) searchInput.value = '';
    document.querySelectorAll('.game-card').forEach(c => c.style.display = '');
    document.querySelectorAll('.category').forEach(c => {
        c.style.display = '';
        c.classList.remove('hidden');
    });
    setFilter(_activeFilter);
}

function showGame(id) {
    const entry = GAME_MAP[id];
    if (!entry) return;

    _pauseAll();
    document.getElementById('game-hub').style.display = 'none';
    document.getElementById('game-view').style.display = 'flex';
    document.querySelectorAll('.gw').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(id + '-wrapper');
    if (target) target.classList.add('active');
    const title = document.getElementById('game-view-title');
    if (title) title.textContent = entry.name;

    addRecentGame(id);

    const key = id + 'Game';
    if (!window[key]) {
        window[key] = entry.create();
    } else if (id === 'snake' || id === 'pong' || id === 'breakout' || id === 'game2048' || id === 'invaders' || id === 'flappy' || id === 'dino' || id === 'countmaster' || id === 'penaltykicker' || id === 'basketball' || id === 'sprint' || id === 'bowling' || id === 'archery' || id === 'baseball' || id === 'boggle' || id === 'wordsearch' || id === 'typingtest') {
        window[key].init();
    }
}

// ============================================================
// Theme Switching
// ============================================================
function switchTheme(theme) {
    if (currentBackground) currentBackground.destroy();
    switch (theme) {
        case 'marvel': currentBackground = new MarvelBackground('aiBackground'); break;
        case 'neural': currentBackground = new NeuralNetwork('aiBackground'); break;
        case 'gradient': currentBackground = new GradientBackground('aiBackground'); break;
    }
    document.querySelectorAll('.theme-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.theme === theme);
    });
}

// ============================================================
// Filter & Search
// ============================================================
let _activeFilter = 'all';

function setFilter(filter) {
    _activeFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.filter === filter);
    });
    document.querySelectorAll('.category').forEach(section => {
        if (filter === 'all' || section.dataset.category === filter) {
            section.classList.remove('hidden');
        } else {
            section.classList.add('hidden');
        }
    });
    applySearch();
}

function applySearch() {
    const q = document.getElementById('hub-search-input')?.value?.toLowerCase().trim() || '';
    document.querySelectorAll('.game-card').forEach(card => {
        const title = card.querySelector('.game-card-title')?.textContent.toLowerCase() || '';
        const desc = card.querySelector('.game-card-desc')?.textContent.toLowerCase() || '';
        const match = !q || title.includes(q) || desc.includes(q);
        card.style.display = match ? '' : 'none';
    });
    document.querySelectorAll('.category:not(.hidden)').forEach(section => {
        const visible = [...section.querySelectorAll('.game-card')].some(c => c.style.display !== 'none');
        if (!visible && q) section.style.display = 'none';
        else section.style.display = '';
    });
}

// ============================================================
// Recently Played
// ============================================================
function getRecentGames() {
    try { return JSON.parse(localStorage.getItem('recentGames') || '[]'); } catch { return []; }
}

function addRecentGame(id) {
    let recent = getRecentGames().filter(g => g !== id);
    recent.unshift(id);
    if (recent.length > 3) recent = recent.slice(0, 3);
    localStorage.setItem('recentGames', JSON.stringify(recent));
}

function updateRecentDisplay() {
    const el = document.getElementById('hub-recent');
    if (!el) return;
    const recent = getRecentGames();
    el.textContent = recent.length
        ? 'Recent: ' + recent.map(id => GAME_MAP[id]?.name || id).join(', ')
        : 'Recent: —';
}

// ============================================================
// Touch Support for Canvas Games
// ============================================================
function enableTouchOnCanvas(canvas) {
    if (!canvas || canvas._touchEnabled) return;
    canvas._touchEnabled = true;
    canvas.style.touchAction = 'none';
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const t = e.changedTouches[0];
        canvas.dispatchEvent(new MouseEvent('mousedown', { clientX: t.clientX, clientY: t.clientY }));
    });
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const t = e.changedTouches[0];
        canvas.dispatchEvent(new MouseEvent('mousemove', { clientX: t.clientX, clientY: t.clientY }));
    });
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        canvas.dispatchEvent(new MouseEvent('mouseup', {}));
        canvas.dispatchEvent(new MouseEvent('click', {}));
    });
}

// ============================================================
// Keyboard Support
// ============================================================
document.addEventListener('keydown', (e) => {
    if (window.snakeGame) {
        const snw = document.getElementById('snake-wrapper');
        if (snw && snw.classList.contains('active') && !window.snakeGame.gameOver) {
            switch (e.key) {
                case 'ArrowUp': e.preventDefault(); window.snakeGame.setDirection(0, -1); break;
                case 'ArrowDown': e.preventDefault(); window.snakeGame.setDirection(0, 1); break;
                case 'ArrowLeft': e.preventDefault(); window.snakeGame.setDirection(-1, 0); break;
                case 'ArrowRight': e.preventDefault(); window.snakeGame.setDirection(1, 0); break;
            }
        }
    }
});

// ============================================================
// Pause animations when tab is hidden
// ============================================================
document.addEventListener('visibilitychange', () => {
    if (currentBackground) {
        if (document.hidden) {
            currentBackground.pause();
        } else {
            currentBackground.resume();
        }
    }
});

// ============================================================
// Initialization
// ============================================================
window.addEventListener('load', () => {
    const hub = document.getElementById('game-hub');
    if (hub) {
        const countEl = document.getElementById('hub-game-count');
        if (countEl) countEl.textContent = GAMES.length + ' games';
        _buildHub();
        currentBackground = new MarvelBackground('aiBackground');
        showHub();
    } else {
        // Standalone mode — background is initialized per-page
        return;
    }

    // Theme switching
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTheme(btn.dataset.theme));
    });

    // Category filter
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => setFilter(btn.dataset.filter));
    });

    // Search
    const searchInput = document.getElementById('hub-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', applySearch);
    }

    // Random game
    const randomBtn = document.getElementById('hub-random-btn');
    if (randomBtn) {
        randomBtn.addEventListener('click', () => {
            const filtered = GAMES.filter(g => _activeFilter === 'all' || g.category === _activeFilter);
            const pick = filtered[Math.floor(Math.random() * filtered.length)];
            if (pick) showGame(pick.id);
        });
    }
});
