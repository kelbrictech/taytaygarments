import {neon} from '@neondatabase/serverless';
type Env={DATABASE_URL?:string;IP_HASH_PEPPER?:string};
type S={token_hash:string;csrf_token:string;user_id:string;role:string;email:string;full_name:string;approval_status:string;demo:boolean};
const te=new TextEncoder();
const reply=(x:unknown,status=200,headers:Record<string,string>={})=>new Response(JSON.stringify(x),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}});
const hex=(b:BufferSource)=>Array.from(new Uint8Array(b instanceof ArrayBuffer?b:b.buffer as ArrayBuffer),v=>v.toString(16).padStart(2,'0')).join('');
const random=(n=32)=>{const a=new Uint8Array(n);crypto.getRandomValues(a);return hex(a)};
const sha=async(s:string)=>hex(await crypto.subtle.digest('SHA-256',te.encode(s)));
function equal(a:string,b:string){if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0}
async function hashPassword(pw:string,salt:string,iterations=600000){const k=await crypto.subtle.importKey('raw',te.encode(pw),'PBKDF2',false,['deriveBits']);return hex(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new Uint8Array((salt.match(/.{2}/g)||[]).map(x=>parseInt(x,16))),iterations},k,256))}
const clean=(x:unknown,n=150)=>typeof x==='string'?x.trim().slice(0,n):'';
const emailOk=(x:string)=>x.length<=150&&/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(x);
function cookie(r:Request){return (r.headers.get('cookie')||'').match(/(?:^|;\s*)__Host-ttc_session=([a-f0-9]{64})(?:;|$)/)?.[1]||''}
function setCookie(value:string,maxAge=43200){return '__Host-ttc_session='+value+'; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age='+maxAge}
function safeOrigin(r:Request){const u=r.headers.get('origin'),site=r.headers.get('sec-fetch-site');return (!u||u===new URL(r.url).origin)&&(!site||site==='same-origin'||site==='none')}
async function body(r:Request){if(r.headers.get('content-type')?.split(';')[0]!=='application/json'||Number(r.headers.get('content-length')||0)>12288)throw Error('Invalid content');const s=await r.text();if(s.length>12288)throw Error('Too large');const x=JSON.parse(s);if(!x||typeof x!=='object'||Array.isArray(x))throw Error('Invalid body');return x as Record<string,unknown>}
const access=(s:S,roles:string[])=>roles.includes(s.role);
const denied=(status=403)=>reply({error:status===401?'Sign in required.':'Permission denied.'},status);
const orderStates=['received','sampling','approved','production','quality_check','dispatch','delivered','cancelled'];
export async function portalApi(r:Request,e:Env):Promise<Response>{
 const path=new URL(r.url).pathname,method=r.method;
 if(!e.DATABASE_URL)return reply({error:'Database connection is not configured.'},503);
 const db=neon(e.DATABASE_URL);
 const q=(sql:string,args:any[]=[])=>db.query(sql,args);
 if(path==='/api/v2/jobs'&&method==='GET')return reply({jobs:await q('SELECT code,title,department,location,arrangement,summary,demo FROM ttc_jobs WHERE published=true ORDER BY code'),notice:'All displayed openings are sample demonstration positions, not actual vacancies.'});
 const page=path.match(/^\/api\/v2\/pages\/(taytay-hub|careers|homepage-note)$/);
 if(page&&method==='GET'){const rows=await q('SELECT slug,title,body FROM ttc_content_pages WHERE slug=$1 AND published=true',[page[1]]);return rows.length?reply({page:rows[0]}):reply({error:'Page unavailable.'},404)}
 if(method==='POST'&&path==='/api/v2/auth/login'){
  if(!safeOrigin(r))return denied();let x;try{x=await body(r)}catch{return reply({error:'Invalid sign-in request.'},400)}
  const email=clean(x.email).toLowerCase(),pw=typeof x.password==='string'?x.password:'';
  if(!emailOk(email)||pw.length<8||pw.length>128)return reply({error:'Incorrect email or password.'},401);
  const ip=await sha((e.IP_HASH_PEPPER||'')+'|'+(r.headers.get('cf-connecting-ip')||'unknown'));
  const attempts=await q("SELECT count(*)::int AS n FROM ttc_login_attempts WHERE success=false AND created_at>now()-interval '15 minutes' AND (email=$1 OR ip_hash=$2)",[email,ip]);
  if(Number(attempts[0]?.n||0)>=8)return reply({error:'Too many attempts. Try later.'},429);
  const users=await q('SELECT * FROM ttc_users WHERE email=$1 LIMIT 1',[email]);const u=users[0];
  const hash=await hashPassword(pw,u?.password_salt||'00000000000000000000000000000000',u?.password_iterations||600000);
  const valid=Boolean(u&&equal(hash,u.password_hash));
  await q('INSERT INTO ttc_login_attempts(email,ip_hash,success) VALUES($1,$2,$3)',[email,ip,valid]);
  if(!valid)return reply({error:'Incorrect email or password.'},401);
  if(u.approval_status!=='approved')return reply({error:'Administrator approval is pending.'},403);
  const token=random(),csrf=random(),th=await sha(token);
  await q("INSERT INTO ttc_sessions(token_hash,user_id,csrf_token,expires_at) VALUES($1,$2,$3,now()+interval '12 hours')",[th,u.id,csrf]);
  return reply({user:{id:u.id,name:u.full_name,email:u.email,role:u.role,demo:u.demo,csrf}},200,{'set-cookie':setCookie(token)});
 }
 if(method==='POST'&&path==='/api/v2/auth/request-staff'){
  if(!safeOrigin(r))return denied();let x;try{x=await body(r)}catch{return reply({error:'Invalid request.'},400)}
  const name=clean(x.name,100),email=clean(x.email).toLowerCase(),pw=typeof x.password==='string'?x.password:'';
  if(name.length<3||!emailOk(email)||pw.length<15||pw.length>128||x.consent!==true||clean(x.website)!=='')return reply({error:'Valid name, email, 15-character password and consent required.'},422);
  const ip=await sha((e.IP_HASH_PEPPER||'')+'|'+(r.headers.get('cf-connecting-ip')||'unknown'));
  const attempts=await q("SELECT count(*)::int AS n FROM ttc_login_attempts WHERE ip_hash=$1 AND created_at>now()-interval '1 hour'",[ip]);
  if(Number(attempts[0]?.n||0)>=10)return reply({error:'Too many account requests.'},429);
  const salt=random(16),digest=await hashPassword(pw,salt);
  try{await q("INSERT INTO ttc_users(email,full_name,role,approval_status,password_salt,password_hash,demo) VALUES($1,$2,'staff','pending',$3,$4,false)",[email,name,salt,digest])}catch{return reply({error:'Account request could not be created.'},409)}
  await q('INSERT INTO ttc_login_attempts(email,ip_hash,success) VALUES($1,$2,false)',[email,ip]);
  return reply({received:true,message:'Await administrator approval before signing in.'},201);
 }
 let s:S|null=null;const token=cookie(r);
 if(token){const th=await sha(token);const rows=await q("SELECT ss.token_hash,ss.csrf_token,ss.user_id,u.role,u.email,u.full_name,u.approval_status,u.demo FROM ttc_sessions ss JOIN ttc_users u ON ss.user_id=u.id WHERE ss.token_hash=$1 AND ss.expires_at>now() LIMIT 1",[th]);s=rows[0]?.approval_status==='approved'?rows[0] as S:null}
 if(path==='/api/v2/auth/me'&&method==='GET')return s?reply({user:{id:s.user_id,name:s.full_name,email:s.email,role:s.role,demo:s.demo,csrf:s.csrf_token}}):denied(401);
 if(!s)return denied(401);
 if(['POST','PUT','PATCH','DELETE'].includes(method)&&(!safeOrigin(r)||r.headers.get('x-csrf-token')!==s.csrf_token))return reply({error:'CSRF verification failed.'},403);
 const audit=(action:string,entity:string,key:string)=>q('INSERT INTO ttc_audit_log(actor_id,action,entity,entity_key) VALUES($1,$2,$3,$4)',[s!.user_id,action,entity,key]);
 if(path==='/api/v2/auth/logout'&&method==='POST'){await q('DELETE FROM ttc_sessions WHERE token_hash=$1',[s.token_hash]);return reply({signedOut:true},200,{'set-cookie':setCookie('',0)})}
 if(path==='/api/v2/auth/password'&&method==='POST'){
  let x;try{x=await body(r)}catch{return reply({error:'Invalid request.'},400)}
  const current=typeof x.current==='string'?x.current:'',next=typeof x.next==='string'?x.next:'';
  if(next.length<15||next.length>128)return reply({error:'New password must be 15–128 characters.'},422);
  const rows=await q('SELECT password_salt,password_hash,password_iterations FROM ttc_users WHERE id=$1',[s.user_id]);
  if(!rows.length||!equal(await hashPassword(current,rows[0].password_salt,rows[0].password_iterations),rows[0].password_hash))return reply({error:'Incorrect current password.'},403);
  const salt=random(16),hash=await hashPassword(next,salt);
  await q('UPDATE ttc_users SET password_salt=$1,password_hash=$2,password_iterations=600000,updated_at=now() WHERE id=$3',[salt,hash,s.user_id]);
  await q('DELETE FROM ttc_sessions WHERE user_id=$1',[s.user_id]);await audit('password-change','user',s.user_id);
  return reply({changed:true,signInAgain:true},200,{'set-cookie':setCookie('',0)});
 }
 if(path==='/api/v2/orders'&&method==='GET'){
  if(!access(s,['customer','staff','admin']))return denied();
  const sql=access(s,['staff','admin'])?'SELECT o.order_no,o.status,o.description,o.quantity,o.delivery_target,o.demo,o.created_at,u.full_name AS customer FROM ttc_orders o JOIN ttc_users u ON u.id=o.customer_id ORDER BY o.created_at DESC LIMIT 100':'SELECT order_no,status,description,quantity,delivery_target,demo,created_at FROM ttc_orders WHERE customer_id=$1 ORDER BY created_at DESC LIMIT 100';
  return reply({orders:await q(sql,s.role==='customer'?[s.user_id]:[])});
 }
 if(path==='/api/v2/orders'&&method==='POST'){
  if(!access(s,['staff','admin']))return denied();let x;try{x=await body(r)}catch{return reply({error:'Invalid request.'},400)}
  const customer=clean(x.customerEmail).toLowerCase(),desc=clean(x.description,500),qty=Number(x.quantity),order='TTC-'+new Date().getUTCFullYear()+'-'+random(5).toUpperCase();
  if(!emailOk(customer)||desc.length<5||!Number.isSafeInteger(qty)||qty<1||qty>1000000)return reply({error:'Invalid order fields.'},422);
  const rows=await q("INSERT INTO ttc_orders(order_no,customer_id,status,description,quantity,demo) SELECT $1,id,'received',$2,$3,true FROM ttc_users WHERE email=$4 AND role='customer' RETURNING order_no,status,description,quantity",[order,desc,qty,customer]);
  if(!rows.length)return reply({error:'Customer not found.'},404);await audit('order-create','order',order);return reply({order:rows[0],demo:true},201);
 }
 const os=path.match(/^\/api\/v2\/orders\/(TTC-[A-Z0-9-]+)\/status$/);
 if(os&&method==='PATCH'){
  if(!access(s,['staff','admin']))return denied();let x;try{x=await body(r)}catch{return reply({error:'Invalid request.'},400)}
  const status=clean(x.status,32),note=clean(x.note,400);if(!orderStates.includes(status))return reply({error:'Invalid order status.'},422);
  const rows=await q("WITH changed AS (UPDATE ttc_orders SET status=$1,updated_at=now() WHERE order_no=$2 RETURNING id) INSERT INTO ttc_order_events(order_id,actor_id,status,note) SELECT id,$3,$1,$4 FROM changed RETURNING status",[status,os[1],s.user_id,note]);
  if(!rows.length)return reply({error:'Order not found.'},404);await audit('status:'+status,'order',os[1]);return reply({order_no:os[1],status});
 }
 if(path==='/api/v2/stock'&&method==='GET'){
  if(!access(s,['staff','admin']))return denied();
  return reply({stock:await q('SELECT sku,description,category,unit,location,on_hand,reorder_point,demo,updated_at,(on_hand<=reorder_point) AS low_stock FROM ttc_stock_items ORDER BY category,sku')});
 }
 if(path==='/api/v2/stock/movements'&&method==='GET'){
  if(!access(s,['staff','admin']))return denied();
  return reply({movements:await q('SELECT m.id,i.sku,m.delta,m.reason,m.note,m.created_at,u.full_name AS actor FROM ttc_stock_movements m JOIN ttc_stock_items i ON i.id=m.stock_id LEFT JOIN ttc_users u ON u.id=m.actor_id ORDER BY m.created_at DESC LIMIT 100')});
 }
 if(path==='/api/v2/stock/movements'&&method==='POST'){
  if(!access(s,['staff','admin']))return denied();let x;try{x=await body(r)}catch{return reply({error:'Invalid request.'},400)}
  const sku=clean(x.sku,80),delta=Number(x.delta),reason=clean(x.reason,30),note=clean(x.note,400);
  if(!/^[A-Z0-9-]{4,80}$/.test(sku)||!Number.isSafeInteger(delta)||delta===0||Math.abs(delta)>100000||!['receipt','issue','adjustment','return'].includes(reason))return reply({error:'Invalid stock movement.'},422);
  const rows=await q("WITH changed AS (UPDATE ttc_stock_items SET on_hand=on_hand+$1,updated_at=now() WHERE sku=$2 AND on_hand+$1>=0 RETURNING id,sku,on_hand), ledger AS (INSERT INTO ttc_stock_movements(stock_id,actor_id,delta,reason,note) SELECT id,$3,$1,$4,$5 FROM changed RETURNING id) SELECT changed.sku,changed.on_hand,ledger.id AS movement_id FROM changed CROSS JOIN ledger",[delta,sku,s.user_id,reason,note]);
  if(!rows.length)return reply({error:'Unknown SKU or insufficient stock.'},409);await audit('stock:'+reason,'stock',sku);return reply({stock:rows[0]},201);
 }
 if(path==='/api/v2/users'&&method==='GET'){
  if(s.role!=='admin')return denied();
  return reply({users:await q("SELECT id,email,full_name,role,approval_status,demo,created_at FROM ttc_users ORDER BY CASE approval_status WHEN 'pending' THEN 0 ELSE 1 END,email LIMIT 100")});
 }
 const approval=path.match(/^\/api\/v2\/users\/([a-f0-9-]{36})\/approval$/);
 if(approval&&method==='PATCH'){
  if(s.role!=='admin')return denied();let x;try{x=await body(r)}catch{return reply({error:'Invalid request.'},400)}
  const status=clean(x.status,30);if(!['approved','pending','rejected'].includes(status))return reply({error:'Invalid approval status.'},422);
  const rows=await q("UPDATE ttc_users SET approval_status=$1,updated_at=now() WHERE id=$2 AND role='staff' AND id<>$3 RETURNING id,approval_status,role",[status,approval[1],s.user_id]);
  if(!rows.length)return reply({error:'Staff record not found.'},404);
  if(status!=='approved')await q('DELETE FROM ttc_sessions WHERE user_id=$1',[approval[1]]);
  await audit('staff:'+status,'user',approval[1]);return reply({user:rows[0]});
 }
 if(path==='/api/v2/cms'&&method==='GET'){
  if(s.role!=='webmaster')return denied();return reply({pages:await q('SELECT slug,title,body,published,updated_at FROM ttc_content_pages ORDER BY slug')});
 }
 const content=path.match(/^\/api\/v2\/cms\/(taytay-hub|careers|homepage-note)$/);
 if(content&&method==='PUT'){
  if(s.role!=='webmaster')return denied();let x;try{x=await body(r)}catch{return reply({error:'Invalid request.'},400)}
  const title=clean(x.title,140),txt=clean(x.body,6000);if(title.length<4||txt.length<20||typeof x.published!=='boolean')return reply({error:'Invalid content.'},422);
  const rows=await q('UPDATE ttc_content_pages SET title=$1,body=$2,published=$3,updated_by=$4,updated_at=now() WHERE slug=$5 RETURNING slug,title,body,published,updated_at',[title,txt,x.published,s.user_id,content[1]]);
  if(!rows.length)return reply({error:'Page not found.'},404);await audit('content-publish','page',content[1]);return reply({page:rows[0]});
 }

 if(path==='/api/v2/suppliers'&&method==='GET'){
  if(!access(s,['staff','admin']))return denied();
  return reply({suppliers:await q('SELECT code,name,region,contact_email,demo,active FROM ttc_suppliers ORDER BY code')});
 }
 if(path==='/api/v2/suppliers'&&method==='POST'){
  if(s.role!=='admin')return denied();let x;try{x=await body(r)}catch{return reply({error:'Invalid supplier request.'},400)}
  const code=clean(x.code,65).toUpperCase(),name=clean(x.name,140),region=clean(x.region,100),email=clean(x.email).toLowerCase();
  if(!/^[A-Z0-9-]{5,65}$/.test(code)||name.length<3||region.length<2||(email&&!emailOk(email)))return reply({error:'Invalid supplier fields.'},422);
  try{const rows=await q('INSERT INTO ttc_suppliers(code,name,region,contact_email,demo) VALUES($1,$2,$3,$4,true) RETURNING code,name,region',[code,name,region,email]);await audit('supplier-create','supplier',code);return reply({supplier:rows[0]},201)}
  catch{return reply({error:'Supplier code already exists or data could not be saved.'},409)}
 }
 if(path==='/api/v2/purchase-orders'&&method==='GET'){
  if(!access(s,['staff','admin']))return denied();
  const rows=await q("SELECT po.po_no,po.status,po.expected_date,po.notes,po.demo,s.name AS supplier,s.code AS supplier_code,COALESCE((SELECT json_agg(json_build_object('sku',i.sku,'ordered',l.ordered_qty,'received',l.received_qty)) FROM ttc_purchase_lines l JOIN ttc_stock_items i ON i.id=l.stock_id WHERE l.po_id=po.id),'[]'::json) AS lines FROM ttc_purchase_orders po JOIN ttc_suppliers s ON s.id=po.supplier_id ORDER BY po.created_at DESC LIMIT 100");
  return reply({purchaseOrders:rows});
 }
 if(path==='/api/v2/purchase-orders'&&method==='POST'){
  if(!access(s,['staff','admin']))return denied();let x;try{x=await body(r)}catch{return reply({error:'Invalid purchase order.'},400)}
  const supplier=clean(x.supplierCode,65),sku=clean(x.sku,80),quantity=Number(x.quantity),notes=clean(x.notes,400),date=clean(x.expectedDate,10);
  if(!/^[A-Z0-9-]{5,65}$/.test(supplier)||!/^[A-Z0-9-]{4,80}$/.test(sku)||!Number.isSafeInteger(quantity)||quantity<1||quantity>1000000||(date&&!/^\d{4}-\d{2}-\d{2}$/.test(date)))return reply({error:'Invalid PO data.'},422);
  const number='TTC-PO-'+new Date().getUTCFullYear()+'-'+random(4).toUpperCase();
  const rows=await q("WITH sup AS (SELECT id FROM ttc_suppliers WHERE code=$1 AND active=true), itm AS(SELECT id FROM ttc_stock_items WHERE sku=$2), created AS(INSERT INTO ttc_purchase_orders(po_no,supplier_id,created_by,status,expected_date,notes,demo) SELECT $3,sup.id,$4,'draft',$5::date,$6,true FROM sup WHERE EXISTS(SELECT 1 FROM itm) RETURNING id,po_no,status), lines AS(INSERT INTO ttc_purchase_lines(po_id,stock_id,ordered_qty) SELECT created.id,itm.id,$7 FROM created CROSS JOIN itm RETURNING id) SELECT created.po_no,created.status FROM created JOIN lines ON true",[supplier,sku,number,s.user_id,date||null,notes,quantity]);
  if(!rows.length)return reply({error:'Supplier or stock item not found.'},404);
  await audit('purchase-create','purchase',number);return reply({purchaseOrder:rows[0]},201);
 }
 const poStatus=path.match(/^\/api\/v2\/purchase-orders\/(TTC-PO-[A-Z0-9-]+)\/status$/);
 if(poStatus&&method==='PATCH'){
  if(s.role!=='admin')return denied();let x;try{x=await body(r)}catch{return reply({error:'Invalid status request.'},400)}
  const status=clean(x.status,20);
  if(!['issued','cancelled'].includes(status))return reply({error:'Invalid transition.'},422);
  const rows=await q("UPDATE ttc_purchase_orders SET status=$1,updated_at=now() WHERE po_no=$2 AND status='draft' RETURNING po_no,status",[status,poStatus[1]]);
  if(!rows.length)return reply({error:'Only draft POs can be issued or cancelled.'},409);
  await audit('purchase:'+status,'purchase',poStatus[1]);return reply({purchaseOrder:rows[0]});
 }
 const receiving=path.match(/^\/api\/v2\/purchase-orders\/(TTC-PO-[A-Z0-9-]+)\/receive$/);
 if(receiving&&method==='POST'){
  if(!access(s,['staff','admin']))return denied();let x;try{x=await body(r)}catch{return reply({error:'Invalid goods receipt.'},400)}
  const sku=clean(x.sku,80),qty=Number(x.quantity),note=clean(x.note,400);
  if(!/^[A-Z0-9-]{4,80}$/.test(sku)||!Number.isSafeInteger(qty)||qty<1||qty>1000000)return reply({error:'Invalid receipt quantity or SKU.'},422);
  // Single-statement receiving locks the order line and atomically increments both the received and on-hand balances.
  const rows=await q("WITH chosen AS (SELECT l.id FROM ttc_purchase_lines l JOIN ttc_purchase_orders p ON p.id=l.po_id JOIN ttc_stock_items i ON i.id=l.stock_id WHERE p.po_no=$1 AND i.sku=$2 AND p.status IN ('issued','partial') FOR UPDATE OF l), updated_line AS (UPDATE ttc_purchase_lines SET received_qty=received_qty+$3 WHERE id=(SELECT id FROM chosen) AND received_qty+$3<=ordered_qty RETURNING stock_id), changed_stock AS (UPDATE ttc_stock_items SET on_hand=on_hand+$3,updated_at=now() WHERE id=(SELECT stock_id FROM updated_line) RETURNING id,sku,on_hand), ledger AS (INSERT INTO ttc_stock_movements(stock_id,actor_id,delta,reason,note) SELECT id,$4,$3,'receipt',$5 FROM changed_stock RETURNING id) SELECT changed_stock.sku,changed_stock.on_hand FROM changed_stock JOIN ledger ON true",[receiving[1],sku,qty,s.user_id,'PO '+receiving[1]+' / '+note]);
  if(!rows.length)return reply({error:'Cannot receive: PO not issued, SKU missing or quantity exceeds open balance.'},409);
  await q("UPDATE ttc_purchase_orders SET status=CASE WHEN EXISTS(SELECT 1 FROM ttc_purchase_lines l WHERE l.po_id=ttc_purchase_orders.id AND l.received_qty<l.ordered_qty) THEN 'partial' ELSE 'received' END,updated_at=now() WHERE po_no=$1 AND status IN('issued','partial')",[receiving[1]]);
  await audit('purchase-receipt','purchase',receiving[1]);return reply({receipt:rows[0]});
 }
 const timeline=path.match(/^\/api\/v2\/orders\/(TTC-[A-Z0-9-]+)\/events$/);
 if(timeline&&method==='GET'){
  if(!access(s,['customer','staff','admin']))return denied();
  const rows=await q("SELECT o.order_no,o.status,o.description,o.demo,e.status AS event_status,e.note,e.created_at FROM ttc_orders o LEFT JOIN ttc_order_events e ON e.order_id=o.id WHERE o.order_no=$1 AND ($2::boolean=true OR o.customer_id=$3::uuid) ORDER BY e.created_at ASC",[timeline[1],access(s,['staff','admin']),s.user_id]);
  if(!rows.length)return reply({error:'Order not found.'},404);
  return reply({order:{order_no:rows[0].order_no,status:rows[0].status,description:rows[0].description,demo:rows[0].demo},events:rows.filter(x=>x.event_status).map(x=>({status:x.event_status,note:x.note,created_at:x.created_at}))});
 }
 if(path==='/api/v2/audit'&&method==='GET'){
  if(s.role!=='admin')return denied();return reply({events:await q('SELECT a.action,a.entity,a.entity_key,a.created_at,u.full_name AS actor FROM ttc_audit_log a LEFT JOIN ttc_users u ON u.id=a.actor_id ORDER BY a.created_at DESC LIMIT 100')});
 }
 return reply({error:'Route not found.'},404);
}
