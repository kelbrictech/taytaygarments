import {neon} from '@neondatabase/serverless';
import {portalApi} from './portal';
import {loadClientConfig,featureForApiPath} from './client-config';
import {normalizeInquiry,validateInquiry,makeReference} from './domain';
interface Env{CLIENT_CONFIG_JSON?:string;DATABASE_URL?:string;IP_HASH_PEPPER?:string;TURNSTILE_SECRET?:string;TURNSTILE_SITE_KEY?:string;INQUIRIES_ENABLED?:string;SITE_STATUS?:string;ASSETS:Fetcher}
const json=(body:unknown,status=200,extra:Record<string,string>={})=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json;charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...extra}});
async function fingerprint(r:Request,pepper:string){const ip=r.headers.get('cf-connecting-ip');if(!ip||!pepper)return null;const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(pepper+'|'+ip));return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('')}
async function challenge(token:string,r:Request,secret:string){if(!secret)return true;if(!token)return false;const body=new FormData();body.set('secret',secret);body.set('response',token);const ip=r.headers.get('cf-connecting-ip');if(ip)body.set('remoteip',ip);try{const res=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body,signal:AbortSignal.timeout(5000)});const data=await res.json() as {success?:boolean};return Boolean(data.success)}catch{return false}}
async function api(r:Request,e:Env):Promise<Response>{const path=new URL(r.url).pathname;
if(path==='/api/v1/config'&&r.method==='GET')return json(loadClientConfig(e));
if(path==='/api/health'&&r.method==='GET'){
const dbReady=Boolean(e.DATABASE_URL),guardReady=Boolean(e.IP_HASH_PEPPER);
const turnstileReady=Boolean(e.TURNSTILE_SECRET&&e.TURNSTILE_SITE_KEY);
const prod=(e.SITE_STATUS||'development')==='production';
return json({ok:true,service:'taytay-textile-co',databaseConfigured:dbReady,
inquiriesConfigured:dbReady&&guardReady,privacyRequestAvailable:dbReady&&guardReady,inquirySubmissionEnabled:e.INQUIRIES_ENABLED==='true'&&dbReady&&guardReady&&(!prod||turnstileReady),
turnstileSiteKey:turnstileReady?e.TURNSTILE_SITE_KEY:null,status:e.SITE_STATUS||'development'});}
if(path.startsWith('/api/v2/')){const feature=featureForApiPath(path);if(feature&&!loadClientConfig(e).features[feature])return json({error:'Module unavailable for this client.'},404);return portalApi(r,e)}
if(path.startsWith('/api/v1/admin/'))return json({error:'Legacy admin API retired. Sign in at /portal.html.'},410);
if(!e.DATABASE_URL)return json({error:'Database not configured.'},503);
const db=neon(e.DATABASE_URL);
if(path==='/api/v1/privacy/requests'&&r.method==='POST'){
 // Register a data-subject request; do not automatically access, release or erase records.
 if(!e.IP_HASH_PEPPER)return json({error:'Request service unavailable.'},503);
 const origin=r.headers.get('origin');
 if(origin&&origin!==new URL(r.url).origin)return json({error:'Cross-origin request denied.'},403);
 if(r.headers.get('content-type')?.split(';')[0]!=='application/json')return json({error:'JSON required.'},415);
 if(Number(r.headers.get('content-length')||0)>8192)return json({error:'Request too large.'},413);
 let input:Record<string,unknown>;
 try{const raw=await r.text();if(raw.length>8192)throw Error('Size');const parsed=JSON.parse(raw);if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw Error('Input');input=parsed as Record<string,unknown>}
 catch{return json({error:'Invalid JSON request.'},400)}
 const email=typeof input.email==='string'?input.email.trim().toLowerCase():'';
 const kind=typeof input.type==='string'?input.type.trim():'';
 const details=typeof input.details==='string'?input.details.trim():'';
 const idempotency=typeof input.idempotencyKey==='string'?input.idempotencyKey:'';
 const token=typeof input.turnstileToken==='string'?input.turnstileToken:'';
 const allowed=['access','correction','erasure','objection','withdrawal','portability','complaint'];
 if(input.website)return json({error:'Request rejected.'},400);
 if(input.acknowledged!==true||input.noticeVersion!=='2026-10-30')return json({error:'Please review and acknowledge the privacy notice.'},422);
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>150||!allowed.includes(kind)||details.length>1000)return json({error:'Invalid email, request type or details.'},422);
 if(idempotency&&!/^[a-f0-9-]{36}$/i.test(idempotency))return json({error:'Invalid retry token.'},422);
 if(e.TURNSTILE_SECRET&&!await challenge(token,r,e.TURNSTILE_SECRET))return json({error:'Security verification failed.'},403);
 const fp=await fingerprint(r,e.IP_HASH_PEPPER);
 if(!fp)return json({error:'Anti-abuse protection unavailable.'},503);
 if(idempotency){
  const prior=await db`SELECT reference,status FROM ttc_privacy_requests WHERE idempotency_key=${idempotency} AND email=${email}`;
  if(prior.length)return json({received:true,reference:prior[0].reference,status:prior[0].status,actionCompleted:false});
 }
 const rate=await db`SELECT count(*)::int n FROM ttc_privacy_requests WHERE ip_fingerprint=${fp} AND created_at>now()-interval '1 hour'`;
 if(Number(rate[0]?.n||0)>=3)return json({error:'Too many recent requests; use a verified alternative contact channel.'},429);
 const sameEmail=await db`SELECT count(*)::int n FROM ttc_privacy_requests WHERE email=${email} AND created_at>now()-interval '24 hours'`;
 if(Number(sameEmail[0]?.n||0)>=5)return json({error:'Too many recent requests for this email.'},429);
 const reference='PRIV-'+new Date().getUTCFullYear()+'-'+Array.from(crypto.getRandomValues(new Uint8Array(6)),b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
 const key=idempotency||null;
 try{
  const saved=await db`WITH created AS (
   INSERT INTO ttc_privacy_requests(reference,email,kind,details,idempotency_key,ip_fingerprint,notice_version)
   VALUES (${reference},${email},${kind},${details},${key},${fp},'2026-10-30') RETURNING id,reference,status
  ), history AS (
   INSERT INTO ttc_privacy_request_events(request_id,actor_id,status,note)
   SELECT id,NULL,'received','Public submission; independent identity verification needed.' FROM created RETURNING id
  ) SELECT reference,status FROM created`;
  if(!saved.length)return json({error:'Unable to record request.'},503);
  return json({received:true,reference:saved[0].reference,status:saved[0].status,actionCompleted:false,
   notice:'Request recorded. Independent identity and legal-retention review precede any action.'},201);
 }catch{return json({error:'Unable to store request. Try again.'},503)}
}
if(path==='/api/v1/products'&&r.method==='GET'){
const rows=await db`SELECT p.sku,p.slug,p.name,p.category,p.subtitle,p.fabric,p.finish,p.applications,p.concept,
COALESCE((SELECT json_agg(json_build_object('color',v.color_slug,'label',v.color_label,'hex',v.color_hex,'default',v.default_color,'views',
COALESCE((SELECT json_object_agg(m.angle,json_build_object('url',m.url,'alt',m.alt_text,'status',m.asset_status))
FROM ttc_product_media m WHERE m.variant_id=v.id AND m.asset_status!='retired'),'{}'::json)) ORDER BY v.default_color DESC,v.color_slug)
FROM ttc_product_variants v WHERE v.product_id=p.id AND v.available),'[]'::json) AS variants
FROM ttc_products p WHERE p.published ORDER BY p.display_rank,p.name`;
return json({products:rows,conceptsOnly:rows.every(x=>x.concept===true)},200,{'cache-control':'public,max-age=60'});}
if(path==='/api/v1/inquiries'&&r.method==='POST'){
if(e.INQUIRIES_ENABLED!=='true')return json({error:'Inquiry submission is temporarily unavailable.'},503,{'retry-after':'3600'});
if((e.SITE_STATUS||'development')==='production'&&(!e.TURNSTILE_SECRET||!e.TURNSTILE_SITE_KEY))return json({error:'Inquiry protection has not been configured.'},503);
if(r.headers.get('content-type')?.split(';')[0]!=='application/json')return json({error:'JSON required.'},415);
if(Number(r.headers.get('content-length')||0)>32768)return json({error:'Request too large.'},413);
let input:unknown;try{const raw=await r.text();if(raw.length>32768)return json({error:'Request too large.'},413);input=JSON.parse(raw)}catch{return json({error:'Invalid JSON.'},400)}
const d=normalizeInquiry(input),errors=validateInquiry(d);if(errors.length)return json({error:'Validation failed',details:errors},422);
if(!e.IP_HASH_PEPPER)return json({error:'Anti-abuse server secret missing.'},503);
if(!await challenge(d.turnstileToken,r,e.TURNSTILE_SECRET||''))return json({error:'Challenge verification failed.'},403);
const ip=await fingerprint(r,e.IP_HASH_PEPPER);
if(ip){const counts=await db`SELECT count(*)::int n FROM ttc_inquiries WHERE ip_fingerprint=${ip} AND created_at>now()-interval '1 hour'`;if(Number(counts[0]?.n||0)>=5)return json({error:'Rate limit exceeded.'},429)}
if(d.idempotencyKey){const seen=await db`SELECT reference FROM ttc_inquiries WHERE idempotency_key=${d.idempotencyKey}`;if(seen.length)return json({received:true,duplicate:true,reference:seen[0].reference},200)}
const uuid=crypto.randomUUID(),reference=makeReference(uuid),idem=d.idempotencyKey||null;
const itemsJson=JSON.stringify(d.items);
try{await db`WITH created AS (
INSERT INTO ttc_inquiries(id,reference,organization,sector,contact_name,email,garment_type,quantity_band,service_type,target_timeline,destination,details,consent_at,ip_fingerprint,idempotency_key)
VALUES (${uuid},${reference},${d.organization},${d.sector},${d.contactName},${d.email},${d.garmentType},${d.quantityBand},${d.serviceType},${d.targetTimeline},${d.destination},${d.details},now(),${ip},${idem}) RETURNING id)
INSERT INTO ttc_inquiry_items(inquiry_id,product_sku,requested_color,quantity)
SELECT created.id,entry.value->>'sku',entry.value->>'color',NULLIF(entry.value->>'quantity','')::integer
FROM created CROSS JOIN LATERAL jsonb_array_elements(${itemsJson}::jsonb) AS entry(value)`;
}catch(err){console.error('RFQ insertion error:',String(err).slice(0,150));return json({error:'Unable to persist inquiry; please retry.'},503)}
return json({received:true,reference,message:'Inquiry received; not an order or confirmed quotation.'},201)}
if(path==='/api/v1/inquiries/status'&&r.method==='POST'){
 if(r.headers.get('content-type')?.split(';')[0]!=='application/json')return json({error:'JSON required.'},415);
 let x:Record<string,unknown>;
 try{const raw=await r.text();if(raw.length>2048)return json({error:'Request too long.'},413);x=JSON.parse(raw) as Record<string,unknown>}
 catch{return json({error:'Invalid tracking request.'},400)}
 const reference=typeof x.reference==='string'?x.reference.trim().toUpperCase():'';
 const email=typeof x.email==='string'?x.email.trim().toLowerCase():'';
 if(!/^TTC-\d{4}-[A-F0-9]{8}$/.test(reference)||email.length>150||!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))return json({error:'Valid inquiry reference and email required.'},400);
 const rows=await db`SELECT reference,status,created_at FROM ttc_inquiries WHERE reference=${reference} AND lower(email)=${email} LIMIT 1`;
 return rows.length?json({inquiry:rows[0]}):json({error:'No matching inquiry found.'},404);
}
if(/^\/api\/v1\/inquiries\/TTC-\d{4}-[A-F0-9]{8}\/status$/.test(path))return json({error:'Use the privacy-safe tracking form to submit email in a POST body.'},410);
return json({error:'Route not found.'},404)}
export default {async fetch(r:Request,e:Env):Promise<Response>{try{const path=new URL(r.url).pathname;const result=path.startsWith('/api/')?await api(r,e):await e.ASSETS.fetch(r);const h=new Headers(result.headers);h.set('x-content-type-options','nosniff');h.set('referrer-policy','strict-origin-when-cross-origin');h.set('x-frame-options','DENY');h.set('permissions-policy','camera=(),microphone=(),geolocation=()');return new Response(result.body,{status:result.status,headers:h})}catch(err){console.error('Unexpected request error',String(err).slice(0,150));return json({error:'Internal server error.'},500)}}};
