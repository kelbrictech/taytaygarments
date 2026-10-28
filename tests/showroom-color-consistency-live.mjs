import {chromium} from 'playwright';
const ORIGIN='https://taytaygarments.arjayb-fb.workers.dev';
const EXPECTED={
 'campus-polo':['navy','white','deepGreen','burgundy'],
 'scholar-blazer':['navy','charcoal','burgundy','deepGreen'],
 'pe-set':['deepGreen','navy','sky','terracotta'],
 'office-shirt':['sky','white','navy','charcoal'],
 'brand-polo':['deepGreen','navy','charcoal','burgundy'],
 'executive-blazer':['charcoal','navy','black','cream'],
 'public-service':['cream','white','sky'],
 'field-uniform':['olive','navy','charcoal','terracotta'],
 'clinical-scrub':['teal','navy','sky','burgundy'],
 'chef-jacket':['white','black','charcoal'],
 'retail-hoodie':['terracotta','charcoal','olive','cream'],
 'event-tee':['burgundy','white','black','sky','olive']
};
const COMPLETED=new Set(['campus-polo','scholar-blazer','pe-set']);
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
let passed=0;
try {
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.goto(ORIGIN+'/#/showroom',{waitUntil:'domcontentloaded',timeout:40000});
  await page.waitForFunction(()=>document.documentElement.dataset.ttcCatalogSynced==='true',{timeout:45000});
  for(const [id,colors] of Object.entries(EXPECTED)){
   const card=page.locator('[data-product="'+id+'"]').first();
   await card.waitFor({state:'visible',timeout:15000});
   await card.click();
   const choices=await page.locator('.color-options [data-color]').evaluateAll(xs=>xs.map(x=>x.dataset.color));
   if(JSON.stringify(choices)!==JSON.stringify(colors))throw Error(width+' '+id+' expected '+JSON.stringify(colors)+' got '+JSON.stringify(choices));
   if(COMPLETED.has(id)){
    if(await page.locator('#colorPreviewNotice').count())throw Error(width+' '+id+' received a pending preview warning');
    const color=colors.at(-1);
    await page.locator('.color-options [data-color="'+color+'"]').click();
    await page.locator('#modalVisual [data-ttc-angle="side"]').waitFor({timeout:15000});
    await page.locator('#modalVisual [data-ttc-angle="side"]').click();
    const src=await page.locator('#modalVisual img.product-photograph').getAttribute('src');
    if(!src.includes('/'+color+'/side.webp'))throw Error(width+' '+id+' side preview not functioning: '+src);
   }else{
    const refSrc=await page.locator('#modalVisual img.product-photograph').getAttribute('src');
    const chosen=colors.at(-1);
    await page.locator('.color-options [data-color="'+chosen+'"]').click();
    if(await page.locator('#modalVisual img.product-photograph').getAttribute('src')!==refSrc)throw Error(width+' '+id+' substituted an unapproved color photograph');
    if(await page.locator('.color-options [data-color="'+chosen+'"]').getAttribute('aria-pressed')!=='true')throw Error(width+' '+id+' swatch not selected');
    const notice=await page.locator('#colorPreviewNotice').innerText();
    if(!/reference|pending|quotation/i.test(notice))throw Error(width+' '+id+' missing color preview disclaimer');
    if(!(await page.locator('#selectedColor').innerText()).includes('Preferred:'))throw Error(width+' '+id+' selected color not presented as a preference');
   }
   await page.locator('#modalClose').click();
   passed++;
  }
  if(errors.length)throw Error(width+' browser errors: '+errors.join(' | '));
  console.log('COLOR_SELECTOR_VIEWPORT_SUCCESS '+width+' '+Object.keys(EXPECTED).length);
  await page.close();
 }
 console.log('COLOR_SELECTOR_CONSISTENCY_SUCCESS '+passed+' product-viewport checks');
}finally{await browser.close()}
