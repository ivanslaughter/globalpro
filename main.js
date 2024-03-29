import 'bootstrap/dist/css/bootstrap.min.css';
import './css/style.css';
import isMobile from './mobile';
import WebFont from 'webfontloader';
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
import { Modal, Collapse, Tooltip, Offcanvas } from 'bootstrap';
import numeral from 'numeral';
import { firestore, auth, userDataAsync } from './firebase';
import { Timestamp } from 'firebase/firestore';
import { showAlert, startLoadingButton, stopLoadingButton } from './animated';
import nameFormatter from './name-formatter';
import showFarmStats from './sidebar';

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

let selectedWsmSource = null;
let formFeature = {};
let selectedSource = null;
let selectedLayer = null;
let selectedFilter = "blok";
let prevSelected = null;
let mapFullyLoaded = false;
let pupukRec = 0;
let panenRec = 0;
let tablePanen;
let tablePupuk;

let gsHost = 'http://128.199.253.151:8080';
// let gsHost = 'http://localhost:8080';

const user = JSON.parse(localStorage.getItem('gp|user'));
const company = JSON.parse(localStorage.getItem('gp|company'));
const kebuns = JSON.parse(localStorage.getItem('gp|kebuns'));
const selected_kebun = localStorage.getItem('gp|selected_kebun');
const selected_tahun = localStorage.getItem('gp|selected_tahun');

const isAdmin = user && user.role === 'admin' ? true : false;

if (!selected_tahun) {
  localStorage.setItem('gp|logged-on', 'false');
  localStorage.removeItem('gp|user');
  localStorage.removeItem('gp|company');
  localStorage.removeItem('gp|kebuns');
  localStorage.removeItem('gp|selected_kebun');
  localStorage.removeItem('gp|selected_tahun');
}

let workSpace = kebuns ? kebuns[selected_kebun].geoserver[selected_tahun].data.workspace : '';
let layerAfdeling = kebuns ? kebuns[selected_kebun].geoserver[selected_tahun].data.layer_afdeling : '';
let layerBlock = kebuns ? kebuns[selected_kebun].geoserver[selected_tahun].data.layer_block : '';
let layerGroup = kebuns ? kebuns[selected_kebun].geoserver[selected_tahun].data.layer_group : '';
let layerTree = kebuns ? kebuns[selected_kebun].geoserver[selected_tahun].data.layer_tree : '';
let layerRaster = kebuns ? kebuns[selected_kebun].geoserver[selected_tahun].data.layer_raster : [];

// const Stats = document.getElementById('stats');
const mainStats = document.getElementById('main-stats');
const subStats = document.getElementById('sub-stats');
const infoDiv = document.body.querySelector('#info');
// const infoBtn = document.getElementById('info-button');
// const filterDiv = document.body.querySelector('#filter-div');
// const statsBoxesBtn = document.getElementById('stats-boxes-button');

// let bsStats = new Collapse(Stats, {
//   toggle: false
// });
let bsInfoDiv = new Collapse(infoDiv, {
  toggle: false
});
// let bsInfoBtn = new Collapse(infoBtn, {
//   toggle: false
// });
// let bsFilterDiv = new Collapse(filterDiv, {
//   toggle: false
// });

let scrollRec = isMobile() ? 61.56 : 75;
let infoText = {
  info: "Total _TOTAL_ records",
}

infoDiv.addEventListener('shown.bs.collapse', function () {
  // console.log('info collapse show');
  if (subStats.classList.contains('show') == true) {
    // console.log('sub-stats on');
    // Stats.classList.remove('info-active');
    // bsInfoBtn.hide();
    // statsBoxesBtn.innerHTML = '<i class="jt-chevron-thin-up"></i>';

    if (!$.fn.DataTable.isDataTable('#table-pupuk')) {
      if (pupukRec > 0) {
        if (pupukRec > 3) {
          tablePupuk = $('#table-pupuk').DataTable({
            scrollY: scrollRec, paging: false, filter: false, language: infoText
          });
        } else {
          tablePupuk = $('#table-pupuk').DataTable({ paging: false, filter: false, language: infoText });
        }
      }
    }

    if (!$.fn.DataTable.isDataTable('#table-panen')) {
      if (panenRec > 0) {
        if (panenRec > 3) {
          tablePanen = $('#table-panen').DataTable({ scrollY: scrollRec, paging: false, filter: false, language: infoText });
        } else {
          tablePanen = $('#table-panen').DataTable({ paging: false, filter: false, language: infoText });
        }
      }
    }


  }
});

// infoDiv.addEventListener('hidden.bs.collapse', function () {
//   console.log('info collapse hide');
//   if (subStats.classList.contains('show') == true) {
//     console.log('sub-stats on');
//     // Stats.classList.add('info-active');
//     // bsInfoBtn.show();
//   }
// });

/* infoBtn.addEventListener('show.bs.collapse', function () {
  console.log('btn info collapse hide');
  Stats.classList.remove('info-active');
});
infoBtn.addEventListener('hide.bs.collapse', function () {
  console.log('btn info collapse show');
  Stats.classList.add('info-active');
}); */

const mapCenter = fromLonLat([98.1969, 4.2667]);

function transform(extent) {
  return transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
}

const mapExtent = transform([98.17655462693399, 4.233276920014973, 98.2303961838639, 4.298548400759917]);

let mapPadding = [50, 198, 0, 247];
if (isMobile()) {
  mapPadding = [90, 30, 0, 90];
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

const wmsSourceAfdeling = new ImageWMS({
  url: gsHost + '/geoserver/' + workSpace + '/wms',
  params: { 'LAYERS': workSpace + `:${layerAfdeling}` },
  serverType: 'geoserver',
});

const wmsSourceBlock = new ImageWMS({
  url: gsHost + '/geoserver/' + workSpace + '/wms',
  params: { 'LAYERS': workSpace + `:${layerBlock}` },
  serverType: 'geoserver',
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

const wsmAfdeling = new ImageLayer({
  //extent: [408380,467955,414599,475177],
  name: 'layer1',
  source: wmsSourceAfdeling,
});

const wsmBlock = new ImageLayer({
  //extent: [408380,467955,414599,475177],
  name: 'layer1',
  source: wmsSourceBlock,
});

const wsmGroup = new ImageLayer({
  //extent: [408380,467955,414599,475177],
  name: 'layer1',
  source: wmsSourceGroup,
});

const wmsTree = new ImageLayer({
  //extent: [408380,467955,414599,475177],
  name: 'layer3',
  source: wmsSourceTree,
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

const layers = [osmLayer].concat(tlRaster);
layers.push(wsmGroup);
layers.push(wsmBlock);
layers.push(wsmAfdeling);

selectedWsmSource = wmsSourceBlock;

const view = new View({
  //center: proj.transform([98.1969, 4.2667], 'EPSG:4326', 'EPSG:32647'),
  //projection: projection,
  center: mapCenter,
  pixelRatio: 1,
  padding: mapPadding,
  zoom: isMobile() ? 13 : 14,
  maxZoom: 20,
  minZoom: isMobile() ? 13 : 14
});

const map = new Map({
  controls: defaultControls().extend([mousePositionControl, overviewMapControl, new ScaleLine()]),
  target: 'map',
  layers: layers,
  view: view,
});

map.getView().fit(mapExtent, { duration: 1500 });

map.on('singleclick', function (evt) {
  const viewResolution = /** @type {number} */ (view.getResolution());
  const url = selectedWsmSource.getFeatureInfoUrl(
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
          if (mapFullyLoaded) {
            bsInfoDiv.hide();
            // bsInfoBtn.hide();
            // Stats.classList.remove('info-active');

            selectMap(layerJson);
            // mapFullyLoaded = false;
            // console.log('loaded -> ' + mapFullyLoaded);
          }
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

// const gpDashboardClose = document.getElementById('gp-dashboard-close');
const checkMap = document.getElementById('checkMap');
const checkRaster = document.getElementById('checkRaster');
const checkAfdeling = document.getElementById('checkAfdeling');
const checkBlock = document.getElementById('checkBlock');
const checkGroup = document.getElementById('checkGroup');
const checkTree = document.getElementById('checkTree');

//showFilter();
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

checkAfdeling.addEventListener('change', (event) => {
  if (event.currentTarget.checked) {
    wsmAfdeling.setVisible(true);
  } else {
    wsmAfdeling.setVisible(false);
  }
  //gpDashboardClose.click();
});

checkBlock.addEventListener('change', (event) => {
  if (event.currentTarget.checked) {
    wsmBlock.setVisible(true);
  } else {
    wsmBlock.setVisible(false);
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
    const layers = map.getLayers();
    layers.insertAt(3, wmsTree);
  } else {
    map.removeLayer(wmsTree);
  }
  //gpDashboardClose.click();
});


//EDIT SEPRI

function getKebunData() {
  let afdeling = 0;
  const afdelingUrl = gsHost + '/geoserver/' + workSpace + '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=' + workSpace + `:${layerAfdeling}&outputFormat=application%2Fjson&srsname=EPSG:32647`;
  fetch(afdelingUrl)
    .then((response) => response.text())
    .then((json) => {
      // console.log(JSON.parse(json));
      //afdelingJson.push(JSON.parse(json).features);
      let afdelingJson = JSON.parse(json).features;
      afdeling = afdelingJson.length;
      /* document.getElementById('stats-afdeling').innerHTML = afdelingJson.length; */
    });

  const blockUrl = gsHost + '/geoserver/' + workSpace + '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=' + workSpace + `:${layerBlock}&outputFormat=application%2Fjson&srsname=EPSG:32647`;
  fetch(blockUrl)
    .then((response) => response.text())
    .then((json) => {
      //console.log(JSON.parse(json).features);
      // blocksJson.push(JSON.parse(json).features);
      let blocksJson = JSON.parse(json).features;
      showFarmStats(afdeling, blocksJson);
      /* if (blocksJson.length > 0) {
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
      } */
    });
}

/* $('#selectAfdeling').on('change', (event) => {
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
}); */

function selectFilterFunction(event) {
  console.log('Checked radio with ID = ' + event.target.value);
  selectedFilter = event.target.value;
  if (selectedFilter === 'afdeling')
    selectedWsmSource = wmsSourceAfdeling
  else if (selectedFilter === 'blok')
    selectedWsmSource = wmsSourceBlock
  else
    selectedWsmSource = wmsSourceGroup

  reset.selectFilter(event.target.id);

  selectObject();
}

document.querySelectorAll("input[name='selectFiltersRadios']").forEach((input) => {
  input.addEventListener('change', selectFilterFunction);
});

const reset = {
  selectFilter: function (id) {
    // if (selectedLayer) {
    //   if (id === 'selectAfdeling')
    this.mapView();
    //   else
    //     this.selectView();
    // }
    /* const ids = ['selectAfdeling', 'selectBlock', 'selectRoad', 'selectBuilding', 'selectRiver', 'selectBridge'];
    ids.forEach(element => {
      if (element !== id) {
        $(`#${element}`).prop('checked', false);
        $(`#${element}`).removeAttr("disabled");
      } else {
        $(`#${element}`).attr("disabled", true);
      }
    }); */
  },
  mapView: function () {
    if (selectedSource && isAdmin)
      ModifyLayer.setActive(false);

    $("#sidebar").removeClass("select-active");
    $("#user-box").show();
    $('#fab').hide();
    map.removeLayer(selectedLayer);
    selectedSource = null;
    selectedLayer = null;
    prevSelected = null;
    subStats.innerHTML = '';
    subStats.classList.remove('show');
    mainStats.classList.add('show');
    /* infoDiv.classList.remove('show'); */
    // infoBtn.classList.remove('show');
    bsInfoDiv.hide();
    // bsInfoBtn.hide();
    // statsBoxesBtn.innerHTML = '<i class="jt-chevron-thin-up"></i>';
    // Stats.classList.remove('info-active');
    // map.getView().setZoom(14);
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
const modalConfirm = new Modal(document.getElementById('modalConfirm'));

function setMapInfos(layerJson) {
  const selectedLayers = layerJson.features;
  let content = '';
  let prevLayer = "";
  let nullLayer = true;
  let layerId = "";
  let layerName = "";
  selectedLayers.forEach(element => {
    if (prevLayer !== element.id.split('.')[0]) {
      const arrCol = Object.keys(element.properties);
      let featureNames = element.id.split('.')[0].split('_');
      featureNames.forEach(title => {
        if (selectedFilter.includes(title.toLowerCase())) {
          // console.log('title->' + title);
          // console.log('arrCol' + arrCol);
          content += `<div class="d-grid gap-2 mb-2 ${!isMobile() ? 'mt-2' : ''}">`;
          if (title == 'Blok') {
            content += `<div class="stats-title">Blok <div class="stats-title-text">${element.properties['Block']}</div></div>`;
          } else {
            content += `<div class="stats-title">Info <div class="stats-title-text">${title}</div></div>`;
          }
          // if (!isMobile())
          //   content += `<button id="back-stats" class="btn btn-outline-warning btn-sm mt-2"><i class="jt-chevron-left"></i> Back</button></div>`;

          content += `<div id="sub-stats-boxes" class="stats-boxes collapse show">`;
          arrCol.forEach(element_ => {

            if (element_ !== 'Block') {
              const el_label = element_.replace('_', ' ');
              if (el_label.toLowerCase() !== "id") {
                content += `
                <div id="${element_}" class="stats-box">
                <div class="stats-label">${el_label[0].toUpperCase() + el_label.slice(1)}</div>
                <div class="stats-value">${isNaN(element.properties[element_]) ? element.properties[element_] : numeral(element.properties[element_]).format(',0')}</div>
              </div>`;
              }
            }

            let fieldNames = element_.split('_');
            fieldNames.forEach(title => {
              if (title.toLowerCase().includes('block') || title.toLowerCase().includes('blok'))
                layerName = 'Blok ' + element.properties[element_];
            });
          });

          // if (isAdmin)
          //   content += `<button id="edit-feature" class="btn btn-warning btn-sm mt-1 ${!isMobile() ? 'mb-2' : ''}" data-toggle="modal" data-target="#modalFeature">Edit</button>`;
          // if (isMobile())
          //   content += `<button id="back-stats" class="btn btn-outline-warning btn-sm mt-2"><i class="jt-chevron-left"></i> Back</button></div>`;
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

    // statsBoxesBtn.innerHTML = '<i class="jt-chevron-thin-up"></i>';

    if (document.getElementById('map-filter-toggle').classList.contains('collapsed') == false) {
      console.log('filter-div on');
      document.getElementById('map-filter-toggle').click();
    }


    const statsTitleTxt = document.querySelector('.stats-title-text');
    if (isMobile()) {
      if (statsTitleTxt.offsetWidth < statsTitleTxt.scrollWidth) {
        statsTitleTxt.style.setProperty('font-size', '0.72em');
      }
    }

    document.getElementById('back-stats').addEventListener('click', event => {
      reset.mapView();
      map.getView().fit(mapExtent, { duration: 1500 });
    });

    if (selectedFilter === 'blok') {
      $('#info-button').show();
      getBlokData(layerId, layerName);
    } else {
      $('#info-button').hide();
    }
  }
}

function getBlokData(layerId, layerName) {
  $('#detail-info').html('');
  document.body.classList.toggle('info-show');
  pupukRec = 0; panenRec = 0;

  firestore.getBlokColls().then(function (collections) {
    collections.forEach(element => {
      firestore.getBlokData(company.collection, kebuns[selected_kebun].collection, element.collection, layerId).then(function (data) {
        const tahun = kebuns[selected_kebun].geoserver[selected_tahun].tahun;

        let content = `<div class="col-sm">`;
        content += `<div class="d-flex align-items-center">
      <div class="stats-title align-middle">${element.collection[0].toUpperCase() + element.collection.slice(1)}</div>`;

        if (tahun === new Date().getFullYear().toString() && isAdmin)
          content += `<button data-coll="${element.collection}" data-fields='${JSON.stringify(element.fields)}' class="add-data-blok btn btn-outline-warning btn-sm btn-block lh-1 m-2"><i class="jt-plus"></i></button>`

        content += `</div>`;

        if (data) {
          let titleTable = "";
          let tableBody = "";
          let th = false;
          let nullValue = true;
          const titleArr = Object.keys(data.data[0]);

          data.data.forEach(element_ => {
            if (element_.tanggal.toDate().getFullYear().toString() === tahun) {
              titleTable += !th ? "<tr>" : "";
              tableBody += "<tr>";
              titleArr.forEach(subelement => {
                const title = subelement.replace('_', ' ');
                if (!th && subelement !== 'satuan')
                  titleTable = titleTable + `<th>${title[0].toUpperCase() + title.slice(1)}</th>`;

                if (subelement !== 'satuan')
                  tableBody = tableBody + `<td>${subelement === 'tanggal' ? element_[subelement].toDate().toLocaleString('id-ID').split(' ')[0] : isNaN(element_[subelement]) ? element_[subelement] : element_[subelement] + element_['satuan']}</td>`;
              });
              titleTable += !th ? "</tr>" : "";
              th = true;
              tableBody += "</tr>";

              if (element.collection == 'pupuk') {
                pupukRec++;
              }
              if (element.collection == 'panen') {
                panenRec++;
              }
              nullValue = false;
            }
          });

          if (!nullValue) {
            content += `
            <div>
            <table id="table-${element.collection}" class="table table-sm text-light mb-2">
                <thead>
                    ${titleTable}
                </thead>
                <tbody>
                    ${tableBody}
                </tbody>
            </table>
            </div>`;
          } else {
            content += `<div class="mt-1 mb-2">Belum ada data</div>`;
          }

        } else {
          content += `<div class="mt-1 mb-2">Belum ada data</div>`;
        }
        content += `</div>`;



        // class="table-responsive-sm"
        $('#detail-info').append(content);

        //infoDiv.classList.add('show');
        infoDiv.classList.remove('full-width');
        // let sidebarInfoGap = window.innerHeight - document.getElementById('sidebar').clientHeight - 17.28 - infoDiv.clientHeight;
        // if (sidebarInfoGap > 17.28) {
        //   infoDiv.classList.add('full-width');
        // }
        bsInfoDiv.show();

        // console.log(pupukRec);
        // console.log(panenRec);
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
      const el_label = element.id.replace('_', ' ');
      if (element.type === 'option') {
        content += `<select class="mt-1 form-select" id="${layerId.replace('.', '_') + "-" + coll + "-" + element.id}">
        <option selected value="">Pilih satuan</option>`;
        let options = "";
        element.option.forEach(element_ => {
          options += `<option value="${element_}">${element_}</option>`;
        });
        content += options;
        content += `</select>`;
      } else {
        content += `<label class="mt-1" for="${layerId.replace('.', '_') + "-" + coll + "-" + element.id}">${el_label[0].toUpperCase() + el_label.slice(1)}</label><input class="form-control" type="${element.type}" id="${layerId.replace('.', '_') + "-" + coll + "-" + element.id}" value="">`;
      }
    });

    content += '<div id="alert-blok"></div></div>';

    const footer = `<button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
    <button id="save-data-blok" data-layer_id="${layerId}" data-layer_name="${layerName}" data-coll="${coll}" data-fields='${JSON.stringify(fields)}' type="button" class="btn btn-success btn-sm">Save</button>`;

    return {
      content,
      footer
    }
  }

  $('#info').on('click', '.add-data-blok', function () {
    const coll = $(this).attr("data-coll");
    const fields = $(this).data("fields");

    firestore.companyPackage(user.company_id).then(function (data) {
      if (data.data.editable) {

        $('#modalBlokTitle').text(`Tambah data ${coll}`)
        $('#bodyBlok').html(formBlok(coll, fields).content);
        $('#footerBlok').html(formBlok(coll, fields).footer);
        modalBlok.show();
      } else {
        $('#bodyConfirm').text('Anda berada di akun ' + data.package[0].toUpperCase() + data.package.slice(1) + '. Upgrade akun Anda agar dapat menggunakan fitur ini');
        modalConfirm.show();
      }
    });
  });
}

$('#footerBlok').on('click', '#save-data-blok', function () {
  startLoadingButton('save-data-blok');
  const coll = $(this).attr("data-coll");
  const fields = $(this).data("fields");
  const layer_id = $(this).attr("data-layer_id");
  const layer_name = $(this).attr("data-layer_name");

  let data = {};
  let nullValue = false;
  fields.forEach(element => {
    if ($(`#${layer_id.replace('.', '_') + "-" + coll + "-" + element.id}`).val() === '')
      nullValue = true;

    if (element.type === 'date')
      data[element.id] = Timestamp.fromDate(new Date($(`#${layer_id.replace('.', '_') + "-" + coll + "-" + element.id}`).val()));
    else
      data[element.id] = $(`#${layer_id.replace('.', '_') + "-" + coll + "-" + element.id}`).val();

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
    if (el_label.toLowerCase() !== 'id')
      content += `<label class="mt-1" for="${layerId.replace('.', '_') + "-" + element}">${el_label[0].toUpperCase() + el_label.slice(1)}</label><input class="form-control" type="text" id="${layerId.replace('.', '_') + "-" + element}" value='${layerProperties[element]}'>`;
    else
      content += `<label hidden class="mt-1" for="${layerId.replace('.', '_') + "-" + element}">${el_label[0].toUpperCase() + el_label.slice(1)}</label><input hidden class="form-control" type="text" id="${layerId.replace('.', '_') + "-" + element}" value='${layerProperties[element]}'>`;
  });

  content += '<div id="alert-feature"></div></div>';

  let footer = `<button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Close</button>
  <button id="save-feature" type="button" class="btn btn-success btn-sm">Save</button>`;

  formFeature = {
    layerId, content, arrCol, footer
  };
}

$("#edit-feature").on('click', () => {
  firestore.companyPackage(user.company_id).then(function (data) {
    if (data.data.editable) {
      $('#bodyFeature').html(formFeature.content);
      $('#footerFeature').html(formFeature.footer);
      modalFeature.show();
    } else {
      $('#bodyConfirm').text('Anda berada di akun ' + data.package[0].toUpperCase() + data.package.slice(1) + '. Upgrade akun Anda agar dapat menggunakan fitur ini');
      modalConfirm.show();
    }
  });
})

$("#info-button").on('click', () => {
  bsInfoDiv.show();
})

// $('#sub-stats').on('click', '#edit-feature', function () {
//   $('#bodyFeature').html(formFeature.content);
//   $('#footerFeature').html(formFeature.footer);
//   modalFeature.show();
// });

$('#footerFeature').on('click', '#save-feature', function () {
  startLoadingButton('save-feature');
  saveFeature();
});

function selectMap(layerJson) {
  let prevLayer = "";
  let nullLayer = true;
  const selectStyle = new Style({
    fill: new Fill({
      color: 'rgba(255,255,255,0)',
    }),
    stroke: new Stroke({
      color: '#FF0000',
      width: 5,
    }),
  });

  layerJson.features.forEach(element => {
    if (prevLayer !== element.id.split('.')[0]) {
      const layerNames = element.id.split('.')[0].split('_');
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
      } else {
        if (selectedFilter === 'blok')
          bsInfoDiv.show();

        if (isAdmin) {
          $('#bodyConfirm').text('Anda mengaktifkan mode edit geometri. Silahkan tarik garis yang berwarna biru untuk mengubah posisi geometri. Pilih tombol "+" - "edit" - "Save" untuk menyimpan.');
          modalConfirm.show();
        }
      }
    } else {
      setSelectMap();
      setMapInfos(layerJson);
    }
  }
}

function setSelectMap() {
  $('#fab').show();
  $("#sidebar").addClass("select-active");
  map.addLayer(selectedLayer);
  prevSelected = selectedLayer;

  selectedLayer.getSource().on('featuresloadend', function () {
    const feature = selectedSource.getFeatures()[0];
    const blockPolygon = feature.getGeometry();
    // , { padding: [0, 0, 0, 0] }
    view.fit(blockPolygon);
    if (isAdmin)
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

const yearSelect1 = document.getElementById('farm-select-year-1');
const yearSelect2 = document.getElementById('farm-select-year-2');

function yearSelectOptions() {
  kebuns[selected_kebun].geoserver.forEach((element, index) => {
    var option = document.createElement("option");
    option.text = element.tahun;
    option.value = index;
    yearSelect1.add(option);

    var option1 = document.createElement("option");
    option1.text = element.tahun;
    option1.value = index;
    yearSelect2.add(option1);

  });
  yearSelect1.selectedIndex = selected_tahun;
  yearSelect2.selectedIndex = selected_tahun;
}

yearSelect1.addEventListener('change', (event) => {
  // console.log('year1', yearSelect1.selectedIndex);
  if (yearSelect1.selectedIndex != selected_tahun) {
    localStorage.setItem('gp|selected_tahun', yearSelect1.selectedIndex);
    location.reload();
  }
});

yearSelect2.addEventListener('change', (event) => {
  // console.log('year2', yearSelect2.selectedIndex);
  if (yearSelect2.selectedIndex != selected_tahun) {
    localStorage.setItem('gp|selected_tahun', yearSelect2.selectedIndex);
    location.reload();
  }
});

const modalLogin = new Modal(document.getElementById('authentication'), { keyboard: false });
const userLogin = document.getElementById('login');
const userLogout = document.getElementById('logout');
const onLogin = document.getElementById('onLogin');

userLogin.addEventListener('click', event => {
  localStorage.setItem('gp|logged-on', 'true');
  document.querySelector('.logged-off').classList.remove('show');
  document.querySelector('.logged-on').classList.add('show');
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

map.on('rendercomplete', function (evt) {
  mapFullyLoaded = true;
  // console.log('loaded -> ' + mapFullyLoaded);
})

window.addEventListener('DOMContentLoaded', event => {

  if (isMobile()) {
    document.querySelector("body").classList.add('mobile');
    // document.getElementById('filters').classList.toggle('show');
    // document.getElementById('select-filters').classList.toggle('show');
    document.getElementById('filters').classList.toggle('show');
    document.getElementById('map-filter-title').classList.toggle('show');
    document.getElementById('select-filter').classList.toggle('show');
    document.getElementById('map-filter-toggle').classList.toggle('collapsed');
    // document.getElementById('map-filter-toggle').click();
  }

  if (!localStorage.getItem('gp|user')) {
    modalLogin.show();
  } else {
    document.querySelector('.logged-off').classList.remove('show');
    document.querySelector('.logged-on').classList.add('show');
    const nameTxt = user.name;
    let displayName = nameTxt;
    if (isMobile()) {
      displayName = nameFormatter(nameTxt);
    }
    $("#user-name").text(displayName);
    $("#company-name-1").text(company.company_name);
    $("#company-name-2").text(company.company_name);
    $("#nama-kebun-1").text(kebuns[selected_kebun].nama_kebun);
    $("#nama-kebun-2").text(kebuns[selected_kebun].nama_kebun);
    userDataAsync(user.email);
    farmSelectOptions();
    yearSelectOptions();
    getKebunData();
  }
  // document.querySelector('#map-filter-title').classList.toggle('show');
  document.querySelector('#select-filter').classList.toggle('show');
  document.querySelector('#menu-toggle').classList.toggle('show');
});

// window.onresize = function () { location.reload(); };

const menuToggle = document.getElementById('menu-toggle');
menuToggle.addEventListener('click', event => {
  if (!isMobile()) {
    document.querySelector('body').classList.toggle('mobile');
  }
});

function selectObject() {
  let layerName = '';
  Object.keys(kebuns[selected_kebun].geoserver[selected_tahun].data).map((key) => {
    if (key !== 'layer_raster' && key !== 'workspace') {
      const layerNames = kebuns[selected_kebun].geoserver[selected_tahun].data[key].split("_");
      layerNames.forEach(element => {
        if (selectedFilter.includes(element.toLowerCase())) {
          layerName = kebuns[selected_kebun].geoserver[selected_tahun].data[key];
        }
      });
    }
  })

  const style = new Style({
    stroke: new Stroke({
      color: '#FF0000',
      width: 1.5,
    }),
  });

  const url = gsHost + `/geoserver/` + workSpace + `/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=` + workSpace + `:${layerName}&outputFormat=application%2Fjson&srsname=EPSG:4326`;

  const source = new VectorSource({
    url: url,
    format: new GeoJSON(),
  });

  const layer = new VectorLayer({
    source: source,
    style: style,
  })

  selectedLayer = layer;
  prevSelected = selectedLayer;

  map.addLayer(layer);

  // setTimeout(() => { map.removeLayer(layer); }, 300);
}

const userAdmin = document.getElementById('user-admin');
if (!isAdmin)
  userAdmin.style.display = "none";

userAdmin.addEventListener('click', event => {
  $("#admin-name").text(user.name);
  $("#admin-company").text(company.company_name);
  firestore.companyPackage(user.company_id).then(function (data) {
    $("#account-type").text(data.package[0].toUpperCase() + data.package.slice(1));
    $("#account-limit").text('Anda dapat menambahkan ' + data.data.account_limit + ' akun');

    listUser(data.data.account_limit);
  });

  document.querySelector('.logged-off').classList.remove('show');
  document.querySelector('.logged-on').classList.add('show');
});

function listUser(account_limit) {
  firestore.listUser(user.company_id).then(function (users) {
    if (users.length >= account_limit)
      $("#addUser").addClass('disabled');

    $('#admin-table tbody').empty();
    let content = "";
    if (users) {
      users.forEach(function (element, index) {
        content = content + `<tr><th scope="row">${index + 1}</th>
        <td>${element.name}</td>
        <td>${element.email}</td>
        <td>${element.jabatan}</td></tr>`;
      });

    } else {
      content += `<div class="mb-2">Belum ada data</div>`;
    }

    $('#admin-table tbody').append(content);

  });
}

$("#addUser").on('click', () => {
  startLoadingButton('addUser');
  const name = $("#admin-nama").val();
  const email = $("#admin-email").val();
  const password = $("#admin-password").val();
  const jabatan = $("#admin-jabatan").val();

  if (name == "" || email == "" || password == "" || jabatan == "") {
    stopLoadingButton('addUser');
    showAlert('alert-admin', 'alert-danger', 'Mohon lengkapi data');

    return;
  }

  const newuser = {
    company_id: user.company_id,
    role: 'user',
    name,
    email,
    password,
    jabatan,
    createdAt: Timestamp.fromDate(new Date())
  }

  auth.addUser(newuser).then((userCredential) => {
    const docData = {
      ...newuser,
      accessToken: userCredential.user.accessToken,
      uid: userCredential.user.uid
    }

    firestore.saveUser(docData).then((res) => {
      stopLoadingButton('addUser');
      showAlert('alert-admin', 'alert-success', 'Berhasil menyimpan data');
      $("#admin-nama").val('');
      $("#admin-email").val('');
      $("#admin-password").val('');
      $("#admin-jabatan").val('');

      listUser();
    })
  }).catch((error) => {
    stopLoadingButton('addUser');
    const errorCode = error.code;
    if (errorCode === 'auth/email-already-in-use')
      showAlert('alert-admin', 'alert-danger', 'Email sudah terdaftar');
    else
      showAlert('alert-admin', 'alert-danger', 'Gagal menyimpan, silahkan coba lagi');
  });
})