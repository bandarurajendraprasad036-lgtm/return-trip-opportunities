import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { expect,it } from 'vitest';
it('only earliest ten paid applicants in an area lead and expired applications leave priority', async () => {
 const db = new PGlite();
 try {
 await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE SCHEMA auth;CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT NULL::uuid$$;CREATE FUNCTION has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$SELECT false$$;CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;CREATE FUNCTION has_paid_bell(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;CREATE TABLE profiles(id uuid PRIMARY KEY);`);
 await db.exec(readFileSync('drizzle/migrations/0098_admin_vehicle_read_and_service_priority.sql','utf8'));
 await db.exec(`INSERT INTO profiles SELECT md5(i::text)::uuid FROM generate_series(1,11) i;INSERT INTO service_priority_applications(user_id,area,category,applied_at) SELECT md5(i::text)::uuid,'A','plumber',now()-interval '1 hour'+i*interval '1 second' FROM generate_series(1,11) i;`);
 expect((await db.query<{position:number|null}>(`SELECT service_priority_position(md5('10')::uuid,'A') position`)).rows[0]?.position).toBe(10);
 expect((await db.query<{position:number|null}>(`SELECT service_priority_position(md5('11')::uuid,'A') position`)).rows[0]?.position).toBeNull();
 const sql=readFileSync('drizzle/migrations/0099_complete_listing_expiry_and_priority_period.sql','utf8');
 const start=sql.indexOf('CREATE OR REPLACE FUNCTION public.service_priority_position');
 const end=sql.indexOf('CREATE OR REPLACE FUNCTION public.get_post_details');
 await db.exec(sql.slice(start,end));
 await db.exec(`UPDATE service_priority_applications SET applied_at=now()-interval '1 month' WHERE user_id=md5('1')::uuid;`);
 expect((await db.query<{position:number|null}>(`SELECT service_priority_position(md5('1')::uuid,'A') position`)).rows[0]?.position).toBeNull();
 expect((await db.query<{position:number|null}>(`SELECT service_priority_position(md5('11')::uuid,'A') position`)).rows[0]?.position).toBe(10);
 await expect(db.query('SELECT admin_vehicle_records(0)')).rejects.toThrow('ADMIN_ONLY');
 } finally { await db.close(); }
},30000);