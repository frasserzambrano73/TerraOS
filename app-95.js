(()=>{
  const $=s=>document.querySelector(s);
  const panel=$('#panel'), consult=$('#consult'), search=$('#search'), project=$('#project');
  const consultTab=$('#consultTab'), searchTab=$('#searchTab'), projectTab=$('#projectTab'), headerBtn=$('#soilHeaderBtn');
  if(!panel||!consult||!search||!project) return;
  const tabs=[consultTab,searchTab,projectTab];
  function activate(name){
    const sections={consult,search,project};
    Object.entries(sections).forEach(([key,el])=>el.hidden=key!==name);
    tabs.forEach((b,i)=>{if(!b)return; const active=['consult','search','project'][i]===name;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));});
    panel.dataset.soilActivity=name;
  }
  consultTab?.addEventListener('click',()=>activate('consult'));
  searchTab?.addEventListener('click',()=>activate('search'));
  projectTab?.addEventListener('click',()=>activate('project'));
  headerBtn?.addEventListener('click',()=>{
    const visible=!panel.hidden;
    panel.hidden=visible;
    headerBtn.setAttribute('aria-expanded',String(!visible));
    headerBtn.classList.toggle('active',!visible);
    if(!visible) activate(panel.dataset.soilActivity||'consult');
  });
  activate('consult');
  window.TerraOS9_5={activateSoilActivity:activate,toggleSoilPanel:()=>headerBtn?.click()};
})();
