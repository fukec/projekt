// Service Worker pro Anglina PWA
const CACHE_NAME = 'anglina-v1.0.0';
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json'
];

// Instalace Service Worker
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching files');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('Service Worker: Installation complete');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: Installation failed', error);
            })
    );
});

// Aktivace Service Worker
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Activation complete');
            return self.clients.claim();
        })
    );
});

// Fetch handler - cache first strategy
self.addEventListener('fetch', event => {
    // Skip non-GET requests and external URLs
    if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version if available
                if (response) {
                    console.log('Service Worker: Serving from cache', event.request.url);
                    return response;
                }

                // Otherwise fetch from network
                console.log('Service Worker: Fetching from network', event.request.url);
                return fetch(event.request)
                    .then(response => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response for caching
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(error => {
                        console.error('Service Worker: Fetch failed', error);
                        
                        // Return offline page for HTML requests
                        if (event.request.destination === 'document') {
                            return caches.match('./index.html');
                        }
                        
                        throw error;
                    });
            })
    );
});

// Background sync (future enhancement)
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        console.log('Service Worker: Background sync triggered');
        // Here you could sync vocabulary data when connection is restored
    }
});

// Push notifications (future enhancement)
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        console.log('Service Worker: Push notification received', data);
        
        const options = {
            body: data.body || 'Čas na procvičování slovíček!',
            icon: './manifest.json', // Would be replaced with actual icon
            badge: './manifest.json', // Would be replaced with actual badge
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: '1'
            },
            actions: [
                {
                    action: 'explore',
                    title: 'Otevřít aplikaci',
                    icon: './manifest.json'
                },
                {
                    action: 'close',
                    title: 'Zavřít'
                }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'Anglina', options)
        );
    }
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    console.log('Service Worker: Notification clicked', event);
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handler for communication with app
self.addEventListener('message', event => {
    console.log('Service Worker: Message received', event.data);
    
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'SKIP_WAITING':
                self.skipWaiting();
                break;
            case 'UPDATE_CACHE':
                // Force cache update
                caches.delete(CACHE_NAME).then(() => {
                    console.log('Service Worker: Cache cleared for update');
                });
                break;
            default:
                console.log('Service Worker: Unknown message type', event.data.type);
        }
    }
});

// Error handler
self.addEventListener('error', event => {
    console.error('Service Worker: Error occurred', event.error);
});

// Unhandled rejection handler
self.addEventListener('unhandledrejection', event => {
    console.error('Service Worker: Unhandled promise rejection', event.reason);
});

console.log('Service Worker: Script loaded');