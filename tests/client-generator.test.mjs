import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url));
test('new client generator creates a separate worker profile without connection credentials',()=>{
 const dir=mkdtempSync(join(tmpdir(),'client-config-'));
 try{
  const run=spawnSync(process.execPath,[join(root,'tools/make-client-config.mjs'),join(root,'clients/example-apparel.json')],{cwd:dir,encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  const generated=readFileSync(join(dir,'wrangler.example-apparel.toml'),'utf8');
  assert.match(generated,/name = "ttc-example-apparel"/);
  assert.match(generated,/CLIENT_CONFIG_JSON =/);
  assert.match(generated,/INQUIRIES_ENABLED = "false"/);
  assert.equal(generated.includes('DATABASE_URL ='),false);
  const again=spawnSync(process.execPath,[join(root,'tools/make-client-config.mjs'),join(root,'clients/example-apparel.json')],{cwd:dir,encoding:'utf8'});
  assert.notEqual(again.status,0,'generator must not silently overwrite existing client config');
 }finally{rmSync(dir,{recursive:true,force:true})}
});
