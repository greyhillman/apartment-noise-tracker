/// <reference lib="WebWorker" />

export type { };
declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = "backend";
const VERSION = "v0.1.0";

const CURRENT_CACHE_KEY = `${CACHE_NAME}_${VERSION}`;

interface CacheResource {
    revision: string | null;
    url: string;
}

// I can't find the docs that say what the precache manifest is
// and what's in it but, from running it, it's NOT a list of URLs;
// it's a list of objects.
declare const CACHE_RESOURCES: CacheResource[];

self.addEventListener("install", event => {
    const fn = async () => {
        const cache = await caches.open(CURRENT_CACHE_KEY);

        const resources = CACHE_RESOURCES;

        try {
            cache.addAll(resources.map(r => r.url));
        } catch (err) {
            console.error(err);
        }
    };

    event.waitUntil(fn());
});

self.addEventListener("activate", event => {
    const fn = async () => {
        const keys = await caches.keys();

        const deletions = keys
            .filter(key => key !== CURRENT_CACHE_KEY)
            .map(key => caches.delete(key));

        await Promise.all(deletions);

        self.clients.claim();
    };

    event.waitUntil(fn());
});

self.addEventListener("fetch", event => {
    const request = event.request;
    const fn: () => Promise<Response> = async () => {
        const cache = await caches.open(CURRENT_CACHE_KEY);

        if (request.mode === "navigate") {
            // SPA routing; serve root file
            const cachedResponse = await cache.match("/");
            if (cachedResponse) {
                console.log(`Cache hit: SPA: ${request.url}`);
                return cachedResponse;
            }
        }

        // PWA files should already be in the cache
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            console.log(`Cache hit: ${request.url}`);
            return cachedResponse;
        }

        console.log(`Cache miss: ${request.url}`);

        // Otherwise, use the network
        return await fetch(request);
    }

    event.respondWith(fn());
});
