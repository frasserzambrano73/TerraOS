/* ===== TerraOS 10.5 · Comercio predial frontend ===== */
document.addEventListener('DOMContentLoaded', function(){
  const modal = document.getElementById('marketModal');
  if(!modal || !window.L) return;

  const els = {
    mode: document.getElementById('marketModeLabel'),
    title: document.getElementById('marketTitle'),
    mapTitle: document.getElementById('marketMapTitle'),
    summaryTitle: document.getElementById('marketSummaryTitle'),
    summaryText: document.getElementById('marketSummaryText'),
    badge: document.getElementById('marketStatusBadge'),
    type: document.getElementById('marketType'),
    ref: document.getElementById('marketParcelRef'),
    price: document.getElementById('marketPrice'),
    area: document.getElementById('marketArea'),
    contact: document.getElementById('marketContactName'),
    phone: document.getElementById('marketPhone'),
    commercialTitle: document.getElementById('marketCommercialTitle'),
    description: document.getElementById('marketDescription'),
    lat: document.getElementById('marketLat'),
    lng: document.getElementById('marketLng'),
    photos: document.getElementById('marketPhotos'),
    preview: document.getElementById('marketPhotoPreview'),
    state: document.getElementById('marketState'),
    listings: document.getElementById('marketListings')
  };

  let marketMap = null;
  let marketMarker = null;
  let currentMode = 'venta';

  function textOf(id){
    const el=document.getElementById(id);
    return (el?.innerText || el?.textContent || '').trim();
  }

  function compact(txt, max=700){
    return String(txt||'').replace(/\s+/g,' ').trim().slice(0,max);
  }

  function money(v){
    const n=Number(v||0);
    return n ? new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n) : 'Consultar';
  }

  function loadListings(){
    try{return JSON.parse(localStorage.getItem('terraosMarketListings')||'[]')}catch(e){return []}
  }

  function saveListings(data){
    localStorage.setItem('terraosMarketListings',JSON.stringify(data));
  }

  function renderListings(){
    const data=loadListings();
    if(!data.length){
      els.listings.innerHTML='<div class="marketEmpty">Aún no hay publicaciones en este navegador. Cuando vendas un predio o publiques una solicitud de compra, aparecerá aquí.</div>';
      return;
    }
    els.listings.innerHTML=data.slice().reverse().slice(0,6).map(item=>`
      <article class="marketMiniCard">
        <div class="marketMiniCardTop">
          <div>
            <span class="tag">${item.type==='venta'?'EN VENTA':'BUSCO COMPRAR'}</span>
            <b>${item.title||item.ref||'Publicación predial'}</b>
          </div>
          <span class="price">${money(item.price)}</span>
        </div>
        <p>${item.area?Number(item.area).toLocaleString('es-CO')+' m² · ':''}${item.ref?item.ref+' · ':''}${item.summary||'Sin resumen territorial.'}</p>
        <p><strong>Contacto:</strong> ${item.contact||'Por definir'} ${item.phone?'· '+item.phone:''}</p>
      </article>
    `).join('');
  }

  function initMarketMap(){
    if(marketMap) return;
    marketMap=L.map('marketMap',{zoomControl:true,scrollWheelZoom:true}).setView([5.6338,-73.5249],15);
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {maxZoom:19,attribution:'Tiles © Esri'}
    ).addTo(marketMap);
    marketMap.on('click',e=>{
      setLocation(e.latlng.lat,e.latlng.lng,true);
    });
  }

  function setLocation(lat,lng,openPopup=false){
    els.lat.value=Number(lat).toFixed(6);
    els.lng.value=Number(lng).toFixed(6);
    if(marketMarker) marketMap.removeLayer(marketMarker);
    marketMarker=L.marker([lat,lng]).addTo(marketMap);
    if(openPopup) marketMarker.bindPopup('Ubicación de la publicación').openPopup();
    marketMap.setView([lat,lng],Math.max(marketMap.getZoom(),16));
  }

  function summaryFromConsult(){
    const parcel=(document.getElementById('parcelId')?.value||'').trim();
    const result=compact(textOf('result'),900);
    const project={
      activity: document.getElementById('activity')?.value || '',
      action: document.getElementById('action')?.value || '',
      footprint: document.getElementById('footprint')?.value || '',
      floorArea: document.getElementById('floorArea')?.value || '',
      height: document.getElementById('height')?.value || '',
      floors: document.getElementById('floors')?.value || ''
    };
    let projectText=[project.activity,project.action,
      project.footprint&&('ocupación '+project.footprint+' m²'),
      project.floorArea&&('construcción '+project.floorArea+' m²'),
      project.height&&('altura '+project.height+' m'),
      project.floors&&project.floors+' pisos'
    ].filter(Boolean).join(' · ');
    return {
      ref: parcel,
      title: parcel ? 'Predio '+parcel : 'Predio seleccionado',
      text: [result, projectText].filter(Boolean).join(' | ') || 'No hay una ficha territorial visible todavía. Puede completar la publicación y verificar la información antes de publicarla.'
    };
  }

  function summaryFromSearch(){
    const criteria=compact(textOf('criteria'),500);
    const results=compact(textOf('searchResults'),700);
    const logic=document.getElementById('logic')?.value||'AND';
    const whole=document.getElementById('whole')?.value||'true';
    const minArea=document.getElementById('minArea')?.value||'0';
    const txt=[
      criteria && ('Criterios: '+criteria),
      'Combinación: '+logic,
      'Resultado: '+(whole==='true'?'predios completos':'porciones de predios'),
      'Superficie mínima: '+minArea+' m²',
      results && ('Resultados actuales: '+results)
    ].filter(Boolean).join(' | ');
    return {ref:'',title:'Búsqueda territorial activa',text:txt};
  }

  function clearForm(){
    ['marketPrice','marketArea','marketContactName','marketPhone','marketCommercialTitle','marketDescription','marketLat','marketLng'].forEach(id=>{
      const e=document.getElementById(id); if(e) e.value='';
    });
    els.preview.innerHTML='';
    els.badge.textContent='BORRADOR';
  }

  function openMarket(mode, source){
    currentMode=mode;
    clearForm();
    initMarketMap();

    let summary;
    if(source==='consult') summary=summaryFromConsult();
    else if(source==='search') summary=summaryFromSearch();
    else summary={ref:'',title:'Publicación directa',text:'Registro creado directamente por el administrador. Complete ubicación, datos comerciales y descripción territorial.'};

    els.type.value=mode;
    els.ref.value=summary.ref||'';
    els.summaryTitle.textContent=summary.title;
    els.summaryText.textContent=summary.text;
    els.mode.textContent=mode==='venta'?'COMERCIO PREDIAL · OFERTA':'COMERCIO PREDIAL · DEMANDA';
    els.title.textContent=mode==='venta'?'Quiero vender este predio':'Me interesa comprar un predio';
    els.mapTitle.textContent=mode==='venta'?'Ubique el predio que se ofrece':'Ubique el sector o predio de interés';
    els.commercialTitle.value = mode==='venta'
      ? (summary.ref ? 'Predio '+summary.ref+' disponible' : 'Predio disponible')
      : 'Busco predio compatible con esta actividad';
    els.description.value=compact(summary.text,650);

    modal.showModal();
    setTimeout(()=>marketMap.invalidateSize(),120);
  }

  document.getElementById('sellCurrentParcel')?.addEventListener('click',()=>openMarket('venta','consult'));
  document.getElementById('buyFromSearch')?.addEventListener('click',()=>openMarket('compra','search'));
  document.getElementById('buySearchCTA')?.addEventListener('click',()=>openMarket('compra','search'));
  document.getElementById('adminPublishParcel')?.addEventListener('click',()=>openMarket('venta','admin'));
  document.getElementById('marketClose')?.addEventListener('click',()=>modal.close());

  els.photos?.addEventListener('change',()=>{
    els.preview.innerHTML='';
    [...els.photos.files].slice(0,8).forEach(file=>{
      const reader=new FileReader();
      reader.onload=()=>{
        const img=document.createElement('img');
        img.src=reader.result;
        img.alt='Vista previa';
        els.preview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  });


  function makeThumbnail(file){
    return new Promise(resolve=>{
      if(!file){resolve('');return}
      const reader=new FileReader();
      reader.onload=()=>{
        const img=new Image();
        img.onload=()=>{
          const maxW=720,maxH=480;
          let w=img.width,h=img.height;
          const scale=Math.min(1,maxW/w,maxH/h);
          w=Math.round(w*scale);h=Math.round(h*scale);
          const canvas=document.createElement('canvas');
          canvas.width=w;canvas.height=h;
          const ctx=canvas.getContext('2d');
          ctx.drawImage(img,0,0,w,h);
          resolve(canvas.toDataURL('image/jpeg',0.72));
        };
        img.onerror=()=>resolve('');
        img.src=reader.result;
      };
      reader.onerror=()=>resolve('');
      reader.readAsDataURL(file);
    });
  }

  function payload(status){
    return {
      id:'MP-'+Date.now(),
      type:els.type.value,
      ref:els.ref.value.trim(),
      price:els.price.value,
      area:els.area.value,
      contact:els.contact.value.trim(),
      phone:els.phone.value.trim(),
      title:els.commercialTitle.value.trim(),
      description:els.description.value.trim(),
      lat:els.lat.value,
      lng:els.lng.value,
      photos:[...els.photos.files].map(f=>f.name),
      summary:compact(els.summaryText.textContent,500),
      source:els.summaryTitle.textContent,
      status,
      createdAt:new Date().toISOString()
    };
  }

  function validate(item){
    if(!item.title) return 'Agregue un título comercial.';
    if(!item.contact) return 'Agregue un nombre de contacto.';
    if(!item.phone) return 'Agregue un teléfono o WhatsApp.';
    if(!item.lat || !item.lng) return 'Ubique el predio o zona de interés en el mapa.';
    return '';
  }

  document.getElementById('marketSave')?.addEventListener('click',async()=>{
    const item=payload('borrador');
    item.thumbnail=await makeThumbnail(els.photos.files[0]);
    const data=loadListings();
    data.push(item);
    saveListings(data);
    els.badge.textContent='BORRADOR GUARDADO';
    els.state.textContent='Borrador guardado localmente. No es una publicación pública todavía.';
    renderListings();
    window.dispatchEvent(new CustomEvent('terraos:market-updated'));
  });

  document.getElementById('marketPublish')?.addEventListener('click',async()=>{
    const item=payload('publicado_local');
    item.thumbnail=await makeThumbnail(els.photos.files[0]);
    const error=validate(item);
    if(error){els.state.textContent=error;return}
    const data=loadListings();
    data.push(item);
    saveListings(data);
    els.badge.textContent='PUBLICADO LOCALMENTE';
    els.state.textContent='Publicación visible en el mercado predial de este navegador. En producción debe enviarse a backend para revisión, moderación y publicación pública.';
    renderListings();
    window.dispatchEvent(new CustomEvent('terraos:market-updated'));
  });

  document.getElementById('marketWhatsApp')?.addEventListener('click',()=>{
    const item=payload('compartir');
    const phone=(window.TERRA_CONFIG?.whatsapp?.phone)||'573144429234';
    const msg=[
      item.type==='venta'?'TerraOS · Predio en venta':'TerraOS · Interés de compra',
      'Título: '+(item.title||'Sin título'),
      item.ref&&('Referencia: '+item.ref),
      item.area&&('Área: '+item.area+' m²'),
      item.price&&('Precio/presupuesto: '+money(item.price)),
      item.lat&&item.lng&&('Ubicación: '+item.lat+', '+item.lng),
      'Descripción: '+(item.description||item.summary||''),
      'Contacto: '+(item.contact||'')+' '+(item.phone||'')
    ].filter(Boolean).join('\n');
    window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(msg),'_blank','noopener');
  });

  renderListings();
});
