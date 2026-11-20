import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { vehiclePageRows, vehicleDisplay, vehicleSearchFrom, VEHICLE_CATALOG } from '@/lib/vehicle-page';
import type { Post } from '@/components/PostCard';
const rows=[{id:'local',module:'vehicle',status:'active',vehicle_type:'Lorry',from_place:'A',to_place:'A',created_at:'2026-11-16T06:00:00Z'}, {id:'return',module:'vehicle',status:'active',vehicle_type:'Lorry',from_place:'A',to_place:'B',trip_date:'2026-12-01'}, {id:'car',module:'vehicle',status:'active',vehicle_type:'Car',from_place:'A',to_place:'B',trip_date:'2026-11-16'}] as unknown as Post[];
beforeAll(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-16T07:00:00Z')); });
afterAll(() => vi.useRealTimers());
describe('vehicle category pages', () => {
  it('shows anonymous vehicle listings without paid access', () => {
    expect(vehicleDisplay(false, true, false, 3)).toEqual({ showCatalog: false, showListings: true });
    expect(vehicleDisplay(false, false, false, 0)).toEqual({ showCatalog: true, showListings: true });
  });
  it('paid access shows real listings and uses types only when no result matches', () => {
    expect(vehicleDisplay(true, false, false, 1)).toEqual({ showCatalog: false, showListings: true });
    expect(vehicleDisplay(true, false, false, 0)).toEqual({ showCatalog: true, showListings: true });
  });
  it('keeps car types separate from goods and return goods', () => {
    expect(VEHICLE_CATALOG.cars).toContain('ఇన్నోవా · Innova');
    expect(VEHICLE_CATALOG.goods).not.toContain('ఇన్నోవా · Innova');
    expect(VEHICLE_CATALOG.returns).toContain('ఆపే ట్రాలీ · Ape trolley');
  });
  it('opens only local goods in first choice', () => { expect(vehiclePageRows(rows,'goods').map(p=>p.id)).toEqual(['local']); });
  it('opens return goods with advance date selection', () => { expect(vehiclePageRows(rows,'returns','','','2026-12-01').map(p=>p.id)).toEqual(['return']); expect(vehiclePageRows(rows,'returns','','','2026-12-02')).toEqual([]); });
  it('opens cars separately', () => { expect(vehiclePageRows(rows,'cars').map(p=>p.id)).toEqual(['car']); });
  it('uses an explicit vehicle route instead of an unrelated saved work village', () => {
    const from = vehicleSearchFrom('A', 'Other village');
    expect(from).toBe('A');
    expect(vehiclePageRows(rows, 'returns', from, 'B').map(p => p.id)).toEqual(['return']);
  });
  it('keeps anonymous unfiltered return lists visible when no village was chosen', () => {
    expect(vehiclePageRows(rows, 'returns', vehicleSearchFrom('', '')).map(p => p.id)).toEqual(['return']);
  });
  it('matches a named endpoint term without requiring an exact whole address', () => {
    const records = [{ ...rows[1], from_place: 'A village' }] as unknown as Post[];
    expect(vehiclePageRows(records, 'returns', 'A').map(p => p.id)).toEqual(['return']);
  });
  it('does not restore expired vehicles as current availability', () => {
    const records = [{ ...rows[1], trip_date: '2026-11-15' }] as unknown as Post[];
    expect(vehiclePageRows(records, 'returns')).toEqual([]);
  });
});