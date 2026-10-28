/* Customer-facing account experience; uses the existing server-managed, role-scoped session. */
(()=>{
'use strict';
const $=sel=>document.querySelector(sel);
let account=null,orders=[];
function feedback(message,isError=false){const box=$('#feedback');box.hidden=false;box.textContent=message;box.dataset.error=String(isError);box.scrollIntoView({block:'nearest',behavior:'smooth'})}
function clearFeedback(){$('#feedback').hidden=true}
async function api(path,method='GET',payload){
 const headers={};
 if(payload!==undefined)headers['content-type']='application/json';
 if(account&&method!=='GET')headers['x-csrf-token']=account.csrf;
 const result=await fetch(path,{method,credentials:'same-origin',cache:'no-store',headers,body:payload===undefined?undefined:JSON.stringify(payload)});
 const data=await result.json().catch(()=>({error:'Could not read server response.'}));
 if(!result.ok)throw new Error(data.error||'The request could not be completed.');
 return data;
}
function node(tag,klass,text){const el=document.createElement(tag);if(klass)el.className=klass;if(text!==undefined)el.textContent=String(text);return el}
const human=status=>String(status||'').replaceAll('_',' ');
function showSignedOut(){account=null;orders=[];$('#signedIn').hidden=true;$('#signedOut').hidden=false}
function showSignedIn(){if(account?.role!=='customer'){location.replace('/portal.html');return false}$('#signedIn').hidden=false;$('#signedOut').hidden=true;$('#customerName').textContent=account.name;$('#customerAccount').textContent=account.email;return true}
async function loadOrders(){
 const data=await api('/api/v2/orders');orders=Array.isArray(data.orders)?data.orders:[];
 const active=orders.filter(o=>!['delivered','cancelled'].includes(o.status)).length;
 const delivered=orders.filter(o=>o.status==='delivered').length;
 const host=$('#customerMetrics');host.replaceChildren();
 for(const [label,value,detail] of [['TOTAL ORDERS',orders.length,'Account records'],['IN PROGRESS',active,'Current projects'],['DELIVERED',delivered,'Completed status']]){
  const tile=node('div','metric');tile.append(node('small','',label),node('strong','',value),node('span','',detail));host.append(tile);
 }
 const container=$('#customerOrders');container.replaceChildren();
 if(orders.length===0){
  const empty=node('div','empty');empty.append(node('h4','','No orders linked to this account yet.'),node('p','','Orders appear here once our team links a project to your customer account.'));
  const a=node('a','','Explore uniforms');a.href='/#/showroom';empty.append(a);container.append(empty);return;
 }
 for(const order of orders){
  const card=node('article','order'),head=node('div','order-head'),intro=node('div');
  intro.append(node('span','order-ref',order.order_no),node('h4','',order.description),node('p','order-description','Quantity: '+order.quantity+' garments'));
  if(order.demo)intro.append(node('span','demo','SAMPLE ORDER — NOT ACTUAL PRODUCTION'));
  head.append(intro,node('span','order-status',human(order.status)));
  const meta=node('div','order-meta');
  meta.append(node('span','','Updated: '+(order.created_at?new Date(order.created_at).toLocaleDateString():'not recorded')));
  if(order.delivery_target)meta.append(node('span','','Target: '+String(order.delivery_target).slice(0,10)));
  const btn=node('button','timeline-toggle','View order timeline');btn.type='button';btn.setAttribute('aria-expanded','false');btn.dataset.order=order.order_no;
  const timeline=node('div','timeline');timeline.hidden=true;timeline.dataset.timeline=order.order_no;
  card.append(head,meta,btn,timeline);container.append(card);
 }
}
async function init(){
 let data;
 try{data=await api('/api/v2/auth/me')}
 catch(err){showSignedOut();if(!String(err.message).includes('Sign in required'))feedback(err.message,true);return}
 account=data.user;
 if(!showSignedIn())return;
 try{await loadOrders()}catch(err){feedback('Your account is signed in, but orders could not be loaded: '+err.message,true)}
}
$('#customerLogin').addEventListener('submit',async event=>{
 event.preventDefault();clearFeedback();const form=event.currentTarget,btn=$('#loginSubmit');btn.disabled=true;
 const values=Object.fromEntries(new FormData(form).entries());
 try{
  const data=await api('/api/v2/auth/login','POST',{email:values.email,password:values.password});
  account=data.user;
  form.reset();
  if(!showSignedIn())return;
  await loadOrders();feedback('You are signed in to your customer account.');
 }catch(err){feedback(err.message,true)}finally{btn.disabled=false}
});
$('#customerOrders').addEventListener('click',async event=>{
 const button=event.target.closest('[data-order]');if(!button)return;
 const target=Array.from(document.querySelectorAll('[data-timeline]')).find(x=>x.dataset.timeline===button.dataset.order);
 if(!target)return;
 if(!target.hidden){target.hidden=true;button.setAttribute('aria-expanded','false');button.textContent='View order timeline';return}
 button.disabled=true;
 try{
  const data=await api('/api/v2/orders/'+encodeURIComponent(button.dataset.order)+'/events');
  target.replaceChildren();
  const heading=node('h4','','Recorded milestones'),list=node('ol');
  if(!data.events.length){target.append(heading,node('p','','No milestone updates have been recorded yet.'))}
  else{
   for(const ev of data.events){
    const item=node('li');item.append(node('strong','',human(ev.status)),node('time','',ev.created_at?new Date(ev.created_at).toLocaleString():'Date unavailable'),node('p','',ev.note||'Status updated.'));
    list.append(item);
   }
   target.append(heading,list);
  }
  target.hidden=false;button.setAttribute('aria-expanded','true');button.textContent='Hide order timeline';
 }catch(err){feedback(err.message,true)}finally{button.disabled=false}
});
$('#reloadOrders').addEventListener('click',async()=>{try{await loadOrders();feedback('Order information refreshed.')}catch(err){feedback(err.message,true)}});
$('#signOut').addEventListener('click',async()=>{
 try{await api('/api/v2/auth/logout','POST',{})}catch{}
 showSignedOut();clearFeedback();$('#customerEmail').focus();
});
$('#customerPasswordForm').addEventListener('submit',async event=>{
 event.preventDefault();const btn=event.currentTarget.querySelector('[type=submit]');btn.disabled=true;
 try{
  const values=Object.fromEntries(new FormData(event.currentTarget).entries());
  await api('/api/v2/auth/password','POST',{current:values.current,next:values.next});
  event.currentTarget.reset();showSignedOut();feedback('Password updated. Sign in again with your new password.');
 }catch(err){feedback(err.message,true)}finally{btn.disabled=false}
});
init();
})();
