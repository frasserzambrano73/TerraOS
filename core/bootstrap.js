/* TerraOS 11 · bootstrap and single UI state */
(()=>{
  const $=(s,r=document)=>r.querySelector(s);
  const params=new URLSearchParams(location.search);
  const state=window.TerraOSState=window.TerraOSState||{
    municipality:localStorage.getItem('terraos.municipality')||'demo',
    module:'soil', activity:'consult', parcel:null, geometry:null,
    consultation:null, search:null, project:null, market:null
  };
  function event(name,detail={}){window.dispatchEvent(new CustomEvent('terraos:metric',{detail:{name,at:Date.now(),...detail}}));}
  function activate(name){
    const api=window.TerraOS9_5;
    if(name==='market'){
      api?.activateSoilActivity?.('project'); state.activity='project';
      setTimeout(()=>$('#marketPriority')?.scrollIntoView({behavior:'smooth',block:'center'}),100);
      event('market_open'); return;
    }
    api?.activateSoilActivity?.(name); state.activity=name; event('soil_activity',{activity:name});
  }
  document.querySelectorAll('[data-go-soil]').forEach(b=>b.addEventListener('click',()=>activate(b.dataset.goSoil)));
  // Prefer Esri without monkey-patching Leaflet. Fall back silently if unavailable.
  function preferEsri(){
    const T=window.TerraOS;if(!T?.map||!T?.baseLayers)return false;
    const esri=T.baseLayers['Esri World Imagery'];if(!esri)return false;
    Object.values(T.baseLayers).forEach(l=>{if(l!==esri&&T.map.hasLayer(l))T.map.removeLayer(l)});
    if(!T.map.hasLayer(esri))esri.addTo(T.map);
    return true;
  }
  function syncSelection(){
    const r=window.TerraOS?.current||null;
    state.consultation=r;
    state.parcel=r?.id||null;
    state.geometry=r?.geometry||null;
  }
  function init(){
    preferEsri(); syncSelection();
    const result=$('#result'); if(result)new MutationObserver(syncSelection).observe(result,{childList:true,subtree:true});
    if(params.get('market')==='1'||location.hash==='#marketProjectHeading')activate('market');
    window.TerraOS11={state,activate,event,preferEsri,syncSelection};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0));else setTimeout(init,0);
})();
