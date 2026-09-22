(() => {
  const form=document.getElementById('discovery-search');
  const input=document.getElementById('discovery-input');
  const results=document.getElementById('discovery-results');
  const intentButtons=[...document.querySelectorAll('[data-discovery-intent]')];
  if(!form||!input||!results)return;

  const pathways=[
    {key:'products',label:'Products',title:'Digital Products',description:'Explore software, platforms, applications, SaaS, AI products and digital assets.',href:'#commerce'},
    {key:'services',label:'Services',title:'Digital Services',description:'Find technology, business, creative, AI, integration and digital capability pathways.',href:'#contact'},
    {key:'solutions',label:'Solutions',title:'Digital Solutions',description:'Connect a real need with combinations of products, services, expertise and partner capabilities.',href:'#market-solutions'},
    {key:'knowledge',label:'Knowledge',title:'Digital Knowledge',description:'Explore research, guides, insights, reports, resources and practical knowledge.',href:'#knowledge'},
    {key:'opportunities',label:'Opportunities',title:'Digital Opportunities',description:'Explore business, partnership, project, collaboration and innovation opportunity paths.',href:'#contact'},
    {key:'projects',label:'Projects',title:'Digital Projects',description:'Move from idea through discovery, assessment, design, development, launch and impact.',href:'#contact'},
    {key:'partners',label:'Partners',title:'Digital Partners',description:'Build technology, product, service, solution, AI, research and distribution partnerships.',href:'#partnerships'},
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
  const render=(items,message)=>{
    const routes=items.length?items:pathways.filter(p=>p.key==='discovery'||p.key===intentFor(message)).concat(pathways.filter(p=>p.key!=='discovery'&&p.key!==intentFor(message)).slice(0,3));
    results.innerHTML=routes.slice(0,5).map(p=>'<article class="discovery-result"><span>'+escape(p.label)+'</span><div><strong>'+escape(p.title)+'</strong><small>'+escape(p.description)+'</small></div><a href="'+p.href+'">Open path →</a></article>').join('');
  };
  const searchCatalog=async query=>{
    const tenant=document.querySelector('meta[name="emeriona-market-tenant"]')?.getAttribute('content')?.trim()||window.EMERIONA_MARKET_TENANT_ID||'';
    if(!tenant)return[];
    const response=await fetch('/api/v1/market/catalog?'+new URLSearchParams({filter:'all',q:query,limit:'20'}).toString(),{headers:{'x-tenant-id':tenant,accept:'application/json'}});
    if(!response.ok)return[];
    const payload=await response.json();
    const catalog=Array.isArray(payload?.data?.items)?payload.data.items:[];
    return catalog.map(item=>({key:'market',label:item.type||'Market',title:item.name||'Market offering',description:'Published and commercially eligible in EMERIONA MARKET CENTER.',href:'#commercial-journey'}));
  };
  const run=async query=>{
    const q=String(query||'').trim();
    intentButtons.forEach(b=>b.classList.toggle('active',b.dataset.discoveryIntent===intentFor(q)));
    results.innerHTML='<div class="discovery-loading">Connecting discovery pathways…</div>';
    let catalog=[];
    try{catalog=await searchCatalog(q);}catch(_){catalog=[];}
    render(catalog,q);
    document.getElementById('discovery-engine')?.scrollIntoView({behavior:'smooth',block:'nearest'});
  };
  form.addEventListener('submit',e=>{e.preventDefault();run(input.value);});
  intentButtons.forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.discoveryIntent||'discovery';input.value=key==='discovery'?'':key;run(input.value||key);}));
})();