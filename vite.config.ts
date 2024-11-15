import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { VitePWA } from "vite-plugin-pwa";
import postcssNesting from "postcss-nesting";
// import devtools from 'solid-devtools/vite';

export default defineConfig({
  plugins: [
    /* 
    Uncomment the following line to enable solid-devtools.
    For more info see https://github.com/thetarnav/solid-devtools/tree/main/packages/extension#readme
    */
    // devtools(),
    solidPlugin(),
    VitePWA({
      injectRegister: 'script-defer',
      strategies: 'injectManifest',

      // When building our own service worker, we need to specify where it is
      srcDir: "src",
      filename: "sw.ts",

      manifest: {
        name: "Apartment Noise Tracker",
        short_name: "Apt Noise",
        description: "Track noise from your apartment neighbours.",
        start_url: "/apartment-noise-tracker", // Follow Github pages layout
        scope: "/apartment-noise-tracker",
        icons: [
          {
            src: "./icons/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "./icons/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          }
        ]
      },
      injectManifest: {
        injectionPoint: "CACHE_RESOURCES",
        swSrc: "src/sw.ts",
      },
      devOptions: {
        enabled: true, // In order to show up during development...
        type: "module", // To use `import` statements; only works in Chrome browsers
      },
    })
  ],
  css: {
    postcss: {
      plugins: [
        postcssNesting,
      ],
    },
  },
  // Since we deploy to a nested page (github.io/apartment-noise-tracker), using
  // the default "/" breaks links.
  base: "/apartment-noise-tracker",
  server: {
    port: 3000,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm'],
  },
  build: {
    target: 'esnext',
  },
});
