// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const actions = vi.hoisted(() => ({ upload: vi.fn().mockResolvedValue('request'), navigate: vi.fn(), invalidate: vi.fn(), backup: vi.fn() }));
vi.mock('@/lib/session', () => ({ useMe: () => ({ data: { id: 'owner', isAdmin: true } }) }));
vi.mock('@/lib/membership-payment-client', () => ({ uploadMembershipScreenshot: actions.upload, uploadAdditionalRecipientScreenshot: vi.fn() }));
vi.mock('@/lib/local-payment-evidence', () => ({ saveLocalPaymentEvidence: actions.backup }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ invalidateQueries: actions.invalidate }) }));
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => actions.navigate }));
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));
import { MembershipEvidenceForm } from '@/components/MembershipEvidenceForm';
beforeEach(() => { URL.createObjectURL = vi.fn().mockReturnValue('blob:test'); URL.revokeObjectURL = vi.fn(); });
afterEach(() => { cleanup(); vi.clearAllMocks(); });
it.each([100, 349])('sends selected %i rupees and the chosen screenshot once for review', async amount => {
  render(<MembershipEvidenceForm amount={amount} />);
  const image = new File(['test'], 'evidence.png', { type: 'image/png' });
  fireEvent.change(screen.getByLabelText('పేమెంట్ స్క్రీన్ షాట్', { selector: 'input' }), { target: { files: [image] } });
  fireEvent.click(screen.getByRole('button', { name: 'అడ్మిన్‌కు ఫోటో పంపండి' }));
  await waitFor(() => expect(actions.upload).toHaveBeenCalledWith({ userId: 'owner', image, amount, beneficiary: undefined }));
  expect(actions.upload).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(actions.navigate).toHaveBeenCalledWith({ to: '/dashboard' }));
});