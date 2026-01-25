const CACHE_NAME = 'noter-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/src/main.ts', // Vite will resolve this in dev, but in build it will be different
  '/style.css',
  '/manifest.json'
];

// 1. Install Event: Cache all essential files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// 2. Fetch Event: Serve files from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
    //   return response || fetch(event.request);
      return fetch(event.request);

    })
  );
});

// 3. Push Event: Listen for server-sent notifications
self.addEventListener('periodicsync', (event) => {
    console.log("sync");
    
  if (event.tag === 'daily-reminder') {
    event.waitUntil(sendReminderNotification());
  }
});

async function sendReminderNotification() {
  const options = {
    body: "write your daily diary bro",
    icon: '/icon.png',
    badge: '/icon.png',
    tag: 'daily-reminder',
    data: { url: '/' }
  };

  return self.registration.showNotification('noter', options);
}

// Handle notification click to open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});