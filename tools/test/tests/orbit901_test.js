// v901：サークルMAPも新しいトーン（ツリーと同じ区分の色・系列の線は4色・光らせない・名前は同じ色）。名前はすべて架空
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
const fs = require('fs'), path = require('path');
T.run(async () => {
  T.login(); setWH(1440, 1000); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '見本', firstName: '一', title: 'ゴールド', parentId: '', mapType: 'both', activity: 'S', actRate: 90, ptCurrent: 1000 },
    { id: 'a', lastName: '見本', firstName: '二', title: 'Q2', parentId: 'r', mapType: 'both', activity: 'A', ptCurrent: 300 },
    { id: 'b', lastName: '見本', firstName: '三', title: 'PG', parentId: 'r', mapType: 'both', trainee: true, gender: 'female' },
    { id: 'd', lastName: '見本', firstName: '四', title: 'BR', parentId: 'r', mapType: 'both', activity: 'B', ptCurrent: 100 }];
  w.switchView('current'); await sleep(150);
  w.switchPCView('orbit'); await sleep(300);
  const svg = $('#orbitSvgC');
  c('サークルMAPが出る', !!svg);
  const ring = id => { const g = svg && svg.querySelector('.orbit-node[data-mid="' + id + '"]'); const cs = g ? [...g.querySelectorAll('circle')].filter(x => x.getAttribute('stroke') && x.getAttribute('stroke') !== 'none') : []; return cs.length ? cs[cs.length - 1].getAttribute('stroke') : ''; };
  const L = w.document.body.classList.contains('light');
  c('BR以上の縁はバイオレット', ring('d') === (L ? '#602BFC' : '#B095FE'), ring('d'));
  c('審査中（Q2）の縁はイエロー', ring('a') === '#B3BF30', ring('a'));
  c('研修生の縁はターコイズ', ring('b') === '#26C7B3', ring('b'));
  c('光らせない（脈打つ輪なし）', !svg.querySelectorAll('.orbit-pulse').length);
  const lines = [...svg.querySelectorAll('path,line')].map(x => x.getAttribute('stroke')).filter(Boolean);
  c('前の色（ミント・スカイ・オレンジ）が残っていない', !lines.concat([...svg.querySelectorAll('circle')].map(x => x.getAttribute('stroke'))).some(s => /^#(2CE5B8|5AD7FF|FFB454|FFD166|8B7CFF)$/i.test(s || '')));
  const html = fs.readFileSync(path.join(__dirname, '../../../index.html'), 'utf8');
  c('(i) ボタンはターコイズ（var(--green)）', /body \.ux-ib,body \.ux-info i,body \.ids-ib\{border-color:var\(--green\)!important;color:var\(--green\)!important\}/.test(html));
});
