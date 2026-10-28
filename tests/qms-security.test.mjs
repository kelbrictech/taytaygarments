import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const ts=createRequire(import.meta.url)('typescript');
const src=readFileSync(new URL('../src/qms.ts',import.meta.url),'utf8');
const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {qmsApi}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const calls=[];
const query=async(sql,args=[])=>{
 calls.push({sql,args});
 if(sql.includes('SELECT order_no,demo FROM ttc_orders'))return args[0]==='TTC-2026-DEMO01'?[{order_no:args[0],demo:true}]:[];
 if(sql.includes('UPDATE ttc_qms_documents'))return [{code:'QMS-WI-001',version:2,status:args[0]||'draft'}];
 if(sql.includes('WITH added AS')&&sql.includes('ttc_qms_documents'))return [{code:'QMS-WI-004',version:1,status:'draft'}];
 if(sql.includes('WITH added AS')&&sql.includes('ttc_qms_issues'))return [{reference:'QMS-RISK-AABBCCDDEE',status:'open'}];
 if(sql.includes('UPDATE ttc_qms_issues'))return [{reference:'QMS-NC-AABBCCDDEE',status:args[0]}];
 if(sql.includes('INSERT INTO ttc_qms_records'))return [{reference:'QMS-REC-AABBCCDDEEFF',kind:args[1],result:args[4]}];
 if(sql.includes('FROM ttc_qms_documents'))return [];
 if(sql.includes('FROM ttc_qms_issues'))return [];
 if(sql.includes('FROM ttc_qms_records'))return [];
 return [];
};
const ctx=(role='staff',demo=true)=>({session:{role,user_id:'123e4567-e89b-12d3-a456-426614174000',demo},
 query,audit:async(action,entity,key)=>{calls.push({audit:{action,entity,key}});return []}});
const post=(path,body,method='POST')=>new Request('https://example.invalid'+path,{method,headers:{'content-type':'application/json'},body:JSON.stringify(body)});
const get=path=>new Request('https://example.invalid'+path);
const data=async r=>r.json();
const docBody={code:'QMS-WI-004',title:'Garment inspection control',kind:'work_instruction',body:'Detailed internal work instruction pending physical trial and authorized approval.'};
test('QMS denies customer and webmaster roles',async()=>{
 for(const role of ['customer','webmaster'])assert.equal((await qmsApi(get('/api/v2/qms/overview'),ctx(role))).status,403);
});
test('QMS reports preparation status and never claims certification',async()=>{
 const r=await qmsApi(get('/api/v2/qms/overview'),ctx('staff'));assert.equal(r.status,200);
 const v=await data(r);assert.equal(v.edition,'ISO 9001:2026');assert.equal(v.claimsAllowed,false);assert.equal(v.certificationStatus,'unverified');
});
test('Approved staff may start document draft, with audit evidence',async()=>{
 calls.length=0;const r=await qmsApi(post('/api/v2/qms/documents',docBody),ctx('staff'));assert.equal(r.status,201);
 assert.ok(calls.some(c=>c.sql?.includes('ttc_qms_document_history')));
 assert.ok(calls.some(c=>c.audit?.action==='qms-document:create'));
});
test('Document revision refuses short justification',async()=>{
 const r=await qmsApi(post('/api/v2/qms/documents/QMS-WI-001',{version:1,title:'Inspection criteria',body:'A complete new inspection record with controlled criteria.',reason:'ok'},'PATCH'),ctx('staff'));assert.equal(r.status,422);
});
test('Staff may not approve or obsolete quality policy',async()=>{
 for(const action of ['approve','obsolete']){
  const r=await qmsApi(post('/api/v2/qms/documents/QMS-POL-001/'+action,{reason:'Reviewed against approved business strategy'},'PATCH'),ctx('staff'));
  assert.equal(r.status,403);
 }
});
test('Administrator approval query enforces separate authorship',async()=>{
 calls.length=0;const r=await qmsApi(post('/api/v2/qms/documents/QMS-WI-001/approve',{reason:'Independent verification of controlled work instruction'},'PATCH'),ctx('admin'));
 assert.equal(r.status,200);assert.ok(calls.some(c=>c.sql?.includes('owner_id<>$3')),'Self-approval must be blocked by database condition');
});
test('Quality risks and opportunities have distinct record types',async()=>{
 for(const kind of ['risk','opportunity','nonconformity','customer_complaint','corrective_action']){
  const r=await qmsApi(post('/api/v2/qms/issues',{kind,title:'Example improvement item',description:'Evidence-backed issue requiring review and follow up.',severity:'medium'}),ctx('staff'));
  assert.equal(r.status,201,kind);
 }
});
test('Only administrator can close CAPA, and root cause and effectiveness check are required',async()=>{
 const payload={status:'closed',note:'Verified corrective action and sustained results',rootCause:'Insufficiently controlled cutting process',actionPlan:'Change template and retrain assigned staff',effectivenessCheck:'Thirty samples checked with documented acceptance'};
 assert.equal((await qmsApi(post('/api/v2/qms/issues/QMS-NC-AABBCCDDEE/status',payload,'PATCH'),ctx('staff'))).status,403);
 assert.equal((await qmsApi(post('/api/v2/qms/issues/QMS-NC-AABBCCDDEE/status',{...payload,effectivenessCheck:'n/a'},'PATCH'),ctx('admin'))).status,422);
 const r=await qmsApi(post('/api/v2/qms/issues/QMS-NC-AABBCCDDEE/status',payload,'PATCH'),ctx('admin'));
 assert.equal(r.status,200);
 assert.ok(calls.some(c=>c.sql?.includes("status='verification' AND $1='closed'")));
});
test('Staff cannot forge an internal audit or management review record',async()=>{
 for(const kind of ['internal_audit','management_review']){
  const r=await qmsApi(post('/api/v2/qms/records',{kind,title:'Audit summary document',details:'Sufficiently detailed sample evidence without asserting actual certification.',result:'follow_up'}),ctx('staff'));
  assert.equal(r.status,403);
 }
});
test('Final inspection requires order, evidence reference and a valid linked order',async()=>{
 const base={kind:'final_inspection',title:'Sample final garment check',details:'Check signed measurements, defect list, sample and trim against approved specification.',result:'pass'};
 assert.equal((await qmsApi(post('/api/v2/qms/records',base),ctx())).status,422);
 assert.equal((await qmsApi(post('/api/v2/qms/records',{...base,orderNo:'TTC-2026-UNKNOWN',evidenceRef:'SPEC-017'}),ctx())).status,404);
 assert.equal((await qmsApi(post('/api/v2/qms/records',{...base,orderNo:'TTC-2026-DEMO01',evidenceRef:'SPEC-017'}),ctx('staff',false))).status,403);
 assert.equal((await qmsApi(post('/api/v2/qms/records',{...base,orderNo:'TTC-2026-DEMO01',evidenceRef:'SPEC-017'}),ctx('staff',true))).status,201);
});
test('Quality record is append-only, and no update API exists',async()=>{
 const r=await qmsApi(post('/api/v2/qms/records/QMS-REC-AABBCCDDEEFF',{details:'Modified report content'},'PATCH'),ctx('admin'));
 assert.equal(r.status,404);
});
test('QMS source never issues certification statuses',()=>{
 assert.doesNotMatch(src,/status\\s*=\\s*['"]certified['"]/);
 assert.match(src,/certificationStatus:'unverified'/);
});
