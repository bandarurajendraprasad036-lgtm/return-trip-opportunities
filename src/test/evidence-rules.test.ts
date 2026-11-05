import {describe,it,expect} from 'vitest';
import {EVIDENCE_RETENTION_HOURS,evidenceImageCount,evidenceReadable,validDecisionReason,distinctEvidence} from '@/lib/evidence-rules';
describe('confirmed screenshot rules',()=>{
it('requires status plus nine groups for alerts',()=>expect(evidenceImageCount('notifications')).toBe(10));
it('requires status plus ten people for early publication',()=>expect(evidenceImageCount('early_publication')).toBe(11));
it('limits admin image access to 24 hours and denies ordinary viewers',()=>{expect(EVIDENCE_RETENTION_HOURS).toBe(24);expect(evidenceReadable(false,'2026-11-06T07:00:00Z',new Date('2026-11-05T07:00:00Z'))).toBe(false);expect(evidenceReadable(true,'2026-11-06T07:00:00Z',new Date('2026-11-06T06:59:59Z'))).toBe(true);expect(evidenceReadable(true,'2026-11-06T07:00:00Z',new Date('2026-11-06T07:00:00Z'))).toBe(false);});
it('requires a reason for rejection',()=>{expect(validDecisionReason(false,' ')).toBe(false);expect(validDecisionReason(false,'సరిపోలేదు')).toBe(true);});
it('rejects identical screenshot bytes even under different names',()=>{const a='a'.repeat(64),b='b'.repeat(64);expect(distinctEvidence([a,a])).toBe(false);expect(distinctEvidence([a,b])).toBe(true);});
});