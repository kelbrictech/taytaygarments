import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source=fs.readFileSync(new URL('../src/client-config.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const mod={exports:{}};
vm.runInNewContext(js,{module:mod,exports:mod.exports});
const {loadClientConfig,featureForApiPath}=mod.exports;
test('Taytay stays the unchanged deployment default',()=>{
 const c=loadClientConfig({});
 assert.equal(c.id,'taytaygarments');
 assert.equal(c.brand.displayName,'Taytay Textile Co.');
 assert.equal(c.features.orders,true);
});
test('example client uses only an isolated deployment configuration',()=>{
 const c=loadClientConfig({CLIENT_CONFIG_JSON:fs.readFileSync(new URL('../clients/example-apparel.json',import.meta.url),'utf8')});
 assert.equal(c.brand.displayName,'Example Apparel Studio');
 assert.equal(c.features.careers,false);
 assert.equal(c.features.orders,true);
 assert.equal(loadClientConfig({}).brand.primaryColor,'#153c36');
});
test('reject unknown keys, invalid colors, code-like text, nonboolean module flags',()=>{
 for(const value of ['{"id":"X"}','{"id":"demo","features":{"orders":"false"}}','{"id":"demo","brand":{"primaryColor":"red"}}','{"id":"demo","adminSecret":"oops"}','{"id":"demo","brand":{"displayName":"<script>"}}']){
  assert.throws(()=>loadClientConfig({CLIENT_CONFIG_JSON:value}));
 }
});
test('backend gates only intended module routes',()=>{
 assert.equal(featureForApiPath('/api/v2/orders/ABC/events'),'orders');
 assert.equal(featureForApiPath('/api/v2/stock/movements'),'inventory');
 assert.equal(featureForApiPath('/api/v2/purchase-orders'),'inventory');
 assert.equal(featureForApiPath('/api/v2/qms/overview'),'quality');
 assert.equal(featureForApiPath('/api/v2/pages/careers'),'careers');
 assert.equal(featureForApiPath('/api/v2/auth/me'),null);
});
test('shared brand loader is present on all entry pages',()=>{
 for(const name of ['index.html','customer.html','portal.html','track.html']){
  assert.match(fs.readFileSync(new URL('../public/'+name,import.meta.url),'utf8'),/\/client-config\.js/);
 }
});
