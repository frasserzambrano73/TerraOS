/* ===== TerraOS 10.6 · Sincronización del mercado con capa Leaflet ===== */
document.addEventListener('DOMContentLoaded', function(){
  const mainMap = window.TerraOS?.map || null;
  const marketButton = document.getElementById('marketLayerButton');
  const marketCount = document.getElementById('marketLayerCount');
  const priority = document.getElementById('marketPriority');

  let marketLayer = null;
  let marketVisible = true;

  function listings(){
    try{return JSON.parse(localStorage.getItem('terraosMarketListings')||'[]')}catch(e){return []}
  }

  function normalizeMarketProperties(p={}){
    return {
      ...p,
      id:p.id||p.id_publicacion||p.ref||p.id_predio||'',
      type:p.type||p.tipo||'venta',
      title:p.title||p.titulo||p.id_predio||p.id_publicacion||'Publicación predial',
      ref:p.ref||p.id_predio||p.id_publicacion||'',
      price:p.price??p.precio_cop??'',
      area:p.area??p.area_aprox_m2??'',
      contact:p.contact||p.contacto||'',
      phone:p.phone||p.telefono||p.whatsapp||'',
      description:p.description||p.descripcion_comercial||p.summary||'',
      summary:p.summary||p.resumen_pot||'',
      pot:p.pot||p.resumen_pot||'',
      determinants:p.determinants||p.resumen_determinantes||'',
      risk:p.risk||p.resumen_riesgo||'',
      use:p.use||p.uso_propuesto||'',
      status:p.status||p.estado||'',
      pending:p.pending||p.pendiente_verificacion||'',
      thumbnail:p.thumbnail||p.fotografia_principal||''
    };
  }

  function seedFeatures(){
    const fc = window.TERRA_COMERCIO_PREDIAL;
    if(!(fc && fc.type==='FeatureCollection' && Array.isArray(fc.features))) return [];
    return fc.features.map(f=>({ ...f, properties: normalizeMarketProperties(f.properties||{}) }));
  }

  function money(v){
    const n=Number(v||0);
    return n ? new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n) : 'Consultar';
  }

  function escapeHtml(s){
    return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  }

  function photoBlock(item){
    if(item.thumbnail){
      return '<img class="photo" src="'+item.thumbnail+'" alt="Fotografía del predio">';
    }
    return '<div class="photoPlaceholder">Predio · TerraOS</div>';
  }

  function popupHTML(item){
    const type=item.type==='compra'?'Interés de compra':'Predio en venta';
    const wa=(item.phone||'').replace(/\D/g,'');
    const waLink=wa ? '<a target="_blank" rel="noopener" href="https://wa.me/'+wa+'?text='+encodeURIComponent('Hola. Vi esta publicación en TerraOS: '+(item.title||item.ref||'predio'))+'">Contactar por WhatsApp ↗</a>' : '';
    const territorial=[
      item.pot&&'<div class="marketFact"><b>POT</b><span>'+escapeHtml(item.pot)+'</span></div>',
      item.determinants&&'<div class="marketFact"><b>Determinantes</b><span>'+escapeHtml(item.determinants)+'</span></div>',
      item.risk&&'<div class="marketFact"><b>Riesgo</b><span>'+escapeHtml(item.risk)+'</span></div>'
    ].filter(Boolean).join('');
    const priceM2=(Number(item.price)>0&&Number(item.area)>0)?money(Number(item.price)/Number(item.area))+'/m²':'';
    return '<div class="marketPopup">'+
      photoBlock(item)+
      '<span class="tag">'+type+'</span>'+
      '<h3>'+escapeHtml(item.title||item.ref||'Publicación predial')+'</h3>'+
      '<div class="price">'+money(item.price)+(priceM2?' <small>· '+priceM2+'</small>':'')+'</div>'+
      '<p>'+(item.area?Number(item.area).toLocaleString('es-CO')+' m² · ':'')+(item.ref?escapeHtml(item.ref):'')+'</p>'+
      '<section class="marketInfo"><strong>Información comercial</strong><p>'+escapeHtml(item.description||'Sin descripción comercial disponible.')+'</p></section>'+
      (territorial?'<section class="marketInfo territorial"><strong>Lectura territorial TerraOS</strong>'+territorial+'</section>':'')+
      '<section class="marketInfo pending"><strong>Verificación</strong><p>'+escapeHtml(item.pending||'La publicación no reemplaza certificado urbanístico, avalúo, estudio de títulos ni verificación en fuentes oficiales.')+'</p></section>'+
      '<p><strong>Contacto:</strong> '+escapeHtml(item.contact||'Por definir')+(item.phone?' · '+escapeHtml(item.phone):'')+'</p>'+
      waLink+
    '</div>';
  }

  function asFeature(item){
    if(!item.lat || !item.lng) return null;
    return {
      type:'Feature',
      geometry:{type:'Point',coordinates:[Number(item.lng),Number(item.lat)]},
      properties:normalizeMarketProperties(item)
    };
  }

  function allFeatures(){
    const local=listings().filter(x=>x.status==='publicado_local'||x.status==='publicado').map(asFeature).filter(Boolean);
    const seed=seedFeatures();
    const byId=new Map();
    [...seed,...local].forEach(f=>{
      const id=f.properties?.id || f.properties?.ref || JSON.stringify(f.geometry);
      byId.set(id,f);
    });
    return [...byId.values()];
  }

  function pointStyle(feature,latlng){
    const type=feature.properties?.type;
    const color=type==='compra'?'#2f7b67':'#b47b52';
    return L.circleMarker(latlng,{
      radius:9,
      color:'#fff',
      weight:3,
      fillColor:color,
      fillOpacity:.95
    });
  }

  function rebuildLayer(){
    if(!window.L) return;
    const features=allFeatures();
    if(marketCount) marketCount.textContent=features.length;

    if(!mainMap) return;

    if(marketLayer && mainMap.hasLayer(marketLayer)) mainMap.removeLayer(marketLayer);

    marketLayer=L.geoJSON({type:'FeatureCollection',features},{
      pointToLayer:pointStyle,
      style:function(feature){
        const color=feature.properties?.type==='compra'?'#2f7b67':'#b47b52';
        return {color,weight:3,fillColor:color,fillOpacity:.18};
      },
      onEachFeature:function(feature,layer){
        layer.bindPopup(popupHTML(feature.properties||{}),{maxWidth:320});
      }
    });

    if(marketVisible) marketLayer.addTo(mainMap);
  }

  if(marketButton){
    marketButton.disabled=false;
    marketButton.addEventListener('click',function(){
      if(!mainMap || !marketLayer) return;
      if(mainMap.hasLayer(marketLayer)){
        mainMap.removeLayer(marketLayer);
        marketVisible=false;
      }else{
        marketLayer.addTo(mainMap);
        marketVisible=true;
        const bounds=marketLayer.getBounds();
        if(bounds.isValid()) mainMap.fitBounds(bounds.pad(.25));
      }
    });
  }

  if(priority){
    priority.addEventListener('click',function(){
      document.getElementById('marketProjectHeading')?.scrollIntoView({behavior:'smooth',block:'start'});
      const features=allFeatures();
      if(mainMap && marketLayer && features.length){
        if(!mainMap.hasLayer(marketLayer)) marketLayer.addTo(mainMap);
        marketVisible=true;
        const bounds=marketLayer.getBounds();
        if(bounds.isValid()) mainMap.fitBounds(bounds.pad(.25));
      }
    });
  }

  window.addEventListener('terraos:market-updated', rebuildLayer);
  rebuildLayer();

  /* Exponer función de refresco a scripts del módulo */
  window.TerraOSMarketLayer = { refresh: rebuildLayer };
});
