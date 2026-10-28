import {neon} from '@neondatabase/serverless';
import {portalApi} from './portal';
import {normalizeInquiry,validateInquiry,makeReference} from './domain';
interface Env{DATABASE_URL?:string;ADMIN_API_TOKEN?:string;IP_HASH_PEPPER?:string;TURNSTILE_SECRET?:string;TURNSTILE_SITE_KEY?:string;INQUIRIES_ENABLED?:string;SITE_STATUS?:string;ASSETS:Fetcher}
const json=(body:unknown,status=200,extra:Record<string,string>={})=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json;charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...extra}});
function authorize(r:Request,e:Env){const token=e.ADMIN_API_TOKEN||'',supplied=(r.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');if(token.length<32||supplied.length!==token.length)return false;let n=0;for(let i=0;i<token.length;i++)n|=token.charCodeAt(i)^supplied.charCodeAt(i);return n===0}
async function fingerprint(r:Request,pepper:string){const ip=r.headers.get('cf-connecting-ip');if(!ip||!pepper)return null;const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(pepper+'|'+ip));return Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('')}
async function challenge(token:string,r:Request,secret:string){if(!secret)return true;if(!token)return false;const body=new FormData();body.set('secret',secret);body.set('response',token);const ip=r.headers.get('cf-connecting-ip');if(ip)body.set('remoteip',ip);try{const res=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body});const data=await res.json() as {success?:boolean};return Boolean(data.success)}catch{return false}}
async function api(r:Request,e:Env):Promise<Response>{const path=new URL(r.url).pathname;
if(path==='/api/health'&&r.method==='GET'){
const dbReady=Boolean(e.DATABASE_URL),guardReady=Boolean(e.IP_HASH_PEPPER);
const turnstileReady=Boolean(e.TURNSTILE_SECRET&&e.TURNSTILE_SITE_KEY);
const prod=(e.SITE_STATUS||'development')==='production';
return json({ok:true,service:'taytay-textile-co',databaseConfigured:dbReady,
inquiriesConfigured:dbReady&&guardReady,inquirySubmissionEnabled:e.INQUIRIES_ENABLED==='true'&&dbReady&&guardReady&&(!prod||turnstileReady),
turnstileSiteKey:turnstileReady?e.TURNSTILE_SITE_KEY:null,status:e.SITE_STATUS||'development'});}
if(path.startsWith('/api/v2/'))return portalApi(r,e);
if(path.startsWith('/api/v1/admin/'))return json({error:'Legacy admin API retired. Sign in at /portal.html.'},410);
if(!e.DATABASE_URL)return json({error:'Database not configured.'},503);
const db=neon(e.DATABASE_URL);
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
const trackMatch=path.match(/^\/api\/v1\/inquiries\/(TTC-\d{4}-[A-F0-9]{8})\/status$/);
if(trackMatch&&r.method==='GET'){
const email=(new URL(r.url).searchParams.get('email')||'').trim().toLowerCase();
if(email.length>150||!(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)))return json({error:'A valid inquiry email is required.'},400);
const rows=await db`SELECT reference,status,created_at FROM ttc_inquiries WHERE reference=${trackMatch[1]} AND lower(email)=${email} LIMIT 1`;
return rows.length?json({inquiry:rows[0]}):json({error:'No matching inquiry found.'},404);
}
if(path==='/api/v1/admin/products'&&r.method==='GET'){
if(!authorize(r,e))return json({error:'Unauthorized.'},401);
return json({products:await db`SELECT p.sku,p.slug,p.name,p.category,p.subtitle,p.concept,p.published,p.display_rank,
(SELECT COUNT(*)::int FROM ttc_product_variants v WHERE v.product_id=p.id) AS color_count,
(SELECT COUNT(*)::int FROM ttc_product_media m JOIN ttc_product_variants v ON v.id=m.variant_id WHERE v.product_id=p.id) AS media_count
FROM ttc_products p ORDER BY p.display_rank,p.name`});}
if(path==='/api/v1/admin/products'&&r.method==='POST'){
if(!authorize(r,e))return json({error:'Unauthorized.'},401);
let x:Record<string,unknown>;try{x=await r.json() as Record<string,unknown>}catch{return json({error:'Invalid JSON.'},400)}
const slug=String(x.slug||''),sku=String(x.sku||''),name=String(x.name||''),category=String(x.category||'');
if(!/^[a-z0-9-]{3,80}$/.test(slug)||!/^[A-Z0-9-]{5,80}$/.test(sku)||name.length<3||name.length>150||category.length<2||category.length>60)return json({error:'Invalid product fields.'},422);
const subtitle=String(x.subtitle||'').slice(0,250);
try{const rows=await db`INSERT INTO ttc_products(slug,sku,name,category,subtitle,concept,published) VALUES(${slug},${sku},${name},${category},${subtitle},true,false) RETURNING sku,slug,published`;return json(rows[0],201)}catch{return json({error:'SKU or slug exists; no change made.'},409)}
}
const productMatch=path.match(/^\/api\/v1\/admin\/products\/([A-Z0-9-]+)$/);
if(productMatch&&r.method==='PATCH'){
if(!authorize(r,e))return json({error:'Unauthorized.'},401);
let x:{published?:unknown};try{x=await r.json() as {published?:unknown}}catch{return json({error:'Invalid JSON.'},400)}
if(typeof x.published!=='boolean')return json({error:'Boolean published required.'},422);
const rows=await db`UPDATE ttc_products SET published=${x.published},updated_at=now() WHERE sku=${productMatch[1]} RETURNING sku,slug,published`;
return rows.length?json(rows[0]):json({error:'Product not found.'},404);
}
const variantMatch=path.match(/^\/api\/v1\/admin\/products\/([A-Z0-9-]+)\/variants$/);
if(variantMatch&&r.method==='POST'){
if(!authorize(r,e))return json({error:'Unauthorized.'},401);
let x:Record<string,unknown>;try{x=await r.json() as Record<string,unknown>}catch{return json({error:'Invalid JSON.'},400)}
const color=String(x.color||''),label=String(x.label||''),hex=String(x.hex||'');
if(!/^[a-zA-Z0-9-]{2,50}$/.test(color)||label.length<2||label.length>60||!/^#[0-9a-fA-F]{6}$/.test(hex))return json({error:'Invalid color variant.'},422);
try{const rows=await db`INSERT INTO ttc_product_variants(product_id,color_slug,color_label,color_hex) SELECT id,${color},${label},${hex} FROM ttc_products WHERE sku=${variantMatch[1]} RETURNING color_slug,color_label,color_hex`;return rows.length?json(rows[0],201):json({error:'Product not found.'},404)}catch{return json({error:'Variant already exists.'},409)}
}
const mediaMatch=path.match(/^\/api\/v1\/admin\/products\/([A-Z0-9-]+)\/variants\/([a-zA-Z0-9-]+)\/media\/([a-z-]+)$/);
if(mediaMatch&&r.method==='PUT'){
if(!authorize(r,e))return json({error:'Unauthorized.'},401);
let x:Record<string,unknown>;try{x=await r.json() as Record<string,unknown>}catch{return json({error:'Invalid JSON.'},400)}
const angle=mediaMatch[3],url=String(x.url||''),alt=String(x.alt||'').slice(0,200),status=x.approved===true?'approved':'concept';
if(!['front','side','back','detail-collar','detail-button','detail-fabric','detail-logo'].includes(angle)||!/^https:\/\/res\.cloudinary\.com\/boay3ffi\/image\/upload\//.test(url)||alt.length<5)return json({error:'Invalid media record or unapproved asset host.'},422);
const rows=await db`INSERT INTO ttc_product_media(variant_id,angle,url,asset_status,alt_text)
SELECT v.id,${angle},${url},${status},${alt} FROM ttc_product_variants v JOIN ttc_products p ON p.id=v.product_id
WHERE p.sku=${mediaMatch[1]} AND v.color_slug=${mediaMatch[2]}
ON CONFLICT(variant_id,angle) DO UPDATE SET url=excluded.url,asset_status=excluded.asset_status,alt_text=excluded.alt_text
RETURNING angle,url,asset_status`;
return rows.length?json(rows[0]):json({error:'Product variant not found.'},404);
}
if(path==='/api/v1/admin/inquiries'&&r.method==='GET'){
if(!authorize(r,e))return json({error:'Unauthorized.'},401);
return json({inquiries:await db`SELECT reference,organization,sector,contact_name,email,garment_type,quantity_band,service_type,target_timeline,destination,details,status,created_at FROM ttc_inquiries ORDER BY created_at DESC LIMIT 100`});}
const match=path.match(/^\/api\/v1\/admin\/inquiries\/(TTC-\d{4}-[A-F0-9]{8})\/status$/);
if(match&&r.method==='PATCH'){
if(!authorize(r,e))return json({error:'Unauthorized.'},401);
let x:{status?:string};try{x=await r.json()}catch{return json({error:'Invalid JSON.'},400)}
if(!['new','reviewing','quoted','closed','archived'].includes(x.status||''))return json({error:'Invalid status.'},422);
const rows=await db`UPDATE ttc_inquiries SET status=${x.status},updated_at=now() WHERE reference=${match[1]} RETURNING reference,status`;
return rows.length?json(rows[0]):json({error:'Not found.'},404)}
return json({error:'Route not found.'},404)}
export default {async fetch(r:Request,e:Env):Promise<Response>{try{const path=new URL(r.url).pathname;const result=path.startsWith('/api/')?await api(r,e):await e.ASSETS.fetch(r);const h=new Headers(result.headers);h.set('x-content-type-options','nosniff');h.set('referrer-policy','strict-origin-when-cross-origin');h.set('x-frame-options','DENY');h.set('permissions-policy','camera=(),microphone=(),geolocation=()');return new Response(result.body,{status:result.status,headers:h})}catch(err){console.error('Unexpected request error',String(err).slice(0,150));return json({error:'Internal server error.'},500)}}};
