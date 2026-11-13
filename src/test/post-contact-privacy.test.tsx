import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { PostCard, type Post } from '@/components/PostCard';
import { supabase } from '@/integrations/supabase/client';
vi.mock('@tanstack/react-router',()=>({useNavigate:()=>vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{rpc:vi.fn(async()=>({data:{description:'Work details'},error:null}))}}));
vi.mock('@/components/ResponsibilityNotice',()=>({ResponsibilityNotice:()=>null}));
vi.mock('@/lib/use-account-program',()=>({useAccountProgram:()=>({data:{completed_at:'2026-11-07'}})}));
vi.mock('@/lib/session',()=>({useMe:()=>({data:{id:'member',profile:{bell_activated_at:'2026-11-10T04:00:00Z'}}})}));
vi.mock('@tanstack/react-query',()=>({useQueryClient:()=>({invalidateQueries:vi.fn()})}));
vi.mock('@/components/ProfileRequest',()=>({ProfileRequest:()=>null}));
vi.mock('@/components/BellPaymentNotice',()=>({BellPaymentNotice:()=>null}));
afterEach(cleanup);
describe('post contact disclosure',()=>{
  const post={id:'post',user_id:'owner',module:'job',status:'active',skill:'Driver',title:'Private name',location:'Hyderabad',salary:'15000',show_contact:true,public_brand:'Consented name',public_photo:'https://example.com/private-photo.jpg',contact_phone:'9876543210'} as Post;
  it('keeps contact and photo hidden in display-only listings even with sharing enabled',async()=>{
    render(<PostCard post={post} meId="member" />);
    expect(screen.queryByText('9876543210')).toBeNull();
    expect(screen.queryByText('Consented name')).toBeNull();
    expect(screen.queryByText('9876543210')).toBeNull();
    expect(screen.queryByText('Consented name')).toBeNull();
    expect(document.querySelector('img')).toBeNull();
    expect(document.querySelector('a[href^="tel:"]')).toBeNull();
  });
  it('never reveals contact without sharing consent',async()=>{
    render(<PostCard post={{...post,show_contact:false}} meId="member" />);
    expect(screen.queryByText('9876543210')).toBeNull();
    expect(screen.queryByText('Consented name')).toBeNull();
  });
  it('never requests interest or broadcasts from a display-only vehicle listing',async()=>{
    vi.mocked(supabase.rpc).mockClear();
    vi.mocked(supabase.rpc).mockResolvedValueOnce({data:true,error:null} as never).mockResolvedValueOnce({data:'owner',error:null} as never);
    render(<PostCard post={{...post,module:'vehicle',vehicle_type:'car'}} meId="member" />);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
  it('never sends interest for an unconfirmed payment',async()=>{
    vi.mocked(supabase.rpc).mockClear();vi.mocked(supabase.rpc).mockResolvedValueOnce({data:false,error:null} as never);
    render(<PostCard post={post} meId="member" />);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});