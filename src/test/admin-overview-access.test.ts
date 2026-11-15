import { expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn(), from: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getUser: mock.getUser }, rpc: mock.rpc, from: mock.from } }));
import { loadAdminOverview } from '@/lib/admin-overview-client';
it('does not fetch private records for a signed-out account', async () => {
  mock.from.mockClear(); mock.rpc.mockClear();
  mock.getUser.mockResolvedValue({ data: { user: null }, error: null });
  await expect(loadAdminOverview()).rejects.toThrow('ADMIN_ONLY');
  expect(mock.rpc).not.toHaveBeenCalled(); expect(mock.from).not.toHaveBeenCalled();
});
it('does not fetch private records for a non-admin account', async () => {
  mock.from.mockClear();
  mock.getUser.mockResolvedValue({ data: { user: { id: 'ordinary' } }, error: null });
  mock.rpc.mockResolvedValue({ data: false, error: null });
  await expect(loadAdminOverview()).rejects.toThrow('ADMIN_ONLY');
  expect(mock.from).not.toHaveBeenCalled();
});