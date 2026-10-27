import {chromium} from 'playwright';
const ORIGIN='https://taytaygarments.arjayb-fb.workers.dev';
const colors=['navy','charcoal','burgundy','deepGreen'],angles=['front','side','back'];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const pages=[],issues=[];let tests=0;
try{
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:850},deviceScaleFactor:1});pages.push(page);
  page.on('pageerror',e=>issues.push(width+': '+e.message));
  const res=await page.goto(ORIGIN+'/#/showroom',{waitUntil:'domcontentloaded',timeout:40000});
  await page.locator('[data-product="scholar-blazer"]').waitFor({timeout:25000});
  const card=page.locator('[data-product="scholar-blazer"] img.product-photograph');
  await page.waitForFunction(()=>document.querySelector('[data-product="scholar-blazer"] img.product-photograph')?.src.includes('/TTC-SCH-002/navy/front.webp'),null,{timeout:45000});
  if(!(await card.getAttribute('src')).includes('/TTC-SCH-002/navy/front.webp'))throw Error('Card image not updated');
  console.log('CARD '+width+' '+await card.getAttribute('src'));
  await page.locator('[data-product="scholar-blazer"]').click();
  await page.locator('#modalVisual [data-ttc-angle="back"]').waitFor({timeout:20000});
  for(const color of colors){
   await page.locator('[data-color="'+color+'"]').click();
   await page.locator('#modalVisual [data-ttc-angle="front"]').waitFor({timeout:15000});
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
