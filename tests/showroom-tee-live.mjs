import {chromium} from 'playwright';
const ORIGIN='https://taytaygarments.arjayb-fb.workers.dev';
const sku='TTC-SCH-003',slug='pe-set';
const colors=['deepGreen','navy','sky','terracotta'],angles=['front','side','back'];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
let checks=0;
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:850}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(ORIGIN+'/#/showroom',{waitUntil:'domcontentloaded',timeout:40000});
  await page.locator('[data-product="pe-set"]').waitFor({timeout:30000});
  await page.waitForFunction(()=>document.querySelector('[data-product="pe-set"] img.product-photograph')?.src.endsWith('/TTC-SCH-003/deepGreen/front.webp'),null,{timeout:40000});
  await page.locator('[data-product="pe-set"]').click();
  for(const color of colors){
   await page.locator('[data-color="'+color+'"]').click();
   await page.locator('#modalVisual [data-ttc-angle="front"]').waitFor({timeout:15000});
   for(const angle of angles){
    await page.locator('#modalVisual [data-ttc-angle="'+angle+'"]').click();
    const img=page.locator('#modalVisual img.product-photograph');
    const expected='/assets/showroom/TTC-SCH-003/'+color+'/'+angle+'.webp';
    await page.waitForFunction(expected=>{const src=document.querySelector('#modalVisual img.product-photograph')?.getAttribute('src');return !!src && new URL(src,location.origin).pathname===expected;},expected,{timeout:12000});
    await img.evaluate(el=>new Promise((resolve,reject)=>{
     if(el.complete)return el.naturalWidth>0?resolve(null):reject(Error('not loaded'));
     el.addEventListener('load',()=>resolve(null),{once:true});
     el.addEventListener('error',()=>reject(Error('load failed')),{once:true});
    }));
    if(['sky','terracotta'].includes(color) && !(await img.getAttribute('src')).includes('?v=ttc003-20261028b'))throw Error('Stale concept asset '+color+'/'+angle);
    checks++;console.log('PASS '+width+' '+color+' '+angle);
   }
  }
  if(errors.length)throw Error(JSON.stringify(errors));
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
  if(overflow)throw Error('Horizontal overflow at '+width);
  console.log('VIEWPORT '+width+' PASS');
  await page.close();
 }
 console.log('SUCCESS '+checks+'/24 live exact URLs and decoded garment images');
}finally{await browser.close()}
