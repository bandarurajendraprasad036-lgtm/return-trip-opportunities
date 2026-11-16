import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
import { InstallButton } from '@/components/AppHelpers';
beforeEach(() => { localStorage.clear(); window.matchMedia = vi.fn().mockReturnValue({ matches: false }); });
afterEach(cleanup);
it('a stale historical installation flag never prevents reinstall help', () => {
  localStorage.setItem('gayatri-installed-confirmed', '1');
  render(<InstallButton />);
  fireEvent.click(screen.getByRole('button', { name: 'ఫోన్‌లో పెట్టుకోండి' }));
  expect(screen.getByRole('dialog')).toBeTruthy();
});
it('uses the available native installation prompt once', async () => {
  render(<InstallButton />);
  const prompt = vi.fn().mockResolvedValue(undefined);
  const event = new Event('beforeinstallprompt');
  Object.assign(event, { prompt });
  fireEvent(window, event);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'ఫోన్‌లో పెట్టుకోండి' })); });
  expect(prompt).toHaveBeenCalledTimes(1);
});