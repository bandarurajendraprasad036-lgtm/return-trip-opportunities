import { ROUTE_RADIUS_PERCENT, routeRadiusKm } from '@/lib/route-radius';

export function RouteRadiusSetting() {
  return <section aria-label="వాహన సూచనల పరిధి · Vehicle alert radius" className="space-y-2 border-y py-4">
    <h2 className="text-xl font-bold">వాహన సూచనల పరిధి · Vehicle alert radius</h2>
    <p className="text-2xl font-bold text-primary">{ROUTE_RADIUS_PERCENT}%</p>
    <p className="text-sm">భారతదేశమంతా ఎంచుకున్న రెండు స్థానాల మధ్య నేరుగా ఉజ్జాయింపు దూరంలో 20%; రోడ్డు దూరం కాదు. · Across India: 20% of selected endpoints’ straight-line distance, not road distance.</p>
    <p className="text-sm">ఉజ్జాయింపు దూరం 150 కిలోమీటర్లు అయితే, నుంచి–వరకు రెండు స్థానాల చుట్టూ {routeRadiusKm(150)} కిలోమీటర్ల పరిధి. · A 150 km estimate gives a 30 km radius at both endpoints.</p>
    <p role="status" className="text-sm text-muted-foreground">రెండు స్థానాలు ఉన్న భద్రపరిచిన మార్గాలకు వర్తిస్తుంది; పాత పేర్లకు స్థానాలు ఎంచుకోవాలి. సూచనల అంగీకారం, పరిమితులు, ఉచిత ఖాతా ఆధారాల ఆమోదం వర్తిస్తాయి. ప్రత్యేక దూరసేవ రుసుము లేదు; నిర్వహణ ఖర్చులు ఉండవచ్చు. · Selected coordinates required; preferences, quotas and free evidence approval apply. No paid distance lookup; operating costs may apply.</p>
  </section>;
}