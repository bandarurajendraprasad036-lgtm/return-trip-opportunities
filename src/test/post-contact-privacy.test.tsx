import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PostCard, type Post } from '@/components/PostCard';
vi.mock('@tanstack/react-router',()=>({useNavigate:()=>vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{rpc:vi.fn(async()=>({data:{description:'Work details'},error:null}))}}));
vi.mock('@/components/ResponsibilityNotice',()=>({ResponsibilityNotice:()=>null}));
afterEach(cleanup);
describe('post contact disclosure',()=>{
  const post={id:'post',user_id:'owner',module:'job',status:'active',skill:'Driver',title:'Private name',location:'Hyderabad',salary:'15000',show_contact:true,public_brand:'Consented name',public_photo:'https://example.com/private-photo.jpg',contact_phone:'9876543210'} as Post;
  it('keeps contact and photo hidden even after opening details with sharing enabled',async()=>{
    render(<PostCard post={post} meId="member" />);
    expect(screen.queryByText('9876543210')).toBeNull();
    expect(screen.queryByText('Consented name')).toBeNull();
    fireEvent.click(screen.getByRole('button',{name:'వివరాలు · Details'}));
    await screen.findByRole('dialog');
    expect(screen.queryByText('9876543210')).toBeNull();
    expect(screen.queryByText('Consented name')).toBeNull();
    expect(document.querySelector('img')).toBeNull();
    expect(document.querySelector('a[href^="tel:"]')).toBeNull();
  });
  it('never reveals contact without sharing consent even after details',async()=>{
    render(<PostCard post={{...post,show_contact:false}} meId="member" />);
    fireEvent.click(screen.getByRole('button',{name:'వివరాలు · Details'}));
    await screen.findByRole('dialog');
    expect(screen.queryByText('9876543210')).toBeNull();
    expect(screen.queryByText('Consented name')).toBeNull();
  });
});