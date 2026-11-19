import { createFileRoute, Link } from '@tanstack/react-router';
import { AboutVideos } from '@/components/AboutVideos';
import { Brand } from '@/components/Brand';
import { Button } from '@/components/ui/button';
import { LanguageButton } from '@/components/LanguageButton';

export const Route = createFileRoute('/about')({
  head: () => ({ meta: [
    { title: 'మా గురించి వీడియోలు — గాయత్రి వన్' },
    { name: 'description', content: 'గాయత్రి వన్ నిర్వాహకులు అందించిన పరిచయ వీడియోలు.' },
    { property: 'og:title', content: 'మా గురించి వీడియోలు — గాయత్రి వన్' },
    { property: 'og:description', content: 'గాయత్రి వన్ నిర్వాహకులు అందించిన పరిచయ వీడియోలు.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }),
  component: () => <main className="mx-auto min-h-screen max-w-md space-y-5 p-4"><header className="flex items-center justify-between gap-2"><Brand /><LanguageButton /></header><h1 className="text-2xl font-bold">మా గురించి</h1><AboutVideos /><Button asChild variant="outline" className="min-h-12 w-full"><Link to="/">ముఖ్య పేజీ</Link></Button></main>,
});