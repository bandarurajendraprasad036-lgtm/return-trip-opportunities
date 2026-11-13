import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMe } from '@/lib/session';
import { usePrime99 } from '@/lib/prime99';
import { Button } from '@/components/ui/button';
import { PaymentScanner } from '@/components/PaymentScanner';
import { MembershipEvidenceForm } from '@/components/MembershipEvidenceForm';
export function Prime99Payment({bellPayment=false}:{bellPayment?:boolean}) {
 const {data:me}=useMe();const {data:prime}=usePrime99(me?.id);const [discount,setDiscount]=useState(false);const [paidFor,setPaidFor]=useState<number|null>(null);
 const price=useQuery({queryKey:['membership-price',me?.id],enabled:!!me,queryFn:async()=>{const r=await supabase.rpc('my_membership_price');if(r.error)throw r.error;return r.data;}});
 const quota=useQuery({queryKey:['post-quota99',me?.id],enabled:!!me,queryFn:async()=>{const r=await supabase.rpc('my_post_quota99');if(r.error)throw r.error;return r.data as {used:number;limit:number};}});
 if(!me)return null; const amount=discount?80:100;
 return <section className="space-y-4 border-y py-4 profile-copy"><h2 className="text-xl font-bold">₹100 ప్రైమ్ మెంబర్ షిప్ <span className="block text-xs font-normal">Prime Membership</span></h2>
 {prime?.active&&<p role="status" className="font-bold">{prime.provisional?'అడ్మిన్ వెరిఫికేషన్ కోసం వెయిటింగ్':'మీ ప్రైమ్ ఆన్ అయింది'}{prime.ends_at&&` · ${new Date(prime.ends_at).toLocaleDateString('te-IN')} వరకు`}</p>}
 <div className="grid gap-3 sm:grid-cols-2"><article className="space-y-2 rounded-lg border p-3"><h3 className="text-xl font-bold">ఫ్రీ - ₹0</h3><p>నెలకు 3 పోస్టులు ఫ్రీగా పెట్టవచ్చు</p><p>అందరి పోస్టులు ఫ్రీగా చూడవచ్చు</p><p>3 కంటే ఎక్కువ పోస్టు పెడితే, ఒక్కో పోస్టుకు ₹49</p></article><article className="space-y-2 rounded-lg border-2 border-primary bg-primary/10 p-3"><h3 className="text-xl font-bold">ప్రైమ్ - ₹100 / నెలకు</h3><p>మీకు తెలిసిన 20 మంది నంబర్లు ఇస్తే, కేవలం ₹80 మాత్రమే!</p><p>నంబర్లు మేము పరిశీలించిన తర్వాతే ₹80 చెల్లించండి.</p><p>అన్ లిమిటెడ్ పోస్టులు పెట్టవచ్చు</p><p>మీకు సంబంధించిన జాబ్ వస్తే నోటిఫికేషన్ ఆటోమేటిక్ గా వస్తుంది</p><p>డైరెక్ట్ గా చాట్ చేసుకోవచ్చు, ఫోన్ చేసుకోవచ్చు</p></article></div>
 <p className="text-sm">ప్రైమ్ తీసుకున్న రోజు నుండి 1 నెల వరకు ఉంటుంది. గంట నోటిఫికేషన్ కావాలంటే మీ ఫోన్ లో నోటిఫికేషన్ ON చేసుకోండి.</p><p>ఈ నెల పోస్ట్లు {quota.data?.used??'—'}/3</p>
 <h3 className="font-bold">గమనిక - దయచేసి చదవండి:</h3><p>డబ్బు కట్టినంత మాత్రాన మీకు కస్టమర్ వస్తాడని గ్యారెంటీ లేదు.</p><p>మరి ఈ ₹100 ఎందుకు తీసుకుంటున్నామంటే - మీరు ఎప్పుడైనా కూడా ఎక్కడెక్కడ బండ్లు ఎక్కడికి వెళ్తున్నాయి, ఎలా వెళ్తున్నాయి - అన్నీ A to Z చూసుకునేందుకు, ప్లస్ ఎక్కడెక్కడ జాబ్స్ ఉన్నాయి - టోటల్ చూసుకునేందుకు, మీకు సంబంధించిన జాబ్ వస్తే నోటిఫికేషన్ ఆటోమేటిక్ గా వస్తుందని తెలిపేందుకు మాత్రమే ఈ ₹100 తీసుకుంటున్నాము.</p><p>ఈ ₹100 కేవలం ఒక నెల మీ ప్రకటన ఖర్చులు, మా కంపెనీ ఖర్చుల కోసం మాత్రమే. సేవా భావంతో తీసుకుంటున్నాము తప్ప వేరే ఏమీ లేదు, లాభాలు ఆశించి కాదు.</p>
 {!bellPayment&&<div className="grid grid-cols-2 gap-2"><Button className="h-auto whitespace-normal" variant={!discount?'default':'outline'} onClick={()=>setDiscount(false)}>ప్రైమ్ అవ్వండి - ₹100 కట్టండి / Become Prime</Button><Button className="h-auto whitespace-normal" variant={discount?'default':'outline'} disabled={price.data!==80} onClick={()=>setDiscount(true)}>రిఫరల్ పేమెంట్ ₹80</Button></div>}
 {discount&&<p className="text-sm">ఇది రిఫరల్ సర్వీస్ ప్రొవైడర్స్ ని రిఫర్ చేసిన వారి పేమెంట్. మీకు తెలిసిన ఎలక్ట్రిషియన్, ప్లంబర్ లాంటి వారిని రిఫర్ చేస్తే ₹80 కట్టండి.</p>}
 <PaymentScanner amount={amount} onPaid={()=>setPaidFor(amount)}/>{paidFor===amount&&<MembershipEvidenceForm key={`${me.id}-${amount}`} amount={amount}/>}</section>;
}
