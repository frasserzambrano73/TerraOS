window.TERRA_CONFIG={
  version:'11.0.0',
  imagery:{label:'Fondo alternativo · OpenStreetMap',url:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',maxNativeZoom:19,maxZoom:21,attribution:'© OpenStreetMap contributors'},
  esriImagery:{
    enabled:true,
    label:'Esri World Imagery',
    url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom:19,
    attribution:'Esri, Maxar, Earthstar Geographics, and the GIS User Community'
  },
  myMaps:{enabled:false,embedUrl:null,mapId:null},
  igac:{
    enabled:true,
    label:'IGAC · SINIC / Base Catastral Nacional',
    service:'https://sigi.igac.gov.co/habilitacion/rest/services/sinic/SINIC_DA/FeatureServer/3',
    spatialReference:9377,
    maxFeatures:500
  },
  ar:{demoLocation:'Plaza principal de Villa de Leyva',enabled:true},
  receiver:{url:null},
  commercialEnabled:false,
  purchaseUrl:null,
  whatsapp:{phone:'573144429234',catalogUrl:null},
  municipalities:[
    {id:'demo',name:'Demo',label:'Demo · paquete actual',path:'municipios/demo/',loaded:true,sourceMode:'current-terraos-demo',summary:'Capas funcionales actuales de TerraOS. Paquete de demostración, no fuente oficial municipal.'},
    {id:'villa-de-leyva',name:'Villa de Leyva',label:'Villa de Leyva',path:'municipios/villa-de-leyva/',loaded:false,sourceMode:'municipal-package',summary:'Carpeta municipal preparada para incorporar capas oficiales validadas.'},
    {id:'guican',name:'Güicán',label:'Güicán',path:'municipios/guican/',loaded:false,sourceMode:'municipal-package',summary:'Carpeta municipal preparada para incorporar capas oficiales validadas.'},
    {id:'guacamayas',name:'Guacamayas',label:'Guacamayas',path:'municipios/guacamayas/',loaded:false,sourceMode:'municipal-package',summary:'Carpeta municipal preparada para incorporar capas oficiales validadas.'},
    {id:'tunja',name:'Tunja',label:'Tunja',path:'municipios/tunja/',loaded:false,sourceMode:'municipal-package',summary:'Carpeta municipal preparada para incorporar capas oficiales validadas.'}
  ],
  topo:{url:'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',maxNativeZoom:17,maxZoom:21,attribution:'Datos © OpenStreetMap contributors, SRTM | Cartografía © OpenTopoMap (CC-BY-SA)'},
  alternative:{url:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',maxNativeZoom:19,maxZoom:21,attribution:'© OpenStreetMap contributors'}
};
