import {chromium} from 'playwright';
import fs from 'node:fs';
const origin='https://taytaygarments.arjayb-fb.workers.dev';
fs.mkdirSync('artifacts/customer-access',{recursive:true});
// Account for Cloudflare's GitHub-linked deployment after a repository push.
let ready=false;
for(let n=0;n<40;n++){
 try{
  const [home,login]=await Promise.all([fetch(origin+'/',{cache:'no-store'}),fetch(origin+'/customer',{cache:'no-store'})]);
  if(home.ok&&login.ok&&(await home.text()).includes('showroom-customer-entry')&&(await login.text()).includes('id="customerLogin"')){ready=true;break}
 }catch{}
 await new Promise(r=>setTimeout(r,4000));
}
if(!ready)throw Error('Customer page and showroom customer entry are not both deployed');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [390,1024,1440]){
  const page=await browser.newPage({viewport:{width,height:880},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.goto(origin+'/#/showroom',{waitUntil:'domcontentloaded',timeout:40000});
  const entry=page.locator('.showroom-customer-entry');
  await entry.waitFor({state:'visible',timeout:20000});
  await page.waitForFunction(()=>document.documentElement.dataset.ttcCatalogSynced==='true',{timeout:35000});
  if(!(await entry.innerText()).includes('Follow your garment order'))throw Error('Customer entry missing at '+width);
  const link=entry.locator('a[href="/customer"]');
  await Promise.all([page.waitForURL(url=>url.pathname==='/customer',{waitUntil:'domcontentloaded',timeout:35000}),link.click()]);
  await page.locator('#customerLogin').waitFor({state:'visible',timeout:20000});
  if(!(await page.locator('#signedIn').isHidden()))throw Error('Customer private dashboard displayed before authentication');
  if(await page.locator('#staffForm').count())throw Error('Staff sign-up should not appear inside customer sign-in');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth);
  if(overflow>width+2)throw Error('Customer login overflows at '+width+'px: '+overflow);
  if(errors.length)throw Error('Browser errors '+width+': '+errors.join(' | '));
  await page.screenshot({path:'artifacts/customer-access/customer-login-'+width+'.png'});
  console.log('CUSTOMER_NAV_AND_LOGIN_PASS width='+width);
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:390,height:850}});
 const demoOrders=[{order_no:'TTC-2026-DEMO01',description:'Sample campus uniform batch',quantity:60,status:'production',demo:true,created_at:'2026-10-25T10:00:00Z'}];
 await page.route('**/api/v2/auth/me',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({user:{id:'demo',name:'Demo Customer',email:'customer.demo@example.invalid',role:'customer',demo:true,csrf:'test'}})}));
 await page.route('**/api/v2/orders',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({orders:demoOrders})}));
 await page.route('**/api/v2/orders/*/events',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({order:demoOrders[0],events:[{status:'received',note:'Sample order registered',created_at:'2026-10-25T10:00:00Z'},{status:'production',note:'Sample production milestone',created_at:'2026-10-26T10:00:00Z'}]})}));
 await page.goto(origin+'/customer',{waitUntil:'domcontentloaded',timeout:40000});
 await page.locator('#customerOrders .order').first().waitFor({timeout:25000});
 if(!(await page.locator('#signedOut').isHidden()))throw Error('Sign-in form visible after successful customer session');
 if(!(await page.locator('.order').innerText()).includes('SAMPLE ORDER'))throw Error('Demo marker not visible');
 await page.locator('.timeline-toggle').click();
 await page.locator('.timeline li').first().waitFor({timeout:15000});
 if(await page.locator('.timeline li').count()!==2)throw Error('Customer milestone timeline did not render');
 await page.screenshot({path:'artifacts/customer-access/customer-dashboard-390.png'});
 console.log('CUSTOMER_ORDER_AND_TIMELINE_PASS');
 await page.close();
 const staff=await browser.newPage();
 await staff.route('**/api/v2/auth/me',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({user:{id:'staff',name:'Staff Demo',email:'staff.demo@example.invalid',role:'staff',demo:true,csrf:'test'}})}));
 await staff.goto(origin+'/customer',{waitUntil:'domcontentloaded',timeout:40000});
 await staff.waitForURL(/\/portal$/, {timeout:20000});
 console.log('STAFF_ROLE_REDIRECT_PASS');
 await staff.close();
 const guest=await fetch(origin+'/api/v2/orders',{cache:'no-store'});
 if(guest.status!==401)throw Error('Anonymous order API must return HTTP 401; found '+guest.status);
 console.log('CUSTOMER_ORDER_AUTH_GATE_PASS HTTP_401');
}finally{await browser.close()}
