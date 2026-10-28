import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const match=html.match(/const VISUALS=(\{[\s\S]*?\});/);
assert.ok(match,'Source image registry missing');
const assets=JSON.parse(match[1]);
const sectors=['school','corporate','government','specialized'];
for(const key of sectors){
 test('Photorealistic '+key+' mannequin image is sourced from prepared Cloudinary photo, never SVG',()=>{
  assert.ok(assets[key].startsWith('https://res.cloudinary.com/boay3ffi/image/upload/e_upscale/c_crop,'));
  assert.ok(assets[key].includes('c_fill,w_900,h_1100'));
  assert.ok(assets[key].includes('reference-s3-probe.png'));
  assert.ok(!/\.svg$|data:image/i.test(assets[key]));
 });
}
test('Hero uses photorealistic approved source rather than vector illustration',()=>{
 assert.ok(assets.hero_wide.startsWith('https://res.cloudinary.com/boay3ffi/image/upload/e_upscale/'));
 assert.ok(assets.hero_wide.includes('c_fill,w_1600,h_700'));
 assert.equal(assets.hero,assets.hero_wide);
});
test('Four sectors use distinct prepared photographic crops',()=>{
 assert.equal(new Set(sectors.map(k=>assets[k])).size,4);
});
test('No old cartoon mannequin files are referenced in HTML',()=>{
 assert.doesNotMatch(html,/\/assets\/mannequins\/[^"']+\.svg/);
 assert.match(html,/Photorealistic wooden-neck mannequin/);
});
test('Production photo provenance and use are described honestly',()=>{
 assert.match(html,/Photorealistic mannequin imagery is illustrative/);
});
