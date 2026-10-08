// v751：スマホのMAP（一覧）で研修生・審査中（LOI〜Q4）の丸が光る
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.state.members = [
    { id: 'r', lastName: '山内', firstName: '北斗', title: 'ゴールド', parentId: '', mapType: 'both' },
    { id: 'q', lastName: '井上', firstName: '葵', title: 'Q2', parentId: 'r', mapType: 'both' },
    { id: 't', lastName: '佐藤', firstName: '花', title: '', trainee: true, parentId: 'r', mapType: 'both' },
    { id: 'b', lastName: '鈴木', firstName: '一', title: 'B2', parentId: 'r', mapType: 'both' },
    { id: 'x', lastName: '田中', firstName: '健', title: 'LOI', parentId: 'r', mapType: 'both', badgeMode: 'off' },
    { id: 'o', lastName: '木村', firstName: '空', title: 'OUT', trainee: true, parentId: 'r', mapType: 'both' }];
  w.switchView('current'); await sleep(40);
  const glw = id => { const r = $('#nc-' + id); return !!(r && r.querySelector('.mav.glw')); };
  c('審査中（Q2）が光る', glw('q'));
  c('研修生が光る', glw('t'));
  c('BR以上・BAは光らない', !glw('r') && !glw('b'));
  c('ケアの印を「非表示」にした人・OUTは光らない', !glw('x') && !glw('o'));
  c('光るアニメ（mxGlow）', /@keyframes mxGlow/.test(w.document.head.innerHTML));
});
