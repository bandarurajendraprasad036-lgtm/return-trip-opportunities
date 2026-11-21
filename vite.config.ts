// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

// gayatrione.com is also built by a separate Vercel project whose variables point at an old,
// wrong database (every request returned 401). Force that build onto this app's own backend.
// Only public browser values are set here; nothing secret.
if (process.env["VERCEL"]) {
  process.env["VITE_SUPABASE_URL"] = "https://txzzxuvjwkqhcjeshfai.supabase.co";
  process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] = "sb_publishable_mt_ficWmT4BtHokB-lP8Dw_wPQsvLBV";
  process.env["VITE_SUPABASE_PROJECT_ID"] = "txzzxuvjwkqhcjeshfai";
  process.env["SUPABASE_URL"] = "https://txzzxuvjwkqhcjeshfai.supabase.co";
  process.env["SUPABASE_PUBLISHABLE_KEY"] = "sb_publishable_mt_ficWmT4BtHokB-lP8Dw_wPQsvLBV";
}

export default defineConfig({
  vite: {
    plugins: [{
      name: 'gayatri-localized-jsx',
      enforce: 'pre',
      transform(code, id) {
        if (!id.includes('/src/') || !id.split('?')[0]?.endsWith('.tsx') || id.includes('/lib/localized-') || id.includes('/test/')) return;
        const localizedCode = code.replace(/from\s+['"]sonner['"]/g, "from '@/lib/localized-toast'");
        return { code: `/** @jsxImportSource /src/lib/localized */\n${localizedCode}`, map: null };
      },
      resolveId(id) {
        if (id === '/src/lib/localized/jsx-runtime' || id === '/src/lib/localized/jsx-dev-runtime') return `${process.cwd()}/src/lib/localized-jsx.tsx`;
        return null;
      },
    }, VitePWA({
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
        navigateFallback: null,
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
