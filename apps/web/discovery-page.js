(() => {
  const form=document.getElementById('discovery-search');
  const input=document.getElementById('discovery-input');
  const results=document.getElementById('discovery-results');
  const categoryButtons=[...document.querySelectorAll('[data-discovery-category]')];
  const categoryLabels={all:'All',products:'Products',services:'Services',solutions:'Solutions',projects:'Projects',opportunities:'Opportunities',knowledge:'Knowledge'};
  let category='all';

  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const routeFor=key=>({
    products:'./index.html#commerce',
    services:'./index.html#commerce',
    solutions:'./index.html#market-solutions',
    projects:'./index.html#contact',
    opportunities:'./index.html#contact',
    knowledge:'./index.html#knowledge'
  })[key]||'./index.html#top';

  const intentFor=query=>{
    const q=String(query||'').toLowerCase();
    if(/product|software|app|saas|tool|منتج|برنامج|تطبيق/.test(q))return'products';
    if(/service|consult|support|technology|خدمة|استشار|تقني/.test(q))return'services';
    if(/solution|solve|problem|حل|مشكلة/.test(q))return'solutions';
    if(/project|build|develop|مشروع|بناء|تطوير/.test(q))return'projects';
    if(/opportunit|career|collab|فرص|فرصة|تعاون/.test(q))return'opportunities';
    if(/knowledge|research|guide|report|learn|معرف|بحث|دليل|تقرير|تعلم/.test(q))return'knowledge';
    return'';
  };

  const setCategory=key=>{
    category=key;
    categoryButtons.forEach(b=>{
      const active=b.dataset.discoveryCategory===key;
      b.classList.toggle('active',active);
      b.setAttribute('aria-selected',String(active));
    });
    if(key!=='all'){
      input.placeholder='Search '+categoryLabels[key]+'...';
      input.value='';
    }else{
      input.placeholder='What are you looking for?';
    }
  };

  const renderPaths=message=>{
    const key=category!=='all'?category:intentFor(message);
    const keys=key?[key]:['products','services','solutions','projects','opportunities','knowledge'];
    results.innerHTML=keys.map(k=>'<article class="gateway-result"><span>'+escape(categoryLabels[k])+'</span><div><strong>'+escape(categoryLabels[k])+'</strong><small>Continue through the EMERIONA GLOBAL ecosystem. Live commercial inventory is shown only when genuinely available.</small></div><a href="'+routeFor(k)+'">Open path →</a></article>').join('');
  };

  const renderCatalog=items=>{
    if(!items.length){renderPaths(input.value.trim());return;}
    results.innerHTML=items.slice(0,8).map(item=>{
      const type=escape(item.type||'offering'),name=escape(item.name||'Market offering'),partner=escape(item.partner||'EMERIONA GLOBAL');
      return '<article class="gateway-result"><span>'+type+'</span><div><strong>'+name+'</strong><small>Live catalog entity · '+partner+' · '+escape(item.status||'PUBLISHED')+'</small></div><a href="./index.html#commerce">Open in Market →</a></article>';
    }).join('');
  };

  const searchCatalog=async()=>{
    const q=input.value.trim();
    results.innerHTML='<div class="gateway-loading">Searching live Market entities and connected ecosystem pathways…</div>';
    try{
      const params=new URLSearchParams({filter:category,q,limit:'20'});
      const response=await fetch('/api/v1/market/catalog?'+params.toString(),{headers:{accept:'application/json'}});
      if(!response.ok)throw new Error('catalog');
      const payload=await response.json();
      renderCatalog(Array.isArray(payload?.data?.items)?payload.data.items:[]);
    }catch(_){renderPaths(q);}
  };

  categoryButtons.forEach(button=>button.addEventListener('click',()=>{setCategory(button.dataset.discoveryCategory||'all');searchCatalog();}));
  form?.addEventListener('submit',event=>{event.preventDefault();searchCatalog();});
  document.querySelectorAll('.ecosystem-path-card').forEach(card=>card.addEventListener('click',()=>{ /* native link remains the source of truth */ }));
  setCategory('all');
})();