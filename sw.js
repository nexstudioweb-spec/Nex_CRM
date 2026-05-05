// Nex CRM Service Worker
var CACHE = 'nex-crm-v3';
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

// Fetch: network-first for Firebase/external, cache-first for local assets
self.addEventListener('fetch', function(e){
  var url = e.request.url;

  // Always go network for Firebase, Google Fonts, external APIs
  if(url.includes('firebaseio.com') ||
     url.includes('googleapis.com') ||
     url.includes('gstatic.com') ||
     url.includes('fonts.googleapis') ){
    e.respondWith(fetch(e.request).catch(function(){ return caches.match(e.request); }));
    return;
  }

  // Cache-first for local assets
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(response){
        // Cache new local assets
        if(response && response.status === 200 && e.request.method === 'GET'){
          var clone = response.clone();
          caches.open(CACHE).then(function(cache){ cache.put(e.request, clone); });
        }
        return response;
      }).catch(function(){
        // Offline fallback: return index.html
        return caches.match('./index.html');
      });
    })
  );
});
