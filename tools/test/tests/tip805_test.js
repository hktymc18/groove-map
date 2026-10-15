// v805（#15）：スマホで計画シートのMAPの人を押しても、マウス用の情報カードが出て消えなくなることがない
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '永尾', firstName: '歩夢', title: 'BR', parentId: '', mapType: 'both' },
    { id: 'a', lastName: '別所', firstName: '星哉', title: 'B3', parentId: 'r', mapType: 'both' }];
  const tip = () => w.document.getElementById('pcTooltip');
  const shown = () => !!(tip() && tip().classList.contains('show'));
  const ev = (type, extra) => { const e = new w.Event(type, { bubbles: true }); Object.assign(e, extra || {}); return e; };
  // 指でタップ（pointerdown(touch) → mouseenter）
  w.document.body.dispatchEvent(ev('pointerdown', { pointerType: 'touch' }));
  w.showPcTooltip('a', { clientX: 100, clientY: 100 }); await sleep(20);
  c('指のタップでは情報カードを出さない', !shown());
  // マウス（PC）では今までどおり
  w.document.body.dispatchEvent(ev('pointerdown', { pointerType: 'mouse' }));
  w.showPcTooltip('a', { clientX: 100, clientY: 100 }); await sleep(20);
  c('マウスでは今までどおり出る', shown());
  // 出ている時に画面を指でさわると消える
  w.document.body.dispatchEvent(ev('touchstart')); await sleep(20);
  c('指でさわると消える', !shown());
});
