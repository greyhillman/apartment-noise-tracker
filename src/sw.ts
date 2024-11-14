/// <reference lib="WebWorker" />

import { addNoise, getNoise } from "./api";

export type { };
declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = "backend";
const VERSION = "v0.0.1";

const CURRENT_CACHE_KEY = `${CACHE_NAME}_${VERSION}`;

declare const CACHE_RESOURCES: string[];

self.addEventListener("install", event => {
    const fn = async () => {
        const cache = await caches.open(CURRENT_CACHE_KEY);

        cache.addAll(CACHE_RESOURCES)
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
            const cachedResponse = await caches.match("/");
            if (cachedResponse) {
                return cachedResponse;
            }
        }

        const url = new URL(request.url);

        const contentType = request.headers.get("Content-Type");
        if (contentType === "application/json" && !url.pathname.endsWith(".json")) {
            const client = await self.clients.get(event.clientId);
            if (!client) {
                return;
            }

            const clients = await self.clients.matchAll();

            client.postMessage(`ServiceWorker: calling api ${url}`);

            // Probably an API call
            if (url.pathname === "/noise" && request.method === "POST") {
                return await addNoise(request);
            } else if (url.pathname === "/noise" && request.method === "GET") {
                return await getNoise(request);
            }
        }

        // Defer to network
        return await fetch(request);
    }

    event.respondWith(fn());
});
