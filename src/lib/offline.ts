/** App-shell caching is never registered in development or editor previews. */
export function isOfflinePreview(hostname: string, inFrame: boolean, production: boolean, disabled: boolean) {
  const host = hostname.toLowerCase();
  const label = host.split(".")[0] ?? "";
  const lovableDomain = /\.(lovable\.app|gpt-eng\.com|gptengineer\.run)$/.test(host);
  return !production || inFrame || disabled ||
    (lovableDomain && (/^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/.test(label) || /^project--.+-dev$/.test(label))) ||
    ["lovableproject.com", "lovableproject-dev.com", "beta.lovable.dev"].some(domain => host === domain || host.endsWith(`.${domain}`));
}

export async function setupOfflineSupport() {
  if (!("serviceWorker" in navigator)) return;
  const refused = isOfflinePreview(window.location.hostname, window.self !== window.top, import.meta.env.PROD, new URLSearchParams(window.location.search).get("sw") === "off");
  if (refused) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.filter(registration => [registration.active, registration.waiting, registration.installing].some(worker => worker && new URL(worker.scriptURL).pathname === "/sw.js")).map(registration => registration.unregister()));
    return;
  }
  const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await registration.update();
}