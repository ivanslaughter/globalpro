import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/style.css';
import '../css/style_admin.css';
import numeral from 'numeral';
import isMobile from '../mobile';
import WebFont from 'webfontloader';

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

window.addEventListener('DOMContentLoaded', event => {
  if (isMobile()) {
    document.querySelector("body").classList.add('mobile');
  }
  console.log('Loaded');
});
