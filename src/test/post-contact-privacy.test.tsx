import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PostCard, type Post } from '@/components/PostCard';
vi.mock('@tanstack/react-router',()=>({useNavigate:()=>vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{rpc:vi.fn()}}));
vi.mock('@/components/ResponsibilityNotice',()=>({ResponsibilityNotice:()=>null}));
afterEach(cleanup);
describe('post contact disclosure',()=>{
  const post={id:'post',user_id:'owner',module:'job',status:'active',skill:'Driver',title:'Private name',location:'Hyderabad',salary:'15000',show_contact:true,public_brand:'Consented name',public_photo:'',contact_phone:'9876543210'} as Post;
  it('keeps opted-in contact hidden until the details action',()=>{
    render(<PostCard post={post} meId="member" />);
    expect(screen.queryByText('9876543210')).toBeNull();
    expect(screen.queryByText('Consented name')).toBeNull();
    fireEvent.click(screen.getByRole('button',{name:'వివరాలు · Details'}));
    expect(screen.getByText('9876543210')).toBeTruthy();
    expect(screen.getByText('Consented name')).toBeTruthy();
  });
  it('never reveals contact without sharing consent even after details',()=>{
    render(<PostCard post={{...post,show_contact:false}} meId="member" />);
    fireEvent.click(screen.getByRole('button',{name:'వివరాలు · Details'}));
    expect(screen.queryByText('9876543210')).toBeNull();
    expect(screen.queryByText('Consented name')).toBeNull();
  });
});