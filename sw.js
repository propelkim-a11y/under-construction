// 💡 캐시 저장소 이름 및 관리할 자원 목록 정의
const CACHE_NAME = 'arrow-sim-v1';
const ASSETS_TO_CACHE = [
  './',                  // 메인 HTML (index.html)
  './index.html',
  './ui.js',             // 제공해주신 드래그/스와이프 로직이 담긴 스크립트
  // './physics.js',     // 시뮬레이터 물리 엔진 파일명이 있다면 추가
  // './style.css',       // 스타일시트 파일명이 있다면 추가
];

// 1. 서비스 워커 설치: 필수 자원을 미리 하드디스크(캐시)에 다운로드
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] 필수 자원 프리캐싱 중...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. 서비스 워커 활성화: 이전 버전의 구형 캐시 자동 삭제 청소
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] 구형 캐시 삭제 중:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. 🔥 핵심 패치: 네트워크 우선(Network-First) 후 실패 시 캐시 반환 전략
self.addEventListener('fetch', (event) => {
  // 브라우저 확장 프로그램이나 로컬 호스트 외의 외부 요청(chrome-extension 등)은 캐싱에서 제외
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // 네트워크가 정상 작동하면 최신 파일을 캐시에 실시간 업데이트(복사) 해둡니다.
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // [오프라인 조치] 인터넷이 완전히 끊기면 미리 저장해둔 로컬 캐시 파일을 꺼내줍니다.
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // 캐시에도 없는 자원 요청 시 최종 텍스트 안내
          return new Response(
            "<h3>오프라인 상태입니다.</h3><p>시뮬레이터 초기 구동을 위해 최초 1회는 인터넷 연결이 필요합니다.</p>", 
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        });
      })
  );
});
