const RETURN_KEY = 'gayatri-auth-return';
const PUBLIC_BROKER = 'https://project--2c06ad9b-f779-5a1b-a09a-0d4125404c28.lovable.app/~oauth/initiate';
const RETURN_PATHS = new Set(['/', '/feed', '/post/new', '/vehicles', '/work', '/services', '/bell-board', '/dashboard', '/my-posts', '/notifications']);

export function safeAuthReturn(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null;
  const parsed = new URL(value, 'https://app.invalid');
  if (parsed.origin !== 'https://app.invalid' || !RETURN_PATHS.has(parsed.pathname)) return null;
  return parsed.pathname + parsed.search + parsed.hash;
}

export function rememberAuthReturn(href: string) {
  const safe = safeAuthReturn(href);
  if (safe) sessionStorage.setItem(RETURN_KEY, safe);
}

export function takeAuthReturn(fallback: '/' | '/feed' | '/admin-login'): string {
  const saved = sessionStorage.getItem(RETURN_KEY);
  sessionStorage.removeItem(RETURN_KEY);
  return fallback === '/admin-login' ? fallback : safeAuthReturn(saved) ?? fallback;
}

/** The immutable managed host intercepts this URL even on externally hosted domains. */
export function managedBrokerReturn(search: string, origin: string): string | null {
  const params = new URLSearchParams(search);
  const redirect = params.get('redirect_uri');
  const state = params.get('state');
  if (params.get('provider') !== 'google' || !redirect || !state || state.length > 256) return null;
  let callback: URL;
  try { callback = new URL(redirect); } catch { return null; }
  if (callback.origin !== origin || callback.pathname !== '/auth/callback' || callback.search || callback.hash) return null;
  const target = new URL(PUBLIC_BROKER);
  for (const key of ['provider', 'redirect_uri', 'state', 'response_mode', 'prompt', 'login_hint', 'hd']) {
    const value = params.get(key);
    if (value && value.length <= 2048) target.searchParams.set(key, value);
  }
  return target.href;
}