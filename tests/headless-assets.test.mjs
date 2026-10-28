import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const m=html.match(/const VISUALS=(\{[\s\S]*?\});/);
assert.ok(m,'VISUALS registry must exist');
const visuals=JSON.parse(m[1]);
const mannequinKeys={school:'schools',corporate:'corporate',government:'government',specialized:'specialized',hero_wide:'hero',hero:'corporate'};
for(const [key,file] of Object.entries(mannequinKeys)){
 test('Mannequin-based '+key+' uses actual committed SVG',()=>{
  assert.equal(visuals[key],'/assets/mannequins/'+file+'.svg');
  const image=readFileSync(new URL('../public/assets/mannequins/'+file+'.svg',import.meta.url),'utf8');
  assert.match(image,/<svg\b/);
  assert.match(image,/<title>.+<\/title>/);
  assert.match(image,/Mannequin|dress forms|garment|uniform/i);
  assert.doesNotMatch(image,/<(?:image|foreignObject|script)\b|\son\w+\s*=|(?:xlink:)?href\s*=\s*["']https?:\/\//i);
 });
}
for(const key of ['factory','machine']){
 test('Hands-only or tool-focused '+key+' keeps optimized Cloudinary URL',()=>{
  assert.ok(visuals[key].startsWith('https://res.cloudinary.com/boay3ffi/image/upload/'));
  assert.ok(visuals[key].includes('headless-'));
 });
}
test('Sector descriptions accurately describe mannequin uniforms',()=>{
 assert.match(html,/Two headless full-body mannequins/);
 assert.doesNotMatch(html,/Illustrative student group in school uniforms|Illustrative professional team in an office/);
});
