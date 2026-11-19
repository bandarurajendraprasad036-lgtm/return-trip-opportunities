export type AboutVideo = { url: string; title: string };

export function aboutVideoSource(value: string): { kind: 'youtube' | 'file'; src: string } | null {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(host)) {
      const id = host === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v') ?? url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
      return id && /^[\w-]{11}$/.test(id) ? { kind: 'youtube', src: `https://www.youtube.com/embed/${id}` } : null;
    }
    if (/\.(mp4|webm)$/i.test(url.pathname)) return { kind: 'file', src: url.href };
    return null;
  } catch { return null; }
}

export function parseAboutVideos(value: string): AboutVideo[] {
  if (!value.trim()) return [];
  let rows: unknown;
  try { rows = JSON.parse(value); } catch { rows = [{ url: value, title: 'గాయత్రి వన్ గురించి' }]; }
  if (!Array.isArray(rows)) return [];
  const seen = new Set<string>();
  return rows.flatMap((row: unknown) => {
    if (!row || typeof row !== 'object' || !('url' in row) || typeof row.url !== 'string') return [];
    const source = aboutVideoSource(row.url);
    if (!source || seen.has(source.src)) return [];
    seen.add(source.src);
    return [{ url: row.url, title: 'title' in row && typeof row.title === 'string' ? row.title.slice(0, 120) : 'గాయత్రి వన్ గురించి' }];
  });
}