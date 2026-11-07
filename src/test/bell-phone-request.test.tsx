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
describe('phone-free explicit bell notification request', () => {
  it('does not change the mobile or register a device when push is unavailable', async () => {
    setup();
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(mocks.enable).toHaveBeenCalledTimes(1));
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.enable).toHaveBeenCalledTimes(1);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('registers by device token without profile-mobile writes', async () => {
    setup('9876543211');
    mocks.enable.mockResolvedValue({ status: 'registered', token: 'test-token' });
    fireEvent.click(screen.getByRole('button'));
    mocks.register.mockResolvedValue({}); mocks.rpc.mockResolvedValue({data:'notice',error:null});
    await waitFor(() => expect(mocks.register).toHaveBeenCalledWith({data:{id:'device',token:'test-token',sound:true}}));
    expect(mocks.update).not.toHaveBeenCalled();
    await waitFor(() => expect(mocks.rpc).toHaveBeenCalledWith('request_own_bell_notice',{_device:'device'}));
  });
});