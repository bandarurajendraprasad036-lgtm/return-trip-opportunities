export type CommunicationChoices = { bell: boolean; voice: boolean; video: boolean };
export const DEFAULT_COMMUNICATION_CHOICES: CommunicationChoices = { bell: true, voice: true, video: true };
export function changeCommunication(choices: CommunicationChoices, kind: keyof CommunicationChoices, enabled: boolean): CommunicationChoices | null {
  const next = { ...choices, [kind]: enabled };
  return next.bell || next.voice || next.video ? next : null;
}
export function dashboardSurface(path: string) { return path === '/dashboard' || path === '/admin'; }
export const COMMUNICATION_EVENT = 'gayatri-communication-choices';
export function readCommunicationChoices(owner: string): CommunicationChoices {
  try {
    const stored = JSON.parse(localStorage.getItem(`gayatri-communications:${owner}`) ?? 'null');
    if (stored && ['bell', 'voice', 'video'].every(k => typeof stored[k] === 'boolean') && (stored.bell || stored.voice || stored.video)) return stored;
  } catch { /* Invalid preference cannot disable every channel. */ }
  return { ...DEFAULT_COMMUNICATION_CHOICES };
}
export function saveCommunicationChoices(owner: string, choices: CommunicationChoices) {
  if (!choices.bell && !choices.voice && !choices.video) return false;
  try { localStorage.setItem(`gayatri-communications:${owner}`, JSON.stringify(choices)); } catch { return false; }
  window.dispatchEvent(new Event(COMMUNICATION_EVENT));
  return true;
}