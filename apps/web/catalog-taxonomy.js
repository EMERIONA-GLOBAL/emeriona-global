(() => {
  const productCategories = [
    ["digital-products","Digital Products","Digital products and downloadable commercial assets."],
    ["software-platforms","Software & Platforms","Software products, platforms and enterprise systems."],
    ["saas","SaaS","Subscription-based software products and cloud applications."],
    ["ai-products","AI Products","AI-powered products, assistants, agents and intelligent tools."],
    ["web-mobile-apps","Web & Mobile Applications","Web applications, mobile applications and connected digital experiences."],
    ["digital-tools","Digital Tools","Practical tools, utilities and productivity products."],
    ["knowledge-products","Knowledge Products","Courses, guides, reports and structured digital knowledge products."],
    ["digital-assets","Digital Assets","Templates, media, design assets and other digital resources."],
    ["enterprise-products","Business & Enterprise Products","Products designed for organizational and enterprise use."],
    ["integrated-solutions","Integrated Digital Products","Composable products designed to connect with wider digital ecosystems."]
  ];
  const serviceCategories = [
    ["technology","Technology Services","Technology delivery, engineering and technical enablement services."],
    ["digital-transformation","Digital Transformation","Assessment, strategy and execution for digital transformation."],
    ["ai-automation","AI & Automation","AI, intelligent workflows, automation and agent-enabled services."],
    ["business-strategy","Business & Strategy","Business strategy, operating models and growth-oriented advisory."],
    ["consulting","Consulting & Advisory","Specialized consulting and professional advisory services."],
    ["creative-digital","Creative & Digital Services","Design, content, brand and digital creative services."],
    ["integration-implementation","Integration & Implementation","Implementation, integration, migration and deployment services."],
    ["research-innovation","Research & Innovation","Research, experimentation, R&D and innovation support services."],
    ["professional-services","Professional Services","Structured professional services delivered through defined engagements."],
    ["partner-enabled","Partner-Enabled Services","Services delivered or extended through verified ecosystem partners."]
  ];
  const escape = value => String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]||c));
  const injectStyle = () => {
    if(document.getElementById("catalog-taxonomy-style")) return;
    const style=document.createElement("style"); style.id="catalog-taxonomy-style";
    style.textContent=".catalog-taxonomy{margin-top:1rem}.catalog-taxonomy-head{display:flex;justify-content:space-between;gap:1rem;align-items:end;margin-bottom:1rem}.catalog-taxonomy-head span{display:block;font-size:.72rem;letter-spacing:.14em;opacity:.65}.catalog-taxonomy-head strong{display:block;margin-top:.35rem;font-size:1.15rem}.catalog-taxonomy-head small{max-width:34rem;opacity:.62;line-height:1.5}.catalog-taxonomy-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.7rem}.catalog-category{display:block;padding:1rem;border:1px solid rgba(212,175,55,.16);border-radius:14px;background:rgba(255,255,255,.018);text-decoration:none}.catalog-category:hover{border-color:rgba(212,175,55,.4);transform:translateY(-1px)}.catalog-category b{display:block}.catalog-category span{display:block;margin-top:.3rem;font-size:.82rem;line-height:1.45;opacity:.62}.catalog-category em{display:block;margin-top:.65rem;font-size:.7rem;font-style:normal;letter-spacing:.08em;text-transform:uppercase;opacity:.45}@media(max-width:700px){.catalog-taxonomy-head{display:block}.catalog-taxonomy-head small{display:block;margin-top:.6rem}.catalog-taxonomy-grid{grid-template-columns:1fr}}";
    document.head.appendChild(style);
  };
  const render=(selector,title,items,kind)=>{
    const panel=document.querySelector(selector); if(!panel || panel.dataset.taxonomyReady==="true") return;
    panel.dataset.taxonomyReady="true"; injectStyle();
    const host=document.createElement("div"); host.className="catalog-taxonomy";
    host.innerHTML='<div class="catalog-taxonomy-head"><div><span>'+escape(kind)+' CATEGORIES</span><strong>'+escape(title)+'</strong></div><small>Category architecture is active now. Real '+kind.toLowerCase()+' entities will appear only when published from governed data.</small></div><div class="catalog-taxonomy-grid">'+items.map(([slug,name,desc])=>'<a class="catalog-category" href="#market-catalog" data-taxonomy-filter="'+escape(slug)+'"><b>'+escape(name)+'</b><span>'+escape(desc)+'</span><em>Ready for live inventory</em></a>').join("")+'</div>';
    panel.appendChild(host);
    host.querySelectorAll("[data-taxonomy-filter]").forEach(link=>link.addEventListener("click",()=>{document.querySelector('[data-market-filter="'+(kind==="PRODUCT"?"products":"services")+'"]')?.click();}));
  };
  const load=(selector,title,kind)=>fetch("/api/v1/catalog/categories?kind="+encodeURIComponent(kind),{headers:{accept:"application/json"}}).then(r=>r.ok?r.json():Promise.reject(new Error("Category request failed"))).then(payload=>{const categories=(payload?.data?.categories||[]).map(item=>[item.slug,item.name,item.description||""]);render(selector,title,categories,kind);}).catch(()=>render(selector,title,[],kind));
  load("#market-products","Explore the Product World","PRODUCT");
  load("#market-services","Explore the Service World","SERVICE");
})();
