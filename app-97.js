/* TerraOS 9.7 · UX orchestration. Preserves existing functional IDs and events. */
(()=>{
  const $=s=>document.querySelector(s);
  const moduleMap={
    '/consultoria.html':'Nuestros servicios',
    '/arca.html':'Tienda ARCA',
    '/proyecto.html':'Gestione su proyecto',
    '/territorio.html':'Nuestro territorio',
    '/administracion.html':'Administración',
    '/formulario-unico.html':'Formulario Único Nacional',
    '/proyecto-licencia.html':'Proyecto de licencia'
  };
  const path=location.pathname.replace(/\\/g,'/');
  const key=Object.keys(moduleMap).find(k=>path.endsWith(k));
  document.body.dataset.terraVersion='11.0';
  document.body.dataset.module=key?key.slice(1,-5):'gestion-suelo';

  // Correct global navigation state: the soil workspace, not a marketing module, is active on index.
  if(!key){
    document.querySelectorAll('.primaryNav a,.moduleNav a').forEach(a=>a.classList.remove('active'));
    $('#soilHeaderBtn')?.classList.add('active');
    $('#soilHeaderBtn')?.setAttribute('aria-current','page');
  }

  // Make the current module explicit without adding another navigation system.
  const header=document.querySelector('.moduleHeader');
  if(header && key && !header.querySelector('.moduleContext')){
    const context=document.createElement('span');
    context.className='moduleContext';
    context.innerHTML='<span>TerraOS</span><strong>· '+moduleMap[key]+'</strong>';
    header.insertBefore(context,header.querySelector('.moduleNav'));
  }

  // Keep version badges synchronized without touching functional controls.
  document.querySelectorAll('.brand b').forEach(el=>el.textContent='9.7');
  document.title=document.title.replace(/9\.6|9\.5\.1|9\.5/g,'9.7');

  // Map tools are grouped visually while preserving every original button ID and listener.
  const tools=$('.mapTools');
  if(tools && !tools.querySelector('.mapToolGroup')){
    const groups=[
      ['map',['baseMenuButton','decisionMenuButton']],
      ['tools',['identifyButton','fitSelection','selectionActions']],
      ['view',['colorsButton','imageryButton','igacButton','fullMap']]
    ];
    const byId=new Map([...tools.children].map(el=>[el.id,el]));
    groups.forEach(([name,ids])=>{
      const wrap=document.createElement('div');
      wrap.className='mapToolGroup'; wrap.dataset.group=name;
      ids.forEach(id=>{const el=byId.get(id);if(el)wrap.appendChild(el)});
      if(wrap.children.length)tools.appendChild(wrap);
    });
  }

  // Improve labels/accessible names without changing semantics.
  const labels={
    baseMenuButton:'Elegir mapa base',decisionMenuButton:'Abrir capas de decisión',
    identifyButton:'Identificar elementos territoriales',colorsButton:'Cambiar simbología',
    fitSelection:'Centrar selección',selectionActions:'Acciones sobre selección',
    imageryButton:'Abrir imágenes',igacButton:'Consultar IGAC',fullMap:'Ver mapa en pantalla completa'
  };
  Object.entries(labels).forEach(([id,label])=>{
    const el=$('#'+id); if(el){el.setAttribute('aria-label',label);el.title=label}
  });

  // Professional forms get a consistent document context and return path.
  document.querySelectorAll('a.back,a.backMap').forEach(a=>{
    if(a.textContent.includes('9.3'))a.textContent=a.textContent.replace('9.3','9.7');
  });
})();
