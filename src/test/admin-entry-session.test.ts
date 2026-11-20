import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), getUser: vi.fn(), from: vi.fn() }));
vi.mock('@tanstack/react-query', () => ({ useQuery: (options: { queryFn: () => Promise<unknown> }) => options.queryFn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { getSession: mocks.getSession, getUser: mocks.getUser }, from: mocks.from } }));
import { useMe } from '@/lib/session';

beforeEach(() => {
  mocks.getUser.mockReset(); mocks.from.mockReset();
  mocks.getSession.mockReset();
  mocks.getSession.mockImplementation(async () => {
    const result = await mocks.getUser();
    return { data: { session: result.data.user ? { user: result.data.user } : null } };
  });
  mocks.from.mockImplementation((table: string) => {
    const value = table === 'user_roles' ? [{ role: 'user' }] : null;
    const result = { data: value, error: null };
    const chain = { select: () => chain, eq: () => chain, maybeSingle: async () => result, then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve) };
    return chain;
  });
});

it('signed-out visitors have no admin account state', async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
  expect(await useMe()).toBeNull();
  expect(mocks.from).not.toHaveBeenCalled();
});

it('ordinary users cannot gain admin state from editable account metadata', async () => {
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'ordinary', user_metadata: { isAdmin: true } } }, error: null });
  expect(await useMe()).toMatchObject({ isAdmin: false });
});

it('existing administrator role provides admin account state', async () => {
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'admin' } }, error: null });
  mocks.from.mockImplementation((table: string) => {
    const result = { data: table === 'user_roles' ? [{ role: 'admin' }] : null, error: null };
    const chain = { select: () => chain, eq: () => chain, maybeSingle: async () => result, then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve) };
    return chain;
  });
  expect(await useMe()).toMatchObject({ isAdmin: true });
});