import { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Video, LockKeyhole } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useMe } from '@/lib/session';
import { playBell, stopBell, enableBellAudio } from '@/lib/bell';
import { readCommunicationChoices } from '@/lib/dashboard-communications';
import { toast } from 'sonner';

const ICE = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
export const START_CALL_EVENT = 'gayatri-start-call';
export function startCall(peer: string, video: boolean) { window.dispatchEvent(new CustomEvent(START_CALL_EVENT, { detail: { peer, video } })); }
type Offer = { sdp: RTCSessionDescriptionInit; video: boolean };

/** Durable participant-private signalling; media is browser-to-browser, never WhatsApp. */
export function CallManager() {
  const { data: me } = useMe();
  const [state, setState] = useState<'idle' | 'calling' | 'ringing' | 'live'>('idle');
  const [video, setVideo] = useState(false);
  const pc = useRef<RTCPeerConnection | null>(null);
  const peer = useRef(''), call = useRef('');
  const pending = useRef<Offer | null>(null);
  const stream = useRef<MediaStream | null>(null), remote = useRef<MediaStream | null>(null);
  const localV = useRef<HTMLVideoElement>(null), remoteV = useRef<HTMLVideoElement>(null);
  const candidates = useRef<RTCIceCandidateInit[]>([]);
  const outboundIce = useRef<RTCIceCandidateInit[]>([]), descriptionSent = useRef(false);
  const active = useRef(true);
  const cleanup = () => {
    stopBell(); pc.current?.close(); pc.current = null;
    stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; remote.current = null;
    pending.current = null; candidates.current = []; outboundIce.current = []; descriptionSent.current = false; call.current = ''; peer.current = ''; setState('idle');
  };
  const send = async (kind: 'offer' | 'answer' | 'ice' | 'end', payload: object = {}) => {
    if (!call.current) return;
    const r = await supabase.rpc('send_app_call_signal', { _call: call.current, _kind: kind, _payload: JSON.parse(JSON.stringify(payload)) });
    if (r.error) throw r.error;
  };
  const end = async () => { try { await send('end'); } finally { cleanup(); } };
  const sendDescription = async (kind: 'offer' | 'answer', sdp: RTCSessionDescriptionInit) => {
    await send(kind, { sdp }); descriptionSent.current = true;
    for (const ice of outboundIce.current.splice(0)) await send('ice', { ice });
  };
  const connect = async (withVideo: boolean) => {
    const media = await navigator.mediaDevices.getUserMedia({ audio: true, video: withVideo });
    if (!active.current || !call.current) { media.getTracks().forEach(t => t.stop()); throw new Error('CALL_ENDED'); }
    const conn = new RTCPeerConnection({ iceServers: ICE }); pc.current = conn; stream.current = media;
    conn.onicecandidate = e => { if (!e.candidate) return; const ice=e.candidate.toJSON(); if (!descriptionSent.current) outboundIce.current.push(ice); else void send('ice', { ice }).catch(() => void end().catch(() => {})); };
    conn.ontrack = e => { remote.current = e.streams[0] ?? new MediaStream([e.track]); if (remoteV.current) { remoteV.current.srcObject = remote.current; void remoteV.current.play().catch(() => {}); } };
    conn.onconnectionstatechange = () => { if (conn.connectionState === 'connected') setState('live'); if (['failed', 'closed'].includes(conn.connectionState) && pc.current === conn) void end().catch(() => {}); };
    media.getTracks().forEach(t => conn.addTrack(t, media));
    if (localV.current) localV.current.srcObject = media;
    return conn;
  };
  const applyCandidates = async (conn: RTCPeerConnection) => { for (const ice of candidates.current.splice(0)) await conn.addIceCandidate(ice); };
  const answer = async () => {
    const offer = pending.current; if (!offer) return; stopBell();
    try {
      const allowed = await supabase.rpc('can_call_member', { _other: peer.current });
      if (allowed.error || allowed.data !== true) throw new Error('BOTH_PAID_REQUIRED');
      const conn = await connect(offer.video); await conn.setRemoteDescription(offer.sdp); await applyCandidates(conn);
      const sdp = await conn.createAnswer(); await conn.setLocalDescription(sdp); await sendDescription('answer', sdp); setState('calling');
    } catch { toast.error('పిలుపు కలవలేదు. ఇద్దరి చందా, మైకు అనుమతి పరిశీలించండి'); void end().catch(() => {}); }
  };
  useEffect(() => {
    if (localV.current) localV.current.srcObject = stream.current;
    if (remoteV.current) remoteV.current.srcObject = remote.current;
  }, [state, video]);
  useEffect(() => {
    if (!me) return;
    active.current = true;
    let cursor = 0, polling = false;
    const since = new Date().toISOString();
    // Recover unanswered calls even if the calling phone closed before its timer ran.
    void supabase.rpc('expire_app_calls');
    const poll = async () => {
      if (polling) return; polling = true;
      try {
        const r = await supabase.from('app_call_signals').select('*').eq('receiver_id', me.id).gte('created_at', since).gt('id', cursor).order('id').limit(100);
        if (r.error) throw r.error;
        for (const row of r.data ?? []) {
          cursor = row.id; if (!active.current) return;
          const s = row.payload as { sdp?: RTCSessionDescriptionInit; ice?: RTCIceCandidateInit };
          if (row.kind === 'offer') {
            if (!s.sdp || call.current) continue;
            const allowed = await supabase.rpc('can_call_member', { _other: row.sender_id });
            const c = await supabase.from('app_calls').select('video,ended_at').eq('id', row.call_id).single();
            const choices = readCommunicationChoices(me.id);
            if (allowed.error || !allowed.data || c.error || c.data.ended_at || !(c.data.video ? choices.video : choices.voice)) continue;
            call.current = row.call_id; peer.current = row.sender_id; pending.current = { sdp: s.sdp, video: c.data.video };
            setVideo(c.data.video); setState('ringing'); enableBellAudio(); if (choices.bell) playBell();
          } else if (row.call_id === call.current) {
            if (row.kind === 'answer' && s.sdp && pc.current) { await pc.current.setRemoteDescription(s.sdp); await applyCandidates(pc.current); }
            else if (row.kind === 'ice' && s.ice) { if (pc.current?.remoteDescription) await pc.current.addIceCandidate(s.ice); else candidates.current.push(s.ice); }
            else if (row.kind === 'end') cleanup();
          }
        }
        if (call.current) {
          const allowed = await supabase.rpc('can_call_member', { _other: peer.current });
          if (allowed.error || allowed.data !== true) await end();
        }
      } catch { /* transient read failure retries; no public signal fallback */ } finally { polling = false; }
    };
    const start = async (e: Event) => {
      const { peer: to, video: v } = (e as CustomEvent<{ peer: string; video: boolean }>).detail;
      if (call.current) return;
      const choices = readCommunicationChoices(me.id);
      if (!(v ? choices.video : choices.voice)) { toast.error('ఈ పిలుపు ఎంపికను మీ పేజీలో తెరవండి'); return; }
      try {
        const r = await supabase.rpc('begin_app_call', { _other: to, _video: v });
        if (r.error || !r.data) throw new Error('CALL_DENIED');
        call.current = r.data; peer.current = to; setVideo(v); setState('calling');
        const conn = await connect(v); const sdp = await conn.createOffer(); await conn.setLocalDescription(sdp); await sendDescription('offer', sdp);
      } catch { toast.error('పిలుపు కలవలేదు. ఇద్దరి చందా, మైకు అనుమతి, అంతర్జాలం పరిశీలించండి'); void end().catch(() => {}); }
    };
    const timer = window.setInterval(() => void poll(), 1000);
    window.addEventListener(START_CALL_EVENT, start);
    return () => { active.current = false; window.clearInterval(timer); window.removeEventListener(START_CALL_EVENT, start); void end().catch(() => {}); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id]);
  useEffect(() => { if (state === 'idle' || state === 'live') return; const timer = window.setTimeout(() => { toast.error('పిలుపుకు సమాధానం రాలేదు'); void end().catch(() => {}); }, 60000); return () => window.clearTimeout(timer); }, [state]);
  if (state === 'idle') return null;
  return <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-background p-4" role="dialog" aria-label="పిలుపు">
    <p className="text-2xl font-bold">{state === 'ringing' ? 'గాయత్రి వన్ పిలుపు వస్తోంది…' : state === 'calling' ? 'పిలుస్తున్నాం…' : 'మాట్లాడుతున్నారు'}</p>
    <video ref={remoteV} autoPlay playsInline className={video ? 'w-full max-w-md rounded-lg bg-muted' : 'h-px w-px opacity-0'} />
    <video ref={localV} autoPlay playsInline muted className={video ? 'w-32 rounded-lg' : 'hidden'} />
    <div className="flex flex-wrap gap-4">{state === 'ringing' && <Button size="lg" className="min-h-16 text-lg" onClick={() => void answer()}><Phone />ఎత్తండి</Button>}<Button size="lg" variant="destructive" className="min-h-16 text-lg" onClick={() => void end().catch(() => {})}><PhoneOff />ముగించండి</Button></div>
  </div>;
}
export function CallButtons({ peer }: { peer: string }) {
  const { data: me } = useMe();
  const { data: allowed } = useQuery({ queryKey: ['call-allowed', me?.id, peer], enabled: !!me && me.id !== peer, refetchInterval: 5000, queryFn: async () => { const r = await supabase.rpc('can_call_member', { _other: peer }); if (r.error) throw r.error; return r.data; } });
  const { data: phone } = useQuery({ queryKey: ['call-dial', me?.id, peer], enabled: allowed === true, refetchInterval: 5000, queryFn: async () => { const r = await supabase.rpc('app_call_dial_number', { _other: peer }); if (r.error) throw r.error; return r.data; } });
  if (!me || me.id === peer) return null;
  if (allowed !== true) return <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><LockKeyhole className="size-4 shrink-0" />ఇద్దరి చందా ఉంటేనే పిలుపులు</p>;
  return <div className="flex flex-wrap gap-2" data-subscription-exempt>
    <Button variant="outline" title="యాప్‌లో మాట పిలుపు" aria-label="మాట పిలుపు" onClick={() => startCall(peer, false)}><Phone />పిలుపు</Button>
    <Button variant="outline" title="యాప్‌లో వీడియో పిలుపు" aria-label="వీడియో పిలుపు" onClick={() => startCall(peer, true)}><Video />వీడియో</Button>
    {phone && <Button variant="outline" title="సాధారణ ఫోన్ పిలుపు" onClick={async () => { const r = await supabase.rpc('app_call_dial_number', { _other: peer }); if (r.error || !r.data) { toast.error('ఈ ఫోన్ పిలుపుకు అనుమతి లేదు'); return; } window.location.href = `tel:+91${r.data}`; }}><Phone /><span translate="no">{phone}</span></Button>}
  </div>;
}
