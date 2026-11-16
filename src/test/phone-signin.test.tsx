import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PhoneSignIn } from '@/components/PhoneSignIn';

const mocks = vi.hoisted(() => ({ request: vi.fn(), redeem: vi.fn(), session: vi.fn(), navigate: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { rpc: mocks.request, auth: { setSession: mocks.session } } }));
vi.mock('@tanstack/react-start', () => ({ useServerFn: () => mocks.redeem }));
vi.mock('@/lib/phone-entry.functions', () => ({ redeemPhoneEntry: vi.fn() }));
vi.mock('@/lib/phone-entry', () => ({ phoneDeviceIdentity: async () => ({ secret: 'a'.repeat(64), hash: 'b'.repeat(64) }) }));
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('phone sign-in', () => {
  it('starts empty, remains editable and clears the entered number', () => {
    render(<PhoneSignIn />);
    const input = screen.getByLabelText('వాట్సాప్ మొబైల్ నంబరు');
    expect(input).toHaveValue('');
    fireEvent.change(input, { target: { value: '98765 43210' } });
    expect(input).toHaveValue('9876543210');
    fireEvent.click(screen.getByRole('button', { name: 'తుడిచేయండి' }));
    expect(input).toHaveValue('');
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it('phone submission and pending approval never open an existing account', async () => {
    mocks.request.mockResolvedValue({ error: null });
    mocks.redeem.mockResolvedValue({ status: 'pending', session: null });
    render(<PhoneSignIn />);
    fireEvent.change(screen.getByLabelText('వాట్సాప్ మొబైల్ నంబరు'), { target: { value: '9876543211' } });
    fireEvent.click(screen.getByRole('button', { name: 'నంబరు పంపండి' }));
    await waitFor(() => expect(mocks.request).toHaveBeenCalledWith('request_phone_entry', { _phone: '9876543211', _hash: 'b'.repeat(64) }));
    fireEvent.click(await screen.findByRole('button', { name: 'అనుమతి చూసి ప్రవేశించండి' }));
    await waitFor(() => expect(mocks.redeem).toHaveBeenCalledWith({ data: { secret: 'a'.repeat(64) } }));
    expect(mocks.session).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
  it('only sets the session returned for an approved device', async () => {
    mocks.request.mockResolvedValue({ error: null });
    const session = { access_token: 'test-access', refresh_token: 'test-refresh' };
    mocks.redeem.mockResolvedValue({ status: 'approved', session });
    mocks.session.mockResolvedValue({ error: null });
    render(<PhoneSignIn />);
    fireEvent.change(screen.getByLabelText('వాట్సాప్ మొబైల్ నంబరు'), { target: { value: '9876543211' } });
    fireEvent.click(screen.getByRole('button', { name: 'నంబరు పంపండి' }));
    fireEvent.click(await screen.findByRole('button', { name: 'అనుమతి చూసి ప్రవేశించండి' }));
    await waitFor(() => expect(mocks.session).toHaveBeenCalledWith(session));
  });
});
