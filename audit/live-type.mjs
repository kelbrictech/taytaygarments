import {chromium} from 'playwright';
const origin='https://taytaygarments.arjayb-fb.workers.dev';
const routes=['/','/showroom','/quote','/solutions','/manufacturing','/about','/contact','/portfolio'];
const viewports=[{width:1440,height:900},{width:390,height:844},{width:320,height:740}];
const selectors=['body','.topline','.brand-copy strong','.brand-copy span','.links a','.mobile-toggle','.eyebrow','.hero-copy h1','.hero-copy p','.page-hero h1','.page-hero .intro','.section-head h2','.lead','.sector-card h3','.sector-card p','.product-info h3','.product-info p','.product-info small','.product-card .tag','.product-card .thumb','.editorial-card h3','.editorial-card p','.quick-item small','.procurement-list small','.tick p','.form-panel label','.field label','.quote-aside p','.form-panel input','.form-panel textarea','.btn','.modal-info h2','.modal-info p','p','h1','h2','h3'];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const results=[];let errors=[];
for(const vp of viewports){const page=await browser.newPage({viewport:vp,deviceScaleFactor:1});
 page.on('pageerror',e=>errors.push({route:page.url(),viewport:vp.width,error:String(e)}));
 for(const route of routes){const url=origin+'/#'+route;
  try{
   const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForTimeout(350);
   const audit=await page.evaluate((selectors)=>{
    const visible=(el)=>{const r=el.getBoundingClientRect(),st=getComputedStyle(el);return r.width>0&&r.height>0&&st.visibility!=='hidden'&&st.display!=='none'};
    const sample={};const size=(el)=>Math.round(parseFloat(getComputedStyle(el).fontSize)*10)/10;
    for(const selector of selectors){const els=[...document.querySelectorAll(selector)].filter(visible);
     if(!els.length)continue;const uniq=[...new Set(els.map(size))];sample[selector]={sizes:uniq.slice(0,8),count:els.length,examples:els.slice(0,2).map(e=>({size:size(e),text:(e.innerText||e.getAttribute('aria-label')||'').trim().slice(0,90)}))};}
    const violations=[];
    const test=(selector,min,label)=>{for(const el of document.querySelectorAll(selector)){if(!visible(el))continue;const f=size(el);if(f<min)violations.push({selector,label,actual:f,minimum:min,text:(el.innerText||'').trim().slice(0,85)});}};
    test('.hero-copy p, .page-hero .intro, .lead, .form-panel input, .form-panel textarea, .form-panel select',16,'primary-content');
    test('.product-info p, .sector-card p, .editorial-card p, .quote-aside p, .procurement-list small',14,'supporting-content');
    test('.links a, .links button',13,'navigation');
    test('.eyebrow, .kicker, .field label, .form-panel label, .product-info small',12,'short-label');
    const h1s=[...document.querySelectorAll('main h1')].filter(visible);
    return {title:document.title,h1Count:h1s.length,h1:h1s.slice(0,2).map(el=>({font:size(el),text:el.innerText.slice(0,100)})),
     htmlScrollWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,
     samples:sample,violations};
   },selectors);
   results.push({viewport:vp.width,route,status:response?.status(),...audit});
   console.log('CHECK '+vp.width+' '+route+' HTTP '+response?.status()+' H1='+audit.h1Count+' overflow='+audit.overflow+' violations='+audit.violations.length);
   for(const v of audit.violations.slice(0,5))console.log('FLAG '+vp.width+' '+route+' '+JSON.stringify(v));
  }catch(e){errors.push({route,viewport:vp.width,error:String(e)})}
 }
 await page.close();
}
const css=await browser.newPage();const cssResponse=await css.goto(origin+'/typography.css',{waitUntil:'domcontentloaded',timeout:30000});const cssText=await css.locator('body').innerText();
console.log('LIVE_CSS '+JSON.stringify({status:cssResponse.status(),hasToken:cssText.includes('--type-editorial'),bytes:cssText.length}));
await css.close();await browser.close();
const summary={total:results.length,errors,overflows:results.filter(x=>x.overflow).map(x=>[x.viewport,x.route]),missingH1:results.filter(x=>x.h1Count!==1).map(x=>[x.viewport,x.route,x.h1Count]),violations:results.flatMap(x=>x.violations.map(v=>({...v,viewport:x.viewport,route:x.route}))),styles:results.map(x=>({viewport:x.viewport,route:x.route,h1:x.samples['main h1']||x.samples['h1'],body:x.samples.body,lead:x.samples['.hero-copy p']||x.samples['.page-hero .intro'],nav:x.samples['.links a'],productTitle:x.samples['.product-info h3'],productCopy:x.samples['.product-info p'],sectorTitle:x.samples['.sector-card h3'],sectorCopy:x.samples['.sector-card p'],fieldLabel:x.samples['.field label'],input:x.samples['.form-panel input'],eyebrow:x.samples['.eyebrow']}))};
console.log('AUDIT_JSON_START');console.log(JSON.stringify(summary,null,2));console.log('AUDIT_JSON_END');
