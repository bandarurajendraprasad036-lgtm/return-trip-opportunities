import { Link, useCanGoBack, useLocation, useRouter } from '@tanstack/react-router';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Available outside account gates, including pages opened directly. */
export function PageReturnControls() {
  const { pathname } = useLocation();
  const router = useRouter();
  const canGoBack = useCanGoBack();
  if (pathname === '/' || pathname === '/auth/callback' || pathname === '/~oauth/initiate') return null;
  return <nav aria-label="తిరిగి వచ్చే ఎంపికలు" className="sticky top-0 z-30 mx-auto flex h-14 max-w-md items-center justify-between gap-3 border-b bg-background px-3 text-foreground">
    <Button type="button" variant="outline" className="min-h-11 gap-2" onClick={() => {
      if (canGoBack) router.history.back();
      else void router.navigate({ to: '/', replace: true });
    }}><ArrowLeft className="size-5" />వెనక్కి</Button>
    <Button asChild variant="outline" className="min-h-11 gap-2"><Link to="/"><Home className="size-5" />హోమ్</Link></Button>
  </nav>;
}