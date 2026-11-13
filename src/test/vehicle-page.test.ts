import { describe, it, expect } from 'vitest';
import { vehiclePageRows, vehicleDisplay, VEHICLE_CATALOG } from '@/lib/vehicle-page';
import type { Post } from '@/components/PostCard';
const rows=[{id:'local',module:'vehicle',status:'active',vehicle_type:'Lorry',from_place:'A',to_place:'A'}, {id:'return',module:'vehicle',status:'active',vehicle_type:'Lorry',from_place:'A',to_place:'B',trip_date:'2026-12-01'}, {id:'car',module:'vehicle',status:'active',vehicle_type:'Car',from_place:'A',to_place:'B'}] as Post[];
describe('vehicle category pages', () => {
  it('shows free types but never actual listing details when unpaid even with cached rows', () => {
    expect(vehicleDisplay(false, true, false, 3)).toEqual({ showCatalog: true, showListings: false });
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
});