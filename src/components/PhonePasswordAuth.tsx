import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { KeyRound, LogIn, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { hasValidMobile } from '@/lib/phone';
import { loginEmailForPhone, pinCredential, pinPairError } from '@/lib/phone-password';
import { takeAuthReturn } from '@/lib/auth-navigation';
import { accountDashboard } from '@/lib/admin-navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

export function PhonePasswordAuth() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotDone, setForgotDone] = useState('');

  const finish = async () => {
    await qc.invalidateQueries();
    const identity=await supabase.auth.getUser();
    if(!identity.data.user)throw new Error('SIGN_IN_REQUIRED');
    const role=await supabase.rpc('has_role',{_user_id:identity.data.user.id,_role:'admin'});
    if(role.error)throw role.error;
    if(role.data){takeAuthReturn('/');await navigate({to:accountDashboard(true),search:{},replace:true});}
    else await navigate({ href: takeAuthReturn('/'), replace: true });
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!hasValidMobile(phone)) { setError('సరైన 10 అంకెల మొబైల్ నంబర్ ఇవ్వండి'); return; }
    if (mode === 'signup') { const problem = pinPairError(password, again); if (problem) { setError(problem); return; } }
    setBusy(true); setError('');
    try {
      const email = loginEmailForPhone(phone);
      if (mode === 'login') {
        let result = await supabase.auth.signInWithPassword({ email, password: pinCredential(password) });
        if (result.error && password.length >= 6) result = await supabase.auth.signInWithPassword({ email, password });
        if (result.error) { setError('మొబైల్ నంబర్ లేదా పిన్ సరిపోలలేదు. కొత్తవారైతే "కొత్త ఖాతా" నొక్కండి'); return; }
      } else {
        const result = await supabase.auth.signUp({ email, password: pinCredential(password), options: { data: { phone }, emailRedirectTo: window.location.origin } });
        if (result.error) { setError(result.error.message.toLowerCase().includes('registered') ? 'ఈ నంబర్‌తో ఇప్పటికే ఖాతా ఉంది. ప్రవేశించండి లేదా "పాస్వర్డ్ మర్చిపోయాను?" నొక్కండి' : 'ఖాతా తయారు కాలేదు. మళ్ళీ ప్రయత్నించండి'); return; }
        if (!result.data.session) { const login = await supabase.auth.signInWithPassword({ email, password: pinCredential(password) }); if (login.error) { setError('ఈ నంబర్‌తో ఇప్పటికే ఖాతా ఉంది. ప్రవేశించండి'); return; } }
      }
      await finish();
    } catch { setError('సర్వర్‌కు చేరలేదు. కొద్దిసేపటి తర్వాత మళ్ళీ ప్రయత్నించండి'); }
    finally { setBusy(false); }
  };
  const sendForgot = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hasValidMobile(forgotPhone) || busy) return;
    setBusy(true);
    try {
      const result = await supabase.rpc('request_password_reset', { _phone: forgotPhone });
      if (result.error) throw result.error;
      setForgotDone('మీ అభ్యర్థన అడ్మిన్‌కు చేరింది. ఈ నంబర్‌తో ఖాతా ఉంటే, అడ్మిన్ మీకు ఫోన్ చేసి నిర్ధారించి కొత్త పాస్వర్డ్ పెడతారు. ఆ తర్వాత ఆ పాస్వర్డ్‌తో ప్రవేశించండి.');
    } catch { setForgotDone('అభ్యర్థన చేరలేదు. మళ్ళీ ప్రయత్నించండి'); }
    finally { setBusy(false); }
  };
  return <section className="space-y-4 border-y py-4" aria-label="మొబైల్ నంబర్‌తో ప్రవేశం">
    <div className="grid grid-cols-2 gap-2" role="group">
      <Button type="button" variant={mode === 'login' ? 'default' : 'outline'} className="min-h-12 text-lg" onClick={() => { setMode('login'); setError(''); }}><LogIn />ప్రవేశం</Button>
      <Button type="button" variant={mode === 'signup' ? 'default' : 'outline'} className="min-h-12 text-lg" onClick={() => { setMode('signup'); setError(''); }}><UserPlus />కొత్త ఖాతా</Button>
    </div>
    <form className="space-y-3" onSubmit={submit}>
      <div className="space-y-1"><Label htmlFor="pw-phone" className="text-base">మొబైల్ నంబర్</Label><Input id="pw-phone" type="tel" inputMode="numeric" autoComplete="username" value={phone} onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setError(''); }} maxLength={10} placeholder="10 అంకెల నంబర్" className="h-12 text-lg" /></div>
      <div className="space-y-1"><Label htmlFor="pw-password" className="text-base">4 అంకెల పిన్</Label><Input id="pw-password" type="password" inputMode={mode === 'signup' ? 'numeric' : 'text'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => { setPassword(mode === 'signup' ? e.target.value.replace(/\D/g, '').slice(0, 4) : e.target.value); setError(''); }} maxLength={mode === 'signup' ? 4 : 72} className="h-12 text-lg" /></div>
      {mode === 'login' && <Button type="button" variant="link" className="h-auto px-0 text-base" onClick={() => { setForgotPhone(phone); setForgotDone(''); setForgotOpen(true); }}><KeyRound />పిన్ మర్చిపోయాను?</Button>}
      {mode === 'signup' && <div className="space-y-1"><Label htmlFor="pw-again" className="text-base">పిన్ మళ్ళీ</Label><Input id="pw-again" type="password" inputMode="numeric" autoComplete="new-password" value={again} onChange={e => { setAgain(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }} maxLength={4} className="h-12 text-lg" /></div>}
      <Button type="submit" className="min-h-14 w-full text-lg" disabled={busy}>{busy ? 'వేచి ఉండండి…' : mode === 'login' ? 'ప్రవేశించండి' : 'ఖాతా తయారు చేయండి'}</Button>
      {error && <p role="alert" className="text-base text-destructive">{error}</p>}
    </form>
    <Dialog open={forgotOpen} onOpenChange={setForgotOpen}><DialogContent><DialogTitle>పాస్వర్డ్ మర్చిపోయాను</DialogTitle><DialogDescription>మీ మొబైల్ నంబర్ ఇవ్వండి. అడ్మిన్ మీతో మాట్లాడి నిర్ధారించిన తర్వాతే కొత్త పాస్వర్డ్ పెడతారు.</DialogDescription>
      <form className="space-y-3" onSubmit={sendForgot}><Input type="tel" inputMode="numeric" aria-label="మొబైల్ నంబర్" value={forgotPhone} onChange={e => { setForgotPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setForgotDone(''); }} maxLength={10} placeholder="10 అంకెల నంబర్" className="h-12 text-lg" /><Button type="submit" className="min-h-12 w-full" disabled={busy || !hasValidMobile(forgotPhone)}>అడ్మిన్‌కు పంపండి</Button>{forgotDone && <p role="status" className="text-base">{forgotDone}</p>}</form>
    </DialogContent></Dialog>
  </section>;
}
