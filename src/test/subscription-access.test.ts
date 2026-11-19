import { afterEach, expect, it, vi } from 'vitest';
import { requireSubscription } from '@/lib/subscription-access';
const mocks=vi.hoisted(()=>({rpc:vi.fn(),getSession:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{auth:{getSession:mocks.getSession},rpc:mocks.rpc}}));
afterEach(()=>vi.clearAllMocks());
it('unpaid user cannot start a bell or chat action',async()=>{
  mocks.getSession.mockResolvedValue({data:{session:{user:{id:'member'}}}});
  mocks.rpc.mockResolvedValue({data:false,error:null});
  const notice=vi.fn();window.addEventListener('gayatri-subscription-required',notice);
  expect(await requireSubscription()).toBe(false);expect(notice).toHaveBeenCalledTimes(1);
  window.removeEventListener('gayatri-subscription-required',notice);
});
it('paid user can start a bell or chat action',async()=>{
  mocks.getSession.mockResolvedValue({data:{session:{user:{id:'member'}}}});
  mocks.rpc.mockImplementation((name:string)=>Promise.resolve({data:name==='has_paid_bell',error:null}));
  expect(await requireSubscription()).toBe(true);
});
it('signed-out bell or chat requests payment without dispatching any RPC',async()=>{
  mocks.getSession.mockResolvedValue({data:{session:null}});
  expect(await requireSubscription()).toBe(false);expect(mocks.rpc).not.toHaveBeenCalled();
});