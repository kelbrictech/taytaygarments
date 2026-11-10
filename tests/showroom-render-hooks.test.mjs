import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const integration=readFileSync(new URL('../public/ttc-integration.js',import.meta.url),'utf8');
test('showroom modal dispatches a render event when opened and when color changes',()=>{
 assert.equal((html.match(/dispatchEvent\(new Event\('ttc:modal-rendered'\)\)/g)||[]).length,2);
});
test('showroom integration listens for deterministic modal renders',()=>{
 assert.match(integration,/document\.addEventListener\('ttc:modal-rendered',updateAngles\)/);
});
test('showroom integration asset is cache-versioned after recovery',()=>{
 assert.match(html,/ttc-integration\.js\?v=20261110-showroom-recovery/);
});
