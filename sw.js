// 試作用サービスワーカー: 常にネットワークから最新を取得し、つながらない時だけキャッシュを使う。
// （更新がすぐ反映されることを優先）
// cache:'no-cache' … ブラウザのHTTPキャッシュ（GitHub Pagesは約10分保持）を使わず、毎回サーバーに更新の有無を確認する
const CACHE = 'sanei-portal-test4-v2';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request))
  );
});
