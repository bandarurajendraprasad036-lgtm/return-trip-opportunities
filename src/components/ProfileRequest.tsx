import { Link } from '@tanstack/react-router';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PROFILE_REQUEST } from '@/lib/account-program';
export function ProfileRequest({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[85svh] overflow-y-auto"><DialogTitle>మీ వివరాలు నింపండి · Complete profile</DialogTitle><DialogDescription className="text-base leading-relaxed">{PROFILE_REQUEST}</DialogDescription><Button asChild onClick={() => onOpenChange(false)}><Link to="/dashboard">నా వివరాలు · My profile</Link></Button></DialogContent></Dialog>;
}