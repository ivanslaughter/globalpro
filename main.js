import 'bootstrap/dist/css/bootstrap.min.css';
import './css/style.css';
import { Map, View, Overlay } from 'ol';
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

const isMobile = navigator.userAgentData.mobile;

let modalEdit = new Modal(document.getElementById('modalEdit'));
let formFeature = [];
let indexFeature = 0;
var mapInfo = new Modal(document.getElementById('mapInfo'));
var blockJSON;
//let gsHost = 'http://ec2-18-136-119-137.ap-southeast-1.compute.amazonaws.com:8080';
//let gsHost = 'http://ec2-52-221-242-95.ap-southeast-1.compute.amazonaws.com:8080';
let gsHost = 'http://localhost:8080';
let workSpace = 'Mopoli';

const mapCenter = fromLonLat([98.1969, 4.2667]);
const projection = new Projection({
  code: 'EPSG:4326',
  units: 'm',
});
const mapExtent = fromLonLat([98.1764, 4.2992, 98.2307, 4.2329]);

const afdelingSource = new VectorSource({
  url: gsHost + '/geoserver/' + workSpace + '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=' + workSpace + '%3ASS_Digitasi_Batas_Afdeling&maxFeatures=10&outputFormat=application%2Fjson&srsname=EPSG:4326',
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
  url: gsHost + '/geoserver/' + workSpace + '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=' + workSpace + '%3ASS_Digitasi_Batas_Blok&maxFeatures=100&outputFormat=application%2Fjson&srsname=EPSG:4326',
  format: new GeoJSON(),
});

const blockStyle = new Style({
  fill: new Fill({
    color: 'rgba(255,255,255,0.01)',
  }),
  stroke: new Stroke({
    color: '#c90000',
    width: 0.18,
    lineDash: [4.5, 1.8]
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
  url: gsHost + '/geoserver/' + workSpace + '/wms',
  params: { 'LAYERS': workSpace + ':Mopoli_Group' },
  serverType: 'geoserver',
});

const wmsSource1 = new ImageWMS({
  url: gsHost + '/geoserver/' + workSpace + '/wms',
  params: { 'LAYERS': workSpace + ':Mopoli_Group_01' },
  serverType: 'geoserver',
});

const wmsSource2 = new ImageWMS({
  url: gsHost + '/geoserver/' + workSpace + '/wms',
  params: { 'LAYERS': 'Mopoli:SS_Digitasi_Titik_Pokok_Sawit' },
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

const wmsLayer2 = new ImageLayer({
  //extent: [408380,467955,414599,475177],
  name: 'layer3',
  source: wmsSource2,
});

// const layers = [osmLayer, wmsLayer, wmsLayer1, afdelingLayer, blockLayer];
const layers = [osmLayer, wmsLayer2, wmsLayer];

const view = new View({
  //center: proj.transform([98.1969, 4.2667], 'EPSG:4326', 'EPSG:32647'),
  //projection: projection,
  center: mapCenter,
  pixelRatio: 1,
  padding: [99, 90, 99, 234],
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
      'exceptions': 'application/vnd.ogc.se_inimage',
      //'INFO_FORMAT': 'text/html',
      'INFO_FORMAT': 'application/json',
      'FEATURE_COUNT': '100',
      'X': '50',
      'Y': '50',
      //'SRS':'EPSG:32647',
    }
  );

  if (url) {
    fetch(url)
      .then((response) => response.text())
      .then((json) => {
        // console.log(json);
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
        // console.log(layerJson);

        //console.log(layerJson.features.length);

        if (layerJson.features.length !== 0) {
          const layerId = layerJson.features[0].id
          const blockId = layerId ? layerId.split('.')[0] : '';
          const layerProperties = layerJson.features[0].properties;

          // console.log(blockId);

          // selectBlock(blockId);

          // setMapInfo(layerProperties);


          setMapInfos(layerJson);
          selectMap(layerJson);
          // editFeature(layerId, layerProperties);
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
const checkMap = document.getElementById('checkMap');
const checkAfdelingBlock = document.getElementById('checkAfdelingBlock');
const checkPokok = document.getElementById('checkPokok');
// const checkRoadBuilding = document.getElementById('checkRoadBuilding');
const blockFilter = document.getElementById('block-filter');

checkMap.addEventListener('change', (event) => {
  if (event.currentTarget.checked) {
    osmLayer.setVisible(true);
    blockFilter.style.display = "";
  } else {
    osmLayer.setVisible(false);
    blockFilter.style.display = "none";
  }
  //gpDashboardClose.click();
});

checkAfdelingBlock.addEventListener('change', (event) => {
  if (event.currentTarget.checked) {
    wmsLayer.setVisible(true);
    blockFilter.style.display = "";
  } else {
    wmsLayer.setVisible(false);
    blockFilter.style.display = "none";
  }
  //gpDashboardClose.click();
});

checkPokok.addEventListener('change', (event) => {
  if (event.currentTarget.checked) {
    wmsLayer2.setVisible(true);
    blockFilter.style.display = "";
  } else {
    wmsLayer2.setVisible(false);
    blockFilter.style.display = "none";
  }
  //gpDashboardClose.click();
});

// checkRoadBuilding.addEventListener('change', (event) => {
//   if (event.currentTarget.checked) {
//     map.addLayer(wmsLayer1);
//   } else {
//     map.removeLayer(wmsLayer1);
//   }
//   //gpDashboardClose.click();
// });

//const block = '26';
var prevAfdeling;
var prevBlock;
let prevSelected = [];


function selectAfdeling(afdelingid) {
  //console.log(afdeling);

  const afdelingSource1 = new VectorSource({
    url: gsHost + '/geoserver/' + workSpace + '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=' + workSpace + '%3ASS_Digitasi_Batas_Afdeling&maxFeatures=50&outputFormat=application%2Fjson&srsname=EPSG:4326&featureId=SS_Digitasi_Batas_Afdeling.' + afdelingid,
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

function selectBlock(blockid) {
  //console.log(block);

  const blockSource1 = new VectorSource({
    url: gsHost + '/geoserver/' + workSpace + '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=' + workSpace + '%3ASS_Digitasi_Batas_Blok&maxFeatures=100&outputFormat=application%2Fjson&srsname=EPSG:4326&featureId=SS_Digitasi_Batas_Blok.' + blockid,
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

  if (prevBlock) {
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

  // console.log(value);
}

function setMapInfo(data) {
  // console.log(data);

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

function getBlockData() {
  const blocksJson = [];
  const blocksUrl = gsHost + '/geoserver/' + workSpace + '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=' + workSpace + '%3ASS_Digitasi_Batas_Blok&maxFeatures=100&outputFormat=application%2Fjson&srsname=EPSG:32647';

  //var blockSelectData = [];

  fetch(blocksUrl)
    .then((response) => response.text())
    .then((json) => {
      //console.log(JSON.parse(json).features.length);
      let blocksJson = JSON.parse(json).features;
      if (blocksJson.length > 0) {
        //console.log(blocksJson);
        let sa = 0;
        let sb = 0;
        let st = 0;
        let sd = 0;
        blocksJson.forEach(function (element) {
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
        document.getElementById('stats-density').innerHTML = numeral((sd / sb)).format('0.00');
      }

    });


  //console.log(blockSelectData);


  //console.log(blockSource.getFeatures());
}

//EDIT SEPRI

function setMapInfos(layerJson) {
  const selectedLayers = layerJson.features;
  let content = `<div class="justify-content-between"><span class="detail-info-title">Detail Info</span><button type="button" class="btn-close btn-close-white" data-bs-toggle="collapse" data-bs-target="#info" aria-label="Close"></button></div>`;
  let prevLayer = "";
  formFeature = [];
  const featureNames = ['Afdeling', 'Blok', 'Jalan', 'Bangunan', 'Sungai', 'Jembatan'];
  let featureName;
  selectedLayers.forEach(function (element, i) {
    if (prevLayer !== element.id.split('.')[0]) {
      const arrCol = Object.keys(element.properties);
      let featureTitle = '';
      featureName = element.id.split('.')[0].split('_');
      featureNames.forEach(function (element) {
        if (featureName.includes(element)) {
          featureTitle = element;
        }
      })
      content += `<div class="row g-0 align-items-center justify-content-start my-2 p-2 feature-box">
      <div class="col feature-title"><span class="fw-bolder">${featureTitle}</span></div>`;
      arrCol.forEach(element_ => {
        if (element_ != 'Id') {
          content += `<div id="${element_}" class="col d-flex flex-column">
          <span class="label text-muted me-2">${element_}</span>
          <span class="value">${isNaN(element.properties[element_]) ? element.properties[element_] : numeral(element.properties[element_]).format(',0')}</span>
          </div>`;
        }
      });
      content += `<button id="edit-feature" data-index="${i}" type="button" class="btn btn-warning btn-sm col" data-toggle="modal" data-target="#modalEdit">Edit</button>`;
      content += '</div>';
      prevLayer = element.id.split('.')[0];
      editFeature(i, element.id, element.properties);
    }
  });
  $('#detail-info').html(content);

  const infoDiv = document.body.querySelector('#info');
  const infoToggle = document.body.querySelector('#info-toggled');
  if (infoToggle) {
    infoToggle.addEventListener('click', event => {
      event.preventDefault();
      document.body.classList.toggle('info-toggled');
    });
  }
  infoDiv.classList.add('show');
}

function selectMap(layerJson) {
  let selectSource = [];
  let selectLayer = [];

  const selectStyle = new Style({
    stroke: new Stroke({
      color: '#c90000',
      width: 1.44,
    })
  });

  layerJson.features.forEach(element => {
    const source = new VectorSource({
      url: gsHost + `/geoserver/` + workSpace + `/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=` + workSpace + `:${element.id.split('.')[0]}&maxFeatures=50&outputFormat=application%2Fjson&srsname=EPSG:4326&featureId=${element.id}`,
      format: new GeoJSON(),
    });

    selectSource.push(source);

    selectLayer.push(
      new VectorLayer({
        source: source,
        style: selectStyle,
      })
    )
  });

  if (prevSelected.length > 0) {
    prevSelected.forEach(element => {
      map.removeLayer(element);
    });
  }

  selectLayer.forEach(element => {
    map.addLayer(element);
  });
  prevSelected = selectLayer;

  selectLayer[1].getSource().on('featuresloadend', function () {
    const feature = selectSource[1].getFeatures()[0];
    const blockPolygon = feature.getGeometry();
    view.fit(blockPolygon, { padding: [0, 0, 200, 0] });
    //console.log(feature);
    //console.log(layers);
  });
}

function editFeature(i, layerId, layerProperties) {
  let content = `<div class="modal-body">`;

  const arrCol = Object.keys(layerProperties);
  arrCol.forEach(element => {
    content += `<div class="mb-2"><label for="${layerId.split('.')[0] + "-" + element}">${element}</label><input class="form-control" type="text" id="${layerId.split('.')[0] + "-" + element}" value='${layerProperties[element]}'></div>`;
  });

  content += '</div>';

  let footer = `<button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
  <button id="save-feature" data-index="${i}" type="button" class="btn btn-success btn-sm">Save</button>`;

  formFeature.push({
    layerId, content, arrCol, footer
  });

  $('#detail-info').on('click', '#edit-feature', function () {
    indexFeature = $(this).data('index');
    $('#formBody').html(formFeature[$(this).data('index')].content);
    $('#formFooter').html(formFeature[$(this).data('index')].footer);
    modalEdit.show();
  });

  $('#formFooter').on('click', '#save-feature', function () {
    indexFeature = $(this).data('index');
    saveFeature();
  });
}

function saveFeature() {
  let arrData = [];
  formFeature[indexFeature].arrCol.forEach(element => {
    arrData.push($(`#${formFeature[indexFeature].layerId.split('.')[0] + "-" + element}`).val());
  });

  var url = gsHost + '/geoserver/wfs';
  var postData =
    '<wfs:Transaction service="WFS" version="1.3.0"\n' +
    'xmlns:ogc="http://www.opengis.net/ogc"\n' +
    'xmlns:wfs="http://www.opengis.net/wfs"\n' +
    'xmlns:gml="http://www.opengis.net/gml"\n' +
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n' +
    'xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/WFS-transaction.xsd">\n' +
    `<wfs:Update typeName="` + workSpace + `:${formFeature[indexFeature].layerId.split('.')[0]}">\n`;

  formFeature[indexFeature].arrCol.forEach(function (element, i) {
    postData += '<wfs:Property>\n' +
      `<wfs:Name>${element}</wfs:Name>\n` +
      '<wfs:Value>\n' +
      arrData[i] + '\n' +
      '</wfs:Value>\n' +
      '</wfs:Property>\n';
  });

  postData += '<ogc:Filter>\n' +
    '<ogc:FeatureId fid="' + formFeature[indexFeature].layerId + '"/>\n' +
    '</ogc:Filter>\n' +
    '</wfs:Update>\n' +
    '</wfs:Transaction>\n';

  // console.log(postData);

  $.ajax({
    url: url,
    type: "POST",
    data: postData,
    contentType: "text/xml",
    success: function (response) {
      // console.log(response);
      // alert('Berhasil menyimpan data');
      // modalEdit.hide();
      location.reload();
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log(textStatus, errorThrown);
      alert('Gagal menyimpan data');
    }
  });
}

/* const ctapi = new CloudTablesApi('mj1826e6oh', 'J1YyYzyXPIxUsrY2Kxn0FXcN', {
  clientId: 'global_pro',
  clientName: 'Global Pro'
});

async function getCloudData(){
  let token = await ctapi.token();
  let script = `
    <script
      src="https://mj1826e6oh.cloudtables.io/loader/Velocity/table/d"
      data-token="${token}"
    ></script>
    `;
  
  let result = ctapi.dataset('Velocity').row(0).data();
  console.log(result);
}
 */

window.addEventListener('DOMContentLoaded', event => {
  if (isMobile) {
    document.querySelector("body").classList.add('mobile');
  }
  //getCloudData();
  getBlockData();
});

const menuToggle = document.getElementById('menu-toggle');
menuToggle.addEventListener('click', event => {
  if(!isMobile){
    document.querySelector('body').classList.add('mobile');
  }
})