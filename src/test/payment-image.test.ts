import { describe,it,expect } from 'vitest';
import { paymentImageDecision,payerUpiSchema,resolvePaymentPayer } from '../lib/payment-image';
const proof={utr:'412345678901',payer_upi:'payer@ybl',readable:true,suspected_edit:false};
describe('payment screenshot rules',()=>{
 it('matches both UTR and payer UPI, ignoring only UPI case',()=>{expect(paymentImageDecision('412345678901','PAYER@ybl',proof)).toBe('matched');});
 it('a different UTR never matches',()=>{expect(paymentImageDecision('412345678902','payer@ybl',proof)).toBe('mismatch');});
 it('a different payer UPI never matches even with correct UTR',()=>{expect(paymentImageDecision('412345678901','other@ybl',proof)).toBe('mismatch');});
 it('unreadable payer details never activate access',()=>{expect(paymentImageDecision('412345678901','payer@ybl',{...proof,payer_upi:'pa***@ybl'})).toBe('unreadable');});
 it('suspected edits are held without a ban decision',()=>{expect(paymentImageDecision('412345678901','payer@ybl',{...proof,suspected_edit:true})).toBe('suspected_edit');});
 it('payer UPI is required',()=>{expect(payerUpiSchema.safeParse('').success).toBe(false);});
 it('screenshot plus UTR can use the sender address read from the original image',()=>{expect(resolvePaymentPayer(null,proof)).toBe('payer@ybl');});
 it('masked image addresses cannot grant access when no address was entered',()=>{expect(resolvePaymentPayer(null,{...proof,payer_upi:'pa***@ybl'})).toBe(null);});
 it('a supplied address still has to match the original image',()=>{const payer=resolvePaymentPayer('other@ybl',proof);expect(paymentImageDecision(proof.utr,payer??'',proof)).toBe('mismatch');});
});