import { supabase } from '@/integrations/supabase/client';
import { summarizeAdminPayments, type AdminPayment } from './admin-overview';
type AdminVehicle = { id: string; user_id: string; vehicle_type: string | null; vehicle_name: string; vehicle_number: string; driver_name: string; contact_phone: string | null; from_place: string | null; to_place: string | null; trip_date: string | null; status: string; created_at: string };

export async function loadAdminOverview() {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('ADMIN_ONLY');
  const role = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
  if (role.error || !role.data) throw new Error('ADMIN_ONLY');
  async function all<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
    const rows: T[] = [];
    for (let from = 0; ; from += 500) {
      const page = await fetchPage(from, from + 499);
      if (page.error) throw page.error;
      rows.push(...(page.data ?? []));
      if (!page.data || page.data.length < 500) return rows;
    }
  }
  const [people, requests, prime, historical, access, vehicles, programs] = await Promise.all([
    all((from, to) => supabase.from('profiles').select('id,full_name,phone,location').order('id').range(from, to)),
    all((from, to) => supabase.from('membership_requests').select('id,user_id,reference,amount,status,reviewed_at,submitted_at').order('id').range(from, to)),
    all((from, to) => supabase.from('prime99_payments').select('id,user_id,reference,payable_amount,status,received_at,submitted_at,ends_at').eq('payment_purpose', 'membership').order('id').range(from, to)),
    all((from, to) => supabase.from('membership_payments').select('id,user_id,transaction_id,amount,status,reviewed_at,created_at').order('id').range(from, to)),
    all((from, to) => supabase.from('membership_access').select('id,user_id,starts_at,ends_at,revoked_at').order('id').range(from, to)),
    all<AdminVehicle>(async (from) => { const result = await supabase.rpc('admin_vehicle_records', { _offset: from }); return { data: Array.isArray(result.data) ? result.data as AdminVehicle[] : [], error: result.error }; }),
    all((from, to) => supabase.from('account_programs').select('user_id,occupation,category,member_kind').order('user_id').range(from, to)),
  ]);
  const payments: AdminPayment[] = [
    ...requests.map(p => ({ ...p, source: 'evidence' })),
    ...prime.map(p => ({ ...p, amount: p.payable_amount, reviewed_at: p.received_at, source: 'prime' })),
    ...historical.map(p => ({ ...p, reference: p.transaction_id, submitted_at: p.created_at, source: 'historical' })),
  ];
  const periods = [...access, ...prime.filter(p => p.status === 'approved' && p.payable_amount === 100 && p.received_at && p.ends_at).map(p => ({ user_id: p.user_id, starts_at: p.received_at ?? '', ends_at: p.ends_at ?? '', revoked_at: null }))];
  const now = new Date();
  const programByUser = new Map(programs.map(program => [program.user_id, program]));
  return { ...summarizeAdminPayments(people.map(person => ({ ...person, ...programByUser.get(person.id) })), payments, periods, now), vehicles, loadedAt: now.toISOString() };
}