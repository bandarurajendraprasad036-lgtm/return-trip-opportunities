import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAccountProgram } from '@/lib/use-account-program';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
export function MembershipReminder({ userId }: { userId: string; prime: boolean }) {
  const { data: program } = useAccountProgram(userId); const qc = useQueryClient();
  if (!program || program.sharing_active || !program.reminder_consent) return null;
  return <section className="mx-4 flex items-center justify-between gap-3 border-y py-3 text-sm"><p>సభ్యత్వ రిమైండర్లు ప్రారంభించారు · Membership reminders on</p><Button size="sm" variant="outline" onClick={async () => { const result = await supabase.rpc('set_program_reminders', { _enabled: false }); if (result.error) toast.error('ఎంపిక భద్రపడలేదు · Could not save'); else await qc.invalidateQueries({ queryKey: ['account-program'] }); }}>నిలిపివేయండి · Stop</Button></section>;
}
