import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { bellMuted, playBell, setBellMuted } from '@/lib/bell';
import { useBellSound } from '@/lib/use-bell-sound';
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });
describe('sound-only preference', () => {
  it('defaults on and persists off across remounts', () => {
    expect(bellMuted()).toBe(false);
    const first = renderHook(() => useBellSound());
    act(() => first.result.current.change(false));
    expect(first.result.current.muted).toBe(true);
    expect(localStorage.getItem('gayatri-notices-muted')).toBe('yes');
    first.unmount();
    const second = renderHook(() => useBellSound());
    expect(second.result.current.muted).toBe(true);
  });
  it('synchronizes controls immediately without changing alert preferences', () => {
    localStorage.setItem('notification-preferences', 'enabled');
    const first = renderHook(() => useBellSound());
    const second = renderHook(() => useBellSound());
    act(() => setBellMuted(true));
    expect(first.result.current.muted).toBe(true);
    expect(second.result.current.muted).toBe(true);
    act(() => setBellMuted(false));
    expect(second.result.current.muted).toBe(false);
    expect(localStorage.getItem('notification-preferences')).toBe('enabled');
  });
  it('does not initialize or play audio while muted', () => {
    const create = vi.fn();
    vi.stubGlobal('AudioContext', create);
    setBellMuted(true); playBell();
    expect(create).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});