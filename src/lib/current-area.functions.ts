import { createServerFn } from '@tanstack/react-start';
import { setResponseHeader } from '@tanstack/react-start/server';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { areaFromResults, type GeocodeResult } from './current-area';

export const resolveCurrentArea = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
  }).strict().parse(input))
  .handler(async ({ data }) => {
    setResponseHeader('Cache-Control', 'no-store');
    const appKey = process.env['LOVABLE_API_KEY'];
    const mapsKey = process.env['GOOGLE_MAPS_API_KEY'];
    if (!appKey || !mapsKey) throw new Error('ప్రాంతం సేవ అనుసంధానం అందుబాటులో లేదు · Location service is not configured');
    const response = await fetch(`https://connector-gateway.lovable.dev/google_maps/maps/api/geocode/json?latlng=${data.latitude},${data.longitude}&language=te`, {
      headers: { Authorization: `Bearer ${appKey}`, 'X-Connection-Api-Key': mapsKey },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) {
      const body = await response.text();
      console.error(`Area lookup failed [${response.status}]: ${body}`);
      if (response.status === 403) {
        if (body.includes('API_KEY_HTTP_REFERRER_BLOCKED')) throw new Error('ప్రాంతం సేవ అనుమతి లేదు; సర్వర్ కీకి వెబ్‌సైట్ పరిమితి తీసి None లేదా IP addresses పెట్టాలి · Server key is referrer-restricted');
        if (body.includes('API_KEY_SERVICE_BLOCKED')) throw new Error('ప్రాంతం సేవ కీలో Geocoding API అనుమతి జోడించాలి · Server key does not allow Geocoding API');
        throw new Error('ప్రాంతం సేవ అనుమతి నిరాకరించింది (403) · Check server key restrictions');
      }
      throw new Error(`ప్రాంతం సేవ వివరాలు రాలేదు (${response.status}) · ${body}`);
    }
    const result = await response.json() as { status: string; results?: GeocodeResult[]; error_message?: string };
    if (result.status === 'ZERO_RESULTS') return null;
    if (result.status !== 'OK') throw new Error(`ప్రాంతం సేవ వివరాలు రాలేదు · ${result.status}: ${result.error_message ?? ''}`);
    return areaFromResults(result.results ?? []);
  });