import { beforeEach,it,expect,vi } from 'vitest';
const mocks=vi.hoisted(()=>({rpc:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{rpc:mocks.rpc}}));
import { deleteOwnPost } from '@/lib/delete-own-post';
beforeEach(()=>{vi.clearAllMocks();});
it('asks the database to delete exactly this ad (owner or admin is checked there)',async()=>{mocks.rpc.mockResolvedValue({data:true,error:null});await deleteOwnPost('post');expect(mocks.rpc).toHaveBeenCalledWith('delete_post_everywhere',{_post:'post'});});
it('fails when the database refuses (not owner, not admin)',async()=>{mocks.rpc.mockResolvedValue({data:null,error:new Error('OWNER_OR_ADMIN_ONLY')});await expect(deleteOwnPost('post')).rejects.toThrow('OWNER_OR_ADMIN_ONLY');});
it('does not claim success when nothing was deleted',async()=>{mocks.rpc.mockResolvedValue({data:false,error:null});await expect(deleteOwnPost('post')).rejects.toThrow('NOT_DELETED');});
