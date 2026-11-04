import { describe, expect, it } from 'vitest';
import { generalWorkValue, hasProhibitedJobWords, jobSuggestions } from '@/lib/job-entry';
describe('Point 8 job entry', () => {
  it('starts village suggestions at two characters', () => {
    expect(jobSuggestions('G', ['Guntur'])).toEqual([]);
    expect(jobSuggestions('Gu', ['Guntur'])).toEqual(['Guntur']);
  });
  it('starts work suggestions at two Telugu characters, not combining marks', () => {
    expect(jobSuggestions('కూ', ['కూలి'])).toEqual([]);
    expect(jobSuggestions('కూలి', ['కూలి'])).toEqual(['కూలి']);
  });
  it('preserves unlisted work from the general box', () => {
    expect(generalWorkValue('Driver', ' పూల అలంకరణ ', true)).toBe('పూల అలంకరణ');
  });
  it('rejects prohibited words but permits ordinary work information', () => {
    expect(hasProhibitedJobWords('driver asshole')).toBe(true);
    expect(hasProhibitedJobWords('గుంటూరులో డ్రైవర్ కావాలి')).toBe(false);
  });
});