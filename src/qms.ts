/**
 * ISO 9001:2026 preparation register. Owner-authenticated, no certification assertion.
 * All writes are append-only or accompanied by immutable history entries.
 * CSRF, same-origin and approved-session checks happen in portal.ts before dispatch.
 */
type Session={user_id:string;role:string;demo:boolean};
type Query=(sql:string,args?:any[])=>Promise<any[]>;
type Context={session:Session;query:Query;audit:(action:string,entity:string,key:string)=>Promise<any>};
const answer=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const deny=()=>answer({error:'Permission denied.'},403);
const text=(x:unknown,max=200)=>typeof x==='string'?x.trim().slice(0,max):'';
const codeOk=(x:string)=>/^QMS-[A-Z0-9-]{3,55}$/.test(x);
const idOk=(x:string)=>/^[a-f0-9-]{36}$/.test(x);
const randomRef=(prefix:string,bytes:number)=>{const buf=new Uint8Array(bytes);crypto.getRandomValues(buf);return prefix+Array.from(buf,b=>b.toString(16).padStart(2,'0')).join('').toUpperCase()};
async function input(r:Request){if(r.headers.get('content-type')?.split(';')[0]!=='application/json'||Number(r.headers.get('content-length')||0)>12288)throw Error('JSON required');const raw=await r.text();if(raw.length>12288)throw Error('Too large');const data=JSON.parse(raw);if(!data||Array.isArray(data)||typeof data!=='object')throw Error('Object required');return data as Record<string,unknown>}
const docsKinds=['policy','scope','procedure','work_instruction','form','register'];
const issuesKinds=['risk','opportunity','nonconformity','customer_complaint','corrective_action'];
const recordsKinds=['requirements_review','supplier_evaluation','incoming_inspection','in_process_inspection','final_inspection','competence','internal_audit','management_review','customer_feedback','change_control','quality_objective','climate_context_review'];
export async function qmsApi(request:Request,ctx:Context):Promise<Response>{
 const {session:s,query:q,audit}=ctx;
 const path=new URL(request.url).pathname,method=request.method;
 if(!['staff','admin'].includes(s.role))return deny();
 const admin=s.role==='admin';
 if(path==='/api/v2/qms/overview'&&method==='GET'){
  const [documents,issues,records]=await Promise.all([
   q("SELECT d.code,d.title,d.kind,d.version,d.status,d.body,d.demo,d.created_at,d.updated_at,d.approved_at,d.owner_id,u.full_name AS owner,a.full_name AS approver FROM ttc_qms_documents d LEFT JOIN ttc_users u ON d.owner_id=u.id LEFT JOIN ttc_users a ON d.approved_by=a.id ORDER BY d.code LIMIT 150"),
   q("SELECT i.reference,i.kind,i.title,i.description,i.severity,i.status,i.order_no,i.root_cause,i.action_plan,i.effectiveness_check,i.demo,i.created_at,i.updated_at,u.full_name AS owner FROM ttc_qms_issues i LEFT JOIN ttc_users u ON u.id=i.owner_id ORDER BY CASE WHEN i.status='closed' THEN 1 ELSE 0 END,i.created_at DESC LIMIT 150"),
   q("SELECT r.reference,r.kind,r.title,r.details,r.result,r.order_no,r.supplier_code,r.evidence_ref,r.demo,r.created_at,u.full_name AS actor FROM ttc_qms_records r LEFT JOIN ttc_users u ON u.id=r.actor_id ORDER BY r.created_at DESC LIMIT 150")
  ]);
  return answer({edition:'ISO 9001:2026',certificationStatus:'unverified',claimsAllowed:false,
   notice:'Operational preparation workspace. Drafts and demonstration records are not proof of implementation, compliance, independent audit or certification.',
   documents,issues,records});
 }
 if(path==='/api/v2/qms/documents'&&method==='POST'){
  let x;try{x=await input(request)}catch{return answer({error:'Valid JSON document required.'},400)}
  const code=text(x.code,65).toUpperCase(),title=text(x.title,160),kind=text(x.kind,40),content=text(x.body,12000);
  if(!codeOk(code)||title.length<5||!docsKinds.includes(kind)||content.length<20)return answer({error:'Invalid document code, type, title or body.'},422);
  try{
   const rows=await q("WITH added AS (INSERT INTO ttc_qms_documents(code,title,kind,body,owner_id,demo) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,code,title,kind,body,version,status), history AS (INSERT INTO ttc_qms_document_history(document_id,version,status,body,actor_id,reason) SELECT id,version,status,body,$5,'Initial draft' FROM added RETURNING id) SELECT added.code,added.version,added.status FROM added JOIN history ON true",[code,title,kind,content,s.user_id,s.demo]);
   await audit('qms-document:create','qms-document',code);return answer({document:rows[0]},201);
  }catch{return answer({error:'A document with this code already exists.'},409)}
 }
 const doc=path.match(/^\/api\/v2\/qms\/documents\/(QMS-[A-Z0-9-]+)$/);
 if(doc&&method==='GET'){
  const rows=await q('SELECT d.code,d.title,d.kind,d.body,d.status,d.version,d.approved_at,d.demo FROM ttc_qms_documents d WHERE d.code=$1',[doc[1]]);
  if(!rows.length)return answer({error:'Document not found.'},404);
  const history=await q("SELECT h.version,h.status,h.body,h.reason,h.created_at,u.full_name AS actor FROM ttc_qms_document_history h JOIN ttc_qms_documents d ON d.id=h.document_id LEFT JOIN ttc_users u ON u.id=h.actor_id WHERE d.code=$1 ORDER BY h.id DESC LIMIT 100",[doc[1]]);
  return answer({document:rows[0],history});
 }
 if(doc&&method==='PATCH'){
  let x;try{x=await input(request)}catch{return answer({error:'Valid JSON revision required.'},400)}
  const content=text(x.body,12000),title=text(x.title,160),why=text(x.reason,300),expected=Number(x.version);
  if(content.length<20||title.length<5||why.length<10||!Number.isSafeInteger(expected)||expected<1)return answer({error:'Document revision, version and change reason required.'},422);
  const rows=await q("WITH changed AS (UPDATE ttc_qms_documents SET title=$1,body=$2,version=version+1,status='draft',owner_id=$3,approved_by=NULL,approved_at=NULL,updated_at=now() WHERE code=$4 AND version=$5 AND status IN ('draft','in_review') AND (owner_id IS NULL OR owner_id=$3 OR $6::boolean=true) RETURNING id,code,version,status,body), history AS (INSERT INTO ttc_qms_document_history(document_id,version,status,body,actor_id,reason) SELECT id,version,status,body,$3,$7 FROM changed RETURNING id) SELECT changed.code,changed.version,changed.status FROM changed JOIN history ON true",[title,content,s.user_id,doc[1],expected,admin,why]);
  if(!rows.length)return answer({error:'Revision rejected: stale version, approved document, or ownership mismatch. Approved issues stay immutable; create a new controlled document for a revision.'},409);
  await audit('qms-document:revise','qms-document',doc[1]);return answer({document:rows[0]});
 }
 const stage=path.match(/^\/api\/v2\/qms\/documents\/(QMS-[A-Z0-9-]+)\/(submit|approve|obsolete)$/);
 if(stage&&method==='PATCH'){
  let x;try{x=await input(request)}catch{return answer({error:'Review reason required.'},400)}
  const reason=text(x.reason,300);if(reason.length<12)return answer({error:'Explain the document review decision.'},422);
  const action=stage[2];if((action==='approve'||action==='obsolete')&&!admin)return deny();
  const from=action==='submit'?'draft':action==='approve'?'in_review':'approved';
  const to=action==='submit'?'in_review':action==='approve'?'approved':'obsolete';
  const rows=await q("WITH changed AS (UPDATE ttc_qms_documents SET status=$1,approved_by=CASE WHEN $2='approve' THEN $3 WHEN $2='obsolete' THEN approved_by ELSE NULL END,approved_at=CASE WHEN $2='approve' THEN now() WHEN $2='obsolete' THEN approved_at ELSE NULL END,updated_at=now() WHERE code=$4 AND status=$5 AND ($2<>'approve' OR (owner_id IS NOT NULL AND owner_id<>$3)) AND ($2<>'submit' OR owner_id=$3 OR $6::boolean=true) RETURNING id,code,version,status,body), history AS (INSERT INTO ttc_qms_document_history(document_id,version,status,body,actor_id,reason) SELECT id,version,status,body,$3,$7 FROM changed RETURNING id) SELECT changed.code,changed.version,changed.status FROM changed JOIN history ON true",[to,action,s.user_id,stage[1],from,admin,reason]);
  if(!rows.length)return answer({error:'Transition blocked: incorrect status or reviewer must be different from the document author.'},409);
  await audit('qms-document:'+action,'qms-document',stage[1]);return answer({document:rows[0]});
 }
 if(path==='/api/v2/qms/issues'&&method==='POST'){
  let x;try{x=await input(request)}catch{return answer({error:'Valid issue record required.'},400)}
  const kind=text(x.kind,35),title=text(x.title,160),desc=text(x.description,2400),severity=text(x.severity,12),orderNo=text(x.orderNo,65)||null;
  if(!issuesKinds.includes(kind)||title.length<5||desc.length<15||!['low','medium','high'].includes(severity)||(orderNo&&!/^TTC-[A-Z0-9-]+$/.test(orderNo)))return answer({error:'Invalid issue type, severity, title or description.'},422);
  const reference=randomRef('QMS-'+({risk:'RISK',opportunity:'OPP',nonconformity:'NC',customer_complaint:'COM',corrective_action:'CAPA'} as Record<string,string>)[kind]+'-',5);
  const rows=await q("WITH added AS (INSERT INTO ttc_qms_issues(reference,kind,title,description,severity,order_no,owner_id,demo) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,reference,kind,status), history AS (INSERT INTO ttc_qms_issue_history(issue_id,actor_id,status,note) SELECT id,$7,status,'Issue opened for assessment' FROM added RETURNING id) SELECT added.reference,added.kind,added.status FROM added JOIN history ON true",[reference,kind,title,desc,severity,orderNo,s.user_id,s.demo]);
  await audit('qms-issue:create','qms-issue',reference);return answer({issue:rows[0]},201);
 }
 const issue=path.match(/^\/api\/v2\/qms\/issues\/(QMS-[A-Z]+-[0-9A-F]{10})\/status$/);
 if(issue&&method==='PATCH'){
  let x;try{x=await input(request)}catch{return answer({error:'Valid issue update required.'},400)}
  const status=text(x.status,20),note=text(x.note,350),cause=text(x.rootCause,1200),plan=text(x.actionPlan,1200),effect=text(x.effectivenessCheck,1200);
  if(!['in_progress','verification','closed'].includes(status)||note.length<12)return answer({error:'Reason and valid transition required.'},422);
  if(status==='closed'&&!admin)return deny();
  if(status==='closed'&&(cause.length<15||plan.length<15||effect.length<15))return answer({error:'Closure requires documented root cause, action and effectiveness verification.'},422);
  const rows=await q("WITH changed AS (UPDATE ttc_qms_issues SET status=$1,root_cause=CASE WHEN $1='closed' THEN $2 WHEN $2<>'' THEN $2 ELSE root_cause END,action_plan=CASE WHEN $1='closed' THEN $3 WHEN $3<>'' THEN $3 ELSE action_plan END,effectiveness_check=CASE WHEN $1='closed' THEN $4 ELSE effectiveness_check END,closed_by=CASE WHEN $1='closed' THEN $5 ELSE NULL END,closed_at=CASE WHEN $1='closed' THEN now() ELSE NULL END,updated_at=now() WHERE reference=$6 AND ((status='open' AND $1='in_progress') OR (status='in_progress' AND $1='verification') OR (status='verification' AND $1='closed' AND $7::boolean=true)) RETURNING id,reference,status), history AS (INSERT INTO ttc_qms_issue_history(issue_id,actor_id,status,note) SELECT id,$5,status,$8 FROM changed RETURNING id) SELECT changed.reference,changed.status FROM changed JOIN history ON true",[status,cause,plan,effect,s.user_id,issue[1],admin,note]);
  if(!rows.length)return answer({error:'Transition invalid. Follow open → in progress → verification → authorized closure.'},409);
  await audit('qms-issue:'+status,'qms-issue',issue[1]);return answer({issue:rows[0]});
 }
 if(path==='/api/v2/qms/records'&&method==='POST'){
  let x;try{x=await input(request)}catch{return answer({error:'Valid quality record required.'},400)}
  const kind=text(x.kind,40),title=text(x.title,160),details=text(x.details,3500),result=text(x.result,20),
   orderNo=text(x.orderNo,65)||null,supplier=text(x.supplierCode,65)||null,evidence=text(x.evidenceRef,160);
  if(!recordsKinds.includes(kind)||title.length<5||details.length<20||!['pass','fail','follow_up','not_applicable'].includes(result))return answer({error:'Invalid record type, result, title or details.'},422);
  if(['internal_audit','management_review'].includes(kind)&&!admin)return deny();
  if(orderNo&&!/^TTC-[A-Z0-9-]+$/.test(orderNo))return answer({error:'Invalid order reference.'},422);
  if(supplier&&!/^[A-Z0-9-]{4,65}$/.test(supplier))return answer({error:'Invalid supplier reference.'},422);
  if(kind==='final_inspection'&&(!orderNo||evidence.length<6))return answer({error:'Final inspection requires a linked order and traceable specification/evidence reference.'},422);
  const reference=randomRef('QMS-REC-',6);
  // For final inspections, enforce an existing matching demo/live order. An unlinked pass cannot release goods.
  if(kind==='final_inspection'){
   const orders=await q('SELECT order_no,demo FROM ttc_orders WHERE order_no=$1',[orderNo]);
   if(!orders.length)return answer({error:'Linked order does not exist.'},404);
   if(Boolean(orders[0].demo)!==Boolean(s.demo))return answer({error:'Demo inspection cannot be recorded against live orders or vice versa.'},403);
  }
  const rows=await q("INSERT INTO ttc_qms_records(reference,kind,title,details,result,order_no,supplier_code,evidence_ref,actor_id,demo) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING reference,kind,result,created_at",[reference,kind,title,details,result,orderNo,supplier,evidence,s.user_id,s.demo]);
  await audit('qms-record:create','qms-record',reference);
  return answer({record:rows[0],immutable:true,notice:'This record is append-only. Correct errors with a new superseding record and traceable explanation.'},201);
 }
 return answer({error:'Quality management route not found.'},404);
}
