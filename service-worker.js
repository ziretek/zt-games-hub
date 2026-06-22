const cacheName = 'gamehub-v1';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './checkers.html',
    './connect4.html',
    './minesweeper.html',
    './memory.html',
    './snake.html',
    './tictactoe.html',
    './hangman.html',
    './game2048.html',
    './pong.html',
    './breakout.html',
    './othello.html',
    './battleship.html',
    './gomoku.html',
    './simon.html',
    './mastermind.html',
    './invaders.html',
    './flappy.html',
    './dino.html',
    './countmaster.html',
    './wordle.html',
    './boggle.html',
    './anagrams.html',
    './wordsearch.html',
    './typingtest.html',
    './spellingbee.html',
    './penaltykicker.html',
    './basketball.html',
    './sprint.html',
    './bowling.html',
    './archery.html',
    './baseball.html'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(cacheName)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
            .catch(() => caches.match('./index.html'))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(names => {
            return Promise.all(
                names.filter(name => name !== cacheName).map(name => caches.delete(name))
            );
        })
    );
});
