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
    const input = screen.getByLabelText('మొబైల్ నంబరు · Mobile number');
    expect(input).toHaveValue('');
    fireEvent.change(input, { target: { value: '98765 43210' } });
    expect(input).toHaveValue('9876543210');
    fireEvent.click(screen.getByRole('button', { name: 'తుడిచేయండి · Clear' }));
    expect(input).toHaveValue('');
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it('allows a second number to create its own account and verifies its code', async () => {
    mocks.request.mockResolvedValue({ error: null });
    mocks.verify.mockResolvedValue({ error: null });
    render(<PhoneSignIn />);
    fireEvent.change(screen.getByLabelText('మొబైల్ నంబరు · Mobile number'), { target: { value: '9876543211' } });
    fireEvent.click(screen.getByRole('button', { name: 'కోడ్ పొందండి · Get code' }));
    await waitFor(() => expect(mocks.request).toHaveBeenCalledWith({ phone: '+919876543211', options: { shouldCreateUser: true } }));
    fireEvent.change(screen.getByLabelText('ఫోన్‌కు వచ్చిన కోడ్ · Received code'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'కోడ్ సరిచూసి ప్రవేశించండి · Verify and sign in' }));
    await waitFor(() => expect(mocks.verify).toHaveBeenCalledWith({ phone: '+919876543211', token: '123456', type: 'sms' }));
  });
});
