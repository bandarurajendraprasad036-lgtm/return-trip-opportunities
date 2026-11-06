import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';

describe('goods-only approved 699 monthly access', () => {
  let db: PGlite;
  const owner='11111111-1111-4111-8111-111111111111';
  const member='22222222-2222-4222-8222-222222222222';
  const goods='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const car='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const job='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  beforeAll(async()=>{
    db=new PGlite();
    await db.exec(`CREATE SCHEMA auth; CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$SELECT nullif(current_setting('test.user',true),'')::uuid$$;
      CREATE TABLE profiles(id uuid primary key,is_prime boolean,prime_until date);
      CREATE TABLE membership_payments(id uuid primary key,status text,amount integer,membership_type text);
      CREATE TABLE job_post_entitlements(user_id uuid,payment_id uuid,starts_at timestamptz,ends_at timestamptz);
      CREATE TABLE job_post_uses(id uuid);
      CREATE TABLE posts(id uuid primary key,user_id uuid,module text,kind text,title text,location text,skill text,salary text,from_place text,to_place text,trip_date date,vehicle_type text,goods_type text,status text,created_at timestamptz default now(),show_contact boolean,category text,area_scope text,district text,state text,service_type text,capacity_tons numeric,job_expires_at timestamptz,visible_after timestamptz,visibility_notified_at timestamptz,description text,contact_phone text,public_photo text,public_brand text);
      CREATE TABLE notifications(id uuid default gen_random_uuid(),user_id uuid,post_id uuid,matched_post_id uuid,message text,created_at timestamptz default now());
      CREATE TABLE messages(id uuid default gen_random_uuid(),sender_id uuid,receiver_id uuid,post_id uuid,body text);
      CREATE TABLE post_chat_pairs(post_id uuid,member_id uuid,owner_id uuid,primary key(post_id,member_id));
      CREATE FUNCTION account_allowed(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
      CREATE FUNCTION can_notify(uuid) RETURNS boolean LANGUAGE sql AS $$SELECT true$$;
      CREATE FUNCTION support_admin_id() RETURNS uuid LANGUAGE sql AS $$SELECT '44444444-4444-4444-8444-444444444444'::uuid$$;
      CREATE FUNCTION posts_match_area(a posts,b posts) RETURNS boolean LANGUAGE sql AS $$SELECT a.user_id<>b.user_id AND a.module=b.module AND a.kind<>b.kind AND a.from_place=b.from_place AND a.to_place=b.to_place AND a.trip_date=b.trip_date$$;`);
    await db.exec(readFileSync('drizzle/migrations/0036_goods_only_paid_access_free_jobs.sql','utf8'));
    await db.exec(`INSERT INTO profiles VALUES('${owner}',false,current_date+30),('${member}',true,current_date+30);
      INSERT INTO membership_payments VALUES('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','approved',699,'individual');
      INSERT INTO job_post_entitlements VALUES('${member}','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',now()-interval '1 day',now()+interval '1 month');
      INSERT INTO posts(id,user_id,module,kind,status,vehicle_type,description,show_contact,public_photo,public_brand,contact_phone) VALUES
      ('${goods}','${owner}','vehicle','owner','active','Lorry','Goods description',true,'https://example.com/lorry.jpg','Shared goods','9876543210'),
      ('${car}','${owner}','vehicle','owner','active','Car','Car description',true,'https://example.com/car.jpg','Private car','9876543210'),
      ('${job}','${owner}','job','employer','active',null,'Job description',true,'https://example.com/job.jpg','Private job','9876543210');
      INSERT INTO post_chat_pairs VALUES('${goods}','${member}','${owner}'),('${car}','${member}','${owner}'),('${job}','${member}','${owner}');`);
  },20000);
  afterAll(async()=>{await db.close();});
  const actor=async(id:string)=>db.exec(`SELECT set_config('test.user','${id}',false)`);
  it('requires approved 699, not pending or 499 or expired payment',async()=>{
    expect((await db.query<{ok:boolean}>(`SELECT has_goods_membership('${member}') AS ok`)).rows[0]?.ok).toBe(true);
    for(const change of ["status='pending'","status='approved',amount=499"]){
      await db.exec(`UPDATE membership_payments SET ${change}`);
      expect((await db.query<{ok:boolean}>(`SELECT has_goods_membership('${member}') AS ok`)).rows[0]?.ok).toBe(false);
    }
    await db.exec("UPDATE membership_payments SET amount=699,status='approved'; UPDATE job_post_entitlements SET ends_at=now()-interval '1 second'");
    expect((await db.query<{ok:boolean}>(`SELECT has_goods_membership('${member}') AS ok`)).rows[0]?.ok).toBe(false);
    await db.exec("UPDATE job_post_entitlements SET ends_at=now()+interval '1 month'");
  });
  it('blocks unpaid goods details and bells including an owner bell',async()=>{
    await actor(owner);
    await expect(db.query(`SELECT get_post_details('${goods}')`)).rejects.toThrow('GOODS_MEMBERSHIP_REQUIRED');
    await expect(db.query(`SELECT notify_matches('${goods}')`)).rejects.toThrow('GOODS_MEMBERSHIP_REQUIRED');
    await db.exec(`SELECT set_config('test.user','44444444-4444-4444-8444-444444444444',false)`);
    await expect(db.query(`SELECT ring_post('${goods}')`)).rejects.toThrow('GOODS_MEMBERSHIP_REQUIRED');
  });
  it('returns opted-in goods photos only to a paid member',async()=>{
    await actor(member);
    const result=await db.query<{details:{public_photo:string}}>(`SELECT get_post_details('${goods}') AS details`);
    expect(result.rows[0]?.details.public_photo).toBe('https://example.com/lorry.jpg');
    expect((await db.query<{ok:boolean}>(`SELECT can_post_chat('${goods}','${owner}') AS ok`)).rows[0]?.ok).toBe(true);
  });
  it('keeps unpaid goods owner chat blocked, but car and job chat free',async()=>{
    await actor(owner);
    expect((await db.query<{ok:boolean}>(`SELECT can_post_chat('${goods}','${member}') AS ok`)).rows[0]?.ok).toBe(false);
    for(const post of [car,job])expect((await db.query<{ok:boolean}>(`SELECT can_post_chat('${post}','${member}') AS ok`)).rows[0]?.ok).toBe(true);
  });
  it('job and car details are free but never include identity or photos',async()=>{
    await actor(owner);
    for(const post of [car,job]){
      const result=await db.query<{details:Record<string,unknown>}>(`SELECT get_post_details('${post}') AS details`);
      expect(result.rows[0]?.details.description).toBe(post===car?'Car description':'Job description');
      expect(result.rows[0]?.details).not.toHaveProperty('public_photo');
      expect(result.rows[0]?.details).not.toHaveProperty('contact_phone');
      expect(result.rows[0]?.details).not.toHaveProperty('public_brand');
    }
  });
  it('removes the three paid job quota and leaves any vehicle insertion free',async()=>{
    await db.exec('CREATE TRIGGER quota BEFORE INSERT ON posts FOR EACH ROW EXECUTE FUNCTION enforce_paid_job_quota()');
    for(let i=0;i<4;i++)await db.exec(`INSERT INTO posts(id,user_id,module,kind,status) VALUES(gen_random_uuid(),'${owner}','job','seeker','active')`);
    await db.exec(`INSERT INTO posts(id,user_id,module,kind,status,vehicle_type) VALUES(gen_random_uuid(),'${owner}','vehicle','owner','active','Lorry')`);
    expect((await db.query<{n:number}>(`SELECT count(*)::integer AS n FROM posts WHERE module='job'`)).rows[0]?.n).toBe(5);
  });
  it('prevents bypassing details through direct public column reads',async()=>{
    expect((await db.query<{ok:boolean}>(`SELECT has_column_privilege('anon','posts','public_photo','SELECT') AS ok`)).rows[0]?.ok).toBe(false);
    expect((await db.query<{ok:boolean}>(`SELECT has_column_privilege('authenticated','posts','description','SELECT') AS ok`)).rows[0]?.ok).toBe(false);
  });
});