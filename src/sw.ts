/// <reference lib="WebWorker" />

import { addNoise, getNoise } from "./api";

export type { };
declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = "backend";
const VERSION = "v0.1.0";

const CURRENT_CACHE_KEY = `${CACHE_NAME}_${VERSION}`;

declare const CACHE_RESOURCES: string[];

self.addEventListener("install", event => {
    const fn = async () => {
        const cache = await caches.open(CURRENT_CACHE_KEY);

        cache.addAll(CACHE_RESOURCES);
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
        if (request.mode === "navigate") {
            // SPA routing; serve root file
            const cachedResponse = await caches.match("/");
            if (cachedResponse) {
                return cachedResponse;
            }
        }

        // PWA files should already be in the cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Otherwise, use the network
        return await fetch(request);
    }

    event.respondWith(fn());
});
