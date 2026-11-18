// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ me: null as null | { id: string; profile: { referral_code: string } }, pending: false, error: false, login: vi.fn() }));
vi.mock('@/lib/session', () => ({ useMe: () => ({ data: state.me, isPending: state.pending, isError: state.error, refetch: vi.fn() }) }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));
vi.mock('@tanstack/react-start', () => ({ useServerFn: () => vi.fn() }));
vi.mock('@tanstack/react-router', () => ({ Link: ({ children }: {children: React.ReactNode}) => <a>{children}</a> }));
vi.mock('@/components/GoogleSignIn', () => ({ GoogleSignIn: (props: unknown) => { state.login(props); return <div data-testid="login"/>; } }));
vi.mock('@/lib/firebase-push', () => ({ enablePush: async () => ({ status: 'unsupported' }), pushDeviceId: vi.fn(), deviceSound: vi.fn() }));
vi.mock('@/lib/push-client', () => ({ registerPushDevice: vi.fn() }));
vi.mock('@/lib/bell-activation', () => ({ markAccountBellActivated: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ upsert: async () => ({ error: null }) }), rpc: vi.fn() } }));
vi.mock('@/lib/share-referral', () => ({ shareReferralWithImage: vi.fn() }));
import { BellJoin } from '@/components/BellJoin';
beforeEach(() => { state.me=null; state.pending=false; state.error=false; state.login.mockClear(); localStorage.clear(); window.history.replaceState(null,'','/'); window.matchMedia=vi.fn().mockReturnValue({matches:false}); });
afterEach(cleanup);
describe('home bell account identity', () => {
  it('does not request sign-in while account lookup is unfinished', () => {
    state.pending=true; render(<BellJoin/>); fireEvent.click(screen.getByRole('button',{name:/Ring the bell/}));
    expect(state.login).not.toHaveBeenCalled();
  });
  it('does not request sign-in when account lookup fails', () => {
    state.error=true; render(<BellJoin/>); fireEvent.click(screen.getByRole('button',{name:/Ring the bell/}));
    expect(state.login).not.toHaveBeenCalled();
  });
  it('shows the real owner referral identity on every bell opening without login', () => {
    state.me={id:'owner',profile:{referral_code:'OWN123'}}; render(<BellJoin/>);
    for(let i=0;i<2;i++){fireEvent.click(screen.getByRole('button',{name:/Ring the bell/}));expect(screen.getByText('OWN123')).toBeTruthy();expect(state.login).not.toHaveBeenCalled();fireEvent.keyDown(screen.getByRole('dialog'),{key:'Escape'});}
  });
  it('resumes the referral dialog after authenticated bell sign-in', () => {
    window.history.replaceState(null,'','/#bell-referral'); state.me={id:'owner',profile:{referral_code:'OWN123'}}; render(<BellJoin/>);
    expect(screen.getByText('OWN123')).toBeTruthy(); expect(state.login).not.toHaveBeenCalled(); expect(window.location.hash).toBe('');
  });
  it('only confirmed signed-out visitors get login with a return to the bell', () => {
    render(<BellJoin/>); fireEvent.click(screen.getByRole('button',{name:/Ring the bell/}));
    expect(state.login).toHaveBeenCalledWith({returnTo:'/#bell-referral'});
  });
});