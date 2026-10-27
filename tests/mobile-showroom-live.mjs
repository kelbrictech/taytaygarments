import {chromium} from 'playwright';
import fs from 'node:fs';
const url='https://taytaygarments.arjayb-fb.workers.dev/#/showroom';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const results=[];
fs.mkdirSync('artifacts/mobile-showroom',{recursive:true});
try{
for(const [width,height] of [[390,844],[320,700],[1440,900]]){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:35000});
 await page.locator('[data-product="scholar-blazer"]').first().waitFor({timeout:35000});
 if(await page.locator('.topline').count())throw Error(width+' outdated promotional strip remains');
 const pageText=await page.locator('#app').innerText();
 if(/Design\\. Develop\\. Manufacture\\.|Choose the direction|A curated starting point/i.test(pageText))throw Error(width+' generic slogans remain on showroom');
 if(!pageText.includes('Browse 12 uniform and apparel styles.'))throw Error(width+' latest copy not deployed');
 if(width<=390){
   await page.screenshot({path:'artifacts/mobile-showroom/showroom-first-screen-'+width+'.png'});
 }

 await page.locator('[data-product="scholar-blazer"]').first().click();
 await page.locator('#modalVisual .ttc-angle-set button[data-ttc-angle="front"]').waitFor({timeout:15000});
 const box=async selector=>{const el=page.locator(selector);const b=await el.boundingBox();if(!b)throw Error(width+' missing box '+selector);return b;};
 const name=await box(width<681?'.mobile-product-heading':'#modalTitle');
 const visual=await box('#modalVisual .product-photograph');
 const nav=await box('#modalVisual .ttc-angle-set');
 const info=await box('.modal-info');
 const close=await box('#modalClose');
 const modal=await box('.modal');
 const tagline=await page.locator('#modalHost').innerText();
 const docWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
 if(/STUDIO CONCEPT|NOT INVENTORY|Fictional identity|PROTOTYPE ONLY|PITCH CONCEPTS ONLY/i.test(tagline)) throw Error('Visible prototype marker persists');
 if(nav.y<visual.y+visual.height-3)throw Error(width+' angle buttons overlapping image');
 if(width<681) {
   if(!(name.y+name.height<=visual.y+3))throw Error(width+' title not above image');
   if(!(nav.y+nav.height<=info.y+4))throw Error(width+' angle buttons overlap product information');
   if(close.x < width*0.52)throw Error(width+' close button on wrong side');
   if(visual.height>height*.52)throw Error(width+' oversized image: '+visual.height);
   if(modal.width>width+2)throw Error(width+' modal overflow');
   if(docWidth>width+2)throw Error(width+' document overflow');
 } else if(close.x < width/2)throw Error('desktop close button misplaced');
 const screenshot='artifacts/mobile-showroom/modal-'+width+'x'+height+'.png';
 await page.screenshot({path:screenshot});
 // Click and check color state persists and view switching works.
 await page.locator('[data-color="charcoal"]').click();
 await page.locator('#modalVisual .ttc-angle-set [data-ttc-angle="back"]').click();
 const photo=await page.locator('#modalVisual img.product-photograph').getAttribute('src');
 if(!photo?.includes('/TTC-SCH-002/charcoal/back.webp'))throw Error('Incorrect angle/color URL: '+photo);
 if(errors.length)throw Error('Browser errors '+errors.join(' | '));
 results.push({width,height,title:name,visual,angles:nav,info,close,modal,bodyWidth:docWidth,screenshot,colorAngle:'charcoal/back',jsErrors:0});
 await page.close();
}
for(const route of ['showroom','about','portfolio','contact','quote','manufacturing']){
 const page=await browser.newPage();
 await page.goto(url.replace('#/showroom','#/'+route),{waitUntil:'domcontentloaded',timeout:35000});
 await page.waitForTimeout(800);
 const visible=await page.locator('body').innerText();
 if(/Fictional identity|PROTOTYPE ONLY|PITCH CONCEPTS ONLY|CONCEPT SHOWROOM|ILLUSTRATIVE IMAGE|This prototype|This demonstration|pitch concept|not inventory/i.test(visible))throw Error('prototype copy in '+route);
 await page.close();
}
console.log('MOBILE_SHOWROOM_QA_SUCCESS');
console.log(JSON.stringify({results,publicRoutesChecked:['showroom','about','portfolio','contact','quote','manufacturing'],allPassed:true},null,2));
}finally{await browser.close()}
