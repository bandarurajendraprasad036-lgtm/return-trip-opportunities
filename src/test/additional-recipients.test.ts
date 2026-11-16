import { expect, it } from 'vitest';
import { additionalRecipientTotal } from '@/lib/additional-recipients';

it('charges exactly ₹80 for each additional person, including four or five people', () => {
  expect(additionalRecipientTotal(1)).toBe(80);
  expect(additionalRecipientTotal(4)).toBe(320);
  expect(additionalRecipientTotal(5)).toBe(400);
});

it('does not invent a charge for zero recipients or accept invalid counts', () => {
  expect(additionalRecipientTotal(0)).toBe(0);
  expect(() => additionalRecipientTotal(-1)).toThrow('INVALID_RECIPIENT_COUNT');
  expect(() => additionalRecipientTotal(1.5)).toThrow('INVALID_RECIPIENT_COUNT');
});
