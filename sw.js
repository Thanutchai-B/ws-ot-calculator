const CACHE = 'ws-ot-calc-v2';
const FILES = [
  './index.html',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES))
  );
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
  const url = new URL(e.request.url);

  // ถ้า URL มี ?_r= → ดึงจาก network เสมอ (cache-busting refresh)
  if(url.searchParams.has('_r')){
    e.respondWith(
      fetch(e.request)
        .then(res => {
          // อัปเดต cache ด้วยไฟล์ใหม่
          const clone = res.clone();
          caches.open(CACHE).then(c => {
            // cache ในชื่อปกติ (ไม่มี _r)
            url.searchParams.delete('_r');
            c.put(new Request(url.toString()), clone);
          });
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // ปกติ: cache first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

self.addEventListener('message', e => {
  if(e.data && e.data.type === 'SKIP_WAITING'){
    self.skipWaiting();
  }
});
