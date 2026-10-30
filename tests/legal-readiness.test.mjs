import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p,root),'utf8');
const policies=['privacy','terms','returns','cookies','accessibility'];
const home=read('public/index.html'),controls=read('public/privacy-controls.js'),rights=read('public/privacy-request.html'),rightsJS=read('public/privacy-request.js');
test('All five legal policies exist as actual independently navigable documents',()=>{
 for(const key of policies){const page=read('public/'+key+'.html');assert.match(page,/<!doctype html>/i);assert.match(page,/<main /);assert.match(page,/Operator review required/);assert.match(page,/<title>/);assert.match(page,/href="\/privacy-request"/)}
});
test('Public website links legal resources and data-rights request next to customer journeys',()=>{
 for(const url of ['/privacy','/terms','/returns','/cookies','/accessibility','/privacy-request'])assert.ok(home.includes('href="'+url+'"'));
 for(const path of ['public/portal.html','public/customer.html','public/track.html'])assert.match(read(path),/privacy-controls\.js/);
});
test('Quote form has a clearly linked processing acknowledgment, never marketing opt-in',()=>{
 assert.match(home,/id="q-consent" required aria-describedby="q-privacy-detail"/);
 assert.match(home,/I acknowledge the <a href="\/privacy"/);
 assert.match(home,/No marketing subscription/);
});
test('Unsupported specific company-years claim is removed',()=>{
 assert.doesNotMatch(home,/10\+ <span style="font-size:18px">years/);
 assert.doesNotMatch(home,/With more than a decade of garment-making experience/);
 assert.match(home,/Company-specific experience remains unverified/);
});
test('Cookie panel asks a real choice and does not pretend advertising cookies exist',()=>{
 assert.match(controls,/Necessary only/);assert.match(controls,/Save my choice/);
 assert.match(controls,/saveBrief===true/);assert.match(controls,/localStorage\.removeItem\(BRIEF\)/);
 assert.match(controls,/There are no advertising or optional analytics trackers/);
});
test('Saving project brief remains optional and gated by user choice',()=>{
 assert.match(home,/function canPersistBrief\(\)/);
 assert.match(home,/if\(!canPersistBrief\(\)\)return \[\]/);
 assert.match(home,/if\(canPersistBrief\(\)\)localStorage\.setItem\(STORAGE/);
});
test('Cookie preferences are keyboard reachable and can be reopened',()=>{
 assert.match(controls,/data-cookie-settings/);assert.match(controls,/ttc-cookie-panel/);
 assert.match(controls,/aria-label/);assert.match(controls,/Escape/);
});
test('Privacy request form collects minimal fields and no document uploads',()=>{
 assert.match(rights,/id="request-email"/);assert.match(rights,/id="request-type"/);
 assert.match(rights,/id="request-ack"/);assert.match(rights,/id="request-status"/);
 assert.doesNotMatch(rights,/<input[^>]+type="file"/);
 assert.match(rights,/does not automatically delete data/);
});
test('Privacy request submission explicitly returns a ticket, with no false erasure claim',()=>{
 assert.match(rightsJS,/api\/v1\/privacy\/requests/);assert.match(rightsJS,/privacy\/requests/);
 assert.match(rightsJS,/Identity and retention checks/);
});
test('Backend exposes intake without public data listing and requires verification',()=>{
 const worker=read('src/worker.ts');
 assert.match(worker,/path==='\/api\/v1\/privacy\/requests'&&r.method==='POST'/);
 assert.match(worker,/input\.acknowledged!==true/);assert.match(worker,/ip_fingerprint/);
 assert.match(worker,/actionCompleted:false/);
 assert.doesNotMatch(worker,/DELETE FROM ttc_privacy_requests/);
});
test('Request review is administrator-only and goes through authenticated CSRF-checked portal',()=>{
 const portal=read('src/portal.ts');assert.match(portal,/if\(s\.role!=='admin'\)return denied\(\)/);
 assert.match(portal,/\/api\/v2\/privacy\/requests/);
 assert.match(portal,/identity_verified_at IS NOT NULL/);
 const ui=read('public/operations.js');
 assert.match(ui,/Privacy requests/);assert.match(ui,/privacy-review-form/);
});
test('Returns page preserves statutory remedies without blanket no-return prohibition',()=>{
 const page=read('public/returns.html');
 assert.match(page,/repair, replacement, refund/);assert.match(page,/No Return, No Exchange/);
 assert.match(page,/mandatory rights for genuine defects/);
});
test('Accessibility notice discloses limited testing rather than claiming full WCAG certification',()=>{
 const page=read('public/accessibility.html');
 assert.match(page,/WCAG/);assert.match(page,/not completed a qualified independent accessibility audit/);
});
