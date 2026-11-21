import { it, expect } from 'vitest';
import { aadhaarNameMatches } from '@/lib/aadhaar-match';
it('accepts the same name in different case and order', () => { expect(aadhaarNameMatches('Swapna Bandaru', 'BANDARU SWAPNA')).toBe(true); });
it('accepts a card name with an initial when the full words match', () => { expect(aadhaarNameMatches('Rajendra prasad Bandaru', 'Bandaru Rajendra Prasad')).toBe(true); });
it('rejects a different person', () => { expect(aadhaarNameMatches('Swapna Bandaru', 'Ramesh Kumar')).toBe(false); });
it('rejects an empty card name', () => { expect(aadhaarNameMatches('Swapna Bandaru', '')).toBe(false); });
