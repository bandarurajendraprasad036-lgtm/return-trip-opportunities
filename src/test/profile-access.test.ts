import { expect, it } from 'vitest';
import { profileFieldsComplete } from '@/lib/profile-access';
it('requires a full existing profile and selected occupation/category', () => {
  const profile = { full_name: 'Person', location: 'Village', phone: '9876543210' };
  expect(profileFieldsComplete(profile, { occupation: 'Driver', category: 'Auto', member_kind: 'owner' })).toBe(true);
  expect(profileFieldsComplete(profile, { occupation: 'Driver', category: '', member_kind: 'owner' })).toBe(false);
  expect(profileFieldsComplete({ ...profile, full_name: ' ' }, { occupation: 'Driver', category: 'Auto', member_kind: 'owner' })).toBe(false);
});
it('a mobile claim alone never completes a profile', () => {
  expect(profileFieldsComplete({ phone: '9876543210' }, null)).toBe(false);
});