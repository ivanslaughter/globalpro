import 'bootstrap/dist/css/bootstrap.min.css';
import './css/style.css';
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
import { fromLonLat, useGeographic, Projection } from 'ol/proj';
import { Modal, Offcanvas } from 'bootstrap';
import numeral from 'numeral';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, addDoc, getDoc, getDocs, setDoc, query, where, orderBy, Timestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCYng2dI6yeBkrJfm7ygBn61KHyHw0tf1M",
  authDomain: "globalpro-22be2.firebaseapp.com",
  projectId: "globalpro-22be2",
  storageBucket: "globalpro-22be2.appspot.com",
  messagingSenderId: "147221436849",
  appId: "1:147221436849:web:c7ed3b46a288af6974c590",
  measurementId: "${config.measurementId}"
};

// Initialize Firebase
initializeApp(firebaseConfig);
const db = getFirestore();

const firestoreModule = {
  getOnce: async function () {
    const docRef = doc(db, "companies", "KhkpYLQ1U4PMDZoio9lc");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log("Document data:", docSnap.data());
    } else {
      // doc.data() will be undefined in this case
      console.log("No such document!");
    }
  },
  getPupuks: async function (layerId) {
    const q = query(collection(db, "companies/KhkpYLQ1U4PMDZoio9lc/kebuns/7aKWb6Wm0SiO4b3WobUR/pupuks"), where("layer_id", "==", layerId, orderBy("tanggal", "asc")));
    const querySnapshot = await getDocs(q);
    let pupuks = [];
    querySnapshot.forEach((doc) => {
      pupuks.push(doc.data());
      // console.log(doc.id, " => ", doc.data());
    });
    return pupuks;
  }
}

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

//const isMobile = navigator.userAgentData.mobile;
let isMobile = false; //initiate as false
// device detection
if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
  || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4))) {
  isMobile = true;
}



let editMode = false;
let modalEdit = new Modal(document.getElementById('modalEdit'));
let formFeature = {};
let selectedSource = null;
let selectedLayer = null;
let selectedFilter = "blok";
let prevSelected = null;
let workSpace = 'Mopoli'; //from db
let layerGroup = 'Mopoli_Group'; //from db
let layerTree = 'SS_Digitasi_Titik_Pokok_Sawit'; //from db
let layerRaster = ['https://api.maptiler.com/tiles/abd80c47-6117-489a-8312-a59cda7b9c3e/tiles.json?key=uwjhDiDfCigiaSx8FPMr', 'https://api.maptiler.com/tiles/01bf2a1a-ad43-4953-8347-2c1c7b23b09b/tiles.json?key=uwjhDiDfCigiaSx8FPMr'];

//let gsHost = 'http://ec2-18-136-119-137.ap-southeast-1.compute.amazonaws.com:8080';
//let gsHost = 'http://ec2-18-142-49-57.ap-southeast-1.compute.amazonaws.com:8080';
let gsHost = 'http://128.199.253.151:8080';
//let gsHost = 'http://localhost:8080';

const subStats = document.getElementById('sub-stats');

const mapCenter = fromLonLat([98.1969, 4.2667]);

let mapPadding = [50, 198, 216, 247.68];
if (isMobile) {
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
  projection: 'EPSG:4326',
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

function getBlockData() {
  const blocksUrl = gsHost + '/geoserver/' + workSpace + '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=' + workSpace + '%3ASS_Digitasi_Batas_Blok&outputFormat=application%2Fjson&srsname=EPSG:32647';
  fetch(blocksUrl)
    .then((response) => response.text())
    .then((json) => {
      // console.log(JSON.parse(json));
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
              content += `
              <div id="${element_}" class="stats-box">
              <div class="stats-label">${element_}</div>
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
    //popup
    $('#main-stats').slideUp();
    subStats.innerHTML = content;
    $('#sub-stats').on('click', '#back-stats', function () {
      $('#main-stats').show();
      reset.mapView();
    });

    if (selectedFilter === 'blok') {
      firestoreModule.getPupuks(layerId).then(function (data) {
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
    content += `<label for="${layerId.split('.')[0] + "-" + element}">${element}</label><input class="form-control" type="text" id="${layerId.split('.')[0] + "-" + element}" value='${layerProperties[element]}'>`;
  });

  content += '</div>';

  let footer = `<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
  <button id="save-feature" type="button" class="btn btn-success">Save</button>`;

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

window.addEventListener('DOMContentLoaded', event => {
  if (isMobile) {
    document.querySelector("body").classList.add('mobile');
    document.getElementById('filters').classList.remove('show');
    document.getElementById('select-filters').classList.remove('show');
  }
  getBlockData();
});
window.onresize = function () { location.reload(); };

const menuToggle = document.getElementById('menu-toggle');
menuToggle.addEventListener('click', event => {
  if (!isMobile) {
    document.querySelector('body').classList.add('mobile');
  }
})
