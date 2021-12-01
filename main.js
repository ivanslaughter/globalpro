import 'bootstrap/dist/css/bootstrap.min.css';
import './css/style.css';
import {Map, View, Overlay} from 'ol';
import MousePosition from 'ol/control/MousePosition';
import { Image as ImageLayer, Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import ImageWMS from 'ol/source/ImageWMS';
import TileWMS from 'ol/source/TileWMS';
import GeoJSON from 'ol/format/GeoJSON';
import VectorSource from 'ol/source/Vector'
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import OSM from 'ol/source/OSM';
import { createStringXY } from 'ol/coordinate';
import { ScaleLine, OverviewMap, ZoomToExtent, defaults as defaultControls } from 'ol/control';
import { fromLonLat, useGeographic, Projection } from 'ol/proj';
import { Modal, Offcanvas } from 'bootstrap';
import numeral from 'numeral';


//useGeographic();

numeral.register('locale', 'id', {
  delimiters: {
    thousands: '.',
    decimal: ','
  },
  abbreviations: {
    thousand: 'rb',
    million: 'jt',
    billion: 'ml',
    trillion: 'tr'
  },
  ordinal: function (number) {
    return number === 1 ? 'er' : 'ème';
  },
  currency: {
    symbol: 'Rp'
  }
});

// switch between locales
numeral.locale('id');

var mapInfo = new Modal(document.getElementById('mapInfo'));
var blockJSON;

const mapCenter = fromLonLat([98.1969, 4.2667]);
const projection = new Projection({
  code: 'EPSG:4326',
  units: 'm',
});
const mapExtent = fromLonLat([98.1764, 4.2992, 98.2307, 4.2329]);

const afdelingSource = new VectorSource({
  url: 'http://localhost:8080/geoserver/Mopoli/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=Mopoli%3ASS_Digitasi_Batas_Afdeling&maxFeatures=10&outputFormat=application%2Fjson&srsname=EPSG:4326',
  format: new GeoJSON(),
  overlaps: true
});

const afdelingStyle = new Style({
  fill: new Fill({
    color: 'rgba(255,255,255,0.01)',
  }),
  stroke: new Stroke({
    color: '#c90000',
    width: 0.18,
    lineDash: [4.5, 1.8]
  })
});

const blockSource = new VectorSource({
  url: 'http://localhost:8080/geoserver/Mopoli/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=Mopoli%3ASS_Digitasi_Batas_Blok&maxFeatures=100&outputFormat=application%2Fjson&srsname=EPSG:4326',
  format: new GeoJSON(),
});

const blockStyle = new Style({
  fill: new Fill({
    color: 'rgba(255,255,255,0.01)',
  }),
  stroke: new Stroke({
    color: '#c90000',
    width: 0.18,
    lineDash: [4.5,1.8]
  })
});

const blockLayer = new VectorLayer({
  source: blockSource,
  style: blockStyle,
});


const afdelingLayer = new VectorLayer({
  source: afdelingSource,
  style: afdelingStyle,
});

const source = new OSM();
const overviewMapControl = new OverviewMap({
  layers: [
    new TileLayer({
      source: source,
    }),
  ],
});

const mousePositionControl = new MousePosition({
  coordinateFormat: createStringXY(4),
  projection: 'EPSG:4326',
  // comment the following two lines to have the mouse position
  // be placed within the map.
  className: 'custom-mouse-position',
  target: document.getElementById('mouse-position'),
});

const wmsSource = new ImageWMS({
  url: 'http://localhost:8080/geoserver/Mopoli/wms',
  params: { 'LAYERS': 'Mopoli:Mopoli_Group' },
  serverType: 'geoserver',
});

const wmsSource1 = new ImageWMS({
  url: 'http://localhost:8080/geoserver/Mopoli/wms',
  params: { 'LAYERS': 'Mopoli:Mopoli_Group_01' },
  serverType: 'geoserver',
});

const osmLayer = new TileLayer({
  source: new OSM()
});

const wmsLayer = new ImageLayer({
  //extent: [408380,467955,414599,475177],
  name: 'layer1',
  source: wmsSource,
});
const wmsLayer1 = new ImageLayer({
  //extent: [408380,467955,414599,475177],
  name: 'layer2',
  source: wmsSource1,
});

const layers = [ osmLayer, wmsLayer, wmsLayer1, afdelingLayer, blockLayer ];

const view = new View({
  //center: proj.transform([98.1969, 4.2667], 'EPSG:4326', 'EPSG:32647'),
  //projection: projection,
  center: mapCenter,
  pixelRatio: 1,
  padding: [99, 90, 99, 90],
  zoom: 14,
});

//

const map = new Map({
  controls: defaultControls().extend([mousePositionControl, overviewMapControl, new ScaleLine()]),
  target: 'map',
  layers: layers,
  view: view,
});

/* 
$('.ol-zoom-in, .ol-zoom-out').tooltip({
  placement: 'left',
  container: '#map',
});
$('.ol-rotate-reset, .ol-attribution button[title]').tooltip({
  placement: 'left',
  container: '#map',
});
 */

map.on('singleclick', function (evt) {
  //document.getElementById('mapinfo').innerHTML = '';
  const viewResolution = /** @type {number} */ (view.getResolution());
  const coord = evt.coordinate;
  const coord1 = fromLonLat([coord[0], coord[1]]);
  const url = wmsSource.getFeatureInfoUrl(
    evt.coordinate,
    viewResolution,
    'EPSG:3857',
    {
      'exceptions':'application/vnd.ogc.se_inimage',
      //'INFO_FORMAT': 'text/html',
      'INFO_FORMAT': 'application/json',
      'FEATURE_COUNT': '100',
      'X':'50',
      'Y':'50',
      //'SRS':'EPSG:32647',
    }
  );
  
  if (url) {
    fetch(url)
      .then((response) => response.text())
      .then((json) => {
        //document.getElementById('map-info').innerHTML = html;
        
        /* document.getElementById('mapinfo').innerHTML = html;
        $('#mapinfo table').removeClass("featureInfo").addClass("table table-sm").wrap("<div class='table-responsive-sm'></div>");
        $("#mapinfo td").each(function () {
          var text = $(this).text();
          text = text.replace("SS_Digitasi_Batas_", "");
          text = text.replace("SS_Digitasi_Jalan_Atribut", "Jalan");
          text = text.replace("SS_Digitasi_Jalan_Utama", "Jalan Utama");
          text = text.replace("SS_Digitasi_Jembatan", "Jembatan");
          text = text.replace("SS_Digitasi_Bangunan", "Bangunan");
          text = text.replace("SS_Digitasi_Sungai", "Sungai");
          $(this).text(text);
        });
        $("#mapinfo th").each(function () {
          var text = $(this).text();
          text = text.replace("Block", "Blok");
          $(this).text(text);
        });
        $("#mapinfo table caption").each(function () {
          var text = $(this).text();
          text = text.replace("SS_Digitasi_Batas_", "");
          text = text.replace("SS_Digitasi_Jalan_Atribut", "Jalan");
          text = text.replace("SS_Digitasi_Jalan_Utama", "Jalan Utama");
          text = text.replace("SS_Digitasi_Bangunan", "Bangunan");
          text = text.replace("SS_Digitasi_Jembatan", "Jembatan");
          text = text.replace("SS_Digitasi_Sungai", "Sungai");
          $(this).text(text);
        }); */
        /* console.log(html.includes('class'));
        if (html.includes('class')){
          mapInfo.show();
        } */
       
        const layerJson = JSON.parse(json);

        //console.log(layerJson.features.length);

        if (layerJson.features.length !== 0){
          const layerId = layerJson.features[0].id
          const blockId = layerId ? layerId.split('.')[1] : '';
          const layerProperties = layerJson.features[0].properties;

          console.log(blockId);

          selectBlock(blockId);

          setMapInfo(layerProperties);
        }


      });
  }
  //console.log(url + ' – ' + coord1 );
});

/* afdelingLayer.getSource().on('featuresloadend', function () {

  const feature = afdelingSource.getFeatures()[0];

  const polygon = feature.getGeometry();
  view.fit(polygon);
  console.log(feature);
  console.log('loaded');
}); */

const highlightStyle = new Style({
  fill: new Fill({
    color: 'rgba(255,255,255,0.09)',
  }),
  stroke: new Stroke({
    color: '#9c0000',
    width: 0.9,
    lineDash: [4.5, 1.8]
  }),
});

let selected = null;

map.on('pointermove', function (evt) {
  if (evt.dragging) {
    return;
  }
  const pixel = evt.map.getEventPixel(evt.originalEvent);
  /* const hit = evt.map.forEachLayerAtPixel(pixel, function(feature){
    return feature.getLayersArray();
  }); */
  //console.log(hit);
  if (selected !== null) {
    selected.setStyle(undefined);
    selected = null;
  }
  const hit = map.forEachFeatureAtPixel(evt.pixel, function (f) {
    selected = f;
    f.setStyle(highlightStyle);
    return true;
  });
  //console.log(hit);
  map.getTargetElement().style.cursor = hit ? 'pointer' : '';
});

/* $(document).ready(function () {
  console.log("ready!");
  $('#map-info table').removeClass("featureInfo").addClass("table table-sm");
}); */

const gpDashboardClose = document.getElementById('gp-dashboard-close');
const checkAfdelingBlock = document.getElementById('checkAfdelingBlock');
const checkRoadBuilding = document.getElementById('checkRoadBuilding');
const blockFilter = document.getElementById('block-filter');

checkAfdelingBlock.addEventListener('change', (event) => {
  if (event.currentTarget.checked) {
    map.addLayer(wmsLayer);
    blockFilter.style.display = "";
  } else {
    map.removeLayer(wmsLayer);
    blockFilter.style.display = "none";
  }
  //gpDashboardClose.click();
});

checkRoadBuilding.addEventListener('change', (event) => {
  if (event.currentTarget.checked) {
    map.addLayer(wmsLayer1);
  } else {
    map.removeLayer(wmsLayer1);
  }
  //gpDashboardClose.click();
});

//const block = '26';
var prevAfdeling;
var prevBlock;


function selectAfdeling(afdelingid) {
  //console.log(afdeling);

  const afdelingSource1 = new VectorSource({
    url: 'http://localhost:8080/geoserver/Mopoli/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=Mopoli%3ASS_Digitasi_Batas_Afdeling&maxFeatures=50&outputFormat=application%2Fjson&srsname=EPSG:4326&featureId=SS_Digitasi_Batas_Afdeling.' + afdelingid,
    format: new GeoJSON(),
  });

  const afdelingStyle1 = new Style({
    stroke: new Stroke({
      color: '#c90000',
      width: 1.44,
    })
  });

  const afdelingLayer1 = new VectorLayer({
    source: afdelingSource1,
    style: afdelingStyle1,
  });

  if (prevAfdeling) {
    map.removeLayer(prevAfdeling);
  }

  map.addLayer(afdelingLayer1);
  prevAfdeling = afdelingLayer1;

  afdelingLayer1.getSource().on('featuresloadend', function () {

    const feature = afdelingSource1.getFeatures()[0];

    const afdelingPolygon = feature.getGeometry();
    view.fit(afdelingPolygon);
    //console.log(feature);
    //console.log(layers);
  });
}

function selectBlock(blockid){
  //console.log(block);

  const blockSource1 = new VectorSource({
    url: 'http://localhost:8080/geoserver/Mopoli/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=Mopoli%3ASS_Digitasi_Batas_Blok&maxFeatures=50&outputFormat=application%2Fjson&srsname=EPSG:4326&featureId=SS_Digitasi_Batas_Blok.' + blockid,
    format: new GeoJSON(),
  });

  const blockStyle1 = new Style({
    stroke: new Stroke({
      color: '#c90000',
      width: 1.44,
    })
  });

  const blockLayer1 = new VectorLayer({
    source: blockSource1,
    style: blockStyle1,
  });

  if (prevBlock){
    map.removeLayer(prevBlock);
  }

  map.addLayer(blockLayer1);
  prevBlock = blockLayer1;

  blockLayer1.getSource().on('featuresloadend', function () {

    const feature = blockSource1.getFeatures()[0];

    const blockPolygon = feature.getGeometry();
    view.fit(blockPolygon);
    //console.log(feature);
    //console.log(layers);
  });
}




var afdelingSelect = document.getElementById('select-afdeling');

afdelingSelect.onchange = function () {
  var elem = (typeof this.selectedIndex === "undefined" ? window.event.srcElement : this);
  var value = elem.value || elem.options[elem.selectedIndex].value;

  selectAfdeling(value);

  //console.log(value);
}

var blockSelect = document.getElementById('select-block');

blockSelect.onchange = function () {
  var elem = (typeof this.selectedIndex === "undefined" ? window.event.srcElement : this);
  var value = elem.value || elem.options[elem.selectedIndex].value;

  selectBlock(value);

  //console.log(value);
}

function setMapInfo(data){
  console.log(data);

  const infoDiv = document.body.querySelector('#info');
  const detailBlock = document.querySelector('#detail-block .value');
  const detailTree = document.querySelector('#detail-tree .value');
  const detailArea = document.querySelector('#detail-area .value');
  const detailDensity = document.querySelector('#detail-density .value');

  detailBlock.innerHTML = data.Block;
  detailTree.innerHTML = numeral(data.Jml_Sawit).format(',0');
  detailArea.innerHTML = numeral(data.Luas).format('0.00');
  detailDensity.innerHTML = numeral(data.Density).format('0.00');
  
  const infoToggle = document.body.querySelector('#info-toggled');
  if (infoToggle) {
    // Uncomment Below to persist sidebar toggle between refreshes
    // if (localStorage.getItem('sb|sidebar-toggle') === 'true') {
    //     document.body.classList.toggle('sb-sidenav-toggled');
    // }
    infoToggle.addEventListener('click', event => {
      event.preventDefault();
      document.body.classList.toggle('info-toggled');
      //localStorage.setItem('sb|sidebar-toggle', document.body.classList.contains('sb-sidenav-toggled'));
    });
  }
  infoDiv.classList.add('show');

}

function getBlockData(){
  const blocksJson = [];
  const blocksUrl = 'http://localhost:8080/geoserver/Mopoli/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=Mopoli%3ASS_Digitasi_Batas_Blok&maxFeatures=100&outputFormat=application%2Fjson&srsname=EPSG:32647';

  //var blockSelectData = [];

  fetch(blocksUrl)
    .then((response) => response.text())
    .then((json) => {
      //console.log(JSON.parse(json).features.length);
      let blocksJson = JSON.parse(json).features;
      if (blocksJson.length > 0){
        //console.log(blocksJson);
        let sa = 0;
        let sb = 0;
        let st = 0;
        let sd = 0;
        blocksJson.forEach(function(element){
          sa += (element.properties.Luas);
          sb++;
          st += (element.properties.Jml_Sawit);
          sd += (element.properties.Density);
          //console.log(element);
          let blockId = element.id.split('.')[1];
          //document.getElementById('select-block').append('<option value="' + blockId +'">Block' + element.properties.Block +'</option>');
          document.getElementById('select-block').add(new Option(element.properties.Block, blockId));
        });
        //console.log(sa);
        document.getElementById('stats-area').innerHTML = numeral(sa).format(',0.00');
        document.getElementById('stats-block').innerHTML = sb;
        document.getElementById('stats-tree').innerHTML = numeral(st).format(',0');
        document.getElementById('stats-density').innerHTML = numeral((sd/sb)).format('0.00');
      }

    });
    

  //console.log(blockSelectData);


  //console.log(blockSource.getFeatures());
}

window.addEventListener('DOMContentLoaded', event => {
  getBlockData();
});