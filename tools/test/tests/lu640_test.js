// v640/v641：理想 vs 現状の「タイトルが上がると、リーディングは」をリストで選んで1つだけ出す／GSV 3,000P未満は3,000Pを超えた場合も
const T = require('../lib/head.js')();
const { w, c, sleep, $, $$ } = T;
T.run(async () => {
  T.login();
  const ms = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'ゴールド', parentId: '', mapType: 'both', ptCurrent: 3000 },
    { id: 'a', lastName: '佐藤', firstName: '花', title: 'BR', parentId: 'r', mapType: 'both', ptCurrent: 2000 }];
  w.localStorage.removeItem('gm_lbUpSel');
  const box = w.document.createElement('div'); w.document.body.appendChild(box);
  box.innerHTML = w._lbUpHtml(ms);
  const op = $$('.ids-lbs select option');
  c('ゴールドより上のタイトルがリストで並ぶ', op.length === 6 && op[0].textContent.indexOf('ラピス') === 0 && op[5].textContent.indexOf('チームエリート') === 0);
  c('最初は1つ上（ラピス）だけ表示', $$('.ids-lbr:not(.off)').length === 1 && +$('.ids-lbr:not(.off)').getAttribute('data-r') === 1 && $('.ids-lbs select').value === '1');
  w.lbUpSel(4);
  c('選ぶとそのタイトルだけ（ダイヤモンド）', $$('.ids-lbr:not(.off)').length === 1 && +$('.ids-lbr:not(.off)').getAttribute('data-r') === 4 && $('.ids-lbs select').value === '4');
  box.innerHTML = w._lbUpHtml(ms);
  c('選んだタイトルは描き直しても覚えている', $('.ids-lbs select').value === '4' && +$('.ids-lbr:not(.off)').getAttribute('data-r') === 4);
  c('GSV 3,000P未満：今のまま／3,000Pを超えたらの2つ', $$('.ids-lbr:not(.off) .ids-lbk').length === 2 && $('.ids-lbr:not(.off)').textContent.indexOf('3,000Pを超えたら') >= 0 && $('.ids-lbh').textContent.indexOf('3,000Pを超えたら') >= 0);
  ms[0].ptCurrent = 3500; box.innerHTML = w._lbUpHtml(ms);
  c('GSV 3,000P以上：1つだけ', $$('.ids-lbr:not(.off) .ids-lbk').length === 1 && $('.ids-lbup').textContent.indexOf('3,000Pを超えたら') < 0);
  box.remove();
});
