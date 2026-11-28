import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { loadBellBoard } from '@/lib/bell-board-client';
import { FREE_WORK_SECTIONS, type FreeWorkSection } from '@/lib/free-work';
import type { BellBoardSection } from '@/lib/bell-board';
import { BELL_BOARD_REFRESH_MS } from '@/lib/bell-board-refresh';
import { bellDateTime } from '@/lib/bell-details';
import { AdminBellRowAction } from '@/components/AdminBellRowAction';
import { AddCategoryBox } from '@/components/AddCategoryBox';

function isFreeSection(section: BellBoardSection): section is FreeWorkSection {
  return (FREE_WORK_SECTIONS as readonly string[]).includes(section);
}

interface AdminBellItem {
  id: string;
  source: string;
  area: string;
  need: string;
  name: string;
  phone: string;
  rangAt: string | null;
}

export function AdminBellBoardSection({ section }: { section: BellBoardSection }) {
  const { data: rows = [], isPending, isError } = useQuery<AdminBellItem[]>({
    queryKey: ['admin-bell-board', section],
    refetchInterval: BELL_BOARD_REFRESH_MS,
    queryFn: async () => {
      if (isFreeSection(section)) {
        const r = await supabase.rpc('list_free_work_interest_contacts', {
          _section: section,
          _area: '',
          _category: '',
        });
        if (r.error) throw r.error;
        return (r.data ?? []).map((row) => ({
          id: row.id,
          source: row.source || 'interest',
          area: row.area ?? '',
          need: row.category ?? '',
          name: row.full_name ?? '',
          phone: row.phone ?? '',
          rangAt: row.rang_at ?? null,
        }));
      }
      const board = await loadBellBoard(section, '');
      return board.rows.map((row) => ({
        id: row.id,
        source: row.source,
        area: row.area ?? '',
        need: row.need ?? '',
        name: row.contact?.full_name ?? '',
        phone: row.contact?.phone ?? '',
        rangAt: row.contact?.rang_at ?? null,
      }));
    },
  });

  return (
    <div className="space-y-3 pb-3 pt-1">
      <AddCategoryBox label="కొత్త రకం చేర్చండి / తొలగించండి" section={section} />
      {isPending && <p role="status" className="text-sm text-muted-foreground">జాబితా వస్తోంది…</p>}
      {isError && <p role="alert" className="text-sm text-destructive">జాబితా రాలేదు. మళ్లీ ప్రయత్నించండి.</p>}
      {!isPending && !isError && rows.length === 0 && (
        <p className="text-sm text-muted-foreground">ఈ విభాగంలో ఇంకా గంట కొట్టినవారు లేరు</p>
      )}
      {rows.map((row) => {
        const dateTime = bellDateTime(row.rangAt);
        return (
          <article key={`${row.source}-${row.id}`} className="flex items-center gap-2 rounded-lg border bg-card p-3">
            <div className="min-w-0 flex-1 space-y-0.5" translate="no">
              {(row.name.trim() || row.phone.trim()) && (
                <p className="break-words font-bold">
                  {[row.name.trim(), row.phone.trim()].filter(Boolean).join(' · ')}
                </p>
              )}
              <p className="break-words text-sm font-semibold">{row.need || '—'}</p>
              <p className="break-words text-sm text-muted-foreground">{row.area || '—'}</p>
              {dateTime && <p className="text-xs text-muted-foreground">{dateTime}</p>}
            </div>
            <AdminBellRowAction id={row.id} source={row.source} section={section} />
          </article>
        );
      })}
    </div>
  );
}