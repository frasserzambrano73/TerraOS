/* TerraOS 9.6 · arquitectura municipal + sistema visual/UX. */
(()=>{
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const config=window.TERRA_CONFIG||{};
  const municipalities=config.municipalities||[];
  const soilPanel=$('#panel'), headerBtn=$('#soilHeaderBtn');
  const decisionNames=['Predios','POT / reglamentación','Clasificación del suelo','Ríos','Rondas hídricas','Movimientos en masa','Inundaciones','Avenidas torrenciales','Límite municipal'];

  function currentMunicipality(){
    const q=new URLSearchParams(location.search).get('municipio');
    const stored=localStorage.getItem('terraos.municipality');
    return municipalities.find(m=>m.id===q)||municipalities.find(m=>m.id===stored)||municipalities[0];
  }

  function municipalityUrl(m){
    const base=m?.path||'';
    return base.endsWith('/')?base+'index.html':base+'/index.html';
  }

  function updateMunicipalityUI(m){
    if(!m)return;
    document.body.dataset.municipality=m.id;
    document.querySelectorAll('[data-municipality-name]').forEach(el=>el.textContent=m.name);
    document.querySelectorAll('#municipalitySelect').forEach(sel=>sel.value=m.id);
    document.querySelectorAll('#municipalityStatus').forEach(status=>{
      status.innerHTML=m.loaded
        ? `<strong>${esc(m.label||m.name)}</strong><span>Capas activas: paquete DEMO actual. ${esc(m.summary||'')}</span>`
        : `<strong>${esc(m.name)}</strong><span>${esc(m.summary||'Paquete municipal preparado.')}</span>`;
    });
    const mapStatus=$('#municipalityMapStatus');
    if(mapStatus) mapStatus.textContent=m.loaded?'DEMO · capas territoriales activas':`${m.name} · mapa base común · capas municipales por incorporar`;
    const count=$('#count');
    if(count) count.textContent=m.loaded?'1.200':'—';
  }

  function syncLocalLayers(m){
    const map=window.TerraOS?.map, overlays=window.TerraOS?.overlays||{};
    if(!map)return;
    decisionNames.forEach(name=>{
      const layer=overlays[name]; if(!layer)return;
      if(m?.loaded){
        if(!map.hasLayer(layer) && ['Predios','POT / reglamentación','Límite municipal','Ríos'].includes(name)) layer.addTo(map);
      }else if(map.hasLayer(layer)) map.removeLayer(layer);
    });
    const arca=overlays['ARCA · Tiendas'];
    if(arca){
      if(!map.hasLayer(arca)) arca.addTo(map);
      arca.bringToFront?.();
    }
    if(m?.loaded && overlays.Predios?.bringToFront) overlays.Predios.bringToFront();
  }

  function navigateMunicipality(id){
    const m=municipalities.find(x=>x.id===id)||municipalities[0];
    if(!m)return;
    localStorage.setItem('terraos.municipality',m.id);
    // V10: one application shell only. Municipality changes never open an iframe shell.
    const u=new URL(location.href);
    u.pathname=u.pathname.replace(/\\/g,'/').replace(/\/municipios\/[^/]+\/index\.html$/,'/index.html');
    u.searchParams.set('municipio',m.id);
    u.searchParams.delete('embed');
    location.href=u.href;
  }

  function initMunicipality(){
    const sels=document.querySelectorAll('#municipalitySelect');
    if(!sels.length)return;
    const m=currentMunicipality();
    sels.forEach(sel=>{
      sel.innerHTML=municipalities.map(x=>`<option value="${esc(x.id)}">${esc(x.label||x.name)}</option>`).join('');
      sel.value=m?.id||municipalities[0]?.id||'';
      sel.addEventListener('change',()=>navigateMunicipality(sel.value));
    });
    updateMunicipalityUI(m);
    syncLocalLayers(m);
  }

  function menuMarkup(){
    const wrap=document.createElement('div'); wrap.className='mapMenuStack';
    wrap.innerHTML=`
      <div class="mapMenu baseMenu" hidden>
        <div class="mapMenuHead"><div><strong>Mapas base</strong><small>Referencia cartográfica</small></div><button type="button" data-close-menu aria-label="Cerrar">×</button></div>
        <p class="mapMenuNote">El mapa base es común a todos los municipios. No contiene reglas de decisión.</p><div id="baseMenuItems"></div>
      </div>
      <div class="mapMenu decisionMenu" hidden>
        <div class="mapMenuHead"><div><strong>Capas de decisión</strong><small>Gestión del Suelo</small></div><button type="button" data-close-menu aria-label="Cerrar">×</button></div>
        <p class="mapMenuNote">Solo se muestran las capas del paquete municipal seleccionado.</p><div id="decisionMenuItems"></div>
      </div>`;
    $('.mapWrap')?.appendChild(wrap); return wrap;
  }

  function initMapMenus(){
    const map=window.TerraOS?.map, bases=window.TerraOS?.baseLayers;
    if(!map||!bases||!$('.mapWrap'))return;
    const wrap=$('.mapMenuStack')||menuMarkup();
    const baseMenu=$('.baseMenu'), decisionMenu=$('.decisionMenu');
    const baseItems=$('#baseMenuItems'), decisionItems=$('#decisionMenuItems');
    if(!baseItems||!decisionItems)return;
    const preferred=['Esri World Imagery','OpenTopoMap','OpenStreetMap','Fondo neutro'];
    const names=[...preferred,...Object.keys(bases).filter(k=>!preferred.includes(k)&&!/Imagen abierta|Fondo alternativo/.test(k))];
    baseItems.innerHTML=names.filter((v,i,a)=>a.indexOf(v)===i).map(name=>`<button type="button" class="mapMenuItem" data-base="${esc(name)}"><span>${esc(name)}</span><small>BASE</small></button>`).join('');
    baseItems.querySelectorAll('[data-base]').forEach(b=>b.addEventListener('click',()=>{
      const layer=bases[b.dataset.base]; if(!layer)return;
      Object.values(bases).forEach(l=>{if(l&&l!==layer&&map.hasLayer(l))map.removeLayer(l)});
      layer.addTo(map); map.fire('baselayerchange',{layer}); baseMenu.hidden=true;
    }));
    const overlays=window.TerraOS.overlays||{};
    const labels={predios:'Predios',pot_reglamentacion:'POT / reglamentación',clasificacion_suelo:'Clasificación del suelo',det_rio:'Ríos',det_ronda_30m:'Rondas hídricas',gr_movimientos_masa:'Movimientos en masa',gr_inundaciones:'Inundaciones',gr_avenidas_torrenciales:'Avenidas torrenciales',limite_municipal:'Límite municipal'};
    const ordered=Object.entries(labels).filter(([,label])=>overlays[label]);
    decisionItems.innerHTML=ordered.length?ordered.map(([,label])=>`<label class="mapMenuCheck"><input type="checkbox" data-decision="${esc(label)}"><span>${esc(label)}</span></label>`).join(''):'<p class="hint">El paquete municipal seleccionado todavía no contiene capas de decisión.</p>';
    const refreshChecks=()=>decisionItems.querySelectorAll('[data-decision]').forEach(c=>{const layer=overlays[c.dataset.decision]; c.checked=!!layer&&map.hasLayer(layer)});
    refreshChecks();
    decisionItems.querySelectorAll('[data-decision]').forEach(c=>c.addEventListener('change',()=>{
      const layer=overlays[c.dataset.decision]; if(!layer)return;
      c.checked?layer.addTo(map):map.removeLayer(layer);
      if(overlays.Predios?.bringToFront)overlays.Predios.bringToFront();
    }));
    const baseBtn=$('#baseMenuButton'), decisionBtn=$('#decisionMenuButton');
    const close=()=>{baseMenu.hidden=true;decisionMenu.hidden=true};
    baseBtn?.addEventListener('click',e=>{e.stopPropagation();decisionMenu.hidden=true;baseMenu.hidden=!baseMenu.hidden});
    decisionBtn?.addEventListener('click',e=>{e.stopPropagation();baseMenu.hidden=true;decisionMenu.hidden=!decisionMenu.hidden;refreshChecks()});
    wrap.querySelectorAll('[data-close-menu]').forEach(b=>b.addEventListener('click',close));
    document.addEventListener('click',e=>{if(!e.target.closest('.mapMenuStack')&&!e.target.closest('#baseMenuButton')&&!e.target.closest('#decisionMenuButton'))close()},{passive:true});
    const syncDecisionVisibility=()=>{if(decisionBtn)decisionBtn.hidden=!(soilPanel&&!soilPanel.hidden)};
    syncDecisionVisibility();
    window.addEventListener('terraos:soil-activity',syncDecisionVisibility);
  }

  function addArcaDemo(){
    const map=window.TerraOS?.map, data=window.TERRA_DATA;
    if(!map||!data?.layers?.predios||window.__terraArcaLayer)return;
    const first=data.layers.predios.features.find(f=>f.properties?.id_predio==='P-0001')||data.layers.predios.features[0];
    if(!first)return;
    const layer=L.geoJSON(first,{style:{color:'#a95b3d',weight:3,fillColor:'#d8b36a',fillOpacity:.28,dashArray:'7 5'},onEachFeature:(f,l)=>l.bindTooltip('ARCA · lote piloto demostrativo',{sticky:true})});
    layer.addTo(map); layer.bringToFront(); window.TerraOS.overlays['ARCA · Tiendas']=layer; window.__terraArcaLayer=layer;
  }

  function syncSoilHeader(){
    if(!headerBtn)return;
    headerBtn.addEventListener('click',()=>setTimeout(()=>window.dispatchEvent(new CustomEvent('terraos:soil-activity',{detail:soilPanel&&!soilPanel.hidden?'soil':'other'})),0));
    document.querySelectorAll('.primaryNav a,.moduleNav a').forEach(a=>a.addEventListener('click',()=>window.dispatchEvent(new CustomEvent('terraos:soil-activity',{detail:'other'}))));
  }

  function embedMode(){
    const p=new URLSearchParams(location.search); if(p.get('embed')!=='map')return;
    document.documentElement.classList.add('terraEmbed'); document.body.classList.add('terraEmbed');
    if(soilPanel)soilPanel.hidden=true; document.querySelector('header')?.remove(); document.querySelector('.demo')?.remove();
    const main=document.querySelector('main'); if(main)main.style.display='block'; const wrap=$('.mapWrap'); if(wrap){wrap.style.height='100dvh';wrap.style.minHeight='100dvh'}
  }

  function init(){
    embedMode();
    initMunicipality();
    if(new URLSearchParams(location.search).get('soil')==='1' && soilPanel && headerBtn){soilPanel.hidden=false;headerBtn.setAttribute('aria-expanded','true');headerBtn.classList.add('active')}
    addArcaDemo();
    const m=currentMunicipality(); updateMunicipalityUI(m); syncLocalLayers(m);
    initMapMenus(); syncSoilHeader();
    const observer=new MutationObserver(()=>{const active=soilPanel&&!soilPanel.hidden; const decisionBtn=$('#decisionMenuButton'); if(decisionBtn)decisionBtn.hidden=!active});
    if(soilPanel)observer.observe(soilPanel,{attributes:true,attributeFilter:['hidden']});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0));else setTimeout(init,0);
})();
