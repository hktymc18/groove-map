// v911：MAP の女性の名前はトーン表になじむピンク（ライト #D6337A・ダーク #FF8FC0）。名前はすべて架空
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $ } = T;
const fs = require('fs'), path = require('path');
T.run(async () => {
  const html = fs.readFileSync(path.join(__dirname, '../../../index.html'), 'utf8');
  c('女性の色（ライト・ダーク）', /body:not\(\.light\)\{--female:#FF8FC0\}body\.light\{--female:#D6337A\}/.test(html));
  c('スマホの MAP の女性の名前はピンク（--female）', /body \.mn \.n\.female\{color:var\(--female\)\}/.test(html));
  T.login(); w.setTheme('light'); setWH(1440, 1000); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '見本', firstName: '一', title: 'ゴールド', parentId: '', mapType: 'both', gender: 'male' },
    { id: 'a', lastName: '見本', firstName: '花', title: 'B2', parentId: 'r', mapType: 'both', gender: 'female' }];
  w.switchView('current'); await sleep(250);
  const fill = id => { const g = $('[data-mid="' + id + '"]'); const t = g && [...g.querySelectorAll('text')].find(x => /見本/.test(x.textContent)); return t ? t.getAttribute('fill') : ''; };
  c('PC の MAP：女性の名前はピンク', fill('a') === '#D6337A', fill('a'));
  c('PC の MAP：男性の名前はチャコール', fill('r') !== '#D6337A' && !!fill('r'), fill('r'));
});
