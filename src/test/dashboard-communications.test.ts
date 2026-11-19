import { describe, expect, it } from 'vitest';
import { changeCommunication, DEFAULT_COMMUNICATION_CHOICES, dashboardSurface, readCommunicationChoices, saveCommunicationChoices } from '@/lib/dashboard-communications';
describe('dashboard communication rules', () => {
  it('refuses to block the last of bell, voice and video', () => {
    for (const kind of ['bell', 'voice', 'video'] as const) {
      expect(changeCommunication({ bell: kind === 'bell', voice: kind === 'voice', video: kind === 'video' }, kind, false)).toBeNull();
    }
  });
  it('permits two blocked channels when one remains open', () => {
    expect(changeCommunication({ bell: false, voice: false, video: true }, 'voice', true)).toEqual({ bell: false, voice: true, video: true });
  });
  it('keeps dashboard controls off public and profile surfaces', () => {
    expect(dashboardSurface('/dashboard')).toBe(true);
    expect(dashboardSurface('/')).toBe(false);
    expect(dashboardSurface('/feed')).toBe(false);
    expect(dashboardSurface('/service-profile')).toBe(false);
  });
  it('isolates choices by owner and rejects all-off persistence', () => {
    expect(saveCommunicationChoices('test-a', { bell: true, voice: false, video: false })).toBe(true);
    expect(readCommunicationChoices('test-a')).toEqual({ bell: true, voice: false, video: false });
    expect(readCommunicationChoices('test-b')).toEqual(DEFAULT_COMMUNICATION_CHOICES);
    expect(saveCommunicationChoices('test-a', { bell: false, voice: false, video: false })).toBe(false);
  });
});