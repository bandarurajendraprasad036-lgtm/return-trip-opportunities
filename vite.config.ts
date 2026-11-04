// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  vite: {
    plugins: [VitePWA({
      strategies: "generateSW",
      filename: "sw.js",
      registerType: "autoUpdate",
      injectRegister: null,
      manifest: false,
      devOptions: { enabled: false },
      includeAssets: ["offline.html", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"],
      workbox: {
        globPatterns: ["**/*.{js,css,png,jpg,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: undefined,
        runtimeCaching: [{
          urlPattern: ({ request, url }) => request.mode === "navigate" && url.origin === self.location.origin && !url.pathname.startsWith("/~oauth") && ["/", "/auth", "/feed"].includes(url.pathname),
          handler: "NetworkFirst",
          options: { cacheName: "gayatri-public-pages", networkTimeoutSeconds: 4, expiration: { maxEntries: 8, maxAgeSeconds: 86400 }, precacheFallback: { fallbackURL: "/offline.html" } },
        }],
      },
    })],
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
