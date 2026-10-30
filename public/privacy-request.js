(()=>{'use strict';
const form=document.querySelector('#privacy-form'),btn=document.querySelector('#privacy-submit'),box=document.querySelector('#request-status');
let ready=false,key='',widget=null,token='';
const notice=(text,error=false)=>{box.hidden=false;box.textContent=text;box.dataset.error=String(error);box.style.borderLeft='4px solid '+(error?'#ba6445':'#528662')};
async function init(){
 btn.disabled=true;
 try{
  const r=await fetch('/api/health',{cache:'no-store'}),h=await r.json();if(!r.ok||!h.privacyRequestAvailable)throw Error('The request service is not yet configured.');
  if(h.turnstileSiteKey){
   if(!window.turnstile)await new Promise((resolve,reject)=>{const x=document.createElement('script');x.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';x.async=true;x.onload=resolve;x.onerror=()=>reject(Error('Security verification unavailable'));document.head.append(x)});
   widget=window.turnstile.render('#rights-turnstile',{sitekey:h.turnstileSiteKey,callback:x=>token=x,'expired-callback':()=>token=''});
  }
  ready=true;btn.disabled=false;
 }catch(e){notice('Privacy request intake is temporarily unavailable. '+e.message,true)}
}
form.addEventListener('submit',async e=>{
 e.preventDefault();if(!ready||!form.reportValidity())return;
 const values=Object.fromEntries(new FormData(form).entries());
 if(!document.querySelector('#request-ack').checked){notice('Please acknowledge the Privacy Notice.',true);return}
 if(!key)key=crypto.randomUUID();btn.disabled=true;box.hidden=true;
 try{
  const r=await fetch('/api/v1/privacy/requests',{method:'POST',cache:'no-store',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({email:values.email,type:values.type,details:values.details||'',website:values.website||'',acknowledged:true,noticeVersion:'2026-10-30',idempotencyKey:key,turnstileToken:token})});
  const data=await r.json();if(!r.ok)throw Error(data.error||'Request could not be submitted');
  notice('Recorded: '+data.reference+'\nStatus: '+data.status+'. Save your reference. Identity and retention checks must be completed before data is disclosed or erased.');
  form.reset();key='';
 }catch(e){notice('Not submitted: '+e.message+'. Your entries remain for retry.',true)}
 finally{btn.disabled=!ready;token='';if(widget!==null&&window.turnstile){try{window.turnstile.reset(widget)}catch{}}}
});
init();
})();