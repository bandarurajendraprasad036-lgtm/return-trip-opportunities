import { expect, it } from 'vitest';
import { phoneNoticeData } from '@/lib/phone-notice';
it('phone banner contains actual route only, not a name, photo or phone from message text', () => {
  expect(phoneNoticeData({ id: 'notice', message: 'Private Person 9876543210 https://example.com/photo' }, { from_place: 'Hyderabad', to_place: 'Vijayawada' })).toEqual({ id: 'notice', body: 'Hyderabad → Vijayawada', path: '/notifications' });
});
it('board banner uses the database normalized route', () => {
  expect(phoneNoticeData({ id: 'notice', vehicle_bell: true, message: 'Hyderabad → Vijayawada' }).body).toBe('Hyderabad → Vijayawada');
});
it('unrelated private message content is never previewed on the phone', () => {
  expect(phoneNoticeData({ id: 'notice', message: 'Private Person 9876543210' }).body).toBe('గాయత్రి వన్‌లో కొత్త నోటిఫికేషన్ ఉంది');
});