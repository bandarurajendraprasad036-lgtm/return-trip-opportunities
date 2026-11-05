import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
vi.mock('@tanstack/react-start', () => ({ useServerFn: () => vi.fn() }));
vi.mock('@/lib/current-area.functions', () => ({ resolveCurrentArea: vi.fn() }));
import { useCurrentArea } from '@/lib/use-current-area';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
describe('device location lifecycle without Maps requests', () => {
  it('does not request location without a signed-in account', () => {
    const watch = vi.fn();
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { watchPosition: watch, clearWatch: vi.fn() } });
    renderHook(() => useCurrentArea());
    expect(watch).not.toHaveBeenCalled();
  });
  it('starts on opening and stops on leaving or signing out', () => {
    const watch = vi.fn(() => 17); const clear = vi.fn();
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { watchPosition: watch, clearWatch: clear } });
    const hook = renderHook(({ id }) => useCurrentArea(id), { initialProps: { id: 'account' as string | undefined } });
    expect(watch).toHaveBeenCalledTimes(1);
    hook.rerender({ id: undefined });
    expect(clear).toHaveBeenCalledWith(17);
    hook.unmount();
  });
  it('stops when the page is hidden and resumes when visible', () => {
    const watch = vi.fn(() => 18); const clear = vi.fn();
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { watchPosition: watch, clearWatch: clear } });
    const visibility = vi.spyOn(document, 'visibilityState', 'get');
    visibility.mockReturnValue('visible');
    const hook = renderHook(() => useCurrentArea('account'));
    act(() => { visibility.mockReturnValue('hidden'); document.dispatchEvent(new Event('visibilitychange')); });
    expect(clear).toHaveBeenCalledWith(18);
    act(() => { visibility.mockReturnValue('visible'); document.dispatchEvent(new Event('visibilitychange')); });
    expect(watch).toHaveBeenCalledTimes(2);
    hook.unmount();
    expect(clear).toHaveBeenCalledTimes(2);
  });
});