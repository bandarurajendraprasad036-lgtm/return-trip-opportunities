import { afterEach, expect, it, vi } from 'vitest';
import { freeWorkClientAction } from '@/lib/free-work-client';
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), getSession: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getSession: mocks.getSession }, rpc: mocks.rpc } }));
afterEach(() => vi.clearAllMocks());
it('a temporary account read failure does not claim a stored session is signed out', async () => {
  mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'member' } } } });
  mocks.rpc.mockResolvedValue({ data: null, error: new Error('Failed to fetch') });
  await expect(freeWorkClientAction({ data: { section: 'work-wanted', action: 'join' } })).rejects.toThrow('Failed to fetch');
});
it('a missing session still blocks private posting', async () => {
  mocks.getSession.mockResolvedValue({ data: { session: null } });
  await expect(freeWorkClientAction({ data: { section: 'work-wanted', action: 'join' } })).rejects.toThrow('SIGN_IN_REQUIRED');
  expect(mocks.rpc).not.toHaveBeenCalled();
});