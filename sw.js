\// Nex CRM Service Worker
var CACHE = 'nex-crm-v4';
var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './favicon-32.png'
];

// Install: cache all assets
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: network first, fall back to cache
self.addEventListener('fetch', function(e){
  // Only handle GET requests
  if(e.request.method !== 'GET') return;

  // For Firebase API calls — always go network, never cache
  if(e.request.url.includes('firebasedatabase.app')){
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(function(response){
        // Cache fresh copy of valid responses
        if(response && response.status === 200){
          var copy = response.clone();
          caches.open(CACHE).then(function(cache){
            cache.put(e.request, copy);
          });
        }
        return response;
      })
      .catch(function(){
        // Network failed — serve from cache
        return caches.match(e.request).then(function(cached){
          return cached || caches.match('./index.html');
        });
      })
  );
});
