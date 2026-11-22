import { createFileRoute } from '@tanstack/react-router';
import { AccountProfile } from '@/components/AccountProfile';

export const Route = createFileRoute('/_authenticated/my-details')({
  head: () => ({ meta: [
    { title: 'మీ వివరాలు ఇవ్వండి | గాయత్రి వన్' },
    { name: 'description', content: 'మీ పేరు, ఊరు, వాహనం వివరాలు నింపండి.' },
    { property: 'og:title', content: 'మీ వివరాలు ఇవ్వండి | గాయత్రి వన్' },
    { property: 'og:description', content: 'మీ పేరు, ఊరు, వాహనం వివరాలు నింపండి.' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: () => <main className="mx-auto max-w-2xl p-4 space-y-3"><h1 className="text-2xl font-bold">మీ వివరాలు ఇవ్వండి</h1><p className="text-base">ఊరు పేరు తప్పనిసరి. వాహనం ఉంటే రూట్, ఏ వాహనం, ఎన్ని టన్నులు తప్పనిసరి. మిగతావి వదిలేసినా పరవాలేదు.</p><AccountProfile /></main>,
});
