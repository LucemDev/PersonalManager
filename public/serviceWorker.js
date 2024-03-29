let store = 'aug12'

const assets = [
    // "/pm",
    "/index.html",
    "/index.css",
    "/index.js",
    "/vendor.js",
    "/manifest.json",
    "/favicon.ico",
    "/apple-touch-icon.png",
    "/icon-192.png",
    "/logo.png",
]

self.addEventListener("install", installEvent => {
    installEvent.waitUntil(caches.open(store).then(cache => {
            return cache.addAll(assets).catch(e => console.error("Failed To Store Cache", e))
        }).then(() => {
            return self.skipWaiting();
        })
    )
})

self.addEventListener('activate',  activateEvent => {
    activateEvent.waitUntil(caches.open(store).then(cache => {
        return cache.keys().then(cacheNames => {
            return Promise.all(cacheNames.filter(cacheName => {
                return assets.indexOf(cacheName) === -1
            }).map(cacheName => {
                return caches.delete(cacheName)
            }) )
        }).then(() => {return self.clients.claim()})
    }));
});


self.addEventListener("fetch", fetchEvent => {
    // skip firestore (firestore data is cached via firebase API)
    if (fetchEvent.request.url.indexOf('firestore.googleapis.com') === -1)
        fetchEvent.respondWith(
            fetch(fetchEvent.request).catch(() => {
                console.log('returning cache', fetchEvent.request.url)
                return caches.match(fetchEvent.request).then(res => {return res})
            })
        )
})