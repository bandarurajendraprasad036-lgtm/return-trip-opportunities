import { createFileRoute } from '@tanstack/react-router';
import { AppShell } from '@/components/AppShell';
import { ReelBattles } from '@/components/ReelBattles';

export const Route = createFileRoute('/reels-battle')({
  head: () => ({ meta: [
    { title: 'వీడియోల పోటీ · Reels Battle — Gayatri One' },
    { name: 'description', content: 'Watch two videos and vote for your favourite in Gayatri One reels battles.' },
    { property: 'og:title', content: 'Reels Battle — Gayatri One' },
    { property: 'og:description', content: 'Vote for your favourite video and see live vote totals.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: () => <AppShell><ReelBattles /></AppShell>,
});