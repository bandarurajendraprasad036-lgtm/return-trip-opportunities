import { beforeEach, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ signInWithPassword: vi.fn(), getUser: vi.fn(), signOut: vi.fn(), updateUser: vi.fn(), rpc: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: mock, rpc: mock.rpc } }));
import { signInAdministrator, saveRecoveredPassword, adminSignInError } from '@/lib/admin-auth';
beforeEach(() => vi.resetAllMocks());
it('opens only the existing authenticated administrator, not an email assertion', async () => {
  mock.signInWithPassword.mockResolvedValue({ data: { user: { id: 'claimed' } }, error: null });
  mock.getUser.mockResolvedValue({ data: { user: { id: 'existing-admin' } }, error: null });
  mock.rpc.mockResolvedValue({ data: true, error: null });
  expect((await signInAdministrator('  Admin@Example.com ', 'new-password')).id).toBe('existing-admin');
  expect(mock.rpc).toHaveBeenCalledWith('has_role', { _user_id: 'existing-admin', _role: 'admin' });
});
it('does not grant administrator access to ordinary authenticated users', async () => {
  mock.signInWithPassword.mockResolvedValue({ error: null });
  mock.getUser.mockResolvedValue({ data: { user: { id: 'ordinary' } }, error: null });
  mock.rpc.mockResolvedValue({ data: false, error: null });
  await expect(signInAdministrator('user@example.com', 'password')).rejects.toThrow('ADMIN_ONLY');
  expect(mock.signOut).toHaveBeenCalledOnce();
});
it('checks the new password against authentication before reporting recovery success', async () => {
  mock.updateUser.mockResolvedValue({ data: { user: { email: 'existing@example.com' } }, error: null });
  mock.signInWithPassword.mockResolvedValue({ data: { user: { id: 'existing' } }, error: null });
  await saveRecoveredPassword('new-password');
  expect(mock.updateUser).toHaveBeenCalledWith({ password: 'new-password' });
  expect(mock.signInWithPassword).toHaveBeenCalledWith({ email: 'existing@example.com', password: 'new-password' });
});
it('does not report success when updating a password fails', async () => {
  mock.updateUser.mockResolvedValue({ error: new Error('expired') });
  await expect(saveRecoveredPassword('new-password')).rejects.toThrow('expired');
  expect(mock.signInWithPassword).not.toHaveBeenCalled();
});
it('does not label connection failures as wrong credentials', () => {
  expect(adminSignInError(new Error('network'))).not.toContain('పాస్‌వర్డ్ సరిపోలలేదు');
});