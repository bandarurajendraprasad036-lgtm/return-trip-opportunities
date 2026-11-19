import { expect, it } from 'vitest';
import { aboutVideoSource, parseAboutVideos } from '@/lib/about-videos';

it('preserves the old single video and supports multiple admin videos and removal', () => {
  const first = { url: 'https://youtu.be/abcdefghijk', title: 'first' };
  const second = { url: 'https://www.youtube.com/watch?v=lmnopqrstuv', title: 'second' };
  expect(parseAboutVideos(first.url)).toHaveLength(1);
  const stored = parseAboutVideos(JSON.stringify([first, second]));
  expect(stored.map(row => row.url)).toEqual([first.url, second.url]);
  expect(parseAboutVideos(JSON.stringify(stored.filter(row => row.url !== first.url)))).toEqual([second]);
});
it('rejects unsafe embeds and deduplicates the same video', () => {
  for (const url of ['javascript:alert(1)', 'http://youtu.be/abcdefghijk', 'https://youtube.com.evil.example/embed/abcdefghijk', 'https://example.com/page']) expect(aboutVideoSource(url)).toBeNull();
  expect(parseAboutVideos(JSON.stringify([{ url: 'https://youtu.be/abcdefghijk' }, { url: 'https://youtube.com/watch?v=abcdefghijk' }]))).toHaveLength(1);
  expect(aboutVideoSource('https://example.com/video.mp4')?.kind).toBe('file');
});