import { describe, expect, it } from 'vitest';
import { generalWorkValue, hasProhibitedJobWords, jobSuggestions, jobPostIdentity } from '@/lib/job-entry';
describe('Point 8 job entry', () => {
  it('saves the need-job tab as a job seeker', () => {
    expect(jobPostIdentity('seeker', ' డ్రైవర్ ')).toEqual({ module: 'job', kind: 'seeker', title: 'డ్రైవర్ పని కావాలి' });
  });
  it('saves the offer-job tab as a job employer', () => {
    expect(jobPostIdentity('employer', ' డ్రైవర్ ')).toEqual({ module: 'job', kind: 'employer', title: 'డ్రైవర్ కోసం పనివాడు కావాలి' });
  });
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