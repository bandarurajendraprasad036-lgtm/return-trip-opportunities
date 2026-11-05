import {useMe} from '@/lib/session';
import {Button} from '@/components/ui/button';
import {supabase} from '@/integrations/supabase/client';
export function AccountBlockGate({children}:{children:React.ReactNode}) {const {data:me}=useMe();if(me?.block)return <main className="min-h-screen space-y-4 p-6"><h1 className="text-2xl font-bold">మీ ఖాతా నిలిపివేశారు · Account blocked</h1><p>{me.block.reason}</p><Button onClick={()=>supabase.auth.signOut()}>బయటకు వెళ్లండి · Sign out</Button></main>;return children;}