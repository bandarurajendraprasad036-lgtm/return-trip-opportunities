import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { deleteOwnPost } from '@/lib/delete-own-post';
import { useMe } from '@/lib/session';
export function DeleteOwnPost({ id, owner }: { id: string; owner: string }) {
  const [busy,setBusy] = useState(false); const qc=useQueryClient(); const { data: me } = useMe();
  if (!me || (me.id !== owner && !me.isAdmin)) return null;
  const mine = me.id === owner;
  return <Button variant="destructive" disabled={busy} data-subscription-exempt className="h-auto min-h-11 whitespace-normal" onClick={async()=>{
    if(busy || !window.confirm('నిజంగా డిలీట్ చెయ్యాలా?'))return;
    setBusy(true);try{await deleteOwnPost(id);toast.success('ప్రకటన డిలీట్ అయింది');await qc.invalidateQueries();}catch{toast.error('ప్రకటన డిలీట్ కాలేదు; మళ్లీ ప్రయత్నించండి');}finally{setBusy(false);}
  }}><Trash2 />{mine ? 'నా ప్రకటన డిలీట్ చేయండి' : 'డిలీట్'}</Button>;
}
