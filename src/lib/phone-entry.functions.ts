import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';

// The unguessable device secret, not the claimed phone, authorizes redemption.
export const redeemPhoneEntry = createServerFn({ method: 'POST' })
  .inputValidator((input: { secret: string }) => {
    if (!/^[a-f0-9]{64}$/.test(input.secret)) throw new Error('INVALID_DEVICE');
    return input;
  })
  .handler(async ({ data }) => {
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data.secret))), b => b.toString(16).padStart(2, '0')).join('');
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const request = await supabaseAdmin.from('phone_entry_requests').select('id,phone,status,account_id').eq('device_hash', hash).maybeSingle();
    if (request.error) throw new Error('REQUEST_UNAVAILABLE');
    if (!request.data || request.data.status !== 'approved') return { status: request.data?.status ?? 'pending', session: null };
    let account = request.data.account_id;
    if (!account) {
      // Never resolve existing accounts by phone. New approvals get isolated accounts.
      const email = `device-${request.data.id}@entry.gayatrione.com`;
      const created = await supabaseAdmin.auth.admin.createUser({ email, password: crypto.randomUUID() + crypto.randomUUID(), email_confirm: true, user_metadata: { phone: request.data.phone } });
      if (created.error || !created.data.user) {
        // Concurrent/retried creation resolves only this request's deterministic identity.
        const link = await supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email });
        if (link.error || !link.data.user) throw new Error('ENTRY_UNAVAILABLE');
        account = link.data.user.id;
      } else account = created.data.user.id;
      const saved = await supabaseAdmin.from('phone_entry_requests').update({ account_id: account }).eq('id', request.data.id).eq('status', 'approved');
      if (saved.error) throw new Error('ENTRY_UNAVAILABLE');
    }
    const user = await supabaseAdmin.auth.admin.getUserById(account);
    if (user.error || !user.data.user?.email) throw new Error('ENTRY_UNAVAILABLE');
    const link = await supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email: user.data.user.email });
    if (link.error || !link.data.properties?.hashed_token) throw new Error('ENTRY_UNAVAILABLE');
    const publicClient = createClient(process.env['SUPABASE_URL']!, process.env['SUPABASE_PUBLISHABLE_KEY']!, { auth: { persistSession: false, autoRefreshToken: false } });
    const verified = await publicClient.auth.verifyOtp({ token_hash: link.data.properties.hashed_token, type: 'magiclink' });
    if (verified.error || !verified.data.session) throw new Error('ENTRY_UNAVAILABLE');
    return { status: 'approved', session: { access_token: verified.data.session.access_token, refresh_token: verified.data.session.refresh_token } };
  });