(() => {
  const form=document.getElementById('discovery-search');
  const input=document.getElementById('discovery-input');
  const results=document.getElementById('discovery-results');
  const intentButtons=[...document.querySelectorAll('[data-discovery-intent]')];
  if(!form||!input||!results)return;

  const pathways=[
    {key:'products',label:'Products',title:'Digital Products',description:'Explore published products from the live EMERIONA commercial catalog.',href:'#commerce'},
    {key:'services',label:'Services',title:'Digital Services',description:'Explore published services from the live EMERIONA commercial catalog.',href:'#commerce'},
    {key:'solutions',label:'Solutions',title:'Digital Solutions',description:'Connect a real need with products, services, expertise and partner capabilities.',href:'#market-solutions'},
    {key:'knowledge',label:'Knowledge',title:'Digital Knowledge',description:'Explore research, guides, insights, reports, resources and practical knowledge.',href:'#knowledge'},
    {key:'opportunities',label:'Opportunities',title:'Digital Opportunities',description:'Explore business, partnership, project, collaboration and innovation opportunity paths.',href:'#contact'},
    {key:'projects',label:'Projects',title:'Digital Projects',description:'Move from idea through discovery, assessment, design, development, launch and impact.',href:'#contact'},
    {key:'partners',label:'Partners',title:'Digital Partners',description:'Explore approved partner offerings published in the live Market catalog.',href:'#partnerships'},
    {key:'discovery',label:'Discovery',title:'EMERIONA Discovery',description:'Let the discovery engine route your need across the connected ecosystem.',href:'#discovery'}
  ];

  const normalize=value=>String(value||'').toLowerCase().trim();
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const intentFor=query=>{
    const q=normalize(query);
    if(/product|software|app|saas|tool|منتج|برنامج|تطبيق/.test(q))return'products';
    if(/service|consult|support|technology|خدمة|استشار|تقني/.test(q))return'services';
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
    solutions:{selector:'#market-solutions',filter:'solutions'},
    partners:{selector:'#market-partners',filter:'partners'},
    knowledge:{selector:'#knowledge'},
    opportunities:{selector:'#contact',subject:'Digital Opportunity'},
    projects:{selector:'#contact',subject:'Digital Project'}
  };

  const routeToWorld=key=>{
    const route=routeMap[key]; if(!route)return;
    if(route.filter)document.querySelector('.market-filter[data-market-filter="'+route.filter+'"]')?.click();
    const target=document.querySelector(route.selector); if(!target)return;
    if(route.subject){
      const subject=encodeURIComponent(route.subject);
      target.querySelector('a[href^="mailto:"]')?.setAttribute('href','mailto:emeriona.global@gmail.com?subject='+subject);
    }
    target.scrollIntoView({behavior:'smooth',block:'start'});
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
    const routes=pathways.filter(p=>p.key===key||p.key==='discovery'||(key==='partners'&&p.key==='products')).slice(0,4);
    results.innerHTML=routes.map(p=>'<article class="discovery-result"><span>'+escape(p.label)+'</span><div><strong>'+escape(p.title)+'</strong><small>'+escape(p.description)+'</small></div><a href="'+p.href+'" data-discovery-fallback="'+p.key+'">Open path →</a></article>').join('');
    results.querySelectorAll('[data-discovery-fallback]').forEach(a=>a.addEventListener('click',e=>{const key=a.dataset.discoveryFallback;if(routeMap[key]){e.preventDefault();routeToWorld(key);}}));
  };

  const searchCatalog=async query=>{
    const response=await fetch('/api/v1/market/catalog?'+new URLSearchParams({filter:'all',q:String(query||''),limit:'20'}).toString(),{headers:{accept:'application/json'}});
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
    try{catalog=await searchCatalog(q);}catch(_){catalog=[];}
    render(catalog,q);
    if(!catalog.length && ['products','services','solutions','partners'].includes(key)) routeToWorld(key);
  };

  form.addEventListener('submit',e=>{e.preventDefault();run(input.value);});
  intentButtons.forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.discoveryIntent||'discovery';input.value=key==='discovery'?'':key;run(input.value||key);}));
  document.querySelectorAll('[data-discovery-route]').forEach(button=>button.addEventListener('click',()=>routeToWorld(button.dataset.discoveryRoute)));
})();