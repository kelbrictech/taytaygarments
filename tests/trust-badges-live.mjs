import {chromium} from 'playwright';
import fs from 'node:fs';
const origin='https://taytaygarments.arjayb-fb.workers.dev';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
fs.mkdirSync('artifacts/trust',{recursive:true});
const checks=[];
try{
 for(const [w,h] of [[390,844],[1440,900]]){
  const page=await browser.newPage({viewport:{width:w,height:h},deviceScaleFactor:1});
  const failures=[];page.on('pageerror',e=>failures.push(e.message));
  await page.goto(origin+'/#/trust',{waitUntil:'domcontentloaded',timeout:40000});
  await page.locator('.trust-badge-item').first().waitFor({timeout:45000});
  const count=await page.locator('.trust-badge-item').count();
  if(count!==22)throw Error('Live trust record count for '+w+'px: '+count+' != 22');
  if(await page.locator('.trust-badge-item.has-proof').count())throw Error('Undocumented certification marked as earned.');
  const text=await page.locator('main').innerText();
  if(!text.includes('PROUD')||!text.includes('PHILIPPINE')||!text.includes('MADE'))throw Error('Philippine heritage mark missing from trust page');
  const buttons=await page.locator('#trustFilters [data-trust-filter]').count();
  if(buttons!==6)throw Error('Trust category filter count changed: '+buttons);
  const original=await page.locator('.trust-badge-item').count();
  await page.locator('#trustFilters [data-trust-filter="Ethical production"]').click();
  const filtered=await page.locator('.trust-badge-item').count();
  if(filtered!==4)throw Error('Ethical production filter mismatch: '+filtered);
  await page.locator('#trustFilters [data-trust-filter="all"]').click();
  const width=await page.evaluate(()=>document.documentElement.scrollWidth);
  if(width>w+2)throw Error('Trust page horizontal overflow at '+w+'px: '+width);
  if(failures.length)throw Error('Browser errors at '+w+'px: '+failures.join(' | '));
  await page.screenshot({path:'artifacts/trust/trust-'+w+'.png',fullPage:false});
  checks.push({route:'trust',width:w,badges:original,filters:buttons,filtered,errors:failures.length});
  await page.goto(origin+'/#/',{waitUntil:'domcontentloaded',timeout:40000});
  await page.locator('.ph-made-stamp').waitFor({timeout:20000});
  if(!(await page.locator('.ph-made-copy').innerText()).includes('PROUD PHILIPPINE MADE'))throw Error('Homepage Philippine Made title missing');
  const ribbon=await page.locator('.trust-ribbon-piece').count();
  if(ribbon!==3)throw Error('Homepage trust ribbon count mismatch: '+ribbon);
  const homeWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
  if(homeWidth>w+2)throw Error('Homepage overflow at '+w+'px: '+homeWidth);
  await page.screenshot({path:'artifacts/trust/home-'+w+'.png',fullPage:false});
  checks.push({route:'home',width:w,heritage:true,trustRibbon:ribbon});
  await page.close();
 }
 const api=await fetch(origin+'/api/v2/trust');
 if(!api.ok)throw Error('Live trust API status '+api.status);
 const rows=(await api.json()).badges;
 if(rows.length!==22)throw Error('Live API wrong number of trust entries');
 if(rows.some(x=>x.status!=='research'))throw Error('A credential has been represented as documented without approved evidence');
 console.log('TRUST_BADGES_LIVE_QA_SUCCESS '+JSON.stringify({checks,apiCount:rows.length,noUnverifiedOfficialMarks:true}));
}finally{await browser.close()}
