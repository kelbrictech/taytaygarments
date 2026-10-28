/* Taytay Textile Co. quality management preparation interface.
   These records support ISO 9001:2026 preparation; never show a certification badge. */
(()=>{
'use strict';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=x=>String(x||'').replaceAll('_',' ');
const fmtDate=x=>x?new Date(x).toLocaleDateString():'—';
const status=x=>'<span class="tag '+(['open','draft','in_review','fail'].includes(x)?'warn':'')+'">'+esc(label(x))+'</span>';
const kinds={
 document:['policy','scope','procedure','work_instruction','form','register'],
 issue:['risk','opportunity','nonconformity','customer_complaint','corrective_action'],
 record:['requirements_review','supplier_evaluation','incoming_inspection','in_process_inspection','final_inspection','competence','internal_audit','management_review','customer_feedback','change_control','quality_objective','climate_context_review']
};
const options=(arr,selected)=>arr.map(x=>'<option value="'+esc(x)+'" '+(x===selected?'selected':'')+'>'+esc(label(x))+'</option>').join('');
const counts=(items,fn)=>items.filter(fn).length;
const card=(title,sub,body)=>'<section class="panel dash-panel qms-panel"><header class="section-head"><div><h3>'+esc(title)+'</h3><p class="small">'+esc(sub)+'</p></div></header>'+body+'</section>';
const row=(...cells)=>'<tr>'+cells.map(x=>'<td>'+x+'</td>').join('')+'</tr>';
const table=(headers,rows)=>'<div class="tablewrap"><table class="datatable"><thead><tr>'+headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table></div>';
function render(data,user){
 const documents=data.documents||[],issues=data.issues||[],records=data.records||[],admin=user.role==='admin';
 const last=records.slice(0,25);
 const stats='<div class="qms-stats">'+[
  ['CONTROLLED DOCUMENTS',documents.length,counts(documents,x=>x.status==='approved')+' approved'],
  ['OPEN RISKS / ACTIONS',counts(issues,x=>x.status!=='closed'),counts(issues,x=>x.status==='verification')+' pending effectiveness review'],
  ['QUALITY RECORDS',records.length,counts(records,x=>x.kind==='final_inspection'&&x.result==='pass')+' inspection passes recorded']
 ].map(x=>'<div class="qms-stat"><small>'+esc(x[0])+'</small><strong>'+esc(x[1])+'</strong><span>'+esc(x[2])+'</span></div>').join('')+'</div>';
 const docRows=documents.map(d=>row(
  '<strong>'+esc(d.code)+'</strong><span class="muted">'+esc(d.kind)+'</span>',
  '<strong>'+esc(d.title)+'</strong>'+(d.demo?'<small class="qms-demo">DEMO DRAFT / EXAMPLE</small>':''),
  'v'+esc(d.version),status(d.status),esc(d.owner||'Unassigned'),
  '<details class="qms-detail"><summary>Open record</summary><p class="small">Version '+esc(d.version)+' · '+esc(d.kind)+' · '+esc(fmtDate(d.updated_at))+'</p>'+
  '<p class="qms-body">'+esc(d.body)+'</p>'+
  (['draft','in_review'].includes(d.status)?'<form class="qms-form qms-revision" data-qms-type="revision" data-code="'+esc(d.code)+'"><input type="hidden" name="version" value="'+esc(d.version)+'"><label>Title<input name="title" required minlength="5" maxlength="160" value="'+esc(d.title)+'"></label><label>Controlled content<textarea name="body" rows="5" minlength="20" maxlength="12000" required>'+esc(d.body)+'</textarea></label><label>Revision reason<input name="reason" minlength="10" maxlength="300" required></label><button class="outline" type="submit">Save new draft revision</button></form>':'<p class="small">Approved records are immutable. Create a new document code for a revised issue.</p>')+
  '<div class="qms-actions">'+
  (d.status==='draft'?'<button type="button" data-qms-action="submit" data-code="'+esc(d.code)+'">Submit for review</button>':'')+
  (admin&&d.status==='in_review'?'<button type="button" data-qms-action="approve" data-code="'+esc(d.code)+'" '+(d.owner_id===user.id?'disabled title="A separate author/reviewer is required"':'')+'>Approve controlled document</button>':'')+
  (admin&&d.status==='approved'?'<button type="button" data-qms-action="obsolete" data-code="'+esc(d.code)+'">Mark obsolete</button>':'')+
  '<button type="button" data-qms-action="history" data-code="'+esc(d.code)+'">Revision history</button></div><div class="qms-history" data-qms-history="'+esc(d.code)+'" hidden></div></details>'
 ));
 const docForm='<details class="qms-create"><summary>Create a controlled document</summary><form class="qms-form" data-qms-type="document"><label>Document code<input name="code" required pattern="QMS-[A-Z0-9-]{3,55}" placeholder="QMS-WI-004"></label><label>Title<input name="title" required minlength="5" maxlength="160"></label><label>Document type<select name="kind">'+options(kinds.document)+'</select></label><label>Document contents<textarea name="body" rows="5" required minlength="20" maxlength="12000"></textarea></label><button type="submit" class="primary">Create draft document</button></form></details>';
 const issueRows=issues.map(i=>row(
  '<strong>'+esc(i.reference)+'</strong>'+(i.demo?'<small class="qms-demo">FICTIONAL</small>':''),
  esc(label(i.kind)),esc(i.title),status(i.status),esc(i.severity),
  '<details class="qms-detail"><summary>Review issue</summary><p>'+esc(i.description)+'</p>'+
  (i.order_no?'<p class="small">Linked order: '+esc(i.order_no)+'</p>':'')+
  (i.root_cause?'<p><b>Cause:</b> '+esc(i.root_cause)+'</p>':'')+
  (i.action_plan?'<p><b>Action:</b> '+esc(i.action_plan)+'</p>':'')+
  (i.effectiveness_check?'<p><b>Effectiveness:</b> '+esc(i.effectiveness_check)+'</p>':'')+
  (i.status!=='closed'?'<form class="qms-form" data-qms-type="issue-status" data-reference="'+esc(i.reference)+'"><label>Next stage<select name="status">'+options(i.status==='open'?['in_progress']:i.status==='in_progress'?['verification']:admin?['closed']:[],null)+'</select></label><label>Progress note<textarea name="note" rows="2" minlength="12" maxlength="350" required></textarea></label><label>Root cause (required for closure)<textarea name="rootCause" rows="2" maxlength="1200">'+esc(i.root_cause||'')+'</textarea></label><label>Action taken (required for closure)<textarea name="actionPlan" rows="2" maxlength="1200">'+esc(i.action_plan||'')+'</textarea></label><label>Effectiveness verification (required for closure)<textarea name="effectivenessCheck" rows="2" maxlength="1200"></textarea></label><button class="outline" type="submit">Advance controlled issue</button></form>':'<p class="small">Closed with documented effectiveness check.</p>')+
  '</details>'
 ));
 const issueForm='<details class="qms-create"><summary>Log a risk, opportunity, complaint or nonconformity</summary><form class="qms-form" data-qms-type="issue"><label>Type<select name="kind">'+options(kinds.issue)+'</select></label><label>Title<input name="title" minlength="5" maxlength="160" required></label><label>Severity<select name="severity">'+options(['low','medium','high'],'medium')+'</select></label><label>Order reference (optional)<input name="orderNo" placeholder="TTC-2026-…" maxlength="65"></label><label>Incident, risk or opportunity description<textarea name="description" rows="4" required minlength="15" maxlength="2400"></textarea></label><button class="primary" type="submit">Create tracked record</button></form></details>';
 const recRows=last.map(r=>row('<strong>'+esc(r.reference)+'</strong>'+(r.demo?'<small class="qms-demo">DEMO</small>':''),esc(label(r.kind)),status(r.result),esc(r.title),esc(r.order_no||r.supplier_code||'—'),esc(fmtDate(r.created_at)), '<details class="qms-detail"><summary>Evidence</summary><p>'+esc(r.details)+'</p><p class="small">Source: '+esc(r.evidence_ref||'Not supplied')+' · '+esc(r.actor||'Unknown')+'</p></details>'));
 const recForm='<details class="qms-create"><summary>Record an inspection, audit, training or other quality event</summary><form class="qms-form" data-qms-type="record"><label>Record type<select name="kind">'+options(admin?kinds.record:kinds.record.filter(x=>!['internal_audit','management_review'].includes(x)))+'</select></label><label>Title<input name="title" minlength="5" maxlength="160" required></label><label>Result<select name="result">'+options(['follow_up','pass','fail','not_applicable'],'follow_up')+'</select></label><label>Order number (required for final inspection)<input name="orderNo" maxlength="65" placeholder="TTC-2026-…"></label><label>Supplier code (when applicable)<input name="supplierCode" maxlength="65"></label><label>Specification or evidence reference (required for final inspection)<input name="evidenceRef" maxlength="160" placeholder="SPEC-001 / approved sample reference"></label><label>Observed evidence, dimensions, acceptance criteria or follow-up details<textarea name="details" rows="4" required minlength="20" maxlength="3500"></textarea></label><p class="small">Quality records are append-only. Demo-account records are marked fictional and cannot serve as evidence for real production.</p><button class="primary" type="submit">Record quality evidence</button></form></details>';
 const info='<div class="qms-notice"><strong>ISO 9001:2026 — implementation preparation</strong><p>Current status: <b>no independent certification verified</b>. Drafts and fictional demo records do not establish ISO conformity. Only an authorized owner can approve documented processes; traceable final inspection must precede order release.</p><p>Quality policy, QMS scope, physical processes, customer requirements, employee competence, production controls, supplier evaluation, internal audits and management reviews must be implemented and evidenced in the real organization.</p><a href="/#/quality">Buyer-facing quality information ↗</a></div>';
 return '<div class="qms-workspace">'+info+stats+
  card('Controlled information','Versioned policies, procedures and work instructions. A separate administrator approves submitted documents.',
  documents.length?table(['CODE','DOCUMENT','REV','STATUS','OWNER','CONTROL'],docRows):'<p class="empty">No controlled documents.</p>')+docForm)+
  card('Risks, opportunities and corrective actions','Track risk and opportunity separately, record containment, root cause and independent effectiveness checks.',
  issues.length?table(['REFERENCE','TYPE','TITLE','STATUS','RISK','ACTION'],issueRows):'<p class="empty">No issue records.</p>')+issueForm)+
  card('Recorded quality evidence','Immutable operational records. A passing final inspection tied to an order is required before dispatch.',
  last.length?table(['REFERENCE','TYPE','RESULT','DESCRIPTION','LINK','DATE','DETAIL'],recRows):'<p class="empty">No quality records.</p>')+recForm)+'</div>';
}
async function submit(form,data,call){
 const type=form.dataset.qmsType;
 if(type==='document')return call('/api/v2/qms/documents','POST',{code:data.code,title:data.title,kind:data.kind,body:data.body});
 if(type==='revision')return call('/api/v2/qms/documents/'+encodeURIComponent(form.dataset.code),'PATCH',{version:Number(data.version),title:data.title,body:data.body,reason:data.reason});
 if(type==='issue')return call('/api/v2/qms/issues','POST',{kind:data.kind,title:data.title,description:data.description,severity:data.severity,orderNo:data.orderNo});
 if(type==='issue-status')return call('/api/v2/qms/issues/'+encodeURIComponent(form.dataset.reference)+'/status','PATCH',{status:data.status,note:data.note,rootCause:data.rootCause,actionPlan:data.actionPlan,effectivenessCheck:data.effectivenessCheck});
 if(type==='record')return call('/api/v2/qms/records','POST',{kind:data.kind,title:data.title,details:data.details,result:data.result,orderNo:data.orderNo,supplierCode:data.supplierCode,evidenceRef:data.evidenceRef});
 throw Error('Unknown quality operation');
}
async function act(button,call){
 const action=button.dataset.qmsAction,code=button.dataset.code;
 if(action==='history'){
  const parent=document.querySelector('[data-qms-history="'+CSS.escape(code)+'"]');
  if(!parent)return;
  const data=await call('/api/v2/qms/documents/'+encodeURIComponent(code));
  parent.hidden=false;parent.innerHTML='<h4>Controlled revision history</h4>'+data.history.map(h=>'<div class="qms-history-entry"><strong>v'+esc(h.version)+' · '+esc(h.status)+'</strong> · '+esc(fmtDate(h.created_at))+' · '+esc(h.actor||'System')+'<p>'+esc(h.reason)+'</p><details><summary>View archived content</summary><p>'+esc(h.body)+'</p></details></div>').join('');
  return 'Revision history loaded.';
 }
 if(!['submit','approve','obsolete'].includes(action))throw Error('Unknown QMS action');
 const reason=prompt('Enter a documented reason for '+action+' (at least 12 characters):');
 if(reason===null)return '';
 if(reason.trim().length<12)throw Error('A review reason of at least 12 characters is required.');
 await call('/api/v2/qms/documents/'+encodeURIComponent(code)+'/'+action,'PATCH',{reason:reason.trim()});
 return 'Controlled document '+action+' recorded.';
}
window.TTCQMS={render,submit,act};
})();
