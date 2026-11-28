import { expect, it } from 'vitest';
import { hasProhibitedPostText } from '@/lib/post-content';
it.each(['Driver needed in Chennur', 'Rice bags Chittoor to Chennai', 'Electrician wanted', 'Scunthorpe transport', 'Terrorism condemned in news'])('allows normal post text without an external moderation service: %s', text => {
  expect(hasProhibitedPostText(text)).toBe(false);
});
it.each(['driver asshole', 'madarchod', 'లంజకొడుకు', 'join isis'])('rejects prohibited post content: %s', text => {
  expect(hasProhibitedPostText(text)).toBe(true);
});