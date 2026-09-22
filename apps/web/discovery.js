(() => {
  if(!document.getElementById('solution-composer-style')){const style=document.createElement('style');style.id='solution-composer-style';style.textContent='.solution-composer{margin-top:1.25rem;padding:1.25rem;border:1px solid rgba(212,175,55,.22);border-radius:18px;background:rgba(255,255,255,.025)}.solution-composer-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.65rem;margin-top:1rem}.solution-composer-item{display:flex;gap:.7rem;align-items:flex-start;padding:.8rem;border:1px solid rgba(255,255,255,.09);border-radius:12px;cursor:pointer}.solution-composer-item input{margin-top:.25rem}.solution-composer-item strong{display:block}.solution-composer-item small{display:block;margin-top:.2rem;opacity:.65}.solution-composer-actions{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-top:1rem}.solution-composer-actions span{opacity:.65;font-size:.85rem}@media(max-width:700px){.solution-composer-list{grid-template-columns:1fr}.solution-composer-actions{flex-direction:column;align-items:flex-start}}';document.head.appendChild(style);}\n  const form=document.getElementById('discovery-search');
  const input=document.getElementById('discovery-input');
  const results=document.getElementById('discovery-results');
  const intentButtons=[...document.querySelectorAll('[data-discovery-intent]')];
  if(!form||!input||!results)return;

  const pathways=[
    {key:'products',label:'Products',title:'Digital Products',description:'Explore published products from the live EMERIONA commercial catalog.',href:'#commerce'},
    {key:'services',label:'Services',title:'Digital Services',description:'Explore published services from the live EMERIONA commercial catalog.',href:'#commerce'},
    {key:'offers',label:'Partner & Market Offers',title:'Live Offers',description:'Explore active offers that are genuinely published and commercially eligible.',href:'#commerce'},
    {key:'solutions',label:'Solutions',title:'Digital Solutions',description:'Connect a real need with live products, services, expertise and partner capabilities.',href:'#market-solutions'},
    {key:'knowledge',label:'Knowledge',title:'Digital Knowledge',description:'Explore research, guides, insights, reports, resources and practical knowledge.',href:'#knowledge'},
    {key:'opportunities',label:'Opportunities',title:'Digital Opportunities',description:'Explore business, partnership, project, collaboration and innovation opportunity paths.',href:'#contact'},
    {key:'projects',label:'Projects',title:'Digital Projects',description:'Move from idea through discovery, assessment, design, development, launch and impact.',href:'#contact'},
    {key:'partners',label:'Partners',title:'Digital Partners',description:'Explore verified partner products, services and active offerings published in the live Market catalog.',href:'#partnerships'},
    {key:'discovery',label:'Discovery',title:'EMERIONA Discovery',description:'Let the discovery engine route your need across the connected ecosystem.',href:'#discovery'}
  ];

  const normalize=value=>String(value||'').toLowerCase().trim();
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const intentFor=query=>{
    const q=normalize(query);
    if(/product|software|app|saas|tool|منتج|برنامج|تطبيق/.test(q))return'products';
    if(/service|consult|support|technology|خدمة|استشار|تقني/.test(q))return'services';
    if(/offer|deal|discount|bundle|عرض|عروض|خصم|باقة/.test(q))return'offers';
    if(/solution|solve|problem|حل|مشكلة/.test(q))return'solutions';
    if(/knowledge|research|guide|report|learn|معرف|بحث|دليل|تقرير|تعلم/.test(q))return'knowledge';
    if(/opportunit|career|collab|فرص|فرصة|تعاون/.test(q))return'opportunities';
    if(/project|build|develop|مشروع|بناء|تطوير/.test(q))return'projects';
    if(/partner|partnership|شريك|شراكة/.test(q))return'partners';
    return'discovery';
  };

  const routeMap={
    products:{selector:'#commerce',filter:'products'},
    services:{selector:'#commerce',filter:'services'},
    offers:{selector:'#commerce',filter:'offers'},
    solutions:{selector:'#market-solutions'},
    partners:{selector:'#market-partners',filter:'partners'},
    knowledge:{selector:'#knowledge'},
    opportunities:{selector:'#contact',subject:'Digital Opportunity'},
    projects:{selector:'#contact',subject:'Digital Project'}
  };

  const activateSolutionExperience=async target=>{
    if(!target||target.dataset.solutionExperience==='ready')return;
    target.dataset.solutionExperience='ready';
    const host=document.createElement('div');
    host.className='solution-composer';
    host.innerHTML='<div class="discovery-bridge-head"><span>SOLUTION COMPOSER</span><strong>Build from real capabilities.</strong><small>Select live products, services or partner offerings when they exist. Nothing is invented; your selection becomes a structured solution inquiry.</small></div><div class="solution-composer-results"><div class="discovery-loading">Loading live Market capabilities…</div></div>';
    target.appendChild(host);
    const resultsHost=host.querySelector('.solution-composer-results');
    try{
      const response=await fetch('/api/v1/market/catalog?'+new URLSearchParams({filter:'all',limit:'100'}).toString(),{headers:{accept:'application/json'}});
      if(!response.ok)throw new Error('Live Market capabilities are unavailable');
      const payload=await response.json();
      const items=Array.isArray(payload?.data?.items)?payload.data.items:[];
      if(!items.length){resultsHost.innerHTML='<div class="discovery-empty"><strong>No live capabilities are published yet.</strong><span>The solution path is ready. Published products, services and partner offerings will become selectable automatically when real commercial entities are added.</span></div>';return;}
      resultsHost.innerHTML='<div class="solution-composer-list">'+items.slice(0,24).map(item=>'<label class="solution-composer-item"><input type="checkbox" value="'+escape(item.id)+'"><span><strong>'+escape(item.name||'Market capability')+'</strong><small>'+escape(item.type||'offering')+' · '+escape(item.partner||'EMERIONA GLOBAL')+' · '+escape(item.status||'PUBLISHED')+'</small></span></label>').join('')+'</div><div class="solution-composer-actions"><button type="button" class="discovery-result-action" data-solution-submit>Start solution inquiry →</button><span data-solution-count>0 capabilities selected</span></div>';
      const checks=[...resultsHost.querySelectorAll('input[type="checkbox"]')],count=resultsHost.querySelector('[data-solution-count]');
      const sync=()=>{const n=checks.filter(c=>c.checked).length;if(count)count.textContent=n+' '+(n===1?'capability':'capabilities')+' selected';};
      checks.forEach(c=>c.addEventListener('change',sync));
      resultsHost.querySelector('[data-solution-submit]')?.addEventListener('click',()=>{
        const selected=checks.filter(c=>c.checked).map(c=>items.find(item=>String(item.id)===c.value)).filter(Boolean);
        if(!selected.length){count.textContent='Select at least one live capability first.';return;}
        const summary=selected.map(item=>item.name+' ['+item.type+']').join(', ');
        const href='mailto:emeriona.global@gmail.com?subject='+encodeURIComponent('Digital Solution Inquiry')+'&body='+encodeURIComponent('I would like to explore a solution built from these live EMERIONA capabilities:\\n\\n'+summary+'\\n\\nPlease help assess the appropriate combination, scope and next steps.');
        window.location.href=href;
      });
    }catch(error){resultsHost.innerHTML='<div class="discovery-empty"><strong>Solution composition is ready.</strong><span>'+escape(error instanceof Error?error.message:'Live Market capabilities are unavailable')+'. You can still submit a solution inquiry through the connection path.</span></div>';}
  };

  const routeToWorld=key=>{
    const route=routeMap[key]; if(!route)return;
    if(route.filter)document.querySelector('.market-filter[data-market-filter="'+route.filter+'"]')?.click();
    const target=document.querySelector(route.selector); if(!target)return;
    if(route.subject){
      const subject=encodeURIComponent(route.subject);
      target.querySelector('a[href^="mailto:"]')?.setAttribute('href','mailto:emeriona.global@gmail.com?subject='+subject);
    }
    if(key==='solutions')activateSolutionExperience(target);\n    target.scrollIntoView({behavior:'smooth',block:'start'});
    if(history.replaceState)history.replaceState(null,'',route.selector);
  };

  const openMarketItem=item=>{
    if(!item?.id)return;
    window.dispatchEvent(new CustomEvent('emeriona:market-item',{detail:item}));
    document.getElementById('commerce')?.scrollIntoView({behavior:'smooth',block:'start'});
  };

  const render=(items,message)=>{
    if(items.length){
      results.innerHTML=items.slice(0,8).map(item=>{
        const type=escape(item.type||'offering');
        const name=escape(item.name||'Market offering');
        const partner=escape(item.partner||'EMERIONA GLOBAL');
        return '<article class="discovery-result"><span>'+type+'</span><div><strong>'+name+'</strong><small>Live catalog entity · '+partner+' · '+escape(item.status||'PUBLISHED')+'</small></div><button type="button" class="discovery-result-action" data-market-result-id="'+escape(item.id)+'">Open in Market →</button></article>';
      }).join('');
      results.querySelectorAll('[data-market-result-id]').forEach(button=>button.addEventListener('click',()=>openMarketItem(items.find(item=>String(item.id)===button.dataset.marketResultId))));
      return;
    }
    const key=intentFor(message);
    const routes=pathways.filter(p=>p.key===key||p.key==='discovery'||(key==='partners'&&p.key==='offers')).slice(0,4);
    results.innerHTML=routes.map(p=>'<article class="discovery-result"><span>'+escape(p.label)+'</span><div><strong>'+escape(p.title)+'</strong><small>'+escape(p.description)+'</small></div><a href="'+p.href+'" data-discovery-fallback="'+p.key+'">Open path →</a></article>').join('');
    results.querySelectorAll('[data-discovery-fallback]').forEach(a=>a.addEventListener('click',e=>{const key=a.dataset.discoveryFallback;if(routeMap[key]){e.preventDefault();routeToWorld(key);}}));
  };

  const searchCatalog=async(query,intent)=>{
    const filter=intent==='products'||intent==='services'||intent==='offers'||intent==='partners'?intent==='partners'?'partners':intent:'all';
    const params={filter,q:String(query||''),limit:'20'};
    const response=await fetch('/api/v1/market/catalog?'+new URLSearchParams(params).toString(),{headers:{accept:'application/json'}});
    if(!response.ok)throw new Error('Market catalog request failed');
    const payload=await response.json();
    return Array.isArray(payload?.data?.items)?payload.data.items:[];
  };

  const run=async query=>{
    const q=String(query||'').trim();
    const key=intentFor(q);
    intentButtons.forEach(b=>b.classList.toggle('active',b.dataset.discoveryIntent===key));
    results.innerHTML='<div class="discovery-loading">Searching live Market entities and connected ecosystem pathways…</div>';
    let catalog=[];
    if(key!=='solutions'&&key!=='knowledge'&&key!=='opportunities'&&key!=='projects'&&key!=='discovery'){
      try{catalog=await searchCatalog(q,key);}catch(_){catalog=[];}
    }else if(key==='discovery'&&q){
      try{catalog=await searchCatalog(q,key);}catch(_){catalog=[];}
    }
    render(catalog,q);
    if(!catalog.length&&['products','services','offers','solutions','partners'].includes(key))routeToWorld(key);
  };

  form.addEventListener('submit',e=>{e.preventDefault();run(input.value);});
  intentButtons.forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.discoveryIntent||'discovery';input.value=key==='discovery'?'':key;run(input.value||key);}));
  document.querySelectorAll('[data-discovery-route]').forEach(button=>button.addEventListener('click',()=>routeToWorld(button.dataset.discoveryRoute)));
})();