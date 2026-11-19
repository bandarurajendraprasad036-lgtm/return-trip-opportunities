import { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useMe } from '@/lib/session';
import { playBell, stopBell, enableBellAudio } from '@/lib/bell';
import { readCommunicationChoices } from '@/lib/dashboard-communications';
import { toast } from 'sonner';

type Signal = { type: 'offer' | 'answer' | 'ice' | 'end'; from: string; video?: boolean; sdp?: RTCSessionDescriptionInit; ice?: RTCIceCandidateInit };
const ICE = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
export const START_CALL_EVENT = 'gayatri-start-call';
export function startCall(peer: string, video: boolean) { window.dispatchEvent(new CustomEvent(START_CALL_EVENT, { detail: { peer, video } })); }

/** Peer-to-peer voice/video calls; signalling goes over a per-user broadcast topic, media never touches the server. */
export function CallManager() {
  const { data: me } = useMe();
  const [state, setState] = useState<'idle' | 'calling' | 'ringing' | 'live'>('idle');
  const [video, setVideo] = useState(false);
  const pc = useRef<RTCPeerConnection | null>(null);
  const peer = useRef<string>('');
  const pendingOffer = useRef<Signal | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const localV = useRef<HTMLVideoElement>(null), remoteV = useRef<HTMLVideoElement>(null);
  const channels = useRef<Map<string, RealtimeChannel>>(new Map());

  const send = async (to: string, s: Omit<Signal, 'from'>) => {
    if (!me) return;
    let ch = channels.current.get(to);
    if (!ch) { const created = supabase.channel(`call-${to}`); ch = created; channels.current.set(to, created); await new Promise<void>((resolve, reject) => { const timeout = setTimeout(() => reject(new Error('CALL_UNAVAILABLE')), 10000); created.subscribe(st => { if (st === 'SUBSCRIBED') { clearTimeout(timeout); resolve(); } else if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT') { clearTimeout(timeout); reject(new Error('CALL_UNAVAILABLE')); } }); }); }
    await ch.send({ type: 'broadcast', event: 'signal', payload: { ...s, from: me.id } });
  };
  const cleanup = () => {
    stopBell(); pc.current?.close(); pc.current = null; stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; pendingOffer.current = null; setState('idle');
  };
  const connect = async (to: string, withVideo: boolean) => {
    const conn = new RTCPeerConnection({ iceServers: ICE }); pc.current = conn; peer.current = to;
    conn.onicecandidate = e => { if (e.candidate) void send(to, { type: 'ice', ice: e.candidate.toJSON() }); };
    conn.ontrack = e => { if (remoteV.current) remoteV.current.srcObject = e.streams[0] ?? null; };
    conn.onconnectionstatechange = () => { if (['failed', 'closed'].includes(conn.connectionState)) cleanup(); };
    const media = await navigator.mediaDevices.getUserMedia({ audio: true, video: withVideo });
    stream.current = media; media.getTracks().forEach(t => conn.addTrack(t, media));
    if (localV.current) localV.current.srcObject = media;
    return conn;
  };
  const end = () => { if (peer.current) void send(peer.current, { type: 'end' }); cleanup(); };
  const answer = async () => {
    const offer = pendingOffer.current; if (!offer?.sdp) return; stopBell();
    try {
      const conn = await connect(offer.from, !!offer.video);
      await conn.setRemoteDescription(offer.sdp); const a = await conn.createAnswer(); await conn.setLocalDescription(a);
      await send(offer.from, { type: 'answer', sdp: a }); setState('live');
    } catch { end(); }
  };

  useEffect(() => {
    if (!me) return;
    const ch = supabase.channel(`call-${me.id}`).on('broadcast', { event: 'signal' }, async ({ payload }) => {
      const s = payload as Signal;
      if (!s || typeof s.from !== 'string' || s.from === me.id) return;
      if (s.type === 'offer') { if (!s.sdp) return; const allowed = await supabase.rpc('can_post_chat', { _other: s.from }); const choices = readCommunicationChoices(me.id); if (allowed.error || allowed.data !== true || !(s.video ? choices.video : choices.voice)) return; if (pc.current) { void send(s.from, { type: 'end' }); return; } pendingOffer.current = s; peer.current = s.from; setVideo(!!s.video); setState('ringing'); enableBellAudio(); if (choices.bell) playBell(); }
      else if (s.from !== peer.current) return;
      else if (s.type === 'answer' && pc.current && s.sdp) { await pc.current.setRemoteDescription(s.sdp); setState('live'); }
      else if (s.type === 'ice' && pc.current) { try { await pc.current.addIceCandidate(s.ice); } catch { /* late candidate */ } }
      else if (s.type === 'end') cleanup();
    }).subscribe();
    const start = async (e: Event) => {
      const { peer: to, video: v } = (e as CustomEvent<{ peer: string; video: boolean }>).detail;
      const choices = readCommunicationChoices(me.id);
      if (!(v ? choices.video : choices.voice)) { toast.error('ఈ పిలుపు ఎంపికను మీ పేజీలో తెరవండి'); return; }
      const allowed = await supabase.rpc('can_post_chat', { _other: to });
      if (allowed.error || allowed.data !== true) { toast.error('ఈ సభ్యునితో పిలుపుకు అనుమతి లేదు'); return; }
      if (pc.current) return; setVideo(v); setState('calling');
      try { const conn = await connect(to, v); const o = await conn.createOffer(); await conn.setLocalDescription(o); await send(to, { type: 'offer', video: v, sdp: o }); }
      catch { toast.error('పిలుపు కలవలేదు. మైకు అనుమతి, అంతర్జాలం పరిశీలించండి'); cleanup(); }
    };
    window.addEventListener(START_CALL_EVENT, start);
    const list = channels.current;
    return () => { window.removeEventListener(START_CALL_EVENT, start); stopBell(); pc.current?.close(); stream.current?.getTracks().forEach(t => t.stop()); supabase.removeChannel(ch); list.forEach(c => supabase.removeChannel(c)); list.clear(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me?.id]);

  if (state === 'idle') return null;
  return <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-background p-4" role="dialog" aria-label="పిలుపు">
    <p className="text-2xl font-bold">{state === 'ringing' ? 'గాయత్రి వన్ పిలుపు వస్తోంది…' : state === 'calling' ? 'పిలుస్తున్నాం…' : 'మాట్లాడుతున్నారు'}</p>
    <video ref={remoteV} autoPlay playsInline className={video ? 'w-full max-w-md rounded-xl bg-muted' : 'hidden'} />
    <video ref={localV} autoPlay playsInline muted className={video ? 'w-32 rounded-lg' : 'hidden'} />
    <div className="flex gap-6">
      {state === 'ringing' && <Button size="lg" className="min-h-16 min-w-32 text-lg" onClick={() => void answer()}><Phone />ఎత్తండి</Button>}
      <Button size="lg" variant="destructive" className="min-h-16 min-w-32 text-lg" onClick={end}><PhoneOff />ముగించండి</Button>
    </div>
  </div>;
}
export function CallButtons({ peer }: { peer: string }) {
  return <div className="flex gap-1" data-subscription-exempt>
    <Button size="icon" variant="outline" aria-label="వాయిస్ కాల్" onClick={() => startCall(peer, false)}><Phone /></Button>
    <Button size="icon" variant="outline" aria-label="వీడియో కాల్" onClick={() => startCall(peer, true)}><Video /></Button>
  </div>;
}
