// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('sonner', () => ({ toast }));
vi.mock('@/lib/session', () => ({ useMe: () => ({ data: { id: 'owner', profile: { referral_code: 'OWN1' } }, isPending: false, isError: false, refetch: vi.fn() }) }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));
vi.mock('@tanstack/react-start', () => ({ useServerFn: () => vi.fn() }));
vi.mock('@tanstack/react-router', () => ({ Link: ({ children }: {children: React.ReactNode}) => <a>{children}</a> }));
vi.mock('@/components/GoogleSignIn', () => ({ GoogleSignIn: () => null }));
vi.mock('@/lib/firebase-push', () => ({ enablePush: async () => { throw new Error('registration failed'); }, pushDeviceId: vi.fn(), deviceSound: vi.fn() }));
vi.mock('@/lib/push-client', () => ({ registerPushDevice: vi.fn() }));
vi.mock('@/lib/bell-request', () => ({ requireCompleteProfile: vi.fn().mockResolvedValue(undefined), retryBell: (action: () => Promise<unknown>) => action(), bellErrorMessage: () => 'గంట పనిచేయలేదు' }));
vi.mock('@/lib/bell-activation', () => ({ markAccountBellActivated: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ upsert: async () => ({ error: null }) }), rpc: vi.fn(async () => ({ data: null, error: null })) } }));
vi.mock('@/lib/share-referral', () => ({ shareReferralWithImage: vi.fn() }));
import { BellJoin } from '@/components/BellJoin';
afterEach(cleanup);
describe('home bell single status', () => {
  it('granted permission shows only the green notice even when background registration fails', async () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    vi.stubGlobal('Notification', { permission: 'granted', requestPermission: vi.fn() });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(<BellJoin/>);
    fireEvent.click(screen.getByRole('button', { name: /Ring the bell/ }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('నోటిఫికేషన్ ఆన్ అయింది', expect.anything()));
    await new Promise(r => setTimeout(r, 20));
    expect(toast.error).not.toHaveBeenCalled();
    expect(Notification.requestPermission).not.toHaveBeenCalled();
    expect(localStorage.getItem('gayatri-bell-status')).toBe('granted');
  });
});
