var TRUST_PAGE_HTML="\n<section class=\"trust-intro-section\">\n <div class=\"wrap\">\n  <div class=\"trust-lede-grid\">\n   <div>\n    <span class=\"eyebrow\">PHILIPPINE GARMENT IDENTITY</span>\n    <div class=\"trust-heritage-banner\">\n     <div class=\"trust-heritage-badge\"><small>TAYTAY · RIZAL</small><strong>PROUD<br>PHILIPPINE<br>MADE</strong><span>PHILIPPINES</span></div>\n     <div><h2>Rooted in the garments capital.</h2>\n      <p>The municipality recognizes Taytay's garment-making heritage. “Proud Philippine Made” is original site lettering and a Philippine-heritage statement. It is not a government seal, an awarded certification, or proof of country of origin for an individual garment.</p>\n      <a class=\"more-link\" href=\"#/taytay-hub\">Explore Taytay's garment industry ↗</a>\n     </div>\n    </div>\n   </div>\n   <div class=\"trust-principles\"><span class=\"eyebrow\">BUYER ASSURANCE</span>\n    <h3>Every claim needs evidence.</h3>\n    <p>For a registered business, factory audit, membership, chemical test or sustainable-material claim, buyers should have a way to review the issuer, applicable scope, reference number and validity.</p>\n    <p>We label research items clearly. We do not represent them as held credentials. Where a record is documented after administrator review, the website displays its reference and external verification link.</p>\n   </div>\n  </div>\n  <div class=\"trust-legend\">\n   <span><i class=\"legend-dot legend-origin\"></i><strong>Philippine heritage</strong> · Local identity</span>\n   <span><i class=\"legend-dot legend-pending\"></i><strong>Evidence required</strong> · Research only</span>\n   <span><i class=\"legend-dot legend-documented\"></i><strong>Documented</strong> · Company-reviewed proof</span>\n  </div>\n </div>\n</section>\n<section class=\"section muted-bg\"><div class=\"wrap\"><div class=\"section-head\">\n <div><span class=\"eyebrow\">DUE DILIGENCE DIRECTORY</span><h2>Credentials, with context.</h2></div>\n <p>This catalog covers possible registrations, audits and standards from our trust framework. Research entries are unverified and confer no certification.</p>\n </div>\n <div class=\"trust-filters\" id=\"trustFilters\" role=\"group\" aria-label=\"Filter badge categories\"><button type=\"button\" aria-pressed=\"true\">All categories</button></div>\n <div class=\"trust-badge-grid\" id=\"trustBadgeGrid\" aria-live=\"polite\"><p class=\"trust-loading\">Loading the credential register…</p></div>\n <p class=\"hub-caption\">Official issuer logos are intentionally omitted. Names are presented for informational and verification purposes only.</p>\n</div></section>\n<section class=\"section\"><div class=\"wrap\"><div class=\"section-head\"><div><span class=\"eyebrow\">REVIEW PROCESS</span><h2>Documentation before display.</h2></div></div>\n <div class=\"hub-trio\">\n  <article><span>01 / SUPPLY EVIDENCE</span><h3>Reference and issuer.</h3><p>Submit a registry record, product-specific certificate, membership or audit reference. The record must explain what is covered.</p></article>\n  <article><span>02 / APPROVE</span><h3>Administrative review.</h3><p>Confirm issuer, scope, expiry and usage restrictions. A company review does not replace an independent external audit.</p></article>\n  <article><span>03 / PUBLISH</span><h3>Buyer verification.</h3><p>Documented entries carry their reference and evidence link. Withdrawn or expired entries are no longer displayed as documented.</p></article>\n </div>\n</div></section>\n<section class=\"section muted-bg\"><div class=\"wrap\"><div class=\"section-head\"><div><span class=\"eyebrow\">OFFICIAL REFERENCES</span><h2>Check at the source.</h2></div></div>\n<div class=\"trust-sources\">\n<a href=\"https://negosyokonek.dti.gov.ph/\" target=\"_blank\" rel=\"noopener noreferrer\">DTI business verification <span>↗</span></a>\n<a href=\"https://trustmark.dti.gov.ph/\" target=\"_blank\" rel=\"noopener noreferrer\">DTI Philippine Trustmark <span>↗</span></a>\n<a href=\"https://wrapcompliance.org/en/certification/\" target=\"_blank\" rel=\"noopener noreferrer\">WRAP — certification and logo use <span>↗</span></a>\n<a href=\"https://www.sedex.com/what-we-do-at-sedex/\" target=\"_blank\" rel=\"noopener noreferrer\">Sedex — SMETA audit methodology <span>↗</span></a>\n<a href=\"https://www.iso.org/certification.html\" target=\"_blank\" rel=\"noopener noreferrer\">ISO — certification verification <span>↗</span></a>\n<a href=\"https://www.oeko-tex.com/en/our-standards/oeko-tex-standard-100\" target=\"_blank\" rel=\"noopener noreferrer\">OEKO-TEX — certificate check <span>↗</span></a>\n<a href=\"https://www.taytayrizal.gov.ph/\" target=\"_blank\" rel=\"noopener noreferrer\">Taytay municipality — industry heritage <span>↗</span></a>\n</div></div></section>";

var trustDirectory = [];
var trustCurrentCategory = 'all';
function trustCenter(){
 return pageHero('GLOBAL BUYER ASSURANCE','Confidence needs evidence.','A clear directory of the registrations, standards and independent audits international buyers may request — with statuses grounded in available documentation.') + TRUST_PAGE_HTML + wideCTA();
}
function trustEsc(value){
 return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]});
}
function trustMonogram(value){
 var letters=String(value).split(/[\s/&-]+/).filter(Boolean);
 return letters.slice(0,2).map(function(w){return w[0].toUpperCase()}).join('').slice(0,3);
}
function trustRender(){
 var grid=document.getElementById('trustBadgeGrid');
 if(!grid)return;
 var list=trustCurrentCategory==='all'?trustDirectory:trustDirectory.filter(function(b){return b.category===trustCurrentCategory});
 grid.innerHTML=list.map(function(b){
  var documented=b.status==='documented';
  var label=documented?'DOCUMENTED · COMPANY-REVIEWED':'EVIDENCE REQUIRED';
  var proof=documented?'<p class="trust-proof"><strong>Reference:</strong> '+trustEsc(b.certificate_ref)+(b.valid_until?' · Through '+trustEsc(String(b.valid_until).slice(0,10)):'')+'</p><a class="trust-proof-link" href="'+trustEsc(b.verification_url)+'" target="_blank" rel="noopener noreferrer">Review the supporting record ↗</a>':'<small class="trust-pending-note">No active certification, audit result or membership is claimed.</small>';
  return '<article class="trust-badge-item '+(documented?'has-proof':'needs-proof')+'">'+
   '<div class="trust-badge-top"><span class="trust-badge-monogram" aria-hidden="true">'+trustEsc(trustMonogram(b.title))+'</span>'+
   '<span class="trust-badge-state">'+trustEsc(label)+'</span></div>'+
   '<h3>'+trustEsc(b.title)+'</h3><div class="trust-issuer">'+trustEsc(b.issuer)+' · '+trustEsc(b.proof_kind)+'</div>'+
   '<p>'+trustEsc(b.description)+'</p>'+proof+
   '<a class="trust-issuer-link" href="'+trustEsc(b.source_url)+'" target="_blank" rel="noopener noreferrer">Issuer guidance ↗</a></article>';
 }).join('');
 if(!list.length)grid.innerHTML='<p class="trust-loading">No badges match this category.</p>';
}
async function loadTrustBadges(){
 var grid=document.getElementById('trustBadgeGrid'),filters=document.getElementById('trustFilters');
 if(!grid||!filters)return;
 try{
  var response=await fetch('/api/v2/trust',{cache:'no-store'});
  if(!response.ok)throw Error('Badge register unavailable');
  var data=await response.json();
  if(!Array.isArray(data.badges))throw Error('Unexpected badge register response');
  trustDirectory=data.badges;trustCurrentCategory='all';
  var categories=Array.from(new Set(trustDirectory.map(function(b){return b.category})));
  filters.innerHTML='<button type="button" class="active" data-trust-filter="all" aria-pressed="true">All categories ('+trustDirectory.length+')</button>'+
   categories.map(function(c){return '<button type="button" data-trust-filter="'+trustEsc(c)+'" aria-pressed="false">'+trustEsc(c)+'</button>'}).join('');
  filters.onclick=function(ev){
   var button=ev.target.closest('[data-trust-filter]');
   if(!button)return;
   trustCurrentCategory=button.getAttribute('data-trust-filter');
   filters.querySelectorAll('button').forEach(function(el){var active=el===button;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active))});
   trustRender();
  };
  trustRender();
 }catch(e){
  grid.innerHTML='<p class="trust-loading">The live register is temporarily unavailable. No unverified certification claims are displayed.</p>';
 }
}
