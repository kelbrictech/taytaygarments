import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const match=source.match(/const VISUALS=(\{[\s\S]*?\});/);
assert.ok(match,'Visuals registry missing');
const media=JSON.parse(match[1]);
const expected={
 school:'x_5,y_0',corporate:'x_260,y_0',government:'x_500,y_0',specialized:'x_775,y_0'
};
for(const [key,x] of Object.entries(expected)){
 test('Production '+key+' uses full-resolution mannequin artwork crop',()=>{
  assert.ok(media[key].startsWith('https://res.cloudinary.com/boay3ffi/image/upload/c_crop,'));
  assert.ok(media[key].includes('e_upscale/c_fill,w_900,h_1100'));
  assert.ok(media[key].includes('mannequin-photo-master-v6.webp'));
  assert.ok(media[key].includes(x));
  assert.doesNotMatch(media[key],/\.svg$/);
 });
}
test('Production hero uses the same approved high resolution source',()=>{
 assert.ok(media.hero_wide.includes('e_upscale/c_fill,w_1600,h_700'));
 assert.ok(media.hero_wide.includes('mannequin-photo-master-v6.webp'));
 assert.equal(media.hero,media.hero_wide);
});
test('All four sectors get their own image crop',()=>{
 assert.equal(new Set(Object.keys(expected).map(k=>media[k])).size,4);
});
test('No geometric mannequin SVG artwork is deployed in live HTML',()=>{
 assert.doesNotMatch(source,/\/assets\/mannequins\/[^"']+\.svg/);
});
test('Image disclosure remains in landing page',()=>{
 assert.match(source,/Photorealistic mannequin imagery is illustrative/);
});
