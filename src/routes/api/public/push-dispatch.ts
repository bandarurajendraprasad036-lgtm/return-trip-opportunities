import { createFileRoute } from '@tanstack/react-router';
import { authenticateCronRequest } from '@/integrations/supabase/cron-auth';

export const Route = createFileRoute('/api/public/push-dispatch')({ server: { handlers: {
  POST: async ({ request }) => {
    const denied = await authenticateCronRequest(request);
    if (denied) return denied;
    const { dispatchPush } = await import('@/lib/push-dispatch.server');
    return Response.json(await dispatchPush());
  },
} } });