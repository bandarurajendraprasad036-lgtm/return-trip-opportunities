import { phoneToEmail } from '@/lib/match';

export const PASSWORD_MIN = 6;
/** Both password boxes must match and be long enough before anything is saved. */
export function passwordPairError(first: string, second: string) {
  if (first.length < PASSWORD_MIN) return `పాస్వర్డ్ కనీసం ${PASSWORD_MIN} అక్షరాలు ఉండాలి`;
  if (first !== second) return 'రెండు పాస్వర్డ్‌లు ఒకేలా లేవు. మళ్ళీ కొట్టండి';
  return '';
}
export function loginEmailForPhone(phone: string) { return phoneToEmail(phone); }
export const PIN_LENGTH = 4;
/** A 4-digit PIN is stretched into the stored credential; older full passwords still work at login. */
export function pinCredential(pin: string) { return `gayatri-pin-${pin}`; }
export function pinPairError(first: string, second: string) {
  if (!/^\d{4}$/.test(first)) return '4 అంకెల పిన్ ఇవ్వండి';
  if (first !== second) return 'రెండు పిన్‌లు ఒకేలా లేవు. మళ్ళీ కొట్టండి';
  return '';
}
