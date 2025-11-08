const CACHE_NAME = 'gonstead-chiropractic-v1.0.1'
const OFFLINE_URL = '/offline'
const SYNC_TAG = 'background-sync'

// Files to cache for offline use
const FILES_TO_CACHE = [
  '/',
  '/admin',
  '/admin/dashboard',
  '/admin/auth',
  '/patient-portal',
  '/offline',
  '/manifest.json',
  '/images/gonstead-chiropractic-logo-new.png',
  '/images/gonstead-logo-new.png',
  // Add other critical assets
]

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files')
        return cache.addAll(FILES_TO_CACHE)
      })
      .then(() => {
        console.log('Service Worker: Installed successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cache)
            return caches.delete(cache)
          }
        })
      )
    }).then(() => {
      console.log('Service Worker: Activated successfully')
      return self.clients.claim()
    })
  )
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log('Service Worker: Serving from cache', event.request.url)
          return response
        }

        return fetch(event.request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // Clone the response
            const responseToCache = response.clone()

            // Cache the new response
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache)
              })

            return response
          })
          .catch(() => {
            // If network fails, serve offline page for navigate requests
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL)
            }
          })
      })
  )
})

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag)
  
  if (event.tag === SYNC_TAG) {
    event.waitUntil(syncOfflineData())
  }
})

// Sync offline data when connection is restored
async function syncOfflineData() {
  try {
    console.log('Service Worker: Starting background sync...')
    
    // Get offline data from localStorage (we'll access it through clients)
    const clients = await self.clients.matchAll()
    
    if (clients.length > 0) {
      // Send message to client to trigger sync
      clients[0].postMessage({
        type: 'BACKGROUND_SYNC',
        action: 'SYNC_OFFLINE_DATA'
      })
    }
    
    console.log('Service Worker: Background sync completed')
  } catch (error) {
    console.error('Service Worker: Background sync failed', error)
    throw error
  }
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls)
      })
    )
  }
})

// Network status monitoring
self.addEventListener('online', () => {
  console.log('Service Worker: Network is back online')
  // Trigger background sync
  self.registration.sync.register(SYNC_TAG)
})

self.addEventListener('offline', () => {
  console.log('Service Worker: Network is offline')
})
