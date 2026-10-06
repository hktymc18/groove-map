// v640/v641：理想 vs 現状の「タイトルが上がると、リーディングは」をリストで選んで1つだけ（大きい数字だけ・説明は(i)）
//            バー・SB/BB/LBの説明はタップ／マウスで吹き出し。「長期目標から見た今月の目安」と下の説明書きはなし
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login();
  const ms = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'ゴールド', parentId: '', mapType: 'both', ptCurrent: 2500 },
    { id: 'a', lastName: '佐藤', firstName: '花', title: 'BR', parentId: 'r', mapType: 'both', ptCurrent: 2000 }];
  w.localStorage.removeItem('gm_lbUpSel');
  const box = w.document.createElement('div'); w.document.body.appendChild(box);
  box.innerHTML = w._lbUpHtml(ms);
  const op = $$('.ids-lbup select option');
  c('ゴールドより上のタイトルがリストで並ぶ', op.length === 6 && op[0].textContent === 'ラピス' && op[5].textContent === 'チームエリート');
  c('最初は1つ上（ラピス）だけ表示', $$('.ids-lbr:not(.off)').length === 1 && +$('.ids-lbr:not(.off)').getAttribute('data-r') === 1 && $('.ids-lbup select').value === '1');
  w.lbUpSel(4);
  c('選ぶとそのタイトルだけ（ダイヤモンド）', $$('.ids-lbr:not(.off)').length === 1 && +$('.ids-lbr:not(.off)').getAttribute('data-r') === 4 && $('.ids-lbup select').value === '4');
  box.innerHTML = w._lbUpHtml(ms);
  c('選んだタイトルは描き直しても覚えている', $('.ids-lbup select').value === '4' && +$('.ids-lbr:not(.off)').getAttribute('data-r') === 4);
  c('金額は1つだけ（3,000P以上の額・あと必要のバーはなし）', $$('.ids-lbr:not(.off) b').length === 1 && $('.ids-lbup').textContent.indexOf('3,000P') < 0 && $('.ids-lbup').textContent.indexOf('あと必要') < 0 && !!$('.ids-lbup .ids-ib'));
  w.lbUpInfo(); c('(i)で計算の説明', !!$('#uxInfo') && $('#uxInfo').textContent.indexOf('第1世代×10%') >= 0); w.uxInfoClose();
  box.remove();
  console.log('=== 説明はタップ／マウスで ===');
  w.state.members = ms; w.localStorage.setItem('gm_idsOpen', '1');
  setWH(1400, 900); w._uxSync && w._uxSync();
  w.switchView('ideal'); w.renderIdealSum(); await sleep(30);
  const tp = $$('#idealSum .ids-tp');
  const html = require('fs').readFileSync(require('path').join(__dirname, '../../../index.html'), 'utf8');
  c('バーの下・SB/BB/LBの説明は吹き出しの中（最初は隠す・マウスで出す）', tp.length >= 5 && html.indexOf('.ids-card .ids-tp{display:none;') >= 0 && html.indexOf('@media (hover:hover){.ids-card .has-tp:hover .ids-tp{display:block}}') >= 0 && $$('#idealSum .ids-cb>div.has-tp').length === 3);
  const card = $$('#idealSum .ids-cb>div')[1]; w.idsTip(card);
  c('タップで吹き出し（BB：早見表）', card.classList.contains('tp-on') && card.querySelector('.ids-tp').textContent.indexOf('早見表') >= 0);
  w.idsTip($$('#idealSum .ids-t.has-tp')[0]); c('ほかを押すと前のは閉じる', !card.classList.contains('tp-on'));
  c('1列のタイル（5つの数字＋コミッション＋タイトルが上がると）', $$('#idealSum .ids-g>.ids-t').length === 7 && !!$('#idealSum .ids-g>.ids-cm') && !!$('#idealSum .ids-g>.ids-tu') && html.indexOf('.ids-g{display:grid;grid-template-columns:repeat(5,minmax(0,1fr)) minmax(0,1.6fr) minmax(0,1.4fr)') >= 0);
  setWH(390, 844); w._uxSync && w._uxSync(); w.renderIdealSum(); await sleep(20);
  c('スマホは横棒の行・SB/BB/LBのカード・タイトルが上がる（1つ前の形）', $$('#idealSum .ids-row').length === 5 && !$('#idealSum .ids-g') && $$('#idealSum .ids-cb>div.has-tp').length === 3 && !!$('#idealSum .ids-lbup .ids-lbk') && $$('#idealSum .ids-lb.has-tp').length >= 3);
  w.lbUpSel(2); c('スマホでもタイトルを選べる', $('#idealSum .ids-lbup select').value === '2' && +$('#idealSum .ids-lbr:not(.off)').getAttribute('data-r') === 2);
  c('「長期目標から見た今月の目安」と「カードをタップ〜」はなし', $('#idealSum').textContent.indexOf('長期目標から見た') < 0 && $('#idealSum').textContent.indexOf('カードをタップ') < 0);
});
