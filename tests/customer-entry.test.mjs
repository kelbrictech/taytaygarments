import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const index=read('public/index.html');
const customer=read('public/customer.html');
const css=read('public/customer.css');
const script=read('public/customer.js');
const portal=read('public/portal.html');
const operations=read('public/operations.js');
const track=read('public/track.html');
const portalAPI=read('src/portal.ts');

test('Customer entry is visible beside showroom on public navigation',()=>{
 assert.match(index,/<a href="#\/showroom" data-link="showroom">Virtual Showroom<\/a><a href="\/customer\.html"/);
 assert.match(index,/showroom-customer-entry[^]*?href="\/customer\.html"[^]*?href="\/track\.html"/);
});
test('Public footer separates customer account and team operations',()=>{
 assert.match(index,/Customer Account · My Orders/);
 assert.match(index,/Staff \/ Admin Access/);
 assert.doesNotMatch(index,/Customer &amp; Team Login/);
});
test('Customer account has standalone form, private order list and inquiry lookup',()=>{
 assert.match(customer,/<form id="customerLogin"/);
 assert.match(customer,/id="customerOrders"/);
 assert.match(customer,/id="customerMetrics"/);
 assert.match(customer,/href="\/track\.html"/);
 assert.doesNotMatch(customer,/id="staffForm"|id="supplierForm"|data-tab="quality"/);
});
test('Customer dashboard uses existing restricted customer API, never admin endpoint',()=>{
 assert.match(script,/api\('\/api\/v2\/orders'/);
 assert.match(script,/\/api\/v2\/auth\/me/);
 assert.match(script,/role!=='customer'/);
 assert.match(script,/location\.replace\('\/portal\.html'\)/);
 assert.doesNotMatch(script,/api\/v2\/(users|audit|stock|suppliers|qms)/);
});
test('Customer dashboard never injects customer data as innerHTML',()=>{
 assert.doesNotMatch(script,/\.innerHTML\s*=/);
 assert.match(script,/\.textContent\s*=/);
});
test('Customer authentication hides the other state, including with CSS display grid',()=>{
 assert.match(css,/\[hidden\]\{display:none!important\}/);
 assert.match(customer,/id="signedOut" class="signin-layout" hidden/);
 assert.match(customer,/id="signedIn" class="workspace" hidden/);
});
test('Team operations login routes authenticated customers to the customer account',()=>{
 assert.match(operations,/user\?\.role==='customer'\)\{location\.replace\('\/customer\.html'\)/);
 assert.match(operations,/if\(user\.role==='customer'\)\{location\.replace\('\/customer\.html'\)/);
 assert.match(portal,/Staff & Administrator Login/);
 assert.doesNotMatch(portal,/Sign in with the customer, staff, administrator or webmaster/);
});
test('Inquiry lookup links to customer order account without requiring login',()=>{
 assert.match(track,/href="\/customer\.html"/);
 assert.match(track,/Check inquiry status/);
});
test('Backend restricts customer orders and timeline to their account',()=>{
 assert.match(portalAPI,/WHERE customer_id=\$1 ORDER BY created_at DESC LIMIT 100/);
 assert.match(portalAPI,/OR o\.customer_id=\$3::uuid/);
 assert.match(portalAPI,/\['customer','staff','admin'\]/);
});
