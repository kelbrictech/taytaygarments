import {chromium} from 'playwright';
import fs from 'node:fs';
const origin='https://taytaygarments.arjayb-fb.workers.dev';
fs.mkdirSync('artifacts/qms',{recursive:true});
let readiness=false;
for(let n=0;n<36;n++){
 try{
  const resp=await fetch(origin+'/',{cache:'no-store'});
  if(resp.ok&&(await resp.text()).includes('QUALITY_PAGE_HTML')){readiness=true;break}
 }catch{}
 await new Promise(r=>setTimeout(r,4500));
}
if(!readiness)throw Error('Latest Quality page has not reached Cloudflare production');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',x=>errors.push(x.message));
  await page.goto(origin+'/#/quality',{waitUntil:'domcontentloaded',timeout:40000});
  await page.getByText('Quality management preparation',{exact:true}).waitFor({timeout:30000});
  const content=(await page.locator('main').innerText()).toLowerCase();
  for(const phrase of ['no verified iso 9001 certification','requirements','inspection','risk','quality']){
   if(!content.includes(phrase))throw Error(width+'px public quality page missing '+phrase);
  }
  if(await page.locator('main img[src*="iso-logo"]').count())throw Error('Unapproved ISO seal');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth);
  if(overflow>width+2)throw Error('Horizontal scrolling at '+width+'px: '+overflow);
  if(errors.length)throw Error('Browser errors: '+errors.join(' | '));
  await page.screenshot({path:'artifacts/qms/quality-'+width+'.png'});
  console.log('ISO_QUALITY_PAGE_LIVE_PASSED width='+width);
  await page.close();
 }
 const anon=await fetch(origin+'/api/v2/qms/overview');
 if(anon.status!==401)throw Error('QMS private API returned '+anon.status+' (expected 401)');
 console.log('QMS_ANONYMOUS_DENIED status=401');
 const portal=await fetch(origin+'/portal.html').then(r=>r.text());
 if(!portal.includes('/qms-workspace.js')||!portal.includes('/qms-workspace.css'))throw Error('Live portal missing Quality dashboard assets');
 const js=await fetch(origin+'/qms-workspace.js');
 if(!js.ok||!(await js.text()).includes('window.TTCQMS'))throw Error('Quality dashboard script unavailable');
 console.log('QMS_PORTAL_ASSETS_LIVE_PASSED');
}finally{await browser.close()}
