import { createFileRoute } from '@tanstack/react-router';
import { AppShell } from '@/components/AppShell';
import { ReelsFeed } from '@/components/ReelsFeed';

export const Route = createFileRoute('/reels')({
  head: () => ({ meta: [
    { title: 'చిన్న వీడియోలు · Reels — Gayatri One' },
    { name: 'description', content: 'Watch and share published short videos on Gayatri One.' },
    { property: 'og:title', content: 'Reels — Gayatri One' },
    { property: 'og:description', content: 'Watch short videos, like them and join the conversation.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: () => <AppShell><div className="px-4"><ReelsFeed /></div></AppShell>,
});