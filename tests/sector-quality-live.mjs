import {chromium} from 'playwright';
import fs from 'node:fs';
const base='https://taytaygarments.arjayb-fb.workers.dev/';
// Cloudflare's native build often completes after GitHub Actions begins; verify the release marker before browser assertions.
let liveReady=false;
for(let attempt=0;attempt<48;attempt++){
 try {const r=await fetch(base,{cache:'no-store'});if(r.ok&&(await r.text()).includes('headless-school-v3')){liveReady=true;break}}catch{}
 await new Promise(resolve=>setTimeout(resolve,5000));
}
if(!liveReady)throw Error('Cloudflare has not deployed the headless sector assets to production.');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
fs.mkdirSync('artifacts/sector-quality',{recursive:true});
const results=[];
try {
 for(const [width,height,columns] of [[390,844,1],[800,900,2],[1024,768,2],[1440,900,4]]) {
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:40000});
  await page.locator('.sector-card img').first().waitFor({state:'attached',timeout:20000});
  await page.locator('.sector-card img').first().scrollIntoViewIfNeeded();
  const cards=page.locator('.sector-card');if(await cards.count()<4)throw Error('Missing sector cards');
  await page.evaluate(async()=>{await Promise.all([...document.querySelectorAll('.sector-card img')].slice(0,4).map(async img=>{img.loading='eager';await img.decode()}))});
  const images=await cards.locator('img').evaluateAll(imgs=>imgs.slice(0,4).map(img=>({naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,src:img.currentSrc,complete:img.complete})));
  for(const [index,img] of images.entries()){
   if(img.naturalWidth<850||img.naturalHeight<1050)throw Error('Blurry/undersized sector image '+index+' '+JSON.stringify(img));
   if(!img.src.includes('res.cloudinary.com/boay3ffi/image/upload/'))throw Error('Sector photo is not served by project CDN');
   if(!img.src.includes('/headless-')||!img.src.includes('-v3.jpg'))throw Error('Live sector image is not headless v3 asset: '+img.src);
  }
  const rects=await cards.evaluateAll(els=>els.slice(0,4).map(el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}}));
  const distinctRows=new Set(rects.map(r=>Math.round(r.y/10)*10)).size;
  if(distinctRows!==4/columns)throw Error(width+'px expected '+columns+' columns; rows:'+distinctRows+' '+JSON.stringify(rects));
  const scrollWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
  if(scrollWidth>width+2)throw Error('Horizontal scroll overflow '+width+':'+scrollWidth);
  const fonts=await cards.first().evaluate(e=>({title:parseFloat(getComputedStyle(e.querySelector('h3')).fontSize),desc:parseFloat(getComputedStyle(e.querySelector('p')).fontSize)}));
  if(fonts.desc<13||fonts.title<23)throw Error('Sector card fonts too small '+JSON.stringify(fonts));
  if(errors.length)throw Error('Browser JS errors at '+width+': '+errors.join(' | '));
  await page.screenshot({path:'artifacts/sector-quality/industries-'+width+'.png'});
  results.push({width,expectedColumns:columns,images:images.length,sourceWidth:images[0].naturalWidth,captionSize:fonts.desc,scrollWidth});
  await page.close();
 }
 console.log('SECTOR_PHOTO_QA_SUCCESS '+JSON.stringify(results));
}finally {await browser.close()}
