import { expect, it } from 'vitest';
import { mayManageAccount } from '@/lib/admin-account-rules';
it('ordinary users cannot block or remove another user',()=>expect(mayManageAccount(false,'a','b',false)).toBe(false));
it('administrator can manage an ordinary account',()=>expect(mayManageAccount(true,'a','b',false)).toBe(true));
it('administrator cannot remove themselves',()=>expect(mayManageAccount(true,'a','a',false)).toBe(false));
it('other administrator accounts stay protected',()=>expect(mayManageAccount(true,'a','b',true)).toBe(false));