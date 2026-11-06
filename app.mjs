import {announce,button,esc,onAction,show} from './ui.mjs';

const products=[
  {id:'hoodie',name:'Core hoodie',sku:'HD-BLK-M',variant:'Black · M',category:'Apparel',stock:5},
  {id:'tee',name:'Core tee',sku:'TS-GRY-M',variant:'Heather grey · M',category:'Apparel',stock:18},
  {id:'tote',name:'Canvas tote',sku:'TB-NAT-OS',variant:'Natural · One size',category:'Accessories',stock:14},
  {id:'cap',name:'Everyday cap',sku:'CP-NVY-OS',variant:'Navy · One size',category:'Accessories',stock:12},
];
const main=document.querySelector('main');
const nav=document.querySelector('nav');
const switcher=document.querySelector('.view-switch');
const dialog=document.querySelector('dialog');
const brand='<svg width="33" height="33" viewBox="0 0 36 36" aria-hidden="true"><path d="M18 31V19L6 9m12 10L29 8V3M6 9h8M6 9v8M29 3l-5 5m5-5 5 5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg><span><strong>branchorder</strong><small>Replenishment</small></span>';
for(const mark of document.querySelectorAll('.brand'))mark.innerHTML=brand;
const requestId='BR-1042';
const route='Central warehouse → North Store';
let state;
function reset(){
  state={stage:'draft',screen:'request',role:'Branch',item:products[0],quantity:8,due:'2026-11-06',strategy:'partial',reserved:0,query:'',category:'All products'};
  render();
}
const maxReserve=()=>Math.min(state.quantity,state.item.stock);
const proposal=()=>state.strategy==='wait'?0:maxReserve();
const allocated=()=>['reserved','transit','received'].includes(state.stage)?state.reserved:0;
const pending=()=>state.quantity-allocated();
const dateText=()=>new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(state.due+'T12:00:00Z'));
const photo=(item,cls='')=>`<img class="photo ${cls}" src="./assets/${item.id}.webp" alt="">`;
const product=(item,cls='')=>`<div class="product ${cls}">${photo(item)}<div><strong>${item.name}</strong><small>${item.sku}</small><small>${item.variant}</small></div></div>`;
const badge=value=>`<span class="badge">${value}</span>`;
const statList=pairs=>`<dl class="metrics">${pairs.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`;
const summaryLine=(label,value)=>`<div class="summary-line"><span>${label}</span><strong>${value}</strong></div>`;
const heading=(eyebrow,title,subtitle='')=>`<div class="heading"><div class="eyebrow">${eyebrow}</div><h1 tabindex="-1">${title}</h1>${subtitle?`<p>${subtitle}</p>`:''}</div>`;
const stateLabel=()=>({draft:'Draft',submitted:'Submitted',waiting:'Waiting for stock',reserved:pending()?'Partially allocated':'Allocated',transit:'In transit',received:pending()?'Partially received':'Received'})[state.stage];
function warehouse(item){
  const matching=item===state.item;
  const reserved=matching&&state.stage==='reserved'?state.reserved:0;
  const dispatched=matching&&['transit','received'].includes(state.stage)?state.reserved:0;
  return {onHand:item.stock-dispatched,reserved,free:item.stock-dispatched-reserved};
}
function draftPage(){
  const q=state.query.toLowerCase();
  const matches=products.filter(p=>(state.category==='All products'||p.category===state.category)&&`${p.name} ${p.sku} ${p.variant}`.toLowerCase().includes(q));
  return heading(badge('Draft')+' '+requestId,'New replenishment','Choose a product for North Store.')+
    `<div class="catalog-tools"><label class="search"><span class="sr-only">Search products or SKU</span><input type="search" name="query" placeholder="Search products or SKU" value="${esc(state.query)}"></label>
    <div class="categories">${['All products','Apparel','Accessories'].map(c=>button(c,'category',`data-id="${c}" aria-pressed="${state.category===c}"`)).join('')}</div></div>
    <div class="catalog">${matches.map(item=>`<article class="product-card ${item===state.item?'selected':''}">${photo(item)}
      <div class="product-copy"><h2>${item.name}</h2><small>${item.sku}</small><small>${item.variant}</small><div class="product-action">
      ${item===state.item?`<span class="selected-label">Selected</span><p>${item.stock} available at warehouse</p>`:button('＋ Select','item',`class="outline" data-id="${item.id}" aria-label="Select ${item.name}"`)}</div></div></article>`).join('')}</div>
    ${matches.length?'':`<div class="card"><h2>No matching products</h2>${button('Clear filters','clear')}</div>`}`;
}
function allocationPage(){
  const short=state.quantity>maxReserve();
  return heading(badge(stateLabel())+' '+requestId,'Allocate request','Review stock and decide how to handle the shortfall.')+
    `<p class="due">Needed by · ${dateText()}</p><div class="card allocation">${product(state.item)}
    ${statList([['Requested',state.quantity],['Available',state.item.stock],['Allocate',proposal()],['Pending',state.quantity-proposal()]])}</div>
    <div class="card breakdown"><div class="units" aria-hidden="true">${Array.from({length:state.quantity},(_,i)=>`<span class="${i<proposal()?'filled':''}"></span>`).join('')}</div><p>${proposal()} can be reserved now · ${state.quantity-proposal()} remain pending</p></div>
    ${short?`<fieldset class="shortfall"><legend>${state.quantity-maxReserve()} units are not available yet</legend>
      <p>Choose how to handle the remaining quantity.</p>
      <label><input type="radio" name="strategy" value="partial" ${state.strategy==='partial'?'checked':''}><span><strong>Reserve ${maxReserve()} now, keep ${state.quantity-maxReserve()} pending</strong><small>The request stays partially allocated.</small></span></label>
      <label><input type="radio" name="strategy" value="wait" ${state.strategy==='wait'?'checked':''}><span><strong>Wait for all ${state.quantity} units</strong><small>Keeps all ${state.quantity} open and reserves 0.</small></span></label></fieldset>`:''}`;
}
function activity(){
  const complete=['submitted','waiting','reserved','transit','received'].indexOf(state.stage);
  const events=[['Request submitted',`North Store requested ${state.quantity} units`,true],['Stock reserved',`${state.reserved} held at Central warehouse`,complete>=2],['Shipment dispatched',`${state.reserved} left Central warehouse`,complete>=3],['Shipment received',`${state.reserved} added to North Store inventory`,complete>=4]];
  return `<section class="card activity"><h2>Request activity</h2><ol>${events.map(([title,detail,done],i)=>`<li class="${done?'recorded':''}"><span class="step">${String(i+1).padStart(2,'0')}</span><div><strong>${title}</strong>${done?`<small>${detail}</small>`:''}</div></li>`).join('')}</ol></section>`;
}
function shipmentPage(){
  const titles={submitted:'Request submitted',waiting:'Waiting for stock',reserved:'Ready to dispatch',transit:state.role==='Branch'?'Receive shipment':'In transit',received:stateLabel()};
  const captions={submitted:'Warehouse will review the requested quantities.',waiting:'All requested units remain open. No stock is reserved.',reserved:`${state.reserved} units are reserved at Central warehouse.`,transit:`${state.reserved} units are on their way to North Store.`,received:`North Store received ${state.reserved} units. ${pending()?pending()+' units remain open.':'The request is complete.'}`};
  const metric={submitted:'Requested',waiting:'Reserved',reserved:'Reserved',transit:'In transit',received:'Received'}[state.stage];
  return heading(badge(stateLabel())+' '+requestId,titles[state.stage],captions[state.stage])+
    `<section class="card shipment"><h2>${allocated()?'Shipment SH-1042-01':'Requested item'}</h2>${product(state.item)}
    ${statList([[metric,state.stage==='submitted'?state.quantity:allocated()],['Pending',pending()]])}</section>${activity()}`;
}
function summary(){
  const draft=state.stage==='draft';
  const allocate=['submitted','waiting'].includes(state.stage)&&state.role==='Warehouse';
  const branch=state.role==='Branch';
  let content,action='',note='';
  if(draft){
    content=product(state.item)+`<form id="request-form"><label>Requested units<input name="quantity" type="number" min="1" max="24" required value="${state.quantity}"></label><label>Needed by<input name="due" type="date" required value="${esc(state.due)}"></label></form>`;
    if(branch){action='<button class="primary" form="request-form">Submit request</button>';note='Stock is reserved when the warehouse confirms allocation.';}
    else note='Switch to Branch to submit the request.';
  }else if(allocate){
    content=summaryLine('Requested units',state.quantity)+summaryLine('Reserve now',proposal())+summaryLine('Pending units',state.quantity-proposal())+
      `<div class="summary-section"><h3>Warehouse availability</h3>${summaryLine('Before',state.item.stock)}${summaryLine('After confirmation',state.item.stock-proposal())}</div>`;
    action=button(state.strategy==='wait'?'Keep request open':'Confirm allocation','allocate','class="primary"');
    note=state.strategy==='wait'?'No stock will be reserved.':'Confirmation reserves stock. Dispatch and receipt follow.';
  }else{
    const countLabel={submitted:'Reserved',waiting:'Reserved',reserved:'Reserved',transit:'In transit',received:'Received'}[state.stage];
    content=summaryLine('Requested units',state.quantity)+summaryLine(countLabel,allocated())+summaryLine('Pending units',pending());
    if(state.stage==='reserved'&&!branch){action=button(`Dispatch ${state.reserved} units`,'dispatch','class="primary"');note='Dispatch deducts the reserved units from warehouse stock.';}
    else if(state.stage==='transit'&&branch){action=button(`Confirm receipt of ${state.reserved}`,'receive','class="primary"');note='Confirm the units that arrived at North Store.';}
    else if(state.stage==='received'){content+=`<div class="summary-section"><h3>Receipt effect</h3>${summaryLine('North Store stock','+'+state.reserved)}${summaryLine('Units in transit',0)}</div>`;note=pending()?'The remaining units stay on this request.':'All requested units have arrived.';}
    else note=state.stage==='transit'?'Switch to Branch to confirm receipt.':'Switch to Warehouse to manage allocation or dispatch.';
  }
  return `<aside class="summary"><div class="between eyebrow"><span>${allocate?'Allocation preview':draft?'Request summary':'Transfer summary'}</span><span>${requestId}</span></div>
    <h2>North Store</h2><p>${route}</p><div class="summary-content">${content}</div><div class="summary-action">${action}<p>${note}</p></div></aside>`;
}
function otherPage(){
  if(state.screen==='inventory')return heading('Central warehouse','Inventory','Current stock for the four sample products.')+
    `<div class="inventory">${products.map(item=>{const s=warehouse(item);return `<section class="card">${product(item)}${statList([['On hand',s.onHand],['Reserved',s.reserved],['Available',s.free]])}</section>`;}).join('')}</div>`;
  if(state.screen==='locations')return heading('Workspace','Locations')+`<div class="inventory"><section class="card"><h2>Central warehouse</h2><p>Source location</p></section><section class="card"><h2>North Store</h2><p>Destination location</p></section></div>`;
  return heading('Workspace','Requests')+`<section class="card between"><div><h2>${requestId} · North Store</h2><p>${stateLabel()} · ${state.quantity} requested</p></div>${button('Open request','screen','class="outline" data-id="request"')}</section>`;
}
function render(){
  const destinations=[[state.stage==='draft'?'New request':'Current request','request'],['Requests','list'],['Inventory','inventory'],['Locations','locations']];
  nav.innerHTML=destinations.map(([label,id])=>button(label,'screen',`data-id="${id}" aria-current="${state.screen===id?'page':'false'}"`)).join('')+
    '<div class="nav-locations"><span>North Store</span><span>Central warehouse</span></div>';
  switcher.innerHTML='<span>Demo view</span><div>'+['Branch','Warehouse'].map(role=>button(role,'role',`data-id="${role}" aria-pressed="${role===state.role}"`)).join('')+'</div>';
  document.querySelector('.crumb').textContent=(state.role==='Branch'?'North Store':'Central warehouse')+' / '+(state.screen==='request'?(state.stage==='draft'?'New request':'Requests / '+requestId):destinations.find(([,id])=>id===state.screen)[0]);
  const canAllocate=['submitted','waiting'].includes(state.stage)&&state.role==='Warehouse';
  show(main,state.screen==='request'?`<div class="request-layout"><section class="request-content">${state.stage==='draft'?draftPage():canAllocate?allocationPage():shipmentPage()}</section>${summary()}</div>`:`<section class="request-content secondary-page">${otherPage()}</section>`);
}
onAction(document.body,(action,control)=>{
  const id=control.dataset.id;
  if(action==='reset'){dialog.returnValue='';dialog.showModal();return;}
  if(action==='role'){state.role=id;render();switcher.querySelector('[aria-pressed=true]').focus();return;}
  if(action==='screen'){state.screen=id;render();main.querySelector('h1').focus();return;}
  if(action==='category')state.category=id;
  if(action==='clear'){state.query='';state.category='All products';}
  if(action==='item'&&state.stage==='draft')state.item=products.find(p=>p.id===id);
  if(action==='allocate'&&state.role==='Warehouse'&&['submitted','waiting'].includes(state.stage)){
    state.reserved=proposal();state.stage=state.reserved?'reserved':'waiting';
    announce(state.reserved?`${state.reserved} units reserved`:'Waiting for stock. No units reserved.');
  }
  if(action==='dispatch'&&state.role==='Warehouse'&&state.stage==='reserved'){state.stage='transit';announce('Shipment dispatched');}
  if(action==='receive'&&state.role==='Branch'&&state.stage==='transit'){state.stage='received';announce('Receipt recorded');}
  render();
});
main.addEventListener('submit',event=>{
  event.preventDefault();
  if(event.target.id!=='request-form'||state.role!=='Branch'||state.stage!=='draft')return;
  const fields=new FormData(event.target);
  state.quantity=Number(fields.get('quantity'));state.due=fields.get('due');state.stage='submitted';
  render();main.querySelector('h1').focus();announce('Request submitted. Switch to Warehouse to allocate stock.');
});
main.addEventListener('input',({target})=>{
  if(target.name==='quantity'&&target.validity.valid)state.quantity=Number(target.value);
  if(target.name==='due'&&target.validity.valid)state.due=target.value;
  if(target.name==='query'){
    state.query=target.value;
    const position=target.selectionStart;
    render();const next=main.querySelector('[name=query]');next.focus({preventScroll:true});
    if(position!==null)next.setSelectionRange(position,position);
  }
});
main.addEventListener('change',({target})=>{
  if(target.name!=='strategy')return;
  state.strategy=target.value;render();main.querySelector('[name=strategy]:checked').focus();
});
dialog.addEventListener('close',()=>{if(dialog.returnValue==='reset'){reset();announce('Demo reset');}});
reset();
