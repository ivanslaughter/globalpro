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
import { ScaleLine, OverviewMap, defaults as defaultControls } from 'ol/control';
import { fromLonLat, useGeographic, Projection } from 'ol/proj';
import { Modal, Offcanvas } from 'bootstrap';

//useGeographic();

/* const { JSDOM } = require("jsdom");
const { window } = new JSDOM("");
const $ = jQuery = require("jquery")(window); */

var mapInfo = new Modal(document.getElementById('mapInfo'));

const mapCenter = fromLonLat([98.1969, 4.2667]);
const projection = new Projection({
  code: 'EPSG:4326',
  units: 'm',
});
const mapExtent = [];

const afdelingSource = new VectorSource({
  url: 'http://localhost:8080/geoserver/Mopoli/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=Mopoli%3ASS_Digitasi_Batas_Afdeling&maxFeatures=50&outputFormat=application%2Fjson',
  format: new GeoJSON(),
  overlaps: true
});

const afdelingStyle = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.18)',
  }),
  stroke: new Stroke({
    color: '#319FD3',
    width: 1,
  }),
  image: new CircleStyle({
    radius: 5,
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.6)',
    }),
    stroke: new Stroke({
      color: '#319FD3',
      width: 1,
    }),
  }),
});

const vectorLayer = new VectorLayer({
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
  //projection: 'EPSG:4326',
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
  source: wmsSource,
});
const wmsLayer1 = new ImageLayer({
  //extent: [408380,467955,414599,475177],
  source: wmsSource1,
});

const layers = [ osmLayer, wmsLayer, wmsLayer1 ];

const view = new View({
  //center: proj.transform([98.1969, 4.2667], 'EPSG:4326', 'EPSG:32647'),
  //projection: projection,
  center: mapCenter,
  //pixelRatio: 1,
  zoom: 14,
});

//mousePositionControl, 

const map = new Map({
  controls: defaultControls().extend([overviewMapControl, new ScaleLine( )]),
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
  document.getElementById('mapinfo').innerHTML = '';
  const viewResolution = /** @type {number} */ (view.getResolution());
  const coord = evt.coordinate;
  const coord1 = fromLonLat([coord[0], coord[1]]);
  const url = wmsSource.getFeatureInfoUrl(
    evt.coordinate,
    viewResolution,
    'EPSG:3857',
    {
      'exceptions':'application/vnd.ogc.se_inimage',
      'INFO_FORMAT': 'text/html',
      'FEATURE_COUNT': '50',
      'X':'50',
      'Y':'50',
      //'SRS':'EPSG:32647',
    }
  );
  
  if (url) {
    fetch(url)
      .then((response) => response.text())
      .then((html) => {
        //document.getElementById('map-info').innerHTML = html;
        
        document.getElementById('mapinfo').innerHTML = html;
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
        });
        console.log(html.includes('class'));
        if (html.includes('class')){
          mapInfo.show();
        }
       
        /* console.log(html);
        const layerjson = JSON.parse(html);
        console.log(layerjson.density); */
      });
  }
  //console.log(url + ' – ' + coord1 );
});

map.on('pointermove', function (evt) {
  if (evt.dragging) {
    return;
  }
  const pixel = map.getEventPixel(evt.originalEvent);
  const hit = map.forEachLayerAtPixel(pixel, function () {
    return true;
  });
  map.getTargetElement().style.cursor = hit ? 'pointer' : '';
});

/* $(document).ready(function () {
  console.log("ready!");
  $('#map-info table').removeClass("featureInfo").addClass("table table-sm");
}); */

vectorLayer.getSource().on('featuresloadend', function () {

  const feature = afdelingSource.getFeatures()[0];
  const polygon = feature.getGeometry();
  //view.fit(polygon);

});



const gpDashboardClose = document.getElementById('gp-dashboard-close');
const checkAfdelingBlock = document.getElementById('checkAfdelingBlock');
const checkRoadBuilding = document.getElementById('checkRoadBuilding');

checkAfdelingBlock.addEventListener('change', (event) => {
  if (event.currentTarget.checked) {
    map.addLayer(wmsLayer);
  } else {
    map.removeLayer(wmsLayer);
  }
  gpDashboardClose.click();
});

checkRoadBuilding.addEventListener('change', (event) => {
  if (event.currentTarget.checked) {
    map.addLayer(wmsLayer1);
  } else {
    map.removeLayer(wmsLayer1);
  }
  gpDashboardClose.click();
});