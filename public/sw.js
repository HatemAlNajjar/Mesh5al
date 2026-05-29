const DB_NAME = 'mesh5al-db';
const STORE = 'data';
const YT_API = 'https://www.googleapis.com/youtube/v3';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(STORE);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbSet(key, val) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(val, key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function checkComments() {
  try {
    const token = await dbGet('token');
    const expiry = await dbGet('tokenExpiry');
    if (!token || Date.now() > (expiry || 0)) return;

    const chRes = await fetch(`${YT_API}/channels?part=id&mine=true`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!chRes.ok) return;
    const chData = await chRes.json();
    const channelId = chData.items?.[0]?.id;
    if (!channelId) return;

    const params = new URLSearchParams({
      part: 'snippet',
      moderationStatus: 'heldForReview',
      maxResults: '50',
      allThreadsRelatedToChannelId: channelId,
    });
    const res = await fetch(`${YT_API}/commentThreads?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data.error) return;

    const items = data.items || [];
    const knownIds = new Set((await dbGet('knownIds')) || []);
    const newOnes = items.filter(i => !knownIds.has(i.id));

    if (newOnes.length > 0) {
      await dbSet('knownIds', items.map(i => i.id));
      await self.registration.showNotification('مشخال 🎬', {
        body: newOnes.length === 1
          ? 'تعليق جديد معلّق للمراجعة'
          : `${newOnes.length} تعليقات جديدة معلّقة للمراجعة`,
        icon: '/Mesh5al/icon-192.png',
        badge: '/Mesh5al/icon-192.png',
        dir: 'rtl',
        lang: 'ar',
        tag: 'pending-comments',
        renotify: true,
        data: { url: self.registration.scope }
      });
    }
  } catch {}
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));

self.addEventListener('periodicsync', e => {
  if (e.tag === 'check-comments') e.waitUntil(checkComments());
});

self.addEventListener('message', async e => {
  if (!e.data) return;
  if (e.data.type === 'SAVE_TOKEN') {
    await dbSet('token', e.data.token);
    await dbSet('tokenExpiry', e.data.expiry);
  } else if (e.data.type === 'SAVE_KNOWN_IDS') {
    await dbSet('knownIds', e.data.ids);
  } else if (e.data.type === 'CHECK_NOW') {
    await checkComments();
  }
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes('/Mesh5al') && 'focus' in c) return c.focus();
      }
      return clients.openWindow(self.registration.scope);
    })
  );
});
