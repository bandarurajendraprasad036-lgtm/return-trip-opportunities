import { supabase } from '@/integrations/supabase/client';

export async function signInAdministrator(email: string, password: string) {
  const result = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  if (result.error) throw result.error;
  const verified = await supabase.auth.getUser();
  if (verified.error || !verified.data.user) throw verified.error ?? new Error('SESSION_REQUIRED');
  const role = await supabase.rpc('has_role', { _user_id: verified.data.user.id, _role: 'admin' });
  if (role.error) throw role.error;
  if (!role.data) {
    await supabase.auth.signOut();
    throw new Error('ADMIN_ONLY');
  }
  return verified.data.user;
}

export function adminSignInError(error: unknown) {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : '';
  if (code === 'invalid_credentials') return 'ఈ ఖాతా పాస్‌వర్డ్ సరిపోలలేదు. కింద పాస్‌వర్డ్ మార్చే లింక్ పొందండి.';
  if (code === 'email_not_confirmed') return 'ఈమెయిల్ నిర్ధారణ పూర్తి చేయండి.';
  if (code === 'over_request_rate_limit') return 'ఎక్కువసార్లు ప్రయత్నించారు. కొద్దిసేపటి తర్వాత ప్రయత్నించండి.';
  if (error instanceof Error && error.message === 'ADMIN_ONLY') return 'ఈ ఖాతాకు అడ్మిన్ అనుమతి లేదు.';
  return 'ప్రవేశం తనిఖీ పూర్తి కాలేదు. మీ ఇంటర్నెట్ చూసి మళ్లీ ప్రయత్నించండి.';
}

export async function saveRecoveredPassword(password: string) {
  const result = await supabase.auth.updateUser({ password });
  if (result.error) throw result.error;
  // Prove the new password works before reporting success or leaving recovery.
  const email = result.data.user?.email;
  if (!email) throw new Error('EMAIL_REQUIRED');
  const check = await supabase.auth.signInWithPassword({ email, password });
  if (check.error || !check.data.user) throw check.error ?? new Error('PASSWORD_NOT_VERIFIED');
}