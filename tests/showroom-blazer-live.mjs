import {chromium} from 'playwright';
const ORIGIN='https://taytaygarments.kelbrictech.workers.dev';
const colors=['navy','charcoal','burgundy','deepGreen'],angles=['front','side','back'];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const pages=[],issues=[];let tests=0;
try{
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:850},deviceScaleFactor:1});pages.push(page);
  await page.addInitScript(()=>localStorage.setItem('ttc-privacy-choices-v1',JSON.stringify({version:1,saveBrief:true,at:new Date().toISOString()})));
  const responses=[],failedRequests=[],consoleErrors=[];
  page.on('pageerror',e=>issues.push(width+': '+e.stack));
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
  page.on('response',r=>{if(/ttc-integration|client-config|api\/v1\/products|TTC-SCH-00[123]/.test(r.url()))responses.push({url:r.url(),status:r.status(),contentType:r.headers()['content-type']||''})});
  page.on('requestfailed',r=>{if(/ttc-integration|client-config|api\/v1\/products|TTC-SCH-00[123]/.test(r.url()))failedRequests.push({url:r.url(),failure:r.failure()?.errorText||'unknown'})});
  const dump=async reason=>{const state=await page.evaluate(()=>({url:location.href,title:document.title,viewport:{width:innerWidth,height:innerHeight},appText:document.querySelector('#app')?.innerText?.slice(0,500),productCards:document.querySelectorAll('[data-product]').length,blazerCards:document.querySelectorAll('[data-product="scholar-blazer"]').length,scriptTags:[...document.scripts].map(s=>s.src).filter(Boolean),integrationResources:performance.getEntriesByType('resource').filter(x=>x.name.includes('ttc-integration')).map(x=>x.name),catalogSynced:document.documentElement.dataset.ttcCatalogSynced||null,clientConfigError:document.documentElement.dataset.clientConfigError||null,angleButtons:[...document.querySelectorAll('#modalVisual [data-ttc-angle]')].map(b=>{const r=b.getBoundingClientRect(),c=getComputedStyle(b);return{text:b.textContent,rect:{x:r.x,y:r.y,width:r.width,height:r.height},display:c.display,visibility:c.visibility,opacity:c.opacity,position:c.position,zIndex:c.zIndex,pointerEvents:c.pointerEvents,disabled:b.disabled}}),visualRect:(()=>{const r=document.querySelector('#modalVisual')?.getBoundingClientRect();return r?{x:r.x,y:r.y,width:r.width,height:r.height}:null})(),modalRect:(()=>{const r=document.querySelector('#modalHost .modal')?.getBoundingClientRect();return r?{x:r.x,y:r.y,width:r.width,height:r.height}:null})(),animations:document.getAnimations().map(a=>({state:a.playState,time:a.currentTime,target:a.effect?.target?.className||a.effect?.target?.id||''})),modalPid:typeof modalPid==='undefined'?'undefined':modalPid,modalColor:typeof modalColor==='undefined'?'undefined':modalColor,blazerVariants:typeof products==='undefined'?'products undefined':products.filter(p=>p.id==='scholar-blazer').map(p=>({id:p.id,colors:p.colors,variants:p.variants?.map(v=>({color:v.color,views:Object.keys(v.views||{}),front:v.views?.front?.url}))})),modalText:document.querySelector('#modalHost')?.innerText?.slice(0,500)}));console.log('SHOWROOM_DIAGNOSTIC '+JSON.stringify({width,reason,state,responses,failedRequests,issues,consoleErrors}))};
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
    try{await page.locator('#modalVisual [data-ttc-angle="'+angle+'"]').click({timeout:10000})}catch(e){await dump('angle click timeout '+color+'/'+angle+': '+e.message);throw e}
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
  const overflow=await page.evaluate(()=>({html:document.documentElement.scrollWidth,body:document.body.scrollWidth,viewport:innerWidth,scrollX,scrollY,offenders:[...document.body.querySelectorAll('*')].map(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return{tag:el.tagName,id:el.id,classes:typeof el.className==='string'?el.className:'',left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width),position:s.position,display:s.display,overflowX:s.overflowX}}).filter(x=>x.right>innerWidth+1).sort((a,b)=>b.right-a.right).slice(0,20)}));
  if(overflow.html>overflow.viewport+1)throw Error(width+': horizontal overflow '+JSON.stringify(overflow));
  console.log('VIEWPORT '+width+' PASS (cart, viewport, image switching)');
 }
 // A first-visit user has no saved consent. The privacy panel must remain behind the showroom modal.
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:850},deviceScaleFactor:1});pages.push(page);
  await page.goto(ORIGIN+'/#/showroom',{waitUntil:'domcontentloaded',timeout:40000});
  await page.locator('.ttc-cookie-panel').waitFor({state:'visible',timeout:10000});
  await page.locator('[data-product="scholar-blazer"]').click();
  await page.locator('#modalVisual [data-ttc-angle="back"]').click({timeout:10000});
  const firstVisitPhoto=await page.locator('#modalVisual img.product-photograph').getAttribute('src');
  if(!firstVisitPhoto?.includes('/TTC-SCH-002/navy/back.webp'))throw Error(width+': privacy panel blocked showroom modal controls: '+firstVisitPhoto);
  console.log('PRIVACY_OVERLAY_MODAL_ACCESS_PASS '+width);
 }
 if(issues.length)throw Error('page errors: '+JSON.stringify(issues));
 console.log('SUCCESS: '+tests+' exact URL and decoded image checks across 2 viewport widths, all colors and views');
}finally{await Promise.all(pages.map(p=>p.close().catch(()=>{})));await browser.close()}
