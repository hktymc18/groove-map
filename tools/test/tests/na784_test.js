// v784：PCのフロント追加は画面いっぱいではなく、メンバー画面と同じ右側のパネル。タイトルのカードにカテゴリの色
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $ } = T;
T.run(async () => {
  T.login(); setWH(1440, 900); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'G', parentId: '', mapType: 'both' }];
  w.switchView('current'); await sleep(20);
  c('前提：PC', w.isPCMode());
  w.naOpen('r'); await sleep(20);
  c('フロント追加が開く', !!$('#naPg') && /山内 北斗さんの下に追加/.test($('#naPg').textContent));
  const css = w.document.getElementById('ppCss').textContent;
  c('PCは右側のパネル（幅440px）', /@media\(min-width:768px\) and \(min-height:501px\)\{#ppPg,#naPg\{left:auto!important;right:0;width:440px/.test(css));
  c('下のボタンはパネルの中', /#naPg \.ux-btm\{position:sticky!important;left:auto!important/.test(css));
  c('タイトルのカードにカテゴリの色（PCでも読み込む）', !!w.document.getElementById('mxCss') && /--mxtr:/.test(w.document.getElementById('mxCss').textContent) && /--mxtr/.test($('#naPg .ttc').getAttribute('style')));
  w.document.getElementById('naLast').value = '佐藤'; w.naSave(''); await sleep(20);
  c('追加できる', w.state.members.some(m => m.lastName === '佐藤' && m.parentId === 'r'));
});
