import { Link } from '@tanstack/react-router';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HOME_PROFILE_REQUEST, PROFILE_REQUEST } from '@/lib/account-program';
export function ProfileRequest({ open, onOpenChange, home = false, showProfileLink = true, children }: { open: boolean; onOpenChange: (open: boolean) => void; home?: boolean; showProfileLink?: boolean; children?: React.ReactNode }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[85svh] overflow-y-auto"><DialogTitle>మీ వివరాలు నింపండి · Complete profile</DialogTitle><DialogDescription asChild><div className="space-y-4 text-base leading-relaxed">{(home ? HOME_PROFILE_REQUEST : [PROFILE_REQUEST]).map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div></DialogDescription>{showProfileLink && <Button asChild onClick={() => onOpenChange(false)}><Link to="/dashboard" hash="account-profile">పని, వాహనం, మార్గం వివరాలు నింపండి</Link></Button>}{children}</DialogContent></Dialog>;
}