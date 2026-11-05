import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BellPhoneRequest } from '@/components/BellPhoneRequest';

const mocks = vi.hoisted(() => ({
  single: vi.fn(), update: vi.fn(), eq: vi.fn(), enable: vi.fn(), register: vi.fn(), rpc: vi.fn(),
}));
vi.mock('@/lib/session', () => ({ useMe: () => ({ data: { id: 'owner', profile: { phone: '9876543210' } } }) }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));
vi.mock('@tanstack/react-start', () => ({ useServerFn: () => mocks.register }));
vi.mock('@/lib/push.functions', () => ({ registerPushDevice: vi.fn() }));
vi.mock('@/lib/firebase-push', () => ({ enablePush: mocks.enable, pushDeviceId: () => 'device', deviceSound: () => true }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  from: () => ({ update: mocks.update }), rpc: mocks.rpc,
} }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });
function setup(savedPhone = '9876543210') {
  mocks.update.mockReturnValue({ eq: mocks.eq });
  mocks.eq.mockReturnValue({ select: () => ({ single: mocks.single }) });
  mocks.single.mockResolvedValue({ data: { phone: savedPhone }, error: null });
  mocks.enable.mockResolvedValue({ status: 'unsupported' });
  render(<BellPhoneRequest />);
}
describe('single explicit bell notification request', () => {
  it('saves the mobile against the account without a separate consent step even when device push is unavailable', async () => {
    setup();
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Mobile saved'));
    expect(mocks.update).toHaveBeenCalledWith({ phone: '9876543210' });
    expect(mocks.eq).toHaveBeenCalledWith('id', 'owner');
    expect(mocks.single).toHaveBeenCalledTimes(1);
    expect(mocks.enable).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('does not register or request a notice when the saved mobile does not read back', async () => {
    setup('9876543211');
    mocks.enable.mockResolvedValue({ status: 'registered', token: 'test-token' });
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Mobile not saved'));
    expect(mocks.register).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});