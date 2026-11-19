import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PhoneSignIn } from '@/components/PhoneSignIn';

const mocks = vi.hoisted(() => ({ request: vi.fn(), verify: vi.fn(), navigate: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { signInWithOtp: mocks.request, verifyOtp: mocks.verify } } }));
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
  it('requesting a code never creates an account or signs in by number alone', async () => {
    mocks.request.mockResolvedValue({ error: null });
    render(<PhoneSignIn />);
    fireEvent.change(screen.getByLabelText('వాట్సాప్ మొబైల్ నంబరు'), { target: { value: '9876543211' } });
    fireEvent.click(screen.getByRole('button', { name: 'నిర్ధారణ కోడ్ పొందండి' }));
    await waitFor(() => expect(mocks.request).toHaveBeenCalledWith({ phone: '+919876543211', options: { shouldCreateUser: false } }));
    expect(mocks.verify).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
  it('navigates only after the registered phone code returns a session', async () => {
    mocks.request.mockResolvedValue({ error: null });
    mocks.verify.mockResolvedValue({ data: { session: {} }, error: null });
    render(<PhoneSignIn />);
    fireEvent.change(screen.getByLabelText('వాట్సాప్ మొబైల్ నంబరు'), { target: { value: '9876543211' } });
    fireEvent.click(screen.getByRole('button', { name: 'నిర్ధారణ కోడ్ పొందండి' }));
    fireEvent.change(await screen.findByLabelText('ఫోన్‌కు వచ్చిన కోడ్'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'కోడ్ నిర్ధారించి ప్రవేశించండి' }));
    await waitFor(() => expect(mocks.verify).toHaveBeenCalledWith({ phone: '+919876543211', token: '123456', type: 'sms' }));
    await waitFor(() => expect(mocks.navigate).toHaveBeenCalled());
  });
});
