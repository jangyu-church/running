// 앱 화면 파일을 폰에 보관해 두는 서비스 워커 (서버 요청은 건드리지 않음)
const CACHE = 'rl-shell-v5';
const SHELL = ['./', 'index.html', 'config.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'leaflet.js', 'leaflet.css'];

self.addEventListener('install', e => {
  // 파일 하나가 없어도 설치가 멈추지 않도록 하나씩 보관
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// 같은 주소의 파일만 처리: 인터넷이 되면 최신 파일, 안 되면 보관해 둔 파일
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('index.html')))
  );
});
