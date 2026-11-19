import { supabase } from '@/integrations/supabase/client';
import { PROFILE_ACCESS_MESSAGE } from './profile-access';
import { SUBSCRIPTION_MESSAGE, showSubscriptionNotice } from './subscription-access';

export const BELL_LIMIT_MESSAGE = '3 సార్లు అయ్యింది. ఇంకా కొట్టాలంటే మెంబర్షిప్ తీసుకోండి';
export const OWN_POST_MESSAGE = 'ఇది మీ సొంత ప్రకటన. మీ గంట మీకే వెళ్ళదు; వేరే వాళ్ళ ప్రకటనకు గంట కొట్టండి';
export const SIGN_IN_MESSAGE = 'ముందుగా మీ ఖాతాలో ప్రవేశించండి';
export const NETWORK_MESSAGE = 'సర్వర్‌కు చేరలేదు. కొద్దిసేపటి తర్వాత మళ్లీ నొక్కండి';

function errorText(error: unknown) {
  return error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : String(error ?? '');
}

/** A genuine transport failure (no answer from the server). Never decided by navigator.onLine. */
export function isNetworkFailure(error: unknown) {
  const value = error as { status?: number; code?: string } | null;
  if (value && typeof value === 'object' && (value.code || (value.status ?? 0) > 0)) return false;
  return /Failed to fetch|network|Load failed|fetch failed|timeout/i.test(errorText(error));
}

export function bellErrorMessage(error: unknown) {
  const message = errorText(error);
  if (message.includes('PROFILE_REQUIRED')) return PROFILE_ACCESS_MESSAGE;
  if (message.includes('BELL_LIMIT_REACHED')) return BELL_LIMIT_MESSAGE;
  if (/SUBSCRIPTION_REQUIRED|PAID_BELL_REQUIRED|GOODS_MEMBERSHIP_REQUIRED|SERVICE_PLAN_ONLY/.test(message)) { showSubscriptionNotice(); return SUBSCRIPTION_MESSAGE; }
  if (message.includes('SIGN_IN_REQUIRED') || message.includes('JWT') || message.includes('AuthSessionMissing')) return SIGN_IN_MESSAGE;
  if (message.includes('OWN_POST')) return OWN_POST_MESSAGE;
  if (message.includes('POST_UNAVAILABLE') || message.includes('ENTRY_UNAVAILABLE')) return 'ఇది మీ సొంత ప్రకటన లేదా ఈ ప్రకటన గడువు ముగిసింది. వేరే ప్రకటనకు గంట కొట్టండి';
  if (message.includes('VEHICLE_ROUTE_REQUIRED')) return 'ఎక్కడి నుంచి, ఎక్కడికి, వాహన రకం — మూడూ ఇవ్వండి';
  if (message.includes('ROUTE') && message.includes('TYPE')) return 'ప్రొఫైల్‌లో మీ రూట్, వాహన రకం ఎంచుకోండి';
  if (isNetworkFailure(error)) return NETWORK_MESSAGE;
  return 'గంట నమోదు కాలేదు. మళ్లీ నొక్కండి';
}

export function retryableBellError(error: unknown) {
  const value = error as { code?: string; message?: string; status?: number } | null;
  return value?.status === 429 || (value?.status ?? 0) >= 500 || ['40001', '40P01', '57014'].includes(value?.code ?? '') || isNetworkFailure(error);
}

export async function retryBell<T>(operation: () => PromiseLike<{ data: T; error: unknown }>, pause = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))) {
  for (let attempt = 0; ; attempt++) {
    let result: { data: T; error: unknown };
    try { result = await operation(); } catch (error) { result = { data: null as T, error }; }
    if (!result.error) return result;
    if (attempt >= 2 || !retryableBellError(result.error)) throw result.error;
    await pause(750 * 2 ** attempt);
  }
}

/** Signed-in user from the locally stored session; no extra network round trip that could fail. */
export async function signedInUserId() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function requireCompleteProfile() {
  if (!await signedInUserId()) throw new Error('SIGN_IN_REQUIRED');
  const result = await retryBell(() => supabase.rpc('my_profile_access_ready'));
  if (!result.data) throw new Error('PROFILE_REQUIRED');
}
