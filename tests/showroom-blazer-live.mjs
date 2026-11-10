import {chromium} from 'playwright';
const ORIGIN='https://taytaygarments.kelbrictech.workers.dev';
const colors=['navy','charcoal','burgundy','deepGreen'],angles=['front','side','back'];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const pages=[],issues=[];let tests=0;
try{
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:850},deviceScaleFactor:1});pages.push(page);
  const responses=[],failedRequests=[],consoleErrors=[];
  page.on('pageerror',e=>issues.push(width+': '+e.stack));
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
  page.on('response',r=>{if(/ttc-integration|client-config|api\/v1\/products|TTC-SCH-00[123]/.test(r.url()))responses.push({url:r.url(),status:r.status(),contentType:r.headers()['content-type']||''})});
  page.on('requestfailed',r=>{if(/ttc-integration|client-config|api\/v1\/products|TTC-SCH-00[123]/.test(r.url()))failedRequests.push({url:r.url(),failure:r.failure()?.errorText||'unknown'})});
  const dump=async reason=>{const state=await page.evaluate(()=>({url:location.href,title:document.title,appText:document.querySelector('#app')?.innerText?.slice(0,500),productCards:document.querySelectorAll('[data-product]').length,blazerCards:document.querySelectorAll('[data-product="scholar-blazer"]').length,scriptTags:[...document.scripts].map(s=>s.src).filter(Boolean),integrationResources:performance.getEntriesByType('resource').filter(x=>x.name.includes('ttc-integration')).map(x=>x.name),catalogSynced:document.documentElement.dataset.ttcCatalogSynced||null,clientConfigError:document.documentElement.dataset.clientConfigError||null,angleButtons:document.querySelectorAll('#modalVisual [data-ttc-angle]').length,angleNav:document.querySelector('#modalVisual .ttc-angle-set')?.outerHTML||null,modalPid:typeof modalPid==='undefined'?'undefined':modalPid,modalColor:typeof modalColor==='undefined'?'undefined':modalColor,blazerVariants:typeof products==='undefined'?'products undefined':products.filter(p=>p.id==='scholar-blazer').map(p=>({id:p.id,colors:p.colors,variants:p.variants?.map(v=>({color:v.color,views:Object.keys(v.views||{}),front:v.views?.front?.url}))})),modalText:document.querySelector('#modalHost')?.innerText?.slice(0,500)}));console.log('SHOWROOM_DIAGNOSTIC '+JSON.stringify({width,reason,state,responses,failedRequests,issues,consoleErrors}))};
  const res=await page.goto(ORIGIN+'/#/showroom',{waitUntil:'domcontentloaded',timeout:40000});
  try{await page.locator('[data-product="scholar-blazer"]').waitFor({timeout:25000})}catch(e){await dump('product-card timeout: '+e.message);throw e}
  const card=page.locator('[data-product="scholar-blazer"] img.product-photograph');
  try{await page.waitForFunction(()=>document.querySelector('[data-product="scholar-blazer"] img.product-photograph')?.src.includes('/TTC-SCH-002/navy/front.webp'),null,{timeout:45000})}catch(e){await dump('blazer card image timeout: '+e.message);throw e}
  if(!(await card.getAttribute('src')).includes('/TTC-SCH-002/navy/front.webp'))throw Error('Card image not updated');
  console.log('CARD '+width+' '+await card.getAttribute('src'));
  await page.locator('[data-product="scholar-blazer"]').click();
  try{await page.locator('#modalVisual [data-ttc-angle="back"]').waitFor({timeout:20000})}catch(e){await dump('modal angle timeout: '+e.message);throw e}
  for(const color of colors){
   await page.locator('[data-color="'+color+'"]').click();
   try{await page.locator('#modalVisual [data-ttc-angle="front"]').waitFor({timeout:15000})}catch(e){await dump('front angle timeout after color '+color+': '+e.message);throw e}
   for(const angle of angles){
    await page.locator('#modalVisual [data-ttc-angle="'+angle+'"]').click();
    const img=page.locator('#modalVisual img.product-photograph');
    const url=await img.getAttribute('src');
    const expected='/TTC-SCH-002/'+color+'/'+angle+'.webp';
    if(!url?.includes(expected))throw Error(width+': wrong URL '+expected+': '+url);
    await img.evaluate(el=>new Promise((resolve,reject)=>{if(el.complete){el.naturalWidth?resolve(null):reject(Error('image failed'));return;}el.addEventListener('load',()=>resolve(null),{once:true});el.addEventListener('error',()=>reject(Error('image failed')),{once:true});setTimeout(()=>reject(Error('image timeout')),15000)}));
    tests++;
    console.log('PASS '+width+' '+color+' '+angle);
   }
  }
  await page.locator('#modalAdd').click();
  const cart=await page.evaluate(()=>JSON.parse(localStorage.getItem('loomfield-pitch-brief-v1')||'[]'));
  if(!cart.some(x=>x.id==='scholar-blazer'&&x.color==='deepGreen'))throw Error('Saved color missing from cart');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
  if(overflow)throw Error(width+': horizontal overflow');
  console.log('VIEWPORT '+width+' PASS (cart, viewport, image switching)');
 }
 if(issues.length)throw Error('page errors: '+JSON.stringify(issues));
 console.log('SUCCESS: '+tests+' exact URL and decoded image checks across 2 viewport widths, all colors and views');
}finally{await Promise.all(pages.map(p=>p.close().catch(()=>{})));await browser.close()}
