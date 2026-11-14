import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, it, expect } from 'vitest';
let db: PGlite;
const owner='11111111-1111-4111-8111-111111111111';
const visitor='22222222-2222-4222-8222-222222222222';
const post='33333333-3333-4333-8333-333333333333';
beforeAll(async()=>{
 db=new PGlite();
 await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('test.user',true),'')::uuid $$;
 CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT true $$;
 CREATE FUNCTION has_paid_bell(uuid) RETURNS boolean LANGUAGE sql AS $$ SELECT coalesce(current_setting('test.paid',true),'')='1' $$;
 CREATE FUNCTION has_role(uuid,text) RETURNS boolean LANGUAGE sql AS $$ SELECT coalesce(current_setting('test.admin',true),'')='1' $$;
 CREATE TABLE profiles(id uuid PRIMARY KEY); INSERT INTO profiles VALUES('${owner}');
 CREATE TABLE monthly_post_usage(post_id uuid PRIMARY KEY,user_id uuid);
 CREATE TABLE posts(id uuid,user_id uuid,module text,status text,visible_after timestamptz,job_expires_at timestamptz,description text,goods_type text,capacity_tons numeric,trip_date date,show_contact boolean,contact_phone text,public_brand text,public_photo text,vehicle_name text,vehicle_number text,driver_name text);
 INSERT INTO posts VALUES('${post}','${owner}','vehicle','active',NULL,NULL,'real details','rice',2,'2026-11-15',true,'9876543210','owner brand','','Ace','AP01','driver');`);
 await db.exec(readFileSync('drizzle/migrations/0085_free_posting_vehicle_only_details.sql','utf8'));
},30000);
afterAll(async()=>{await db.close();});
it('unpaid users can record more than three posts with no receipt',async()=>{
 for(let i=0;i<8;i++)await db.query(`SELECT consume_post_slot('${owner}',gen_random_uuid())`);
 expect((await db.query('SELECT * FROM monthly_post_usage')).rows).toHaveLength(8);
});
it('vehicle details deny unpaid users, allow current paid and admin access, then deny expired access',async()=>{
 await db.exec(`SELECT set_config('test.user','${visitor}',false);`);
 await expect(db.query(`SELECT get_post_details('${post}')`)).rejects.toThrow('PAID_BELL_REQUIRED');
 await db.exec("SELECT set_config('test.paid','1',false)");
 expect((await db.query<{d:{contact_phone:string}}>(`SELECT get_post_details('${post}') d`)).rows[0]?.d.contact_phone).toBe('9876543210');
 await db.exec("SELECT set_config('test.paid','0',false);SELECT set_config('test.admin','1',false)");
 expect((await db.query<{d:{vehicle_number:string}}>(`SELECT get_post_details('${post}') d`)).rows[0]?.d.vehicle_number).toBe('AP01');
 await db.exec("SELECT set_config('test.admin','0',false)");
 await expect(db.query(`SELECT get_post_details('${post}')`)).rejects.toThrow('PAID_BELL_REQUIRED');
});
it('work and service listing contacts are free only with owner consent',async()=>{
 await db.exec("UPDATE posts SET module='job'");
 expect((await db.query<{d:{contact_phone:string}}>(`SELECT get_post_details('${post}') d`)).rows[0]?.d.contact_phone).toBe('9876543210');
 await db.exec('UPDATE posts SET show_contact=false');
 expect((await db.query<{d:{contact_phone:null}}>(`SELECT get_post_details('${post}') d`)).rows[0]?.d.contact_phone).toBeNull();
});
it('free posting preserves consented contacts without a paid profile flag',async()=>{
 await db.exec('CREATE TRIGGER contact_guard BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION guard_show_contact();UPDATE posts SET show_contact=true,contact_phone=\'9876543210\'');
 expect((await db.query<{contact_phone:string}>('SELECT contact_phone FROM posts')).rows[0]?.contact_phone).toBe('9876543210');
 await db.exec('UPDATE posts SET show_contact=false');
 expect((await db.query<{contact_phone:null}>('SELECT contact_phone FROM posts')).rows[0]?.contact_phone).toBeNull();
});