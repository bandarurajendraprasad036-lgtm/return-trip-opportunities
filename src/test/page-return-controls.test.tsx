// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { PageReturnControls } from '@/components/PageReturnControls';

const state = vi.hoisted(() => ({ pathname: '/vehicles', canGoBack: true, back: vi.fn(), navigate: vi.fn() }));
vi.mock('@tanstack/react-router', () => ({
  useLocation: () => ({ pathname: state.pathname }),
  useCanGoBack: () => state.canGoBack,
  useRouter: () => ({ history: { back: state.back }, navigate: state.navigate }),
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => <a href={to} {...props}>{children}</a>,
}));
afterEach(() => { cleanup(); vi.clearAllMocks(); state.pathname = '/vehicles'; state.canGoBack = true; });
it('returns through router history when an earlier app page exists', () => {
  render(<PageReturnControls />);
  fireEvent.click(screen.getByRole('button', { name: 'వెనక్కి' }));
  expect(state.back).toHaveBeenCalledTimes(1);
  expect(state.navigate).not.toHaveBeenCalled();
});
it('returns to the actual home when opened without earlier app history', async () => {
  state.canGoBack = false;
  render(<PageReturnControls />);
  fireEvent.click(screen.getByRole('button', { name: 'వెనక్కి' }));
  await waitFor(() => expect(state.navigate).toHaveBeenCalledWith({ to: '/', replace: true }));
  expect(state.back).not.toHaveBeenCalled();
});
it('home action always targets the devotional home instead of the feed', () => {
  render(<PageReturnControls />);
  expect(screen.getByRole('link', { name: 'హోమ్' }).getAttribute('href')).toBe('/');
});