import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Share2 } from 'lucide-react';
import { getWeeklyWinners, type WeeklyWinner } from '@/lib/weekly-winners.functions';
import { useMe } from '@/lib/session';
import { Button } from '@/components/ui/button';

async function drawPoster(w: WeeklyWinner): Promise<string> {
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1350; const g = c.getContext('2d'); if (!g) throw new Error('చిత్రం తయారు కాలేదు');
  const styles = getComputedStyle(document.documentElement); const GOLD = styles.getPropertyValue('--gold').trim();
  g.fillStyle = styles.getPropertyValue('--background').trim(); g.fillRect(0, 0, 1080, 1350);
  g.strokeStyle = GOLD; g.lineWidth = 14; g.strokeRect(30, 30, 1020, 1290); g.lineWidth = 3; g.strokeRect(56, 56, 968, 1238);
  g.textAlign = 'center'; g.fillStyle = GOLD;
  g.font = 'bold 54px "Baloo Tammudu 2", sans-serif'; g.fillText('గాయత్రి వన్ · GAYATRI ONE', 540, 140);
  g.font = '150px serif'; g.fillText('🏆', 540, 310);
  g.font = 'bold 92px sans-serif'; g.fillText('WEEKLY WINNER', 540, 420);
  g.font = 'bold 66px sans-serif'; g.fillText(w.region === 'TG' ? 'TELANGANA · తెలంగాణ' : 'ANDHRA · ఆంధ్ర', 540, 500);
  if (!w.photo) throw new Error('విజేత ఫోటో అవసరం');
  const img = new Image(); img.crossOrigin = 'anonymous'; img.src = w.photo; await img.decode(); g.save(); g.beginPath(); g.arc(540, 760, 210, 0, Math.PI * 2); g.clip(); const s = Math.max(420 / img.width, 420 / img.height); g.drawImage(img, 540 - img.width * s / 2, 760 - img.height * s / 2, img.width * s, img.height * s); g.restore();
  g.strokeStyle = GOLD; g.lineWidth = 10; g.beginPath(); g.arc(540, 760, 215, 0, Math.PI * 2); g.stroke();
  g.fillStyle = styles.getPropertyValue('--foreground').trim(); let size = 72; g.font = `bold ${size}px "Noto Sans Telugu", sans-serif`; while (g.measureText(w.display_name).width > 900 && size > 16) { size--; g.font = `bold ${size}px "Noto Sans Telugu", sans-serif`; } g.fillText(w.display_name, 540, 1060, 900);
  g.font = '44px "Noto Sans Telugu", sans-serif'; g.fillText(`ఈ వారం చేరికలు · Joins: ${w.joins}   చెల్లించినవారు · Paid: ${w.paid}`, 540, 1140);
  g.fillStyle = GOLD; g.font = 'bold 44px sans-serif'; g.fillText('gayatrione.com', 540, 1240);
  return c.toDataURL('image/png');
}

function Poster({ w, mine }: { w: WeeklyWinner; mine: boolean }) {
  const [src, setSrc] = useState('');
  const [error, setError] = useState(false);
  useEffect(() => { let on = true; void drawPoster(w).then(u => { if (on) setSrc(u); }).catch(() => { if (on) setError(true); }); return () => { on = false; }; }, [w]);
  const file = `weekly-winner-${w.region}-${w.week_start}.png`;
  const share = async () => {
    const text = `🏆 గాయత్రి వన్ వారపు విజేత · Weekly Winner ${w.region === 'TG' ? 'Telangana' : 'Andhra'}: ${w.display_name} — https://gayatrione.com`;
    try { const blob = await (await fetch(src)).blob(); const f = new File([blob], file, { type: 'image/png' }); if (navigator.canShare?.({ files: [f] })) { await navigator.share({ files: [f], text }); return; } } catch { /* fall back */ }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };
  return <figure className="space-y-2">{error ? <p role="alert">విజేత ఫోటోతో చిత్రం తయారు కాలేదు; మళ్లీ తెరవండి</p> : src ? <img src={src} alt={`${w.display_name} వారపు విజేత పోస్టర్`} className="w-full rounded-lg border" /> : <div className="aspect-[4/5] w-full animate-pulse rounded-lg border" />}
    {mine && src && <div className="grid grid-cols-2 gap-2"><Button asChild className="h-auto min-h-12 whitespace-normal"><a href={src} download={file}><Download />పోస్టర్ దించుకోండి · Download</a></Button><Button variant="outline" className="h-auto min-h-12 whitespace-normal" onClick={() => void share()}><Share2 />వాట్సాప్ · WhatsApp</Button></div>}
  </figure>;
}

export function WeeklyWinners() {
  const { data: me } = useMe();
  const { data = [] } = useQuery({ queryKey: ['weekly-winners'], queryFn: () => getWeeklyWinners() });
  return <section className="space-y-3 border-y py-3">
    <h2 className="text-xl font-bold text-primary">🏆 వారపు విజేతలు · Weekly winners</h2>
    <p className="text-sm text-muted-foreground">వారపు విజేత = ఎక్కువ చేరికలు + 70% చెల్లింపు పూర్తి · Weekly Winner = Most Joins + 70% Payment Completed. ఫోటో ఉన్నవారే అర్హులు.</p>
    {data.length === 0 ? <p>మొదటి విజేతలను నవంబర్ 22 ఆదివారం రాత్రి ప్రకటిస్తాం; అర్హమైన నిజమైన చేరికలు, చెల్లింపులు, అనుమతించిన ఫోటో ఉన్నప్పుడే.</p> : data.map(w => <Poster key={w.region} w={w} mine={w.user_id === me?.id} />)}
  </section>;
}
