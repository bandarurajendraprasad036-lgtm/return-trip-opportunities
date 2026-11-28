import {useMe} from '@/lib/session';
import {Button} from '@/components/ui/button';
import {supabase} from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
export function AccountBlockGate({children}:{children:React.ReactNode}) {
  const {data:me,isError,refetch}=useMe();
  const qc=useQueryClient();
  const navigate=useNavigate();
  async function leave() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    await navigate({to:'/auth',replace:true});
  }
  if(isError)return <main className="min-h-screen space-y-4 p-6"><p role="alert">ఖాతా స్థితి చూడలేకపోయాం. మళ్లీ ప్రయత్నించండి.</p><Button onClick={()=>void refetch()}>మళ్లీ చూడండి</Button></main>;
  if(me?.block)return <main className="min-h-screen space-y-4 p-6"><h1 className="text-2xl font-bold">మీ ఖాతా నిలిపివేశారు</h1><p>{me.block.reason}</p><Button onClick={()=>void leave()}>బయటకు వెళ్లండి</Button></main>;
  return children;
}