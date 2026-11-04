import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import voice from "@/assets/gayatri-one-welcome.mp3.asset.json";
import { indianDay } from "@/lib/daily-devotional";
import { welcomeDue } from "@/lib/vehicle-experience";

export function DailyWelcome() {
  const player = useRef<HTMLAudioElement | null>(null);
  const [needsTap, setNeedsTap] = useState(false);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    let last: string | null = null;
    try { last = localStorage.getItem("gayatri-welcome-day"); } catch { /* Storage can be disabled. */ }
    if (!welcomeDue(last, new Date())) return;
    const audio = new Audio(voice.url);
    player.current = audio;
    const mark = () => {
      setPlaying(true); setNeedsTap(false);
      try { localStorage.setItem("gayatri-welcome-day", indianDay(new Date())); } catch { /* Optional persistence. */ }
    };
    audio.addEventListener("playing", mark);
    audio.onended = () => setPlaying(false);
    void audio.play().catch(() => setNeedsTap(true));
    return () => { audio.pause(); audio.removeEventListener("playing", mark); };
  }, []);
  if (!needsTap && !playing) return null;
  return <div className="flex justify-center pt-2"><Button variant="ghost" className="h-auto gap-2 whitespace-normal text-gold hover:bg-transparent hover:text-on-royal" onClick={() => {
    if (playing) { player.current?.pause(); setPlaying(false); }
    else void player.current?.play().catch(() => setNeedsTap(true));
  }}>{playing ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}{playing ? "ఆపండి · Stop" : "స్వాగతం వినండి · Listen to welcome"}</Button></div>;
}