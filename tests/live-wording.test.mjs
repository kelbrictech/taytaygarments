import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
// Rule (owner, 5 Nov 2026): if the live site will not use a piece of wording, it does not belong on the presentation site.
// image-credits.html is excluded on purpose: it documents the current placeholder imagery and is rewritten when real photographs arrive.
const read=p=>readFileSync(new URL('../public/'+p,import.meta.url),'utf8');
const pages=['index.html','portal.html','customer.html','track.html','privacy.html','privacy-request.html','terms.html','returns.html','cookies.html','accessibility.html'];
const demoOnly=/photorealistic|illustrative|illustrated|demonstration (?:site|website|environment|content|only)|development demonstration|provisional business|fictional test records/i;
for(const p of pages)test('no presentation-only wording on '+p,()=>assert.doesNotMatch(read(p),demoOnly));
test('staff screens do not carry static demo disclaimers',()=>{
 const ops=read('operations.js');
 assert.doesNotMatch(ops,/within this demonstration only|seeded orders are fictional|seeded counts are demonstration|fixture suppliers|client\.demo@/);
});
test('showroom image alt text no longer says concept',()=>{
 assert.doesNotMatch(read('ttc-integration.js'),/\"alt\":\"[^\"]*concept/);
});
