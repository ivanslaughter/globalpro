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
import WebFont from 'webfontloader';

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
    families: ['IBM Plex Sans Condensed']
  }
});

let editMode = false;
let formFeature = {};
let selectedSource = null;
let selectedLayer = null;
let selectedFilter = "blok";
let prevSelected = null;

//let gsHost = 'http://ec2-18-136-119-137.ap-southeast-1.compute.amazonaws.com:8080';
//let gsHost = 'http://ec2-18-142-49-57.ap-southeast-1.compute.amazonaws.com:8080';
// let gsHost = 'http://128.199.253.151:8080';
let gsHost = 'http://localhost:8080';

const user = JSON.parse(localStorage.getItem('gp|user'));
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
const modalEdit = new Modal(document.getElementById('modalEdit'));

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
// layerRaster.forEach(element => {
//   const sourceRaster = new TileJSON({
//     url: element,
//     tileSize: 256,
//     crossOrigin: 'anonymous'
//   });

//   tlRaster.push(new TileLayer({
//     //extent: [408380,467955,414599,475177],
//     name: 'layer-raster',
//     source: sourceRaster,
//   }));
// });

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
  if (!editMode) {
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
            setMapInfos(layerJson);
            selectMap(layerJson);
          }
        });
    }
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
const blockFilter = document.getElementById('block-filter');
const checkMap = document.getElementById('checkMap');
const checkRaster = document.getElementById('checkRaster');
const checkGroup = document.getElementById('checkGroup');
const checkTree = document.getElementById('checkTree');

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

checkRaster.addEventListener('change', (event) => {
  if (event.currentTarget.checked) {
    tlRaster.forEach(element => {
      element.setVisible(true);
    });
    blockFilter.style.display = "";
  } else {
    tlRaster.forEach(element => {
      element.setVisible(false);
    });
    blockFilter.style.display = "none";
  }
  //gpDashboardClose.click();
});

checkGroup.addEventListener('change', (event) => {
  if (event.currentTarget.checked) {
    wsmGroup.setVisible(true);
    blockFilter.style.display = "";
  } else {
    wsmGroup.setVisible(false);
    blockFilter.style.display = "none";
  }
  //gpDashboardClose.click();
});

checkTree.addEventListener('change', (event) => {
  if (event.currentTarget.checked) {
    wmsTree.setVisible(true);
    blockFilter.style.display = "";
  } else {
    wmsTree.setVisible(false);
    blockFilter.style.display = "none";
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

const reset = {
  selectFilter: function (id) {
    if (selectedLayer) {
      this.mapView();
    }
    const ids = ['selectAfdeling', 'selectBlock', 'selectRoad', 'selectBuilding', 'selectRiver'];
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
    editMode = false;
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

function setMapInfos(layerJson) {
  const selectedLayers = layerJson.features;
  let content = '';
  let prevLayer = "";
  let nullLayer = false;
  let layerId = "";
  selectedLayers.forEach(function (element, i) {
    if (prevLayer !== element.id.split('.')[0]) {
      const arrCol = Object.keys(element.properties);

      let featureName = element.id.split('.')[0].split('_');
      featureName.forEach(function (title) {
        if (selectedFilter.includes(title.toLowerCase())) {
          content += `<div class="d-grid gap-2 mb-1 mt-2"><div class="text-uppercase fw-bolder text-center lh-1">Info ${title}</div>
          <button id="back-stats" class="btn btn-outline-warning btn-sm lh-1"><i class="fa fa-home"></i> Back</button></div>
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
          });
          content += `<button id="edit-feature" type="button" class="btn btn-warning btn-sm col mt-3" data-toggle="modal" data-target="#modalEdit">Edit</button>`;
          content += '</div>';
          prevLayer = element.id.split('.')[0];
          layerId = element.id;
          nullLayer = true;
          editFeature(i, element.id, element.properties);
        }
      })

    }
  });

  if (nullLayer) {
    mainStats.classList.remove('show');
    subStats.innerHTML = content;
    subStats.classList.add('show');

    document.getElementById('back-stats').addEventListener('click', event => {
      reset.mapView();
      map.getView().fit(mapExtent);
    });

    if (selectedFilter === 'blok') {
      firestore.getBlokData(user.collection, kebuns[selected_kebun].collection, 'pupuks', layerId).then(function (data) {
        if (data.length === 0) {
          const infoDiv = document.body.querySelector('#info');
          infoDiv.classList.remove('show');

          return;
        }

        let content = `<div class="justify-content-between"><span>Informasi tambahan</span><button type="button" class="btn-close btn-close-white" data-bs-toggle="collapse" data-bs-target="#info" aria-label="Close"></button></div>`;
        let titleTable = "";
        let tableBody = "";
        let th = false;
        const titleArr = Object.keys(data[0]);
        data.forEach(element => {
          titleArr.forEach(element_ => {
            if (element_ !== 'layer_id') {
              const title = element_.replace('_', ' ');
              if (!th)
                titleTable = titleTable + `<th>${title[0].toUpperCase()}${title.slice(1)}</th>`;
              tableBody = tableBody + `<td>${element_ === 'tanggal' ? element[element_].toDate().toLocaleString('id-ID').split(' ')[0] : element[element_]}</td>`;
            }
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
      });
    }
  }
}

function selectMap(layerJson) {
  let nullLayer = false;
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
    let layerNames = element.id.split('.')[0].split('_');
    layerNames.forEach(function (element_) {
      if (selectedFilter.includes(element_.toLowerCase())) {
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

        nullLayer = true;
      }
    })
  });

  if (nullLayer) {
    if (prevSelected) {
      map.removeLayer(prevSelected);
    }

    map.addLayer(selectedLayer);
    prevSelected = selectedLayer;

    selectedLayer.getSource().on('featuresloadend', function () {
      const feature = selectedSource.getFeatures()[0];
      const blockPolygon = feature.getGeometry();
      // , { padding: [0, 0, 0, 0] }
      view.fit(blockPolygon);
      editMode = true;
      ModifyLayer.init();
    });
  }
}

function editFeature(i, layerId, layerProperties) {
  let content = `<div class="modal-body">`;

  const arrCol = Object.keys(layerProperties);
  arrCol.forEach(element => {
    const el_label = element.replace('_', ' ');
    content += `<label class="mt-1" for="${layerId.split('.')[0] + "-" + element}">${el_label[0].toUpperCase() + el_label.slice(1)}</label><input class="form-control" type="text" id="${layerId.split('.')[0] + "-" + element}" value='${layerProperties[element]}'>`;
  });

  content += '</div>';

  let footer = `<button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
  <button id="save-feature" type="button" class="btn btn-success btn-sm">Save</button>`;

  formFeature = {
    layerId, content, arrCol, footer
  };

  $('#sub-stats').on('click', '#edit-feature', function () {
    $('#formBody').html(formFeature.content);
    $('#formFooter').html(formFeature.footer);
    modalEdit.show();
  });

  $('#formFooter').on('click', '#save-feature', function () {
    saveFeature();
  });
}

function saveFeature() {
  let arrData = [];
  formFeature.arrCol.forEach(element => {
    arrData.push($(`#${formFeature.layerId.split('.')[0] + "-" + element}`).val());
  });

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
      console.log(response);
      // alert('Berhasil menyimpan data');
      // modalEdit.hide();
      // location.reload();
    },
    error: function (jqXHR, textStatus, errorThrown) {
      console.log(textStatus, errorThrown);
      alert('Gagal menyimpan data');
    }
  });
}

const changeKebun1 = document.getElementById('change-kebun-1');
const changeKebun2 = document.getElementById('change-kebun-2');
const modalKebun = new Modal(document.getElementById('modalKebun'));

const farmSelect1 = document.getElementById('farm-select-1');
const farmSelect2 = document.getElementById('farm-select-2');

function farmSelectOptions(){
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
  console.log(farmSelect1.selectedIndex);
  if (farmSelect1.selectedIndex != selected_kebun) {
    localStorage.setItem('gp|selected_kebun', farmSelect1.selectedIndex);
    location.reload();
  }
});

farmSelect2.addEventListener('change', (event) => {
  console.log(farmSelect2.selectedIndex);
  if (farmSelect2.selectedIndex != selected_kebun) {
    localStorage.setItem('gp|selected_kebun', farmSelect2.selectedIndex);
    location.reload();
  }
});


/* changeKebun1.addEventListener('click', event => {
  showModalKebun();
})
changeKebun2.addEventListener('click', event => {
  showModalKebun();
}) */

function showModalKebun() {
  let content = `<div class="modal-body">`;

  kebuns.forEach((element, index) => {
    content += `<div id="item-kebun" data-index="${index}" class="p-2">${element.nama_kebun}</div>
    ${index < kebuns.length - 1 ? '<hr>' : ''}`
  });
  content += '</div>';


  $('#listKebun').html(content);
  modalKebun.show();

  $('#listKebun').on('click', '#item-kebun', function () {
    if ($(this).data("index") != selected_kebun) {
      localStorage.setItem('gp|selected_kebun', $(this).data("index"));
      location.reload();
    }
  });
}

const modalLogin = new Modal(document.getElementById('authentication'));
const userLogin = document.getElementById('login');
const userLogout = document.getElementById('logout');
const onLogin = document.getElementById('onLogin');

userLogin.addEventListener('click', event => {
  //auth.init();
  localStorage.setItem('gp|logged-on', 'true'); //<-----  bisa diganti pake firebase localstorage
  document.querySelector('.logged-off').classList.toggle('show');
  document.querySelector('.logged-on').classList.toggle('show');
  //console.log(event);
});

if (localStorage.getItem('gp|logged-on') === 'true') {  //<-----  bisa diganti pake firebase localstorage
  userLogout.addEventListener('click', event => {
    //auth.userSignOut();
    document.querySelector('.logged-off').classList.toggle('show');
    document.querySelector('.logged-on').classList.toggle('show');
    //console.log(event);
    localStorage.setItem('gp|logged-on', 'false'); //<-----  bisa diganti pake firebase localstorage
    localStorage.removeItem('gp|user');
    localStorage.removeItem('gp|kebuns');
    location.reload();
  });
}

/* const loginForm = document.getElementById('form-login');
loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  console.log('form');
  auth.init();
});
 */
onLogin.addEventListener('click', event => {
  const username = $("#username").val();
  const password = $("#password").val();
  firestore.onLogin(username, password).then((data) => {
    if (data) {
      localStorage.setItem('gp|logged-on', 'true');
      getListKebun(data);
    } else {
      alert("Username atau Password salah");
    }
  }).catch((err) => {
    console.log(err);
  })
})

function getListKebun(data) {
  firestore.getCollectionId(data.company_id).then((collection) => {
    const newuser = {
      ...data,
      collection: collection
    }
    localStorage.setItem('gp|user', JSON.stringify(newuser));
    firestore.getKebuns(collection).then((kebuns) => {
      localStorage.setItem('gp|kebuns', JSON.stringify(kebuns));
      localStorage.setItem('gp|selected_kebun', 0);
      location.reload();
    })
  });
}

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
    $("#user-name").text(user.username);
    $("#nama-kebun-1").text(kebuns[selected_kebun].nama_kebun);
    $("#nama-kebun-2").text(kebuns[selected_kebun].nama_kebun);
    getKebunData();
  }

  farmSelectOptions();

});
window.onresize = function () { location.reload(); };

const menuToggle = document.getElementById('menu-toggle');
menuToggle.addEventListener('click', event => {
  if (!isMobile()) {
    document.querySelector('body').classList.toggle('mobile');
  }
});
