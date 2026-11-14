// 앱 화면 파일을 폰에 보관해 두는 서비스 워커 (서버 요청은 건드리지 않음)
const CACHE = 'rl-shell-v14';
const SHELL = ['./', 'index.html', 'config.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'leaflet.js', 'leaflet.css'];

self.addEventListener('install', e => {
  // 파일 하나가 없어도 설치가 멈추지 않도록 하나씩 보관
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// 같은 주소의 파일만 처리: 인터넷이 되면 최신 파일(브라우저 임시 보관본을 쓰지 않고 매번 확인), 안 되면 보관해 둔 파일
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cached = await caches.match(req);
    const net = fetch(req, { cache: 'no-cache' }).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    });
    if (!cached) return net.catch(() => caches.match('index.html'));
    // 인터넷이 느리면 1.5초 뒤에 보관해 둔 파일로 먼저 열고, 새 파일은 뒤에서 받아 둠
    return Promise.race([net.catch(() => cached), new Promise(r => setTimeout(() => r(cached), 1500))]);
  })());
});
