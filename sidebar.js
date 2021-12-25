import numeral from 'numeral';

export default function showFarmStats(afdeling, block){
  let stasHTML = '';

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

    stasHTML = `<div class="stats-box">
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
      </div>`;
    document.getElementById('sidebar').classList.toggle('show');
    document.getElementById('main-stats').innerHTML = stasHTML;
  }

}