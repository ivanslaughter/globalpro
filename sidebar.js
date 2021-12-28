import numeral from 'numeral';
import { Collapse } from 'bootstrap';

const filterDiv = document.body.querySelector('#filter-div');
let bsFilterDiv = new Collapse(filterDiv, {
  toggle: false
});
const statsBoxesBtn = document.getElementById('stats-boxes-button');

export default function showFarmStats(afdeling, block){
  let statsHTML = '';

  if (block.length > 0) {
    let sa = 0;
    let sb = 0;
    let st = 0;
    let sd = 0;
    block.forEach(function (element) {
      sa += (element.properties.Luas);
      sb++;
      st += (element.properties.Jml_Sawit);
      sd += (element.properties.Density);
    });

    statsHTML = `<div class="stats-title mb-2">Data Kebun</div>
      <div id="main-stats-boxes" class="stats-boxes collapse show">
      <div class="stats-box">
        <div class="stats-label">Luas Area (Ha)</div>
        <div id="stats-area" class="stats-value">${numeral(sa).format(',0.0')}</div>
      </div>
      <div class="stats-box">
        <div class="stats-label">Jumlah Afdeling</div>
        <div id="stats-afdeling" class="stats-value">${afdeling}</div>
      </div>
      <div class="stats-box">
        <div class="stats-label">Jumlah Blok</div>
        <div id="stats-block" class="stats-value">${sb}</div>
      </div>
      <div class="stats-box">
        <div class="stats-label">Pokok Sawit</div>
        <div id="stats-tree" class="stats-value">${numeral(st).format(',0')}</div>
      </div>
      <div class="stats-box">
        <div class="stats-label">Densitas (Avg)</div>
        <div id="stats-density" class="stats-value">${numeral((sd / sb)).format('0.')}</div>
      </div>
      </div>`;
    document.getElementById('sidebar').classList.toggle('show');
    document.getElementById('main-stats').innerHTML = statsHTML;
    bsFilterDiv.show();

    const statsBoxes = document.querySelector('.stats-boxes');
    let bsStatsBoxes = new Collapse(statsBoxes, {
      toggle: false
    });
    statsBoxes.addEventListener('shown.bs.collapse', function () {
      console.log('stats-boxes collapse show');
      if (statsBoxes.classList.contains('show') == true) {
        console.log('stats-boxes on');
        statsBoxesBtn.innerHTML = '<i class="jt-chevron-thin-up"></i>';
      }
    });
    statsBoxes.addEventListener('hidden.bs.collapse', function () {
      console.log('stats-boxes collapse hide');
      if (statsBoxes.classList.contains('show') == false) {
        console.log('stats-boxes on');
        statsBoxesBtn.innerHTML = '<i class="jt-chevron-thin-down"></i>';
      }
    });

  }

}