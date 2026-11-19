import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { deleteOwnPost } from '@/lib/delete-own-post';
export function DeleteOwnPost({ id, owner }: { id: string; owner: string }) {
  const [busy,setBusy] = useState(false); const qc=useQueryClient();
  return <Button variant="destructive" disabled={busy} data-subscription-exempt className="h-auto min-h-11 whitespace-normal" onClick={async()=>{
    if(busy || !window.confirm('మీ ప్రకటనను తొలగించాలా?'))return;
    setBusy(true);try{await deleteOwnPost(id,owner);toast.success('మీ ప్రకటన తొలగించారు');await qc.invalidateQueries();}catch{toast.error('ప్రకటన తొలగించలేదు; మళ్లీ ప్రయత్నించండి');}finally{setBusy(false);}
  }}><Trash2 />నా ప్రకటన తొలగించండి</Button>;
}