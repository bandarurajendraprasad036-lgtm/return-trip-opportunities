export type AdminPerson = { id: string; full_name: string; phone: string; location: string };
export type AdminPayment = { user_id: string; reference: string; amount: number; status: string; reviewed_at: string | null; submitted_at: string; source: string };
export type AdminAccess = { user_id: string; starts_at: string; ends_at: string; revoked_at: string | null };

export function summarizeAdminPayments(people: AdminPerson[], payments: AdminPayment[], access: AdminAccess[], now: Date) {
  const approved = payments.filter(p => p.status === 'approved');
  // Evidence and legacy payment paths can refer to the same receipt.
  const receipts = [...new Map(approved.map(p => [`${p.user_id}:${p.reference || `${p.source}:${p.submitted_at}`}`, p])).values()];
  const current = (a: AdminAccess) => !a.revoked_at && Date.parse(a.starts_at) <= now.getTime() && Date.parse(a.ends_at) > now.getTime();
  const members = people.map(person => {
    const records = payments.filter(p => p.user_id === person.id && p.amount === 100);
    const paid = records.some(p => p.status === 'approved');
    const active = access.filter(a => a.user_id === person.id && current(a));
    const expires = active.map(a => a.ends_at).sort().at(-1) ?? null;
    return { ...person, paid, active: active.length > 0, expires, pending: records.some(p => p.status === 'pending'), rejected: records.some(p => p.status === 'rejected') };
  });
  return { members, revenue: receipts.reduce((sum, p) => sum + p.amount, 0), paid100: members.filter(p => p.paid).length, pending100: members.filter(p => p.pending).length, active: members.filter(p => p.active).length };
}