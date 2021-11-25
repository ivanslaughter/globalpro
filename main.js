import './style.css';
import {Map, View} from 'ol';
import MousePosition from 'ol/control/MousePosition';
import { Image as ImageLayer, Tile as TileLayer } from 'ol/layer';
import ImageWMS from 'ol/source/ImageWMS';
import TileWMS from 'ol/source/TileWMS';
import OSM from 'ol/source/OSM';
import { createStringXY } from 'ol/coordinate';
import { OverviewMap, defaults as defaultControls } from 'ol/control';
import { fromLonLat, useGeographic } from 'ol/proj';

//useGeographic();
const mapCenter = fromLonLat([98.1969, 4.2667]);

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

const wmsSource = new ImageWMS({
  url: 'http://localhost:8080/geoserver/Mopoli/wms',
  params: { 'LAYERS': 'Mopoli:Mopoli_Group' },
  serverType: 'geoserver',
});

const osmLayer = new TileLayer({
  source: new OSM(),
});

const wmsLayer = new ImageLayer({
  source: wmsSource,
});

const layers = [ osmLayer, wmsLayer ];

const view = new View({
  //center: proj.transform([98.1969, 4.2667], 'EPSG:4326', 'EPSG:32647'),
  center: mapCenter,
  zoom: 14,
});

//mousePositionControl, 

const map = new Map({
  controls: defaultControls().extend([overviewMapControl]),
  target: 'map',
  layers: layers,
  view: view,
});

$('.ol-zoom-in, .ol-zoom-out').tooltip({
  placement: 'left',
  container: '#map',
});
$('.ol-rotate-reset, .ol-attribution button[title]').tooltip({
  placement: 'left',
  container: '#map',
});

map.on('singleclick', function (evt) {
  document.getElementById('map-info').innerHTML = '';
  const viewResolution = /** @type {number} */ (view.getResolution());
  const url = wmsSource.getFeatureInfoUrl(
    evt.coordinate,
    viewResolution,
    'EPSG:32647',
    { 'INFO_FORMAT': 'text/html' }
  );
  console.log(viewResolution);
  if (url) {
    fetch(url)
      .then((response) => response.text())
      .then((html) => {
        document.getElementById('map-info').innerHTML = html;
      });
  }
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