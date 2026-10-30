/* Privacy choices: strictly necessary account sessions; optional on-device showroom brief.
 * No advertising or analytics trackers are installed by this module. */
(()=>{
'use strict';
const KEY='ttc-privacy-choices-v1',BRIEF='loomfield-pitch-brief-v1';
function read(){try{const raw=localStorage.getItem(KEY);if(!raw)return null;const value=JSON.parse(raw);return value&&value.version===1&&typeof value.saveBrief==='boolean'?value:null}catch{return null}}
function permitted(){return read()?.saveBrief===true}
window.TTCPrivacy={read,maySaveBrief:permitted,show:open};
const style=document.createElement('style');style.id='ttc-privacy-widget-css';style.textContent=`
.ttc-cookie-panel{position:fixed;inset:auto 12px 12px;z-index:1500;max-width:730px;margin:0 auto;background:#fffefa;color:#1b3b33;border:1px solid #b9cabd;border-top:4px solid #b18458;box-shadow:0 16px 55px #102c2940;padding:clamp(16px,3vw,25px);border-radius:5px;font:14px/1.55 Arial,Helvetica,sans-serif}
.ttc-cookie-panel h2{font:26px/1.2 Georgia,serif;color:#193d32;margin:2px 0 10px;letter-spacing:-.025em}.ttc-cookie-panel p{font:13px/1.65 Arial,sans-serif;color:#465e51;margin:0 0 14px}
.ttc-cookie-panel label{display:flex;align-items:flex-start;gap:11px;font:13px/1.55 Arial,sans-serif;margin:12px 0;color:#274d3d}
.ttc-cookie-panel label input{width:20px;height:20px;min-width:20px;margin:1px 0;accent-color:#173f35}
.ttc-cookie-panel .ttc-cookie-actions{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:18px}
.ttc-cookie-panel button{border:1px solid #153e35;background:#153e35;color:#fff;font:700 13px Arial,sans-serif;min-height:44px;padding:9px 15px;cursor:pointer;border-radius:3px}
.ttc-cookie-panel button.ttc-cookie-necessary{background:transparent;color:#173f35}
.ttc-cookie-panel a{color:#205a44;text-decoration:underline;text-underline-offset:2px}
.ttc-cookie-panel .ttc-cookie-close{position:absolute;top:12px;right:12px;padding:5px 10px;min-height:30px;border:1px solid #bacbbc;background:#fff;color:#21513f}
@media(min-width:760px){.ttc-cookie-panel{left:calc(50% - 365px);right:auto;width:min(730px,calc(100% - 24px));bottom:18px}}
@media(max-width:500px){.ttc-cookie-panel{left:8px;right:8px;bottom:8px;max-height:75vh;overflow:auto;padding:17px}.ttc-cookie-panel h2{font-size:23px}}
`;document.head.append(style);
let panel=null,returnFocus=null;
function close(){if(!panel)return;panel.remove();panel=null;if(returnFocus&&returnFocus.isConnected)returnFocus.focus({preventScroll:true});returnFocus=null}
function commit(saveBrief){
 try{
  localStorage.setItem(KEY,JSON.stringify({version:1,saveBrief,at:new Date().toISOString()}));
  if(!saveBrief)localStorage.removeItem(BRIEF);
 }catch{}
 document.dispatchEvent(new CustomEvent('ttc:privacy-choice',{detail:{saveBrief}}));
 close();
}
function open(trigger){
 if(panel){panel.querySelector('input')?.focus();return}
 returnFocus=trigger instanceof HTMLElement?trigger:document.activeElement;
 panel=document.createElement('section');panel.className='ttc-cookie-panel';panel.setAttribute('role','region');panel.setAttribute('aria-label','Cookie and device storage preferences');
 const title=document.createElement('h2');title.textContent='Your privacy choices';
 const desc=document.createElement('p');desc.textContent='Necessary account-session cookies keep sign-in secure. There are no advertising or optional analytics trackers in this version. You can separately choose whether the showroom remembers your saved styles on this device.';
 const label=document.createElement('label');const toggle=document.createElement('input');toggle.type='checkbox';toggle.id='ttc-save-brief-choice';toggle.checked=permitted();const span=document.createElement('span');span.textContent='Remember selected garments and colors on this device (optional).';label.append(toggle,span);
 const detail=document.createElement('p');detail.append('Essential session storage stays on for sign-in. More details: ');const link=document.createElement('a');link.href='/cookies';link.textContent='Cookie & Storage Policy';detail.append(link,'.');
 const actions=document.createElement('div');actions.className='ttc-cookie-actions';
 const needed=document.createElement('button');needed.type='button';needed.className='ttc-cookie-necessary';needed.textContent='Necessary only';needed.addEventListener('click',()=>commit(false));
 const save=document.createElement('button');save.type='button';save.textContent='Save my choice';save.addEventListener('click',()=>commit(toggle.checked));
 actions.append(needed,save);
 const closeButton=document.createElement('button');closeButton.className='ttc-cookie-close';closeButton.type='button';closeButton.setAttribute('aria-label','Close preferences using necessary only');closeButton.textContent='×';closeButton.addEventListener('click',()=>commit(false));
 panel.append(closeButton,title,desc,label,detail,actions);document.body.append(panel);
 toggle.focus({preventScroll:true});
}
document.addEventListener('click',e=>{
 const target=e.target.closest('[data-cookie-settings]');
 if(target){e.preventDefault();open(target)}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel){e.preventDefault();commit(false)}});
function initial(){
 if(!permitted()){try{localStorage.removeItem(BRIEF)}catch{}}
 if(!read())open();
 if(location.pathname==='/cookies'&&location.hash==='#settings')open();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initial,{once:true});else initial();
})();
