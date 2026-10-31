import {readFileSync,writeFileSync} from 'node:fs';
const profile=process.argv[2];
if(!profile)throw new Error('Usage: node tools/make-client-config.mjs clients/example-apparel.json');
const data=JSON.parse(readFileSync(profile,'utf8'));
if(typeof data.id!=='string'||!/^[a-z0-9][a-z0-9-]{2,48}$/.test(data.id))throw new Error('Invalid client ID');
if(typeof data.brand?.displayName!=='string'||!data.brand.displayName.trim())throw new Error('Invalid brand name');
const output=[
  'name = '+JSON.stringify('ttc-'+data.id),
  'main = "src/worker.ts"',
  'compatibility_date = "2026-10-01"',
  'compatibility_flags = ["nodejs_compat"]',
  'workers_dev = true',
  '[assets]',
  'directory = "./public"',
  'binding = "ASSETS"',
  'not_found_handling = "single-page-application"',
  'run_worker_first = ["/api/*"]',
  '[vars]',
  'SITE_STATUS = "development"',
  'INQUIRIES_ENABLED = "false"',
  'CLIENT_CONFIG_JSON = '+JSON.stringify(JSON.stringify(data)),
  ''
].join('\n');
const target='wrangler.'+data.id+'.toml';
writeFileSync(target,output,{flag:'wx'});
console.log(target);
