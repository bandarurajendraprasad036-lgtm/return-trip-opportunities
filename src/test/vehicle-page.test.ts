import { describe, it, expect } from 'vitest';
import { vehiclePageRows } from '@/lib/vehicle-page';
import type { Post } from '@/components/PostCard';
const rows=[{id:'local',module:'vehicle',status:'active',vehicle_type:'Lorry',from_place:'A',to_place:'A'}, {id:'return',module:'vehicle',status:'active',vehicle_type:'Lorry',from_place:'A',to_place:'B',trip_date:'2026-12-01'}, {id:'car',module:'vehicle',status:'active',vehicle_type:'Car',from_place:'A',to_place:'B'}] as Post[];
describe('vehicle category pages', () => {
  it('opens only local goods in first choice', () => { expect(vehiclePageRows(rows,'goods').map(p=>p.id)).toEqual(['local']); });
  it('opens return goods with advance date selection', () => { expect(vehiclePageRows(rows,'returns','','','2026-12-01').map(p=>p.id)).toEqual(['return']); expect(vehiclePageRows(rows,'returns','','','2026-12-02')).toEqual([]); });
  it('opens cars separately', () => { expect(vehiclePageRows(rows,'cars').map(p=>p.id)).toEqual(['car']); });
});