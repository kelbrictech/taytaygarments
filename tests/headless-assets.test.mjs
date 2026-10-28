import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const m=html.match(/const VISUALS=(\{[\s\S]*?\});/);
assert.ok(m,'Expected VISUALS object in index');
const visuals=JSON.parse(m[1]);
const keys=["school","corporate","government","specialized","hero","hero_wide","factory","machine"];
for(const key of keys){
 test('Marketing image '+key+' is a versioned headless Cloudinary garment asset',()=>{
  assert.ok(visuals[key]?.startsWith('https://res.cloudinary.com/boay3ffi/image/upload/'),key);
  assert.ok(visuals[key].includes('/headless-')&&visuals[key].includes('-v3.jpg'),key);
  assert.ok(!visuals[key].startsWith('data:'),'No embedded thumbnail');
 });
}
test('Marketing renderer describes garment subjects instead of people portraits',()=>{
 assert.doesNotMatch(html,/Illustrative student group in school uniforms|Illustrative professional team in an office|Illustrative chef in professional white uniform/);
 assert.match(html,/White uniform shirts arranged on a garment rail/);
});
