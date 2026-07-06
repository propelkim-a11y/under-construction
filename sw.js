// 서비스 워커 설치 이벤트 (최초 앱 등록)
self.addEventListener('install', (event) => {
    // 기다리지 않고 즉시 활성화하여 PWA 자격 획득
    self.skipWaiting();
});

// 서비스 워커 활성화 이벤트
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// 실시간 네트워크 요청 가로채기 (오직 PWA 설치 조건 충족용 빈 패치)
self.addEventListener('fetch', (event) => {
    // 필요한 경우 추후 오프라인 캐싱 로직을 여기에 작성할 수 있습니다.
});

// 최소한의 PWA 설치 요건을 충족하기 위한 빈 서비스 워커 파일
const CACHE_NAME = 'arrow-sim-v1';
const ASSETS = [
  './index.html',
  './style.css',
  './ui.js',
  './physics.js',
  './icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
