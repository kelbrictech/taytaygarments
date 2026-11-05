import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
// Source/file assertions for patch 0.1.1. They prove the files contain the intended rules,
// not that a deployed site behaves that way; verify live with `curl -sI`.
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('_headers hardens static pages that bypass the Worker',()=>{
 const h=read('public/_headers');
 assert.match(h,/^\/\*/m);
 for(const rule of [/X-Content-Type-Options: nosniff/,/X-Frame-Options: DENY/,/Referrer-Policy: strict-origin-when-cross-origin/,/Permissions-Policy: camera=\(\), microphone=\(\), geolocation=\(\)/,/Strict-Transport-Security: max-age=\d{7,}/])assert.match(h,rule);
});
test('CSP ships report-only until inline code is externalised',()=>{
 const h=read('public/_headers');
 assert.match(h,/^\s*Content-Security-Policy-Report-Only:.*object-src 'none'.*frame-ancestors 'none'/m);
 assert.doesNotMatch(h,/^\s*Content-Security-Policy:/m);
});
test('legacy token-only admin code is removed; the 410 stays',()=>{
 const w=read('src/worker.ts');
 assert.doesNotMatch(w,/ADMIN_API_TOKEN|function authorize/);
 assert.equal((w.match(/\/api\/v1\/admin\//g)||[]).length,1);
 assert.match(w,/Legacy admin API retired/);
});
test('retired admin token is gone from config and deployment docs',()=>{
 for(const p of ['.env.example','wrangler.toml','docs/CLOUDFLARE_DEPLOYMENT.md'])assert.doesNotMatch(read(p),/ADMIN_API_TOKEN/);
 assert.doesNotMatch(read('docs/FULL_STACK_RUNBOOK.md'),/ADMIN_API_TOKEN \(Secret\)/);
});
test('Turnstile verification fails closed on a slow upstream',()=>{
 assert.match(read('src/worker.ts'),/siteverify[^;]*AbortSignal\.timeout\(5000\)/);
});
test('quote form declares the purpose of personal-data inputs (WCAG 1.3.5)',()=>{
 const h=read('public/index.html');
 assert.match(h,/id="q-org" autocomplete="organization"/);
 assert.match(h,/id="q-name" autocomplete="name"/);
 assert.match(h,/id="q-email" type="email" autocomplete="email"/);
});
test('anchored and focused content clears the sticky header; no-JS message exists',()=>{
 const h=read('public/index.html');
 assert.match(h,/scroll-padding-top:6rem/);
 assert.match(h,/<main id="app"[^>]*><noscript>/);
});
