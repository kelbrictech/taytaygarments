import {chromium} from 'playwright';
import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url),axe=require.resolve('axe-core/axe.min.js');
const origin='https://taytaygarments.arjayb-fb.workers.dev';
const policies=['privacy','terms','returns','cookies','accessibility','privacy-request','image-credits'];
const reports=[];
fs.mkdirSync('artifacts/legal-audit',{recursive:true});
// The Cloudflare GitHub deployment can lag behind the commit being audited.
let ready=false;
for(let i=0;i<40;i++){
 try{
  const [home,privacy,rights]=await Promise.all([fetch(origin+'/',{cache:'no-store'}),fetch(origin+'/privacy',{cache:'no-store'}),fetch(origin+'/privacy-request',{cache:'no-store'})]);
  if(home.ok&&privacy.ok&&rights.ok&&(await home.text()).includes('legal-links')&&(await privacy.text()).includes('Operator review required')&&(await rights.text()).includes('id="rights-turnstile" role="group"')){ready=true;break}
 }catch{}
 await new Promise(res=>setTimeout(res,4000));
}
if(!ready)throw Error('The legal-policy release is not yet deployed.');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900}});
  const page=await context.newPage();
  await page.goto(origin+'/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('.legal-links a[href="/privacy"]').waitFor({state:'visible',timeout:25000});
  if(!(await page.locator('.ttc-cookie-panel').isVisible()))throw Error('First-visit cookie preference missing at '+width);
  await page.addScriptTag({path:axe});
  const consentScan=await page.evaluate(async()=>await axe.run(document.querySelector('.ttc-cookie-panel'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}));
  const severeConsent=consentScan.violations.filter(x=>['critical','serious'].includes(x.impact));
  if(severeConsent.length)throw Error('Cookie preference banner accessibility defect '+JSON.stringify(severeConsent.map(x=>({id:x.id,impact:x.impact,targets:x.nodes.map(n=>n.target)}))));
  console.log('COOKIE_PREFERENCE_ACCESSIBILITY_PASS width='+width);
  await page.locator('.ttc-cookie-necessary').click();
  await page.waitForTimeout(300);
  if(await page.locator('.ttc-cookie-panel').isVisible())throw Error('Necessary-only preference did not close banner');
  const choice=await page.evaluate(()=>JSON.parse(localStorage.getItem('ttc-privacy-choices-v1')||'null'));
  if(choice?.saveBrief!==false)throw Error('Necessary-only storage choice not honored');
  await page.locator('[data-cookie-settings]').first().click();
  await page.locator('#ttc-save-brief-choice').check();
  await page.getByRole('button',{name:'Save my choice'}).click();
  if(!(await page.evaluate(()=>JSON.parse(localStorage.getItem('ttc-privacy-choices-v1')).saveBrief)))throw Error('Optional brief preference not saved');
  await page.screenshot({path:'artifacts/legal-audit/site-'+width+'.png'});
  for(const key of policies){
   await page.goto(origin+'/'+key,{waitUntil:'domcontentloaded',timeout:40000});
   const title=await page.locator('main h1').first().innerText();
   if(!title?.trim())throw Error(key+' missing first heading at '+width);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth);
   if(overflow>width+2)throw Error(key+' overflows width '+width+' (scrollWidth='+overflow+')');
   if(await page.locator('main').count()!==1)throw Error(key+' landmark missing');
   if(key==='privacy-request'&&await page.locator('#privacy-form').count()!==1)throw Error('Request form missing');
   await page.addScriptTag({path:axe});
   const scan=await page.evaluate(async()=>await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}));
   const severe=scan.violations.filter(v=>['critical','serious'].includes(v.impact));
   reports.push({width,page:key,violations:scan.violations.map(x=>({id:x.id,impact:x.impact,count:x.nodes.length}))});
   if(severe.length)throw Error(key+' severe accessibility findings '+JSON.stringify(severe.map(x=>({id:x.id,impact:x.impact,nodes:x.nodes.map(n=>({target:n.target,html:n.html,summary:n.failureSummary}))}))));
   if(['privacy','returns','privacy-request'].includes(key))await page.screenshot({path:'artifacts/legal-audit/'+key+'-'+width+'.png'});
   console.log('LEGAL_PAGE_RESPONSIVE_AND_ACCESSIBILITY_PASS '+width+' '+key+' total_axe_findings='+scan.violations.length);
  }
  await context.close();
 }
 const restricted=await fetch(origin+'/api/v2/privacy/requests',{cache:'no-store'});
 if(restricted.status!==401)throw Error('Unauthenticated privacy queue exposed HTTP '+restricted.status);
 console.log('LIVE_PRIVACY_QUEUE_AUTH_PASSED HTTP 401');
 const health=await fetch(origin+'/api/health').then(r=>r.json());
 if(health.privacyRequestAvailable){
  const invalid=await fetch(origin+'/api/v1/privacy/requests',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'invalid',type:'erasure',acknowledged:false,noticeVersion:'2026-10-30'})});
  if(invalid.status!==422)throw Error('Invalid rights request should be rejected 422, got '+invalid.status);
  console.log('LIVE_PRIVACY_VALIDATION_PASSED HTTP 422');
 }else console.log('PRIVACY_REQUEST_INTAKE_NOT_CONFIGURED');
 fs.writeFileSync('artifacts/legal-audit/accessibility-findings.json',JSON.stringify(reports,null,2));
}finally{await browser.close()}
