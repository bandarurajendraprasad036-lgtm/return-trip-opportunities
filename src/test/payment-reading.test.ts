import { beforeEach, describe, expect, it, vi } from 'vitest';
const { generateResponse } = vi.hoisted(()=>({generateResponse:vi.fn()}));
vi.mock('@lovable.dev/ai-gateway',()=>({generateResponse}));
import { readPaymentImage } from '@/lib/payment-reading.server';
const reading={utr:'412345678901',payer_upi:'payer@ybl',recipient_upi:'bandarurajendraprasad036@oksbi',readable:true,suspected_edit:false};
function respond(value:typeof reading){generateResponse.mockResolvedValue({output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(value)}]}]});}
describe('payment image recipient and independent reading',()=>{
  beforeEach(()=>{generateResponse.mockReset();});
  it('accepts only the newly supplied recipient for readable evidence',async()=>{respond(reading);expect((await readPaymentImage(new Uint8Array([1,2,3]),'image/png')).readable).toBe(true);});
  it('another recipient cannot activate provisional posting even with matching sender fields',async()=>{respond({...reading,recipient_upi:'other@okhdfcbank'});expect((await readPaymentImage(new Uint8Array([1]),'image/png')).readable).toBe(false);});
  it('missing recipient fails closed',async()=>{respond({...reading,recipient_upi:''});expect((await readPaymentImage(new Uint8Array([1]),'image/png')).readable).toBe(false);});
  it('reads each submitted image independently rather than trusting preview values',async()=>{respond(reading);await readPaymentImage(new Uint8Array([1]),'image/png');await readPaymentImage(new Uint8Array([2]),'image/png');expect(generateResponse).toHaveBeenCalledTimes(2);const first=generateResponse.mock.calls[0]?.[0];const second=generateResponse.mock.calls[1]?.[0];expect(first).toBeDefined();expect(second).toBeDefined();expect(JSON.stringify(first)).not.toBe(JSON.stringify(second));});
});