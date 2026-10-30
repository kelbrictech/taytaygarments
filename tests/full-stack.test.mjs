import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const ts=createRequire(import.meta.url)('typescript');
const root=new URL('../',import.meta.url);
const compile=source=>ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const uri=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const domain=await import(uri(compile(readFileSync(new URL('src/domain.ts',root),'utf8'))));
globalThis.__ttcTestDomain=domain;
const calls=[];
globalThis.__ttcTestNeon=()=>async (strings,...values)=>{
 const sql=strings.join('?');calls.push({sql,values});
 if(sql.includes('SELECT count(*)::int n FROM ttc_privacy_requests'))return [{n:0}];
 if(sql.includes('WITH created AS')&&sql.includes('INSERT INTO ttc_privacy_requests'))return [{reference:'PRIV-2026-ABCDEF123456',status:'received'}];
  if(sql.includes('SELECT p.sku,p.slug,p.name'))return [{sku:'TTC-SCH-001',slug:'campus-polo',name:'Campus Signature Polo',concept:true,variants:[]}];
 if(sql.includes('SELECT reference,status,created_at FROM ttc_inquiries'))return values[1]==='buyer@example.com'?[{reference:values[0],status:'reviewing',created_at:'2026-10-28T00:00:00Z'}]:[];
 if(sql.includes('SELECT reference,organization,sector'))return [];
 return [];
};
let source=readFileSync(new URL('src/worker.ts',root),'utf8');
source=source.replace("import {neon} from '@neondatabase/serverless';","const neon=globalThis.__ttcTestNeon;");
source=source.replace("import {portalApi} from './portal';","const portalApi=globalThis.__ttcPortalTestApi;");
globalThis.__ttcPortalTestApi=async()=>new Response(JSON.stringify({error:'portal test stub'}),{status:404,headers:{'content-type':'application/json'}});
source=source.replace("import {normalizeInquiry,validateInquiry,makeReference} from './domain';","const {normalizeInquiry,validateInquiry,makeReference}=globalThis.__ttcTestDomain;");
const worker=(await import(uri(compile(source)))).default;
const env={DATABASE_URL:'postgresql://invalid.example/test',IP_HASH_PEPPER:'p'.repeat(64),ADMIN_API_TOKEN:'a'.repeat(64),INQUIRIES_ENABLED:'true',SITE_STATUS:'development',ASSETS:{fetch:()=>new Response('static')}};
const req=(path,init={})=>new Request('https://example.test'+path,init);
test('health reports backend and intake state without secrets',async()=>{
 const r=await worker.fetch(req('/api/health'),{...env,INQUIRIES_ENABLED:'false'});
 const j=await r.json();assert.equal(j.databaseConfigured,true);assert.equal(j.inquirySubmissionEnabled,false);
 assert.equal(JSON.stringify(j).includes('postgresql'),false);
});
test('no database yields 503 for catalog',async()=>{
 const r=await worker.fetch(req('/api/v1/products'),{...env,DATABASE_URL:undefined});
 assert.equal(r.status,503);
});
test('catalog is returned from the database',async()=>{
 const r=await worker.fetch(req('/api/v1/products'),env);
 assert.equal(r.status,200);const data=await r.json();assert.equal(data.products[0].sku,'TTC-SCH-001');
});
test('inquiry intake disabled blocks all requests',async()=>{
 const r=await worker.fetch(req('/api/v1/inquiries',{method:'POST'}),{...env,INQUIRIES_ENABLED:'false'});
 assert.equal(r.status,503);
});
test('production inquiry requires configured Turnstile',async()=>{
 const r=await worker.fetch(req('/api/v1/inquiries',{method:'POST'}),{...env,SITE_STATUS:'production'});
 assert.equal(r.status,503);
});
test('valid inquiry is persisted through SQL handler',async()=>{
 calls.length=0;
 const body={organization:'University A',sector:'School',contactName:'Buyer',email:'buyer@example.com',consent:true};
 const r=await worker.fetch(req('/api/v1/inquiries',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),env);
 assert.equal(r.status,201);const data=await r.json();assert.match(data.reference,/^TTC-20\d{2}-[A-F0-9]{8}$/);
 assert.equal(calls.some(x=>x.sql.includes('INSERT INTO ttc_inquiries')),true);
});
test('invalid inquiry rejects before any insert',async()=>{
 calls.length=0;
 const r=await worker.fetch(req('/api/v1/inquiries',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({organization:'X'})}),env);
 assert.equal(r.status,422);assert.equal(calls.length,0);
});
test('reference and email allow limited status lookup',async()=>{
 const good=await worker.fetch(req('/api/v1/inquiries/TTC-2026-12345678/status?email=buyer%40example.com'),env);
 assert.equal(good.status,200);const j=await good.json();assert.equal(j.inquiry.status,'reviewing');assert.equal(j.inquiry.email,undefined);
 const wrong=await worker.fetch(req('/api/v1/inquiries/TTC-2026-12345678/status?email=wrong%40example.com'),env);
 assert.equal(wrong.status,404);
});
test('retired admin API cannot bypass staff and administrator sessions',async()=>{
 const denied=await worker.fetch(req('/api/v1/admin/inquiries'),env);assert.equal(denied.status,410);
 const legacyToken=await worker.fetch(req('/api/v1/admin/inquiries',{headers:{authorization:'Bearer '+env.ADMIN_API_TOKEN}}),env);assert.equal(legacyToken.status,410);
});

test('privacy request intake rejects forged origin, missing notice and honeypot',async()=>{
 const body={email:'customer@example.com',type:'erasure',details:'Please assess records from my original account',acknowledged:true,noticeVersion:'2026-10-30'};
 const headers={'content-type':'application/json','cf-connecting-ip':'203.0.113.7'};
 assert.equal((await worker.fetch(req('/api/v1/privacy/requests',{method:'POST',headers:{...headers,origin:'https://attacker.example'},body:JSON.stringify(body)}),env)).status,403);
 const invalid=await worker.fetch(req('/api/v1/privacy/requests',{method:'POST',headers,body:JSON.stringify({...body,acknowledged:false})}),env);
 assert.equal(invalid.status,422);
 assert.equal((await worker.fetch(req('/api/v1/privacy/requests',{method:'POST',headers,body:JSON.stringify({...body,website:'automated-site'})}),env)).status,400);
});
test('legitimate data subject can record a rights request without automatic erasure',async()=>{
 calls.length=0;
 const r=await worker.fetch(req('/api/v1/privacy/requests',{method:'POST',headers:{'content-type':'application/json','cf-connecting-ip':'203.0.113.8'},body:JSON.stringify({email:'customer@example.com',type:'erasure',details:'Review my account before deleting personal information',acknowledged:true,noticeVersion:'2026-10-30',idempotencyKey:crypto.randomUUID()})}),env);
 assert.equal(r.status,201);
 const j=await r.json();assert.equal(j.actionCompleted,false);
 assert.match(j.reference,/^PRIV-20\d{2}-[A-F0-9]{12}$/);
 assert.ok(calls.some(x=>x.sql.includes('INSERT INTO ttc_privacy_requests')),'Ticket must persist to database');
 assert.ok(calls.some(x=>x.sql.includes('ip_fingerprint')),'Request must store anti-abuse fingerprint instead of raw IP');
});
test('privacy service readiness depends on database and anti-abuse secret',async()=>{
 const ok=await worker.fetch(req('/api/health'),env),j=await ok.json();
 assert.equal(j.privacyRequestAvailable,true);
 const r=await worker.fetch(req('/api/health'),{...env,IP_HASH_PEPPER:undefined});
 assert.equal((await r.json()).privacyRequestAvailable,false);
});
