import { ROUTE_RADIUS_PERCENT, routeRadiusKm } from '@/lib/route-radius';

export function RouteRadiusSetting() {
  return <section aria-label="వాహన సూచనల పరిధి · Vehicle alert radius" className="space-y-2 border-y py-4">
    <h2 className="text-xl font-bold">వాహన సూచనల పరిధి · Vehicle alert radius</h2>
    <p className="text-2xl font-bold text-primary">{ROUTE_RADIUS_PERCENT}%</p>
    <p className="text-sm">భారతదేశంలో ఏ మార్గమైనా, ఆ మార్గపు నిజమైన ప్రయాణ కిలోమీటర్లలో 20% పరిధి; ఇది ఒకే ఊరికి లేదా స్థిరమైన 30 కిలోమీటర్లకు పరిమితం కాదు. · Across India: 20% of each route’s actual road distance, not a fixed radius.</p>
    <p className="text-sm">ప్రయాణ దూరం 150 కిలోమీటర్లు అయితే, నుంచి–వరకు ప్రాంతాల చుట్టూ {routeRadiusKm(150)} కిలోమీటర్ల పరిధి. · A 150 km road trip has a 30 km endpoint radius.</p>
    <p role="status" className="text-sm text-muted-foreground">ఇంకా ప్రారంభం కాలేదు: నిజమైన దూరం, ప్రాంతాల వివరాలు అందిన తర్వాతే ఈ పరిధిలో సూచనలు పంపగలం. · Not active: verified road distance and participant areas are required.</p>
  </section>;
}