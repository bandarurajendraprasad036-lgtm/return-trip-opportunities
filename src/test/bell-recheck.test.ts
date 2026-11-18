import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { bellErrorMessage, BELL_LIMIT_MESSAGE, NETWORK_MESSAGE } from '@/lib/bell-request';
import { PROFILE_ACCESS_MESSAGE } from '@/lib/profile-access';
import { vehicleDemandCategory } from '@/lib/vehicle-demand';

it('fourth ring to the same person shows the membership message', () => {
  expect(bellErrorMessage({ code: 'P0001', message: 'BELL_LIMIT_REACHED' })).toBe('3 సార్లు అయ్యింది. ఇంకా కొట్టాలంటే మెంబర్షిప్ తీసుకోండి');
  expect(BELL_LIMIT_MESSAGE).toBe('3 సార్లు అయ్యింది. ఇంకా కొట్టాలంటే మెంబర్షిప్ తీసుకోండి');
});
it('unfilled profile shows the fill-profile message', () => {
  expect(bellErrorMessage(new Error('PROFILE_REQUIRED'))).toBe(PROFILE_ACCESS_MESSAGE);
});
it('a server refusal is never reported as missing internet', () => {
  for (const message of ['POST_UNAVAILABLE', 'VEHICLE_ROUTE_REQUIRED', 'PAID_CHAT_OR_PRIVATE_PAIR_REQUIRED', 'SOMETHING_ELSE']) {
    expect(bellErrorMessage({ code: 'P0001', message })).not.toBe(NETWORK_MESSAGE);
    expect(bellErrorMessage({ code: 'P0001', message })).not.toContain('ఇంటర్నెట్');
  }
  expect(bellErrorMessage(new TypeError('Failed to fetch'))).toBe(NETWORK_MESSAGE);
});
it('₹49 plan holders are told vehicle bells need ₹100', () => {
  expect(bellErrorMessage({ code: 'P0001', message: 'SERVICE_PLAN_ONLY' })).toContain('₹100');
});
it('post bells open the list tab the database saves them under', () => {
  expect(vehicleDemandCategory({ from_place: 'Hyderabad', to_place: 'Mancherial', vehicle_type: 'Mini truck' })).toBe('returns');
  expect(vehicleDemandCategory({ from_place: 'Mancherial', to_place: 'mancherial ', vehicle_type: 'Tata Ace' })).toBe('goods');
  expect(vehicleDemandCategory({ from_place: 'A', to_place: 'B', vehicle_type: 'Innova' })).toBe('cars');
});
it('a filled profile on a mobile-number login is ready; a different number is not', async () => {
  const db = new PGlite();
  try {
    await db.exec(`CREATE SCHEMA auth;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT '11111111-1111-4111-8111-111111111111'::uuid $$;
      CREATE FUNCTION public.has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$ SELECT false $$;
      CREATE FUNCTION public.account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
      CREATE TABLE public.profiles(id uuid,full_name text,location text,phone text);
      CREATE TABLE public.account_programs(user_id uuid,occupation text,category text,member_kind text);
      CREATE TABLE auth.users(id uuid,email text,phone text,phone_confirmed_at timestamptz);
      INSERT INTO profiles VALUES(auth.uid(),'Person','Village','9876543210');
      INSERT INTO account_programs VALUES(auth.uid(),'Driver','Auto','owner');
      INSERT INTO auth.users VALUES(auth.uid(),'9876543210@phone.returnconnect.app',NULL,NULL);`);
    await db.exec(readFileSync('drizzle/migrations/0117_phone_login_profile_ready.sql', 'utf8'));
    const ready = async () => (await db.query<{ r: boolean }>('SELECT public.profile_ready_for_actions(auth.uid()) r')).rows[0]?.r;
    expect(await ready()).toBe(true);
    await db.exec("UPDATE auth.users SET email='9876543211@phone.returnconnect.app'");
    expect(await ready()).toBe(false);
    await db.exec("UPDATE auth.users SET email='9876543210@phone.returnconnect.app'; UPDATE account_programs SET occupation=''");
    expect(await ready()).toBe(false);
  } finally { await db.close(); }
});

import { passwordPairError } from '@/lib/phone-password';
it('new password saves only when both boxes match', () => {
  expect(passwordPairError('abc123', 'abc124')).toBe('రెండు పాస్వర్డ్‌లు ఒకేలా లేవు. మళ్ళీ కొట్టండి');
  expect(passwordPairError('abc12', 'abc12')).not.toBe('');
  expect(passwordPairError('abc123', 'abc123')).toBe('');
});
