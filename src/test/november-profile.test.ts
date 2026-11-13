import { describe, it, expect } from 'vitest';
import { validDetailedRoute, paymentUtr, ROUTE_TONNES, ROUTE_VEHICLES, PROFILE_NEEDS, TECHNICIAN_WORKS } from '@/lib/november-profile';
import { districtsForState } from '@/lib/state-districts';
describe('November thirteen explicit inputs', () => {
 it('accepts the requested mini truck three tonne route and rejects equal endpoints',()=>{expect(validDetailedRoute('మంచిర్యాల','హైదరాబాద్','Mini Truck',3)).toBe(true);expect(validDetailedRoute('మంచిర్యాల','మంచిర్యాల','Mini Truck',3)).toBe(false);});
 it('uses only the six supplied vehicles',()=>{expect(ROUTE_VEHICLES).toEqual(['Mini Truck','Truck','Lorry','Pickup','Auto','Tata Ace']);expect(validDetailedRoute('A','B','Car',3)).toBe(false);});
 it('uses the six requested tonne capacities',()=>{expect(ROUTE_TONNES).toEqual([1,2,3,5,10,15]);expect(validDetailedRoute('A','B','Truck',4)).toBe(false);});
 it('requires twelve UTR digits, not just a phone number or thirteen digits',()=>{expect(paymentUtr('UTR: 412345678901')).toBe('412345678901');expect(paymentUtr('7036036036')).toBeNull();expect(paymentUtr('4123456789012')).toBeNull();});
 it('retains the five needs and seven technician work choices',()=>{expect(PROFILE_NEEDS.map(r=>r.value)).toEqual(['seeker','employer','owner','business','service']);expect(TECHNICIAN_WORKS.map(r=>r.value)).toEqual(['Electrician','Plumber','Mason','Carpenter','Painter','Welder','AC / Fridge mechanic']);});
 it('never shows Andhra districts for Telangana or vice versa',()=>{expect(districtsForState('TG')).toContain('మంచిర్యాల');expect(districtsForState('TG')).not.toContain('గుంటూరు');expect(districtsForState('AP')).toContain('గుంటూరు');expect(districtsForState('AP')).not.toContain('మంచిర్యాల');expect(districtsForState('')).toEqual([]);});
});