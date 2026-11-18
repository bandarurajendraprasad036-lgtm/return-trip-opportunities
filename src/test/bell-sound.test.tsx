import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { bellMuted, playBell, setBellMuted, installBellAudioUnlock, enableBellAudio } from '@/lib/bell';
import { useBellSound } from '@/lib/use-bell-sound';
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });
describe('sound-only preference', () => {
  it('uses a louder attack and 3.8 second resonant tail while respecting mute', async () => {
    vi.resetModules();
    const { enableBellAudio: unlock, playBell: ring } = await import('@/lib/bell');
    vi.useFakeTimers();vi.setSystemTime(new Date('2026-11-18T06:00:00Z'));
    const ramp=vi.fn(),stop=vi.fn();
    vi.stubGlobal('AudioContext',vi.fn(function(){return {state:'running',currentTime:10,destination:{},resume:vi.fn(),createOscillator:()=>({frequency:{value:0},connect:vi.fn(),start:vi.fn(),stop}),createGain:()=>({gain:{setValueAtTime:vi.fn(),exponentialRampToValueAtTime:ramp},connect:vi.fn()})};}));
    unlock();ring();
    expect(ramp).toHaveBeenCalledWith(0.42,10.012);
    expect(stop).toHaveBeenCalledWith(13.8);
    expect(stop).toHaveBeenCalledTimes(5);
    setBellMuted(true);ring();expect(stop).toHaveBeenCalledTimes(5);
    vi.useRealTimers();vi.unstubAllGlobals();
  });
  it('user interaction unlocks audio without a separate hidden settings step', () => {
    const resume = vi.fn();
    const create = vi.fn(function () { return { resume, state: 'suspended' }; });
    vi.stubGlobal('AudioContext', create);
    const stop = installBellAudioUnlock();
    window.dispatchEvent(new Event('pointerdown'));
    expect(create).toHaveBeenCalledOnce(); expect(resume).toHaveBeenCalledOnce();
    stop(); vi.unstubAllGlobals();
  });
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