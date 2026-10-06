// v640：理想 vs 現状の「タイトルが上がると、リーディングは」をタイトルを選んで1つだけ出す
const T = require('../lib/head.js')();
const { w, c, sleep, $, $$ } = T;
T.run(async () => {
  T.login();
  const ms = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'ゴールド', parentId: '', mapType: 'both', ptCurrent: 3000 },
    { id: 'a', lastName: '佐藤', firstName: '花', title: 'BR', parentId: 'r', mapType: 'both', ptCurrent: 2000 }];
  w.localStorage.removeItem('gm_lbUpSel');
  const box = w.document.createElement('div'); w.document.body.appendChild(box);
  box.innerHTML = w._lbUpHtml(ms);
  const bt = $$('.ids-lbc button');
  c('ゴールドより上のタイトルがボタンで並ぶ', bt.length === 6 && bt[0].textContent === 'ラピス' && bt[5].textContent === 'チームエリート');
  c('最初は1つ上（ラピス）だけ表示', $$('.ids-lbr:not(.off)').length === 1 && $('.ids-lbr:not(.off)').textContent.indexOf('ラピス') >= 0 && bt[0].classList.contains('on'));
  w.lbUpSel(4);
  c('選ぶとそのタイトルだけ（ダイヤモンド）', $$('.ids-lbr:not(.off)').length === 1 && $('.ids-lbr:not(.off)').textContent.indexOf('ダイヤモンド') >= 0 && $('.ids-lbc button.on').textContent === 'ダイヤモンド');
  box.innerHTML = w._lbUpHtml(ms);
  c('選んだタイトルは描き直しても覚えている', $('.ids-lbr:not(.off)').textContent.indexOf('ダイヤモンド') >= 0);
  box.remove();
});
