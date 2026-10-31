/* Load public deployment branding and feature navigation; secrets are never sent. */
(()=>{
'use strict';
window.CLIENT_CONFIG_READY=fetch('/api/v1/config',{cache:'no-store',credentials:'same-origin'}).then(async response=>{
 if(!response.ok)throw Error('Client configuration unavailable');
 const config=await response.json();
 window.CLIENT_PUBLIC_CONFIG=config;
 const brand=config.brand;
 document.documentElement.style.setProperty('--pine',brand.primaryColor);
 document.documentElement.style.setProperty('--accent',brand.accentColor);
 document.documentElement.style.setProperty('--client-primary',brand.primaryColor);
 document.documentElement.style.setProperty('--client-accent',brand.accentColor);
 const theme=document.querySelector('meta[name="theme-color"]');if(theme)theme.content=brand.primaryColor;
 document.querySelectorAll('[data-client-brand]').forEach(element=>{
  const key=element.getAttribute('data-client-brand');
  if(key==='name')element.textContent=brand.displayName;
  if(key==='name-upper')element.textContent=brand.displayName.toUpperCase();
  if(key==='tagline')element.textContent=brand.tagline;
  if(key==='location')element.textContent=brand.location;
 });
 document.querySelectorAll('[data-client-feature]').forEach(element=>{
  const disabled=config.features[element.getAttribute('data-client-feature')]===false;
  element.hidden=disabled;
  element.style.display=disabled?'none':'';
 });
 document.title=document.title.replace(/Taytay Textile Co\./gi,brand.displayName);
 document.dispatchEvent(new CustomEvent('client-config-ready',{detail:config}));
 return config;
}).catch(error=>{document.documentElement.dataset.clientConfigError='true';console.error('Unable to load client config:',error.message);return null});
})();
