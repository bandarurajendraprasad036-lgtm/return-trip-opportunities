import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { BELL_BOARD_LABELS, type BellBoardSection } from '@/lib/bell-board';
export function BellBoardLink({ section }: { section: BellBoardSection }) {
  return <Button asChild variant="outline" className="h-auto min-h-14 w-full whitespace-normal px-2 py-2 text-sm"><Link to="/bell-board" search={{ section }}>{BELL_BOARD_LABELS[section]}</Link></Button>;
}