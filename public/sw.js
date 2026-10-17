// HappyText 오프라인 캐싱 서비스 워커 (v6)

const CACHE_NAME = 'happytext-cache-v9';

self.addEventListener('install', (event) => {
  // 새 서비스 워커가 설치되면 즉시 활성화 (대기 없이 바로 적용)
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 동일 오리진 요청 처리
  if (url.origin === self.origin) {
    event.respondWith(
      (async () => {
        // 1. 네트워크 먼저 시도 (항상 최신 코드 보장)
        try {
          const fetchPromise = fetch(event.request, { cache: 'no-cache' });
          const networkResponse = await fetchPromise;

          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          // 2. 네트워크 실패(오프라인/비행기 모드/PC 꺼짐) 시 캐시에서 꺼냄
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return (await cache.match('/index.html')) || (await cache.match('/'));
          }
          throw err;
        }
      })()
    );
  }
});
