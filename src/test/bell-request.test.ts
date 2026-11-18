import { expect, it, vi } from 'vitest';
import { retryBell } from '@/lib/bell-request';
it('retries temporary failure twice before a successful registration', async () => {
  const operation = vi.fn().mockResolvedValueOnce({ data: null, error: { message: 'Failed to fetch' } }).mockResolvedValueOnce({ data: null, error: { code: '40001' } }).mockResolvedValue({ data: 'saved', error: null });
  const pause = vi.fn().mockResolvedValue(undefined);
  expect((await retryBell(operation, pause)).data).toBe('saved');
  expect(operation).toHaveBeenCalledTimes(3);
  expect(pause.mock.calls).toEqual([[750], [1500]]);
});
it('does not retry a profile or membership denial', async () => {
  const operation = vi.fn().mockResolvedValue({ data: null, error: new Error('BELL_LIMIT_REACHED') });
  await expect(retryBell(operation)).rejects.toThrow('BELL_LIMIT_REACHED');
  expect(operation).toHaveBeenCalledTimes(1);
});
it('does not claim success after three failed requests', async () => {
  const operation = vi.fn().mockResolvedValue({ data: null, error: new Error('network') });
  await expect(retryBell(operation, async () => {})).rejects.toThrow('network');
  expect(operation).toHaveBeenCalledTimes(3);
});