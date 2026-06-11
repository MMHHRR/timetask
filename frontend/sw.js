/**
 * TimeTask Service Worker
 * 支持离线访问和 PWA 安装
 */

const CACHE = 'timetask-v2';
const URLS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/api.js',
    '/js/holidays.js',
    '/js/calendar.js',
    '/js/animations.js',
    '/js/app.js',
    '/manifest.json',
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE).then(cache => cache.addAll(URLS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    if (e.request.url.startsWith(self.location.origin) &&
        !e.request.url.includes('/api/')) {
        e.respondWith(
            caches.match(e.request).then(r => r || fetch(e.request))
        );
    }
});
