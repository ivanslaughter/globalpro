import 'bootstrap/dist/css/bootstrap.min.css';
import './css/style.css';
import isMobile from './mobile.js';
import { Map, View, Overlay } from 'ol';
import { Draw, Modify, Select, Snap } from 'ol/interaction';
import MousePosition from 'ol/control/MousePosition';
import { Image as ImageLayer, Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import ImageWMS from 'ol/source/ImageWMS';
import TileWMS from 'ol/source/TileWMS';
import TileJSON from 'ol/source/TileJSON'
import GeoJSON from 'ol/format/GeoJSON';
import GML from 'ol/format/GML';
import VectorSource from 'ol/source/Vector'
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import OSM from 'ol/source/OSM';
import { createStringXY } from 'ol/coordinate';
import { ScaleLine, OverviewMap, ZoomToExtent, defaults as defaultControls } from 'ol/control';
import { fromLonLat, useGeographic, Projection, transformExtent } from 'ol/proj';
import { Modal, Offcanvas } from 'bootstrap';
import numeral from 'numeral';
import { firestore, auth } from './firebase';
import { Timestamp } from 'firebase/firestore';
import { showAlert, startLoadingButton, stopLoadingButton } from './animated';
import WebFont from 'webfontloader';
import nameFormatter from './name-formatter';

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

numeral.locale('id');

WebFont.load({
  google: {
    families: ['IBM Plex Sans Condensed:300,400,500,600,700']
  }
});

let formFeature = {};
let selectedSource = null;
let selectedLayer = null;
let selectedFilter = "blok";
let prevSelected = null;

//let gsHost = 'http://ec2-18-136-119-137.ap-southeast-1.compute.amazonaws.com:8080';
//let gsHost = 'http://ec2-18-142-49-57.ap-southeast-1.compute.amazonaws.com:8080';
let gsHost = 'http://128.199.253.151:8080';
// let gsHost = 'http://localhost:8080';

const user = JSON.parse(localStorage.getItem('gp|user'));
const company = JSON.parse(localStorage.getItem('gp|company'));
const kebuns = JSON.parse(localStorage.getItem('gp|kebuns'));
const selected_kebun = localStorage.getItem('gp|selected_kebun')

let workSpace = kebuns ? kebuns[selected_kebun].geoserver.workspace : '';
let layerAfdeling = kebuns ? kebuns[selected_kebun].geoserver.layer_afdeling : '';
let layerBlock = kebuns ? kebuns[selected_kebun].geoserver.layer_block : '';
let layerGroup = kebuns ? kebuns[selected_kebun].geoserver.layer_group : '';
let layerTree = kebuns ? kebuns[selected_kebun].geoserver.layer_tree : '';
let layerRaster = kebuns ? kebuns[selected_kebun].geoserver.layer_raster : [];

const mainStats = document.getElementById('main-stats');
const subStats = document.getElementById('sub-stats');

const mapCenter = fromLonLat([98.1969, 4.2667]);

function transform(extent) {
  return transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
}

const mapExtent = transform([98.17655462693399, 4.233276920014973, 98.2303961838639, 4.298548400759917]);

let mapPadding = [50, 198, 216, 247.68];
if (isMobile()) {
  mapPadding = [90, 30, 90, 90];
}

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
  projection: 'EPSG:32647',
  // comment the following two lines to have the mouse position
  // be placed within the map.
  className: 'custom-mouse-position',
  target: document.getElementById('mouse-position'),
});

const wmsSourceGroup = new ImageWMS({
  url: gsHost + '/geoserver/' + workSpace + '/wms',
  params: { 'LAYERS': workSpace + `:${layerGroup}` },
  serverType: 'geoserver',
});

const wmsSourceTree = new ImageWMS({
  url: gsHost + '/geoserver/' + workSpace + '/wms',
  params: { 'LAYERS': workSpace + `:${layerTree}` },
  serverType: 'geoserver',
});

const osmLayer = new TileLayer({
  source: new OSM()
});

const wmsTree = new ImageLayer({
  //extent: [408380,467955,414599,475177],
  name: 'layer3',
  source: wmsSourceTree,
});

const wsmGroup = new ImageLayer({
  //extent: [408380,467955,414599,475177],
  name: 'layer1',
  source: wmsSourceGroup,
});

const tlRaster = [];
layerRaster.forEach(element => {
  const sourceRaster = new TileJSON({
    url: element,
    tileSize: 256,
    crossOrigin: 'anonymous'
  });

  tlRaster.push(new TileLayer({
    //extent: [408380,467955,414599,475177],
    name: 'layer-raster',
    source: sourceRaster,
  }));
});

// 
const layers = [osmLayer].concat(tlRaster);
layers.push(wmsTree);
layers.push(wsmGroup);

const view = new View({
  //center: proj.transform([98.1969, 4.2667], 'EPSG:4326', 'EPSG:32647'),
  //projection: projection,
  center: mapCenter,
  pixelRatio: 1,
  padding: mapPadding,
  zoom: 14,
});

const map = new Map({
  controls: defaultControls().extend([mousePositionControl, overviewMapControl, new ScaleLine()]),
  target: 'map',
  layers: layers,
  view: view,
});

map.getView().fit(mapExtent);

map.on('singleclick', function (evt) {
  const viewResolution = /** @type {number} */ (view.getResolution());
  const url = wmsSourceGroup.getFeatureInfoUrl(
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
        const layerJson = JSON.parse(json);
        if (layerJson.features.length !== 0) {
          selectMap(layerJson);
        }
      });
  }
});

// let selected = null;
// const highlightStyle = new Style({
//   fill: new Fill({
//     color: 'rgba(255,255,255,0.3)',
//   }),
//   stroke: new Stroke({
//     color: '#0000FF',
//     width: 3,
//     lineDash: [4.5, 1.8]
//   }),
// });

// map.on('pointermove', function (evt) {
//   if (evt.dragging) {
//     return;
//   }
//   if (selected !== null) {
//     selected.setStyle(undefined);
//     selected = null;
//   }
//   const hit = map.forEachFeatureAtPixel(evt.pixel, function (f) {
//     selected = f;
//     f.setStyle(highlightStyle);
//     return true;
//   });
//   // console.log(hit);
//   map.getTargetElement().style.cursor = hit ? 'pointer' : '';
// });

const gpDashboardClose = document.getElementById('gp-dashboard-close');
const checkMap = document.getElementById('checkMap');
const checkRaster = document.getElementById('checkRaster');
const checkGroup = document.getElementById('checkGroup');
const checkTree = document.getElementById('checkTree');

checkMap.addEventListener('change', (event) => {
  if (event.currentTarget.checked) {
    osmLayer.setVisible(true);
  } else {
    osmLayer.setVisible(false);
  }
  //gpDashboardClose.click();
});

checkRaster.addEventListener('change', (event) => {
  if (event.currentTarget.checked) {
    tlRaster.forEach(element => {
      element.setVisible(true);
    });
  } else {
    tlRaster.forEach(element => {
      element.setVisible(false);
    });
  }
  //gpDashboardClose.click();
});

checkGroup.addEventListener('change', (event) => {
  if (event.currentTarget.checked) {
    wsmGroup.setVisible(true);
  } else {
    wsmGroup.setVisible(false);
  }
  //gpDashboardClose.click();
});

checkTree.addEventListener('change', (event) => {
  if (event.currentTarget.checked) {
    wmsTree.setVisible(true);
  } else {
    wmsTree.setVisible(false);
  }
  //gpDashboardClose.click();
});

//EDIT SEPRI

function getKebunData() {
  const afdelingUrl = gsHost + '/geoserver/' + workSpace + '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=' + workSpace + `:${layerAfdeling}&outputFormat=application%2Fjson&srsname=EPSG:32647`;
  fetch(afdelingUrl)
    .then((response) => response.text())
    .then((json) => {
      // console.log(JSON.parse(json));
      let afdelingJson = JSON.parse(json).features;
      document.getElementById('stats-afdeling').innerHTML = afdelingJson.length;
    });

  const blockUrl = gsHost + '/geoserver/' + workSpace + '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=' + workSpace + `:${layerBlock}&outputFormat=application%2Fjson&srsname=EPSG:32647`;
  fetch(blockUrl)
    .then((response) => response.text())
    .then((json) => {
      // console.log(JSON.parse(json));
      let blocksJson = JSON.parse(json).features;
      if (blocksJson.length > 0) {
        let sa = 0;
        let sb = 0;
        let st = 0;
        let sd = 0;
        blocksJson.forEach(function (element) {
          sa += (element.properties.Luas);
          sb++;
          st += (element.properties.Jml_Sawit);
          sd += (element.properties.Density);
        });
        document.getElementById('stats-area').innerHTML = numeral(sa).format(',0.0');
        document.getElementById('stats-block').innerHTML = sb;
        document.getElementById('stats-tree').innerHTML = numeral(st).format(',0');
        document.getElementById('stats-density').innerHTML = numeral((sd / sb)).format('0.');
      }
    });
}

$('#selectAfdeling').on('change', (event) => {
  selectedFilter = "afdeling";
  reset.selectFilter('selectAfdeling');
});
$('#selectBlock').on('change', (event) => {
  selectedFilter = "blok";
  reset.selectFilter('selectBlock');
});
$('#selectRoad').on('change', (event) => {
  selectedFilter = "jalan";
  reset.selectFilter('selectRoad');
});
$('#selectBuilding').on('change', (event) => {
  selectedFilter = "bangunan";
  reset.selectFilter('selectBuilding');
});
$('#selectRiver').on('change', (event) => {
  selectedFilter = "sungai";
  reset.selectFilter('selectRiver');
});
$('#selectBridge').on('change', (event) => {
  selectedFilter = "jembatan";
  reset.selectFilter('selectBridge');
});

const reset = {
  selectFilter: function (id) {
    if (selectedLayer) {
      this.mapView();
    }
    const ids = ['selectAfdeling', 'selectBlock', 'selectRoad', 'selectBuilding', 'selectRiver', 'selectBridge'];
    ids.forEach(element => {
      if (element !== id) {
        $(`#${element}`).prop('checked', false);
        $(`#${element}`).removeAttr("disabled");
      } else {
        $(`#${element}`).attr("disabled", true);
      }
    });
  },
  mapView: function () {
    map.removeLayer(selectedLayer);
    selectedSource = null;
    selectedLayer = null;
    ModifyLayer.setActive(false);
    subStats.innerHTML = '';
    subStats.classList.remove('show');
    mainStats.classList.add('show');
    const infoDiv = document.body.querySelector('#info');
    infoDiv.classList.remove('show');
    map.getView().setZoom(14);
  }
}

const ModifyLayer = {
  init: function () {
    this.select = new Select();
    map.addInteraction(this.select);

    this.modify = new Modify({
      features: this.select.getFeatures(),
    });

    map.addInteraction(this.modify);

    this.setEvents();
  },
  setEvents: function () {
    const selectedFeatures = this.select.getFeatures();
    this.select.on('change:active', function () {
      selectedFeatures.forEach(function (each) {
        selectedFeatures.remove(each);
      });
    });
  },
  setActive: function (active) {
    this.select.setActive(active);
    this.modify.setActive(active);
  },
};

const modalFeature = new Modal(document.getElementById('modalFeature'));

function setMapInfos(layerJson) {
  const selectedLayers = layerJson.features;
  let content = '';
  let prevLayer = "";
  let nullLayer = true;
  let layerId = "";
  let layerName = "";
  selectedLayers.forEach(function (element) {
    if (prevLayer !== element.id.split('.')[0]) {
      const arrCol = Object.keys(element.properties);
      let featureName = element.id.split('.')[0].split('_');
      featureName.forEach(function (title) {
        if (selectedFilter.includes(title.toLowerCase())) {
          content += `<div class="d-grid gap-2 mb-1 mt-2"><div class="stats-title">Info <div class="stats-title-text">${title}</div></div>
          <button id="back-stats" class="btn btn-outline-warning btn-sm lh-1"><i class="jt-chevron-left"></i> Back</button></div>
          <div class="d-flex flex-column mt-2">`;
          arrCol.forEach(element_ => {
            if (element_ != 'Id') {
              const el_label = element_.replace('_', ' ');
              content += `
              <div id="${element_}" class="stats-box">
              <div class="stats-label">${el_label[0].toUpperCase() + el_label.slice(1)}</div>
              <div id="stats-density" class="stats-value">${isNaN(element.properties[element_]) ? element.properties[element_] : numeral(element.properties[element_]).format(',0')}</div>
            </div>`;
            }

            if (element_.toLowerCase() === 'block' || element_.toLowerCase() === 'blok')
              layerName = 'Blok ' + element.properties[element_];
          });
          // content += `<button id="edit-geom" hidden type="button" class="btn btn-warning btn-sm col mt-3">Save Geometri</button>`;
          content += `<button id="edit-feature" type="button" class="btn btn-warning btn-sm col mt-3" data-toggle="modal" data-target="#modalFeature">Edit Data</button>`;
          content += '</div>';
          prevLayer = element.id.split('.')[0];
          layerId = element.id;
          nullLayer = false;
          showModalFeature(element.id, element.properties);
        }
      })
    }
  });

  /* const statsTitleTxt = document.querySelector('.stats-title-text');
  function isEllipsisActive(e) {
    return (e.offsetWidth < e.scrollWidth);
  } */

  if (!nullLayer) {
    mainStats.classList.remove('show');
    subStats.innerHTML = content;
    subStats.classList.add('show');
    const statsTitleTxt = document.querySelector('.stats-title-text');
    if (isMobile()) {
      if (statsTitleTxt.offsetWidth < statsTitleTxt.scrollWidth) {
        statsTitleTxt.style.setProperty('font-size', '0.72em');
      }
    }

    document.getElementById('back-stats').addEventListener('click', event => {
      reset.mapView();
      map.getView().fit(mapExtent);
    });

    if (selectedFilter === 'blok') {
      getBlokData(layerId, layerName);
    }
  }
}

function getBlokData(layerId, layerName) {
  $('#detail-info').html('');

  firestore.getBlokColls().then(function (collections) {
    collections.forEach(element => {
      firestore.getBlokData(company.collection, kebuns[selected_kebun].collection, element.collection, layerId).then(function (data) {
        let content = `<div class="col-sm">`;
        content += `<div class="d-flex align-items-center">
      <div class="stats-title align-middle">${element.collection[0].toUpperCase() + element.collection.slice(1)}</div>
      <button id="add-data-blok" data-coll="${element.collection}" data-fields="${element.fields}" class="btn btn-outline-warning btn-sm btn-block lh-1 m-2"><i class="jt-plus"></i></button>
      </div>`;

        if (data) {
          let titleTable = "";
          let tableBody = "";
          let th = false;

          const titleArr = Object.keys(data.data[0]);
          data.data.forEach(element_ => {
            titleArr.forEach(subelement => {
              const title = subelement.replace('_', ' ');
              if (!th)
                titleTable = titleTable + `<th>${title[0].toUpperCase() + title.slice(1)}</th>`;
              tableBody = tableBody + `<td>${subelement === 'tanggal' ? element_[subelement].toDate().toLocaleString('id-ID').split(' ')[0] : element_[subelement]}</td>`;
            });
            th = true;
            tableBody = tableBody + "<tr>";
          });

          content += `
          <table class="table table-sm">
              <thead>
                  <tr>${titleTable}</tr>
              </thead>
              <tbody>
                  <tr>${tableBody}</tr>
              </tbody>
          </table>
        `;
        } else {
          content += `<div class="mb-2">Belum ada data</div>`;
        }

        content += `</div>`;
        $('#detail-info').append(content);

        const infoDiv = document.body.querySelector('#info');
        const infoToggle = document.body.querySelector('#info-toggled');
        if (infoToggle) {
          infoToggle.addEventListener('click', event => {
            event.preventDefault();
            document.body.classList.toggle('info-toggled');
          });
        }
        infoDiv.classList.add('show');

      });
    });

    showModalBlok(layerId, layerName);
  })
}

const modalBlok = new Modal(document.getElementById('modalBlok'));

function showModalBlok(layerId, layerName) {
  const formBlok = (coll, fields) => {
    let content = `<div class="modal-body">`;

    fields.forEach(element => {
      const el_label = element.replace('_', ' ');
      content += `<label class="mt-1" for="${layerId.replace('.', '_') + "-" + coll + "-" + element}">${el_label[0].toUpperCase() + el_label.slice(1)}</label><input class="form-control" type="${element === 'tanggal' ? 'date' : 'text'}" id="${layerId.replace('.', '_') + "-" + coll + "-" + element}" value=''>`;
    });

    content += '<div id="alert-blok"></div></div>';

    const footer = `<button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
    <button id="save-data-blok" data-layer_id="${layerId}" data-layer_name="${layerName}" data-coll="${coll}" data-fields="${fields}" type="button" class="btn btn-success btn-sm">Save</button>`;

    return {
      content,
      footer
    }
  }

  $('#info').on('click', '#add-data-blok', function () {
    const coll = $(this).attr("data-coll");
    const fields = $(this).attr("data-fields").split(',');

    $('#modalBlokTitle').text(`Tambah data ${coll}`)
    $('#bodyBlok').html(formBlok(coll, fields).content);
    $('#footerBlok').html(formBlok(coll, fields).footer);
    modalBlok.show();
  });
}

$('#footerBlok').on('click', '#save-data-blok', function () {
  startLoadingButton('save-data-blok');
  const coll = $(this).attr("data-coll");
  const fields = $(this).attr("data-fields").split(',');
  const layer_id = $(this).attr("data-layer_id");
  const layer_name = $(this).attr("data-layer_name");

  let data = {};
  let nullValue = false;
  fields.forEach(element => {
    if ($(`#${layer_id.replace('.', '_') + "-" + coll + "-" + element}`).val() === '')
      nullValue = true;

    if (element === 'tanggal')
      data[element] = Timestamp.fromDate(new Date($(`#${layer_id.replace('.', '_') + "-" + coll + "-" + element}`).val()));
    else
      data[element] = $(`#${layer_id.replace('.', '_') + "-" + coll + "-" + element}`).val();

  });

  const docData = {
    data: [data],
    layer_id,
    layer_name
  }

  if (nullValue) {
    stopLoadingButton('save-data-blok');
    showAlert('alert-blok', 'alert-danger', 'Mohon lengkapi data');

    return;
  }

  firestore.saveBlokData(company.collection, kebuns[selected_kebun].collection, coll, layer_id, docData).then(() => {
    stopLoadingButton('save-data-blok');
    modalBlok.hide();
    getBlokData(layer_id, layer_name);
  })
});

function showModalFeature(layerId, layerProperties) {
  let content = `<div class="modal-body">`;

  const arrCol = Object.keys(layerProperties);
  arrCol.forEach(element => {
    const el_label = element.replace('_', ' ');
    content += `<label class="mt-1" for="${layerId.replace('.', '_') + "-" + element}">${el_label[0].toUpperCase() + el_label.slice(1)}</label><input class="form-control" type="text" id="${layerId.replace('.', '_') + "-" + element}" value='${layerProperties[element]}'>`;
  });

  content += '<div id="alert-feature"></div></div>';

  let footer = `<button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
  <button id="save-feature" type="button" class="btn btn-success btn-sm">Save</button>`;

  formFeature = {
    layerId, content, arrCol, footer
  };
}

$('#sub-stats').on('click', '#edit-feature', function () {
  $('#bodyFeature').html(formFeature.content);
  $('#footerFeature').html(formFeature.footer);
  modalFeature.show();
});

$('#footerFeature').on('click', '#save-feature', function () {
  startLoadingButton('save-feature');
  saveFeature();
});

function selectMap(layerJson) {
  let prevLayer = "";
  let nullLayer = true;
  const selectStyle = new Style({
    fill: new Fill({
      color: 'rgba(255,255,255,0.1)',
    }),
    stroke: new Stroke({
      color: '#FF0000',
      width: 3,
      lineDash: [4.5, 1.8]
    }),
  });

  layerJson.features.forEach(element => {
    if (prevLayer !== element.id.split('.')[0]) {
      let layerNames = element.id.split('.')[0].split('_');
      layerNames.forEach(function (element_) {
        if (selectedFilter.includes(element_.toLowerCase())) {
          const url = gsHost + `/geoserver/` + workSpace + `/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=` + workSpace + `:${element.id.split('.')[0]}&outputFormat=application%2Fjson&srsname=EPSG:4326&featureId=${element.id}`;
          if (!selectedLayer || selectedLayer.values_.source.url_ !== url) {
            const source = new VectorSource({
              // &featureId=${element.id}
              url: gsHost + `/geoserver/` + workSpace + `/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=` + workSpace + `:${element.id.split('.')[0]}&outputFormat=application%2Fjson&srsname=EPSG:4326&featureId=${element.id}`,
              format: new GeoJSON(),
            });

            selectedSource = source;

            selectedLayer = new VectorLayer({
              source: source,
              style: selectStyle,
            })

            prevLayer = element.id.split('.')[0];
          }
          nullLayer = false;
        }
      })
    }
  });

  if (!nullLayer) {
    if (prevSelected) {
      if (selectedLayer.values_.source.url_ !== prevSelected.values_.source.url_) {
        map.removeLayer(prevSelected);
        setSelectMap();
        setMapInfos(layerJson);
      } 
      // else {
      //   $('#edit-geom').show();
      // }
    } else {
      setSelectMap();
      setMapInfos(layerJson);
    }
  }
}

function setSelectMap() {
  map.addLayer(selectedLayer);
  prevSelected = selectedLayer;

  selectedLayer.getSource().on('featuresloadend', function () {
    const feature = selectedSource.getFeatures()[0];
    const blockPolygon = feature.getGeometry();
    // , { padding: [0, 0, 0, 0] }
    view.fit(blockPolygon);
    ModifyLayer.init();
  });
}

function saveFeature() {
  let arrData = [];
  let nullValue = false;
  formFeature.arrCol.forEach(element => {
    if ($(`#${formFeature.layerId.replace('.', '_') + "-" + element}`).val() === '')
      nullValue = true;

    arrData.push($(`#${formFeature.layerId.replace('.', '_') + "-" + element}`).val());
  });

  if (nullValue) {
    stopLoadingButton('save-feature');
    showAlert('alert-feature', 'alert-danger', 'Mohon lengkapi data');

    return;
  }

  var feat_mod = selectedLayer.getSource().getFeatures();
  var coords = feat_mod[0].getGeometry();
  var format = new GML({
    //4326
    srsName: 'urn:ogc:def:crs:EPSG::3857'
  });
  var gml3 = format.writeGeometry(coords, {
    featureProjection: 'urn:ogc:def:crs:EPSG::3857',
  });

  var url = gsHost + '/geoserver/wfs';
  var postData =
    '<wfs:Transaction service="WFS" version="1.1.0"\n' +
    'xmlns:ogc="http://www.opengis.net/ogc"\n' +
    'xmlns:wfs="http://www.opengis.net/wfs"\n' +
    'xmlns:gml="http://www.opengis.net/gml"\n' +
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n' +
    'xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/WFS-transaction.xsd">\n' +
    `<wfs:Update typeName="` + workSpace + `:${formFeature.layerId.split('.')[0]}">\n` +
    '<wfs:Property>\n' +
    '<wfs:Name>the_geom</wfs:Name>\n' +
    '<wfs:Value>\n' +
    gml3 + '\n' +
    '</wfs:Value>\n' +
    '</wfs:Property>\n';

  formFeature.arrCol.forEach(function (element, i) {
    postData += '<wfs:Property>\n' +
      `<wfs:Name>${element}</wfs:Name>\n` +
      '<wfs:Value>\n' +
      arrData[i] + '\n' +
      '</wfs:Value>\n' +
      '</wfs:Property>\n';
  });

  postData += '<ogc:Filter>\n' +
    '<ogc:FeatureId fid="' + formFeature.layerId + '"/>\n' +
    '</ogc:Filter>\n' +
    '</wfs:Update>\n' +
    '</wfs:Transaction>\n';

  // console.log(formFeature.layerId);

  $.ajax({
    url: url,
    type: "POST",
    data: postData,
    contentType: "text/xml",
    success: function (response) {
      stopLoadingButton('save-feature');
      console.log(response);
      // alert('Berhasil menyimpan data');
      // modalFeature.hide();
      location.reload();
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log(textStatus, errorThrown);
      alert('Gagal menyimpan data');
    }
  });
}

const farmSelect1 = document.getElementById('farm-select-1');
const farmSelect2 = document.getElementById('farm-select-2');

function farmSelectOptions() {
  kebuns.forEach((element, index) => {
    var option = document.createElement("option");
    option.text = element.nama_kebun;
    option.value = index;
    farmSelect1.add(option);

    var option1 = document.createElement("option");
    option1.text = element.nama_kebun;
    option1.value = index;
    farmSelect2.add(option1);

  });
  farmSelect1.selectedIndex = selected_kebun;
  farmSelect2.selectedIndex = selected_kebun;
}

farmSelect1.addEventListener('change', (event) => {
  // console.log(farmSelect1.selectedIndex);
  if (farmSelect1.selectedIndex != selected_kebun) {
    localStorage.setItem('gp|selected_kebun', farmSelect1.selectedIndex);
    location.reload();
  }
});

farmSelect2.addEventListener('change', (event) => {
  // console.log(farmSelect2.selectedIndex);
  if (farmSelect2.selectedIndex != selected_kebun) {
    localStorage.setItem('gp|selected_kebun', farmSelect2.selectedIndex);
    location.reload();
  }
});

const modalLogin = new Modal(document.getElementById('authentication'), { keyboard: false });
const userLogin = document.getElementById('login');
const userLogout = document.getElementById('logout');
const onLogin = document.getElementById('onLogin');

userLogin.addEventListener('click', event => {
  localStorage.setItem('gp|logged-on', 'true');
  document.querySelector('.logged-off').classList.toggle('show');
  document.querySelector('.logged-on').classList.toggle('show');
});

if (localStorage.getItem('gp|logged-on') === 'true') {
  userLogout.addEventListener('click', event => {
    auth.userSignOut();
  });
}

onLogin.addEventListener('click', event => {
  startLoadingButton('onLogin');
  const email = $("#email").val();
  const password = $("#password").val();
  auth.userSignIn(email, password);
})

window.addEventListener('DOMContentLoaded', event => {
  if (isMobile()) {
    document.querySelector("body").classList.add('mobile');
    document.getElementById('filters').classList.remove('show');
    document.getElementById('select-filters').classList.remove('show');
  }

  if (!localStorage.getItem('gp|user')) {
    modalLogin.show();
  } else {
    document.querySelector('.logged-off').classList.toggle('show');
    document.querySelector('.logged-on').classList.toggle('show');
    const nameTxt = user.nama;
    let displayName = nameTxt;
    if (isMobile()) {
      displayName = nameFormatter(nameTxt);
    }
    $("#user-name").text(displayName);
    $("#company-name-1").text(company.company_name);
    $("#company-name-2").text(company.company_name);
    $("#nama-kebun-1").text(kebuns[selected_kebun].nama_kebun);
    $("#nama-kebun-2").text(kebuns[selected_kebun].nama_kebun);
    farmSelectOptions();
    getKebunData();
  }
});

// window.onresize = function () { location.reload(); };

const menuToggle = document.getElementById('menu-toggle');
menuToggle.addEventListener('click', event => {
  if (!isMobile()) {
    document.querySelector('body').classList.toggle('mobile');
  }
});
