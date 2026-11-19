import { beforeEach,it,expect,vi } from 'vitest';
const mocks=vi.hoisted(()=>({getUser:vi.fn(),select:vi.fn(),eq:vi.fn(),del:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{auth:{getUser:mocks.getUser},from:()=>({delete:mocks.del})}}));
import { deleteOwnPost } from '@/lib/delete-own-post';
beforeEach(()=>{vi.clearAllMocks();mocks.getUser.mockResolvedValue({data:{user:{id:'owner'}}});mocks.eq.mockReturnValue({eq:mocks.eq,select:mocks.select});mocks.del.mockReturnValue({eq:mocks.eq});});
it('only permits the signed-in owner and scopes the deletion to them',async()=>{mocks.select.mockResolvedValue({data:[{id:'post'}],error:null});await deleteOwnPost('post','owner');expect(mocks.eq).toHaveBeenCalledWith('user_id','owner');});
it('rejects deleting another users post',async()=>{await expect(deleteOwnPost('post','someone-else')).rejects.toThrow('OWNER_ONLY');expect(mocks.del).not.toHaveBeenCalled();});
it('does not claim success when deletion affects no row',async()=>{mocks.select.mockResolvedValue({data:[],error:null});await expect(deleteOwnPost('post','owner')).rejects.toThrow('NOT_DELETED');});