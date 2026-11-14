import { beforeEach, describe, expect, it, vi } from 'vitest';
import { localPaymentKey, saveLocalPaymentEvidence } from '@/lib/local-payment-evidence';

const input = () => ({ ownerId: 'owner-one', reference: '123456789012', amount: 100, image: new File(['test photo'], 'photo.png', { type: 'image/png' }) });
describe('phone-only payment evidence', () => {
  beforeEach(() => localStorage.clear());
  it('persists the photo and twelve-digit number without making a network request', async () => {
    const network = vi.spyOn(globalThis, 'fetch');
    const evidence = await saveLocalPaymentEvidence(input());
    const saved = JSON.parse(localStorage.getItem(localPaymentKey('owner-one', '123456789012')) ?? '{}');
    expect(saved.reference).toBe('123456789012');
    expect(saved.photo).toBe(evidence.photo);
    expect(saved.photo).toContain('data:image/png;base64,');
    expect(saved.status).toBe('local-only');
    expect(network).not.toHaveBeenCalled();
    network.mockRestore();
  });
  it('rejects eleven digits', async () => {
    await expect(saveLocalPaymentEvidence({ ...input(), reference: '12345678901' })).rejects.toThrow('INVALID_LOCAL_EVIDENCE');
    expect(localStorage.length).toBe(0);
  });
  it('requires a nonempty photo', async () => {
    await expect(saveLocalPaymentEvidence({ ...input(), image: new File([], 'empty.png') })).rejects.toThrow('INVALID_LOCAL_EVIDENCE');
  });
  it('isolates accounts with the same reference', async () => {
    await saveLocalPaymentEvidence(input());
    await saveLocalPaymentEvidence({ ...input(), ownerId: 'owner-two' });
    expect(localStorage.length).toBe(2);
    expect(JSON.parse(localStorage.getItem(localPaymentKey('owner-two', '123456789012')) ?? '{}').ownerId).toBe('owner-two');
  });
  it('same-account retries replace only the same local reference', async () => {
    await saveLocalPaymentEvidence(input());
    await saveLocalPaymentEvidence({ ...input(), image: new File(['replacement'], 'new.png', { type: 'image/png' }) });
    expect(localStorage.length).toBe(1);
    expect(JSON.parse(localStorage.getItem(localPaymentKey('owner-one', '123456789012')) ?? '{}').photoName).toBe('new.png');
  });
  it('falls back to local large-file storage when localStorage is full', async () => {
    const fallback = vi.fn().mockResolvedValue(undefined);
    const evidence = await saveLocalPaymentEvidence(input(), { setItem: () => { throw new Error('quota'); } }, fallback);
    expect(fallback).toHaveBeenCalledWith(localPaymentKey('owner-one', '123456789012'), evidence);
  });
  it('never reports success if both local stores reject saving', async () => {
    await expect(saveLocalPaymentEvidence(input(), { setItem: () => { throw new Error('quota'); } }, async () => { throw new Error('LOCAL_SAVE_FAILED'); })).rejects.toThrow('LOCAL_SAVE_FAILED');
  });
});