import { supabase } from '@/integrations/supabase/client';
import { PROFILE_ACCESS_MESSAGE } from './profile-access';

export function bellErrorMessage(error: unknown) {
  const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : String(error);
  if (message.includes('PROFILE_REQUIRED')) return PROFILE_ACCESS_MESSAGE;
  if (message.includes('BELL_LIMIT_REACHED')) return '3 సార్లు అయ్యింది. ఇంకా కొట్టాలంటే మెంబర్షిప్ తీసుకోండి';
  if (message.includes('SERVICE_PLAN_ONLY')) return 'వాహన గంట, సంభాషణ కోసం ₹100 నెల చందా తీసుకోండి';
  if (message.includes('PAID_BELL_REQUIRED')) return 'ఈ ఎంపికకు చందా అవసరం';
  if (message.includes('SIGN_IN_REQUIRED')) return 'ముందుగా మీ ఖాతాలో ప్రవేశించి వివరాలు నింపండి';
  return 'గంట అభ్యర్థన నిలవలేదు. ఇంటర్నెట్ వచ్చిన తర్వాత మళ్లీ నొక్కండి; చేరినట్లు ఇంకా నిర్ధారణ లేదు';
}

export function retryableBellError(error: unknown) {
  const value = error as { code?: string; message?: string; status?: number } | null;
  return value?.status === 429 || (value?.status ?? 0) >= 500 || ['40001', '40P01', '57014'].includes(value?.code ?? '') || /fetch|network|timeout|Failed to fetch/i.test(value?.message ?? '');
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

export async function requireCompleteProfile() {
  const result = await supabase.rpc('my_profile_access_ready');
  if (result.error) throw result.error;
  if (!result.data) throw new Error('PROFILE_REQUIRED');
}