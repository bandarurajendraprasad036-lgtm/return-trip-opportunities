import { describe, expect, it } from 'vitest';
import { vehicleExample, jobExample } from '@/lib/search-examples';

describe('Private presentation-only search examples', () => {
  it('contains only the selected route, without identity, contact or real post IDs', () => {
    expect(vehicleExample(' గుంటూరు ', ' విజయవాడ ')).toEqual({ type: 'vehicle', from: 'గుంటూరు', to: 'విజయవాడ' });
  });
  it('contains only job area and explicitly fictional salary', () => {
    expect(jobExample(' గుంటూరు ')).toEqual({ type: 'job', location: 'గుంటూరు', salary: '₹15,000 / నెల · month' });
  });
  it('does not invent a missing endpoint or location', () => {
    expect(vehicleExample('గుంటూరు', '')).toBeNull();
    expect(jobExample(' ')).toBeNull();
  });
});