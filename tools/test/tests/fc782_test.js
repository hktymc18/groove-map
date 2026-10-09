// v782：系列フォーカスはやめた（PCのMAPでカードを押しても他の系列が薄くならない・案内／解除の表示も出さない）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(1440, 1000); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'ゴールド', parentId: '', mapType: 'both' },
    { id: 'a', lastName: '鈴木', firstName: '一', title: 'B2', parentId: 'r', mapType: 'both' }, { id: 'b', lastName: '佐藤', firstName: '花', title: 'B1', parentId: 'r', mapType: 'both' },
    { id: 'a1', lastName: '高橋', firstName: '光', title: '', parentId: 'a', mapType: 'both' }];
  w.switchView('current'); await sleep(200);
  const txt = []; const tw = w.document.createTreeWalker(w.document.body, 4); let n; while ((n = tw.nextNode())) { if (n.parentNode.nodeName !== 'SCRIPT' && /系列フォーカス/.test(n.nodeValue)) txt.push(n.nodeValue); }
  c('「系列フォーカス」の案内・解除ボタンが出ない', txt.length === 0 && !$('.layered-focus-hint'), txt.join('|'));
  const g = $('[data-mid="a"]');
  if (g) { g.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); await sleep(30); }
  const dim = $$('.oval-node').filter(n => n.classList.contains('map-unfocus') || n.style.opacity === '0.6');
  c('カードを押しても他の系列が薄くならない', !!g && !w._pcFocusLineage && dim.length === 0, dim.length);
});
