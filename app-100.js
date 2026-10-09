/* TerraOS 10.0 · interaction architecture
   Goal: territory → municipality → activity → map → decision.
   This layer intentionally overrides only presentation/orchestration and keeps the 9.x spatial engine. */
(()=>{
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  document.body.dataset.terraVersion='11.0';
  $$('.brand b').forEach(x=>x.textContent='11.0');
  document.title=document.title.replace(/(?:9\.[0-9.]+|10\.[0-9.]+)/g,'11.0');

  function current(){return window.TerraOS?.current||null}
  function ruleRail(){
    if($('.contextRail'))return; const header=$('header,.moduleHeader'); if(!header)return;
    const file=(location.pathname.replace(/\\/g,'/').split('/').pop()||'index.html');
    const names={
      'index.html':['Gestión del suelo','Mapa + reglas','Decisión territorial'],
      'consultoria.html':['Nuestros servicios','Asesoría profesional','Ruta de gestión'],
      'arca.html':['Tienda ARCA','Catálogo territorial','Producto'],
      'proyecto.html':['Gestione su proyecto','Expediente + formularios','Proyecto preparado'],
      'territorio.html':['Nuestro territorio','Conocimiento + mapa','Descubrimiento territorial'],
      'administracion.html':['Administración','Recepción + control','Información gobernada'],
      'formulario-unico.html':['Formulario Único','Formulario de trabajo','Borrador organizado'],
      'proyecto-licencia.html':['Proyecto de licencia','Documento editable','Borrador para revisión']
    };
    const m=names[file]||names['index.html'];
    const muni=$('[data-municipality-name]')?.textContent?.trim()||'Municipio';
    const rail=document.createElement('div');rail.className='contextRail';
    rail.innerHTML=`<span>Territorio</span><i>›</i><strong>${esc(muni)}</strong><i>›</i><span>Módulo</span><i>›</i><strong>${esc(m[0])}</strong><i>›</i><span>Instrumento</span><i>›</i><strong>${esc(m[1])}</strong><i>›</i><span>Decisión</span><i>›</i><strong class="decision">${esc(m[2])}</strong>`;
    header.insertAdjacentElement('afterend',rail);
  }
  function notify(t){const n=$('#notice');if(n)n.textContent=t}

  // Remove the old four-card explanatory strip. V10 explains itself through progressive states.
  $$('.moduleGuide98').forEach(x=>x.closest('.moduleIntro98')?.remove());

  // Module pages: content first, contextual map second. Embedded map stays a clean visual context.
  function reorderModule(){
    const map=$('.moduleMap'); if(!map)return;
    if(document.body.classList.contains('consultPage')){
      const hero=$('.consultHero'); hero?.insertAdjacentElement('afterend',map);
    }else{
      const hero=$('.moduleMain .hero'); hero?.insertAdjacentElement('afterend',map);
    }
    map.classList.add('moduleMapV10');
  }

  function setupEmbeddedMap(){
    if(!document.body.classList.contains('terraEmbed'))return;
    $$('.mapTools,.mapLegend,#imageryInfo,#igacStatus,#baseWarning,.mapBottom').forEach(x=>x.hidden=true);
    const top=$('.mapTop'); if(top){top.classList.add('embedTop'); const btn=$('#extent'); if(btn)btn.textContent='Ver territorio';}
    const wrap=$('.mapWrap');
    if(wrap&&!$('.embedMapNote')){
      const note=document.createElement('div'); note.className='embedMapNote';
      note.innerHTML='<strong>Contexto territorial</strong><span>Use Gestión del suelo para consultar y decidir.</span>';
      wrap.append(note);
    }
  }

  // Progressive map dock: no permanent bar covering the map.
  function buildMapDock(){
    const old=$('.mapTools'), wrap=$('.mapWrap'); if(!old||!wrap||$('.mapFlowDock'))return;
    const ids={context:['baseMenuButton','decisionMenuButton'],analysis:['identifyButton'],selection:['fitSelection','selectionActions'],view:['colorsButton','imageryButton','igacButton','fullMap']};
    const buttons={}; Object.values(ids).flat().forEach(id=>{const b=$('#'+id);if(b)buttons[id]=b});
    const dock=document.createElement('div'); dock.className='mapFlowDock';
    dock.innerHTML=`
      <button class="dockToggle" type="button" aria-expanded="true"><span>☰</span><b>Mapa</b></button>
      <div class="dockSteps">
        <details class="dockStep" open><summary><i>1</i><span>Contexto<small>Fondo y capas</small></span></summary><div class="dockActions" data-slot="context"></div></details>
        <details class="dockStep"><summary><i>2</i><span>Analizar<small>Consultar atributos</small></span></summary><div class="dockActions" data-slot="analysis"></div></details>
        <details class="dockStep selectionDock" hidden><summary><i>3</i><span>Selección<small>Actuar sobre el área</small></span></summary><div class="dockActions" data-slot="selection"></div></details>
        <details class="dockStep"><summary><i>+</i><span>Vista<small>Opciones</small></span></summary><div class="dockActions" data-slot="view"></div></details>
      </div>`;
    wrap.append(dock);
    Object.entries(ids).forEach(([slot,list])=>list.forEach(id=>{if(buttons[id])dock.querySelector(`[data-slot="${slot}"]`).append(buttons[id])}));
    old.remove();
    const toggle=$('.dockToggle',dock), steps=$('.dockSteps',dock);
    toggle.onclick=()=>{const collapsed=dock.classList.toggle('collapsed');toggle.setAttribute('aria-expanded',String(!collapsed));steps.hidden=collapsed};
    // Staircase: opening one step closes its siblings.
    $$('.dockStep',dock).forEach(d=>d.addEventListener('toggle',()=>{if(d.open)$$('.dockStep',dock).forEach(o=>{if(o!==d)o.open=false})}));
  }

  const groups={
    parcel:{label:'Predio',desc:'Identificación, área y predios intersectados.',layers:['predios']},
    pot:{label:'POT',desc:'Reglamentación, clasificación y usos del suelo.',layers:['pot_reglamentacion','clasificacion_suelo']},
    determinants:{label:'Determinantes',desc:'Río, ronda hídrica y condicionantes supramunicipales.',layers:['det_rio','det_ronda_30m']},
    risk:{label:'Gestión del riesgo',desc:'Movimientos en masa, inundación y avenidas torrenciales.',layers:['gr_movimientos_masa','gr_inundaciones','gr_avenidas_torrenciales']},
    context:{label:'Contexto',desc:'Límite y lectura territorial general.',layers:['limite_municipal']}
  };
  const layerNames={predios:'Predio',pot_reglamentacion:'POT',clasificacion_suelo:'Clasificación',det_rio:'Río',det_ronda_30m:'Ronda hídrica',gr_movimientos_masa:'Movimientos en masa',gr_inundaciones:'Inundación',gr_avenidas_torrenciales:'Avenida torrencial',limite_municipal:'Contexto municipal'};
  let editing=false, originalGeometry=null;

  function makeWizard(){
    const consult=$('#consult'); if(!consult||$('#analysisWizard'))return;
    // replace the old explanatory blocks/lens; keep original form controls
    $$('.workspacePromise,.analysisLens').forEach(x=>x.remove());
    const tools=$('#consult .tools');
    const wizard=document.createElement('section'); wizard.id='analysisWizard'; wizard.className='analysisWizard';
    wizard.innerHTML=`
      <div class="wizardHead"><span>LECTURA DEL POLÍGONO</span><strong id="wizardTitle">Primero seleccione un lugar</strong><small id="wizardSub">Busque un predio, haga clic en el mapa o dibuje un área.</small></div>
      <div class="wizardSteps">
        <div class="wStep active" data-step="1"><b>1</b><span>Seleccionar<small>Predio o polígono</small></span></div>
        <div class="wStep" data-step="2"><b>2</b><span>Valorar<small>Atributos</small></span></div>
        <div class="wStep" data-step="3"><b>3</b><span>Decidir<small>Resultado</small></span></div>
      </div>
      <div class="attributeStage" hidden>
        <p>¿Qué quiere valorar en esta geometría?</p>
        <div class="attributeGrid">${Object.entries(groups).map(([k,g])=>`<label class="attributeChoice"><input type="checkbox" data-v10-group="${k}" ${k==='context'?'':'checked'}><span><b>${g.label}</b><small>${g.desc}</small><em data-count="${k}">—</em></span></label>`).join('')}</div>
        <div class="geometryActions"><button type="button" id="v10Edit">Editar vértices</button><button type="button" id="v10Apply" class="primary">Ver decisión</button></div>
      </div>
      <div id="v10Decision" class="v10Decision" hidden></div>`;
    tools?.insertAdjacentElement('afterend',wizard);
    $$('[data-v10-group]',wizard).forEach(c=>c.onchange=renderDecision);
    $('#v10Apply').onclick=()=>{renderDecision(true);setStep(3)};
    installEdit();
  }

  function setStep(n){
    $$('.wStep').forEach(x=>x.classList.toggle('active',Number(x.dataset.step)<=n));
    if(n>=2){$('.attributeStage').hidden=false;$('.selectionDock')?.removeAttribute('hidden');}
    const title=$('#wizardTitle'), sub=$('#wizardSub');
    if(n===1){title.textContent='Primero seleccione un lugar';sub.textContent='Busque un predio, haga clic en el mapa o dibuje un área.'}
    if(n===2){title.textContent='Geometría lista: elija qué desea valorar';sub.textContent='Puede editar vértices antes de obtener la decisión.'}
    if(n===3){title.textContent='Decisión territorial explicada';sub.textContent='La lectura se actualiza con los atributos activos.'}
  }

  function counts(){
    const hits=current()?.hits||[]; const out={};
    Object.entries(groups).forEach(([k,g])=>out[k]=hits.filter(h=>g.layers.includes(h.layer)).length);
    return out;
  }
  function refreshCounts(){
    const c=counts(); Object.entries(c).forEach(([k,n])=>{const el=$(`[data-count="${k}"]`);if(el)el.textContent=n?`${n} coincidencia${n===1?'':'s'}`:'Sin coincidencias'});
  }
  function bestValue(h){
    const p=h.feature?.properties||{}; const keys=['uso_principal','uso_suelo','clase_suelo','condicionamiento','condicion_licencia','categoria','amenaza','nivel_amenaza','nombre','id_zona','id_elemento','id_predio'];
    for(const k of keys)if(p[k]!=null&&String(p[k]).trim())return String(p[k]); return 'Intersección registrada';
  }
  function renderDecision(force=false){
    const r=current(), box=$('#v10Decision'); if(!r||!box)return;
    const active=$$('[data-v10-group]:checked').map(x=>x.dataset.v10Group);
    const layers=new Set(active.flatMap(k=>groups[k].layers));
    const facts=[]; const seen=new Set();
    for(const h of r.hits||[]){if(!layers.has(h.layer))continue;const val=bestValue(h),key=h.layer+'|'+val;if(seen.has(key))continue;seen.add(key);facts.push({name:layerNames[h.layer]||h.layer,val,area:h.length?`${Number(h.length).toLocaleString('es-CO',{maximumFractionDigits:1})} m`:`${Number(h.area||0).toLocaleString('es-CO',{maximumFractionDigits:1})} m²`});if(facts.length===8)break;}
    box.hidden=false; box.innerHTML=`<div class="decisionTop"><span>RESULTADO · MODELO DE PRUEBA</span><strong>${esc(r.status||'Lectura territorial')}</strong></div><div class="decisionMetrics"><article><b>${Number(r.area||0).toLocaleString('es-CO',{maximumFractionDigits:1})}</b><small>m² analizados</small></article><article><b>${(r.hits||[]).filter(h=>h.layer==='predios').length}</b><small>predios intersectados</small></article><article><b>${active.length}</b><small>dimensiones activas</small></article></div><div class="decisionFacts">${facts.length?facts.map(f=>`<article><span>${esc(f.name)}</span><strong>${esc(f.val)}</strong><small>${esc(f.area)}</small></article>`).join(''):'<article><span>Sin coincidencias</span><strong>No hay atributos con la selección actual.</strong><small>Active otra dimensión.</small></article>'}</div><p>Esta salida demuestra el flujo de TerraOS. Para una decisión formal deben incorporarse y validarse las fuentes oficiales del municipio.</p>`;
    if(force)box.scrollIntoView({behavior:'smooth',block:'nearest'});
  }

  function installEdit(){
    const legacy=$('#edit'); if(legacy){
      // Cloning removes both the original inline property listener and the 9.8 hotfix listener.
      const clean=legacy.cloneNode(true); legacy.replaceWith(clean); clean.onclick=startOrSaveEdit;
    }
    const b=$('#v10Edit'); if(b)b.onclick=startOrSaveEdit;
  }
  function editableGeometry(){
    const T=window.TerraOS, group=T?.selectionGroup; if(!group)return false;
    const fc=group.toGeoJSON(); if(!(fc.features||[]).length)return false;
    group.clearLayers();
    L.geoJSON(fc,{style:{color:'#1473e6',weight:4,fillColor:'#65a6ef',fillOpacity:.13}}).eachLayer(l=>{group.addLayer(l);l.editing?.enable?.()});
    return group.getLayers().some(l=>l.editing?.enabled?.());
  }
  function geometryFromSelection(){
    const fc=window.TerraOS?.selectionGroup?.toGeoJSON(); if(!fc)return null; const ps=[];
    for(const f of fc.features||[]){const g=f.geometry;if(g?.type==='Polygon')ps.push(g.coordinates);else if(g?.type==='MultiPolygon')ps.push(...g.coordinates)}
    return ps.length?{type:'MultiPolygon',coordinates:ps}:null;
  }
  async function startOrSaveEdit(){
    const T=window.TerraOS, r=current(); if(!T||!r)return notify('Seleccione o dibuje un polígono antes de editar.');
    if(!editing){
      originalGeometry=structuredClone(r.geometry); if(!editableGeometry())return notify('La geometría seleccionada no se pudo convertir a edición.');
      editing=true; document.body.classList.add('editingGeometry');
      ['#edit','#v10Edit'].forEach(s=>{const b=$(s);if(b){b.textContent='Guardar geometría';b.classList.add('editingNow')}});
      notify('Edición activa: arrastre los nodos azules y pulse Guardar geometría.'); return;
    }
    const geo=geometryFromSelection(); if(!geo)return notify('No se encontró la geometría editada.');
    T.selectionGroup.eachLayer(l=>l.editing?.disable?.()); editing=false; document.body.classList.remove('editingGeometry');
    ['#edit','#v10Edit'].forEach(s=>{const b=$(s);if(b){b.textContent='Editar vértices';b.classList.remove('editingNow')}});
    notify('Recalculando la geometría editada…');
    await T.select(T.transformGeometry(geo,true),'Área editada',false);
    onSelectionReady();
  }
  document.addEventListener('keydown',async e=>{if(e.key==='Escape'&&editing&&originalGeometry){editing=false;document.body.classList.remove('editingGeometry');await window.TerraOS.select(originalGeometry,'Selección restaurada',false);originalGeometry=null;onSelectionReady();notify('Edición cancelada.')}});

  function onSelectionReady(){
    if(!current())return; setStep(2); refreshCounts(); renderDecision(false);
    const fit=$('#fitSelection');if(fit)fit.disabled=false; const actions=$('#selectionActions');if(actions)actions.disabled=false;
    $('.selectionDock')?.removeAttribute('hidden');
  }
  function onSelectionCleared(){
    setStep(1); const stage=$('.attributeStage');if(stage)stage.hidden=true; const box=$('#v10Decision');if(box)box.hidden=true; const sd=$('.selectionDock');if(sd)sd.hidden=true;
  }

  function watchSelection(){
    const res=$('#result'); if(!res)return;
    let last=null;
    const check=()=>{const r=current(); const key=r?`${r.id}|${r.area}|${r.hits?.length}`:null;if(key!==last){last=key;r?onSelectionReady():onSelectionCleared()}};
    new MutationObserver(()=>setTimeout(check,0)).observe(res,{childList:true,subtree:true}); check();
    $('#clear')?.addEventListener('click',()=>setTimeout(check,20));
  }

  function makeIndexIntroCompact(){
    if(!$('#panel'))return;
    const intro=$('#panel > .intro'); if(intro)intro.textContent='Seleccione un lugar. TerraOS cruza la geometría con las reglas y explica la decisión.';
    const h=$('#panel h1');if(h)h.textContent='Gestión del suelo';
  }

  function init(){
    ruleRail(); reorderModule(); setupEmbeddedMap(); buildMapDock(); makeWizard(); makeIndexIntroCompact(); watchSelection();
    // Keep Esri imagery visible in the base menu with a human label.
    $$('#baseMenuItems [data-base="Esri World Imagery"]').forEach(b=>{const s=$('span',b);if(s)s.textContent='Esri · imágenes satelitales'});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0));else setTimeout(init,0);
})();
