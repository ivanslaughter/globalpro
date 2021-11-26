import './css/style.css';
import {Map, View, Overlay} from 'ol';
import MousePosition from 'ol/control/MousePosition';
import { Image as ImageLayer, Tile as TileLayer } from 'ol/layer';
import ImageWMS from 'ol/source/ImageWMS';
import TileWMS from 'ol/source/TileWMS';
import OSM from 'ol/source/OSM';
import { createStringXY } from 'ol/coordinate';
import { ScaleLine, OverviewMap, defaults as defaultControls } from 'ol/control';
import { fromLonLat, useGeographic, Projection } from 'ol/proj';

//useGeographic();
const mapCenter = fromLonLat([98.1969, 4.2667]);
const projection = new Projection({
  code: 'EPSG:4326',
  units: 'm',
});
const mapExtent = [];

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
  params: { 'LAYERS': 'Mopoli:Mopoli_Group', 'TILED': true },
  serverType: 'geoserver',
});

const osmLayer = new TileLayer({
  source: new OSM(),
});

const wmsLayer = new ImageLayer({
  //extent: [408380,467955,414599,475177],
  source: wmsSource,
});

const layers = [ osmLayer, wmsLayer ];

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
  document.getElementById('map-info').innerHTML = '';
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
        document.getElementById('map-info').innerHTML = html;
        $('#map-info table').removeClass("featureInfo").addClass("table table-sm");
        $("#map-info td").each(function () {
          var text = $(this).text();
          text = text.replace("SS_Digitasi_Batas_", "");
          text = text.replace("SS_Digitasi_Jalan_Atribut", "Jalan");
          text = text.replace("SS_Digitasi_Jembatan", "Jembatan");
          text = text.replace("SS_Digitasi_Bangunan", "Bangunan");
          $(this).text(text);
        });
        $("#map-info th").each(function () {
          var text = $(this).text();
          text = text.replace("Block", "Blok");
          $(this).text(text);
        });
        $("#map-info table caption").each(function () {
          var text = $(this).text();
          text = text.replace("SS_Digitasi_Batas_", "");
          text = text.replace("SS_Digitasi_Jalan_Atribut", "Jalan");
          text = text.replace("SS_Digitasi_Bangunan", "Bangunan");
          $(this).text(text);
        });
      });
  }
  console.log(url + ' – ' + coord1 );
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