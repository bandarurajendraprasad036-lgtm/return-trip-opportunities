import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAccountProgram } from '@/lib/use-account-program';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
export function MembershipReminder({ userId }: { userId: string; prime: boolean }) {
  const { data: program } = useAccountProgram(userId); const qc = useQueryClient();
  if (!program || program.sharing_active) return null;
  return <section className="mx-4 space-y-2 border-y py-3 text-sm"><label className="flex gap-2"><input type="checkbox" checked={program.reminder_consent} onChange={async e => { const result = await supabase.rpc('set_program_reminders', { _enabled: e.target.checked }); if (result.error) toast.error('ఎంపిక భద్రపడలేదు · Could not save'); else await qc.invalidateQueries({ queryKey: ['account-program'] }); }} />పది రోజుల తర్వాత రోజుకు ఒక సభ్యత్వ అభ్యర్థన, నాలుగు రోజులు మాత్రమే అందుకోవడానికి అనుమతి · Allow four daily membership reminders after day ten</label>{program.reminder_consent && <Button size="sm" variant="outline" onClick={async () => { const result = await supabase.rpc('set_program_reminders', { _enabled: false }); if (!result.error) await qc.invalidateQueries({ queryKey: ['account-program'] }); }}>నిలిపివేయండి · Stop</Button>}</section>;
}
