import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { usePrime99 } from '@/lib/prime99';
import { Button } from '@/components/ui/button';
import { PaymentScanner } from '@/components/PaymentScanner';
import { MembershipEvidenceForm } from '@/components/MembershipEvidenceForm';
import { hasLocalPaymentEvidence } from '@/lib/local-payment-evidence';
export function Prime99Payment({bellPayment=false}:{bellPayment?:boolean}) {
 const {data:me}=useMe();const {data:prime}=usePrime99(me?.id);const [discount,setDiscount]=useState(false);const [paidFor,setPaidFor]=useState<number|null>(null);
 const [savedOwner,setSavedOwner]=useState<string|null>(null);
 useEffect(()=>{const owner=me?.id;if(!owner)return;let active=true;const refresh=()=>{void hasLocalPaymentEvidence(owner).then(saved=>{if(active)setSavedOwner(saved?owner:null);}).catch(()=>{if(active)setSavedOwner(null);});};refresh();window.addEventListener('gayatri-local-payment-saved',refresh);return()=>{active=false;window.removeEventListener('gayatri-local-payment-saved',refresh);};},[me?.id]);
 const price=useQuery({queryKey:['membership-price',me?.id],enabled:!!me,queryFn:async()=>{const r=await supabase.rpc('my_membership_price');if(r.error)throw r.error;return r.data;}});
 const request=useQuery({queryKey:['my-membership-request',me?.id],enabled:!!me,refetchInterval:15000,queryFn:async()=>{if(!me)return null;const r=await supabase.from('membership_requests').select('status').eq('user_id',me.id).order('submitted_at',{ascending:false}).limit(1).maybeSingle();if(r.error)throw r.error;return r.data?.status??null;}});
 if(!me)return null; const amount=discount?80:100;
 const completed=!!prime?.active;const waiting=!completed&&request.data==='pending';const savedLocally=savedOwner===me.id;
 return <section className="space-y-4 border-y py-4 profile-copy"><h2 className="text-xl font-bold">₹100 ప్రైమ్ మెంబర్ షిప్ <span className="block text-xs font-normal">Prime Membership</span></h2>
 {prime?.active&&<p role="status" className="font-bold">{prime.provisional?'మీ తాత్కాలిక చందా ప్రారంభమైంది':'మీ ప్రైమ్ ఆన్ అయింది'}{prime.ends_at&&` · ${new Date(prime.ends_at).toLocaleDateString('te-IN')} వరకు`}</p>}
 <div className="grid gap-3 sm:grid-cols-2"><article className="space-y-2 rounded-lg border p-3"><h3 className="text-xl font-bold">ఉచితం</h3><p>ఏ విభాగంలో అయినా ఎవరైనా ఉచితంగా పోస్ట్ పెట్టొచ్చు.</p><p>పని, సేవల ప్రకటనలు చూడటం ఉచితం.</p><p>యజమాని అనుమతించిన ఫోన్ నంబర్ చూడటం ఉచితం.</p></article><article className="space-y-2 rounded-lg border-2 border-primary bg-primary/10 p-3"><h3 className="text-xl font-bold">వాహన వివరాలు — రూ.100 / నెలకు</h3><p>వాహన పూర్తి వివరాలు, యజమాని అనుమతించిన ఫోన్ నంబర్ చూడవచ్చు.</p></article></div>
 <p className="text-sm">చెల్లించిన రోజు నుండి ఒక నెల వరకు ఉంటుంది.</p>
 <h3 className="font-bold">గమనిక:</h3><p>డబ్బు కట్టినంత మాత్రాన మీకు కస్టమర్ వస్తాడని గ్యారెంటీ లేదు.</p>
 {!completed&&!waiting&&!bellPayment&&<div className="grid grid-cols-2 gap-2"><Button className="h-auto whitespace-normal" variant={!discount?'default':'outline'} onClick={()=>setDiscount(false)}>ప్రైమ్ అవ్వండి - ₹100 కట్టండి / Become Prime</Button><Button className="h-auto whitespace-normal" variant={discount?'default':'outline'} disabled={price.data!==80} onClick={()=>setDiscount(true)}>రిఫరల్ పేమెంట్ ₹80</Button></div>}
 {discount&&<p className="text-sm">ఇది రిఫరల్ సర్వీస్ ప్రొవైడర్స్ ని రిఫర్ చేసిన వారి పేమెంట్. మీకు తెలిసిన ఎలక్ట్రిషియన్, ప్లంబర్ లాంటి వారిని రిఫర్ చేస్తే ₹80 కట్టండి.</p>}
 {completed?<p role="status" className="font-bold">చెల్లింపు అయింది — విజయవంతం</p>:waiting?<p role="status" className="font-bold">మీ వివరాలు అందాయి. అడ్మిన్ చెక్ చేసి ఆమోదిస్తారు.</p>:<>{savedLocally&&<p role="status" className="font-bold">వివరాలు భద్రపడ్డాయి</p>}<PaymentScanner amount={amount} onPaid={()=>setPaidFor(amount)}/>{paidFor===amount&&<MembershipEvidenceForm key={`${me.id}-${amount}`} amount={amount}/>}</>}</section>;
}
