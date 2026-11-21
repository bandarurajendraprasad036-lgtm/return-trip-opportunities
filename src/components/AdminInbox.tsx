import { useState } from 'react';
import { SignedImg } from '@/components/SignedImg';
import { Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useMe } from '@/lib/session';
import { PostCard, type Post } from '@/components/PostCard';
import { POST_LIST_COLUMNS } from '@/lib/post-access';
import { bellBoardSection, BELL_BOARD_SECTIONS } from '@/lib/bell-board';

type Notice = { id: string; message: string; is_read: boolean; created_at: string; post_id: string | null; detail: string; section: string; category: string; post_label: string; post_exists: boolean; actor_id: string | null; full_name: string; phone: string; photo: string; hidden: boolean };

function NoticePost({ id }: { id: string }) {
  const { data: me } = useMe();
  const { data, isPending, isError } = useQuery({ queryKey: ['admin-notice-post', id], queryFn: async () => { const r = await supabase.from('posts').select(POST_LIST_COLUMNS).eq('id', id).maybeSingle(); if (r.error) throw r.error; return r.data as Post | null; } });
  if (isPending) return <p role="status">ప్రకటన వస్తోంది…</p>;
  if (isError || !data) return <p role="alert">ఈ ప్రకటన తొలగించబడింది</p>;
  return <PostCard post={data} meId={me?.id} />;
}

export function AdminInbox() {
  const { data: me } = useMe(); const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const { data = [], isError } = useQuery({ queryKey: ['admin-inbox', me?.id], enabled: !!me?.isAdmin, refetchInterval: 3000, queryFn: async () => { const r = await supabase.rpc('admin_activity_feed'); if (r.error) throw r.error; return r.data as Notice[]; } });
  if (!me?.isAdmin) return null;
  const markRead = async (id: string) => { const r = await supabase.from('admin_activity_notices').update({ is_read: true }).eq('id', id); if (!r.error) { await qc.invalidateQueries({ queryKey: ['admin-inbox'] }); await qc.invalidateQueries({ queryKey: ['unread'] }); } };
  return <section id="admin-notices" data-subscription-exempt className="space-y-3 py-2">
    <h2 className="text-2xl font-bold">నిర్వాహక సూచనలు</h2>
    {isError && <p role="alert">సూచనలు రాలేదు</p>}
    {!data.length && !isError && <p>ఇంకా కొత్త సూచనలు లేవు</p>}
    {data.map(n => {
      const digits = n.phone.replace(/\D/g, '').slice(-10);
      const name = n.full_name.trim() || digits || '';
      const board = (BELL_BOARD_SECTIONS as string[]).includes(n.section) ? bellBoardSection(n.section) : null;
      const open = openId === n.id;
      const what = n.post_label || n.detail;
      const body = <>
        {n.actor_id && name && <span className="flex items-center gap-3">
          {n.photo ? <SignedImg src={n.photo} alt="" className="size-14 shrink-0 rounded-full border-2 border-primary object-cover" /> : <span aria-hidden className="flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary text-2xl font-bold text-primary-foreground">{(name[0] ?? '?').toUpperCase()}</span>}
          <span className="min-w-0 break-words" translate="no"><span className="block text-lg font-bold leading-tight">{name}</span>{digits && digits !== name && <span className="block text-base font-semibold">{digits}</span>}{n.hidden && <span className="block text-sm">(ఇతరులకు దాచారు)</span>}</span>
        </span>}
        <span className="block font-semibold">{n.message}</span>
        {what && <span className="block break-words" translate="no">{what}</span>}
        <span className="block text-sm" translate="no">{new Date(n.created_at).toLocaleString('te-IN')}</span>
      </>;
      return <article key={n.id} className="space-y-2 rounded-lg border p-3">
        {n.post_exists && n.post_id ? <button type="button" className="w-full space-y-2 text-left" aria-expanded={open} onClick={() => { setOpenId(open ? null : n.id); if (!n.is_read) void markRead(n.id); }}>{body}<span className="block text-sm font-bold text-primary">{open ? 'ప్రకటన మూసివేయండి' : 'ప్రకటన చూడండి'}</span></button>
          : board ? <Link to="/bell-board" search={{ section: board, category: n.category || undefined, post: undefined }} className="block space-y-2" onClick={() => { if (!n.is_read) void markRead(n.id); }}>{body}<span className="block text-sm font-bold text-primary">గంట జాబితా చూడండి</span></Link>
          : <div className="space-y-2">{body}{n.post_id && <span className="block text-sm">ఈ ప్రకటన తొలగించబడింది</span>}</div>}
        {open && n.post_id && <NoticePost id={n.post_id} />}
        {!n.is_read && <Button variant="outline" onClick={() => void markRead(n.id)}>చూశాను</Button>}
      </article>;
    })}
  </section>;
}
