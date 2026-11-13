import { describe,it,expect } from 'vitest';
import { paymentImageDecision,payerUpiSchema } from '../lib/payment-image';
const proof={utr:'412345678901',payer_upi:'payer@ybl',readable:true,suspected_edit:false};
describe('payment screenshot rules',()=>{
 it('matches both UTR and payer UPI, ignoring only UPI case',()=>{expect(paymentImageDecision('412345678901','PAYER@ybl',proof)).toBe('matched');});
 it('a different UTR never matches',()=>{expect(paymentImageDecision('412345678902','payer@ybl',proof)).toBe('mismatch');});
 it('a different payer UPI never matches even with correct UTR',()=>{expect(paymentImageDecision('412345678901','other@ybl',proof)).toBe('mismatch');});
 it('unreadable payer details never activate access',()=>{expect(paymentImageDecision('412345678901','payer@ybl',{...proof,payer_upi:'pa***@ybl'})).toBe('unreadable');});
 it('suspected edits are held without a ban decision',()=>{expect(paymentImageDecision('412345678901','payer@ybl',{...proof,suspected_edit:true})).toBe('suspected_edit');});
 it('payer UPI is required',()=>{expect(payerUpiSchema.safeParse('').success).toBe(false);});
});