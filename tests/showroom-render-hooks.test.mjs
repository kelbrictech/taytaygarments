import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
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
test('main inline application script is syntactically valid JavaScript',()=>{
 const scripts=[...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
 const app=scripts.find(s=>s.includes('const products='));
 assert.ok(app,'main inline app script must be present');
 try{new vm.Script(app,{filename:'public/index.html inline app'})}
 catch(error){
  const match=String(error.stack||error).match(/public\/index\.html inline app:(\d+)/);
  if(match){
   const line=Number(match[1]),rows=app.split('\n');
   console.error('INLINE_SCRIPT_CONTEXT\n'+rows.slice(Math.max(0,line-4),line+3).map((row,i)=>(Math.max(1,line-3)+i)+': '+row).join('\n'));
  }
  throw error;
 }
});
