import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const ts=createRequire(import.meta.url)('typescript');
const root=new URL('../',import.meta.url);
const dbCalls=[];
let user=null;
const q=async(sql,params=[])=>{
 dbCalls.push({sql,params});
 if(sql.includes('FROM ttc_sessions'))return user?[{token_hash:'h',csrf_token:'csrf-token',user_id:'u-001',role:user,email:'test@example.invalid',full_name:'Test Person',approval_status:'approved',demo:true}]:[];
 if(sql.includes('FROM ttc_jobs'))return [{code:'DEMO-JOB-001',title:'Sample Technician',demo:true}];
 if(sql.includes('FROM ttc_trust_badges'))return [{slug:'smeta',title:'Sedex / SMETA Audit',category:'Ethical production',status:'research',certificate_ref:'',verification_url:'',issuer:'Sedex',proof_kind:'audit'}];
 if(sql.includes('UPDATE ttc_trust_badges'))return [{slug:'smeta',status:params[0]==='documented'?'documented':sql.includes("status='submitted'")?'submitted':params[0]}];

 if(sql.includes('FROM ttc_content_pages'))return [{slug:'taytay-hub',title:'Taytay',body:'Factual industry article'}];
 if(sql.includes('FROM ttc_orders'))return [];
 if(sql.includes('FROM ttc_stock_items'))return [{sku:'TEST-STOCK',on_hand:30,reorder_point:10}];
 if(sql.includes('FROM ttc_stock_movements'))return [];
 if(sql.includes('FROM ttc_users'))return [{id:'u-002',role:'staff',approval_status:'pending'}];
 if(sql.includes('UPDATE ttc_users'))return [{id:'u-002',role:'staff',approval_status:params[0]}];
 if(sql.includes('UPDATE ttc_content_pages'))return [{slug:params[4],title:params[0],body:params[1],published:params[2]}];
 return [];
};
globalThis.__testNeon=()=>({query:q});
let source=readFileSync(new URL('src/portal.ts',root),'utf8');
source=source.replace("import {neon} from '@neondatabase/serverless';","const neon=globalThis.__testNeon;");
source=source.replace("import {qmsApi} from './qms';","const qmsApi=globalThis.__testQmsApi;");
globalThis.__testQmsApi=async()=>new Response(JSON.stringify({error:'QMS stub in portal security suite'}),{status:404,headers:{'content-type':'application/json'}});
const transpiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const portal=(await import('data:text/javascript;base64,'+Buffer.from(transpiled).toString('base64'))).portalApi;
const env={DATABASE_URL:'postgresql://fake-host',IP_HASH_PEPPER:'test-pepper'};
const req=(path,method='GET',payload,headers={})=>new Request('https://demo.test'+path,{method,headers:{...(payload?{'content-type':'application/json'}:{}),...headers},body:payload?JSON.stringify(payload):undefined});
const cookie={cookie:'__Host-ttc_session='+('a'.repeat(64))};
test('jobs are publicly readable with explicit demo status',async()=>{const r=await portal(req('/api/v2/jobs'),env);assert.equal(r.status,200);assert.equal((await r.json()).jobs[0].demo,true)});
test('protected orders reject anonymous readers',async()=>{user=null;assert.equal((await portal(req('/api/v2/orders'),env)).status,401)});
test('customer cannot view warehouse stock',async()=>{user='customer';assert.equal((await portal(req('/api/v2/stock','GET',undefined,cookie),env)).status,403)});
test('customer sees only their own orders',async()=>{user='customer';dbCalls.length=0;const r=await portal(req('/api/v2/orders','GET',undefined,cookie),env);assert.equal(r.status,200);const call=dbCalls.find(x=>x.sql.includes('FROM ttc_orders'));assert.equal(call.params[0],'u-001')});
test('staff cannot approve themselves or others',async()=>{user='staff';assert.equal((await portal(req('/api/v2/users/123e4567-e89b-12d3-a456-426614174000/approval','PATCH',{status:'approved'},{...cookie,'x-csrf-token':'csrf-token'}),env)).status,403)});
test('admin requests require CSRF token',async()=>{user='admin';assert.equal((await portal(req('/api/v2/users/123e4567-e89b-12d3-a456-426614174000/approval','PATCH',{status:'approved'},cookie),env)).status,403)});
test('admin can approve a staff record',async()=>{user='admin';const r=await portal(req('/api/v2/users/123e4567-e89b-12d3-a456-426614174000/approval','PATCH',{status:'approved'},{...cookie,'x-csrf-token':'csrf-token'}),env);assert.equal(r.status,200);assert.equal((await r.json()).user.approval_status,'approved')});
test('webmaster is denied stock and approvals',async()=>{user='webmaster';assert.equal((await portal(req('/api/v2/stock','GET',undefined,cookie),env)).status,403);assert.equal((await portal(req('/api/v2/users','GET',undefined,cookie),env)).status,403)});
test('webmaster edits allowlisted CMS content with CSRF',async()=>{user='webmaster';const r=await portal(req('/api/v2/cms/taytay-hub','PUT',{title:'Taytay industry',body:'A long and meaningful demonstration content update.',published:true},{...cookie,'x-csrf-token':'csrf-token'}),env);assert.equal(r.status,200)});
test('CSRF cross-origin POST is blocked',async()=>{user='staff';const r=await portal(req('/api/v2/orders','POST',{description:'A new demo order'},{...cookie,origin:'https://evil.test','x-csrf-token':'csrf-token'}),env);assert.equal(r.status,403)});

test('badge registry is public, and empty credentials are research-only',async()=>{
 user=null;const r=await portal(req('/api/v2/trust'),env);assert.equal(r.status,200);
 const body=await r.json();assert.equal(body.badges[0].status,'research');assert.equal(body.badges[0].certificate_ref,'');assert.equal(body.verifiedExternally,false);
});
test('anonymous client cannot access badge management',async()=>{
 user=null;assert.equal((await portal(req('/api/v2/trust/manage'),env)).status,401);
});
test('webmaster can see research badges but cannot self-approve',async()=>{
 user='webmaster';assert.equal((await portal(req('/api/v2/trust/manage','GET',undefined,cookie),env)).status,200);
 const r=await portal(req('/api/v2/trust/smeta/review','PATCH',{status:'documented'},{...cookie,'x-csrf-token':'csrf-token'}),env);assert.equal(r.status,403);
});
test('unapproved customer cannot submit badge evidence',async()=>{
 user='customer';const r=await portal(req('/api/v2/trust/smeta/proof','PATCH',{reference:'TEST-0001',verificationUrl:'https://example.com/proof'},{...cookie,'x-csrf-token':'csrf-token'}),env);assert.equal(r.status,403);
});
test('webmaster evidence submission rejects insecure URLs',async()=>{
 user='webmaster';const r=await portal(req('/api/v2/trust/smeta/proof','PATCH',{reference:'TEST-0001',verificationUrl:'http://example.com/proof'},{...cookie,'x-csrf-token':'csrf-token'}),env);assert.equal(r.status,422);
});
test('webmaster may submit review evidence under a secure URL',async()=>{
 user='webmaster';const r=await portal(req('/api/v2/trust/smeta/proof','PATCH',{reference:'TEST-0001',verificationUrl:'https://www.sedex.com/'},{...cookie,'x-csrf-token':'csrf-token'}),env);assert.equal(r.status,200);
});
test('administrator may record a submitted credential review',async()=>{
 user='admin';const r=await portal(req('/api/v2/trust/smeta/review','PATCH',{status:'documented'},{...cookie,'x-csrf-token':'csrf-token'}),env);assert.equal(r.status,200);assert.equal((await r.json()).badge.status,'documented');
});
