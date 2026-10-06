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
  const op = $$('.ids-lbh select option');
  c('今のタイトル（ゴールド・今）から上がリストで並ぶ', op.length === 7 && op[0].textContent === 'ゴールド（今）' && op[1].textContent === 'ラピス' && op[6].textContent.indexOf('チームエリート') === 0);
  c('最初は1つ上（ラピス）だけ表示', $$('.ids-lbr:not(.off)').length === 1 && +$('.ids-lbr:not(.off)').getAttribute('data-r') === 1 && $('.ids-lbh select').value === '1');
  w.lbUpSel(4);
  c('選ぶとそのタイトルだけ（ダイヤモンド）', $$('.ids-lbr:not(.off)').length === 1 && +$('.ids-lbr:not(.off)').getAttribute('data-r') === 4 && $('.ids-lbh select').value === '4');
  box.innerHTML = w._lbUpHtml(ms);
  c('選んだタイトルは描き直しても覚えている', $('.ids-lbh select').value === '4' && +$('.ids-lbr:not(.off)').getAttribute('data-r') === 4);
  ms[0].ptCurrent = 2500; box.innerHTML = w._lbUpHtml(ms);
  c('GSV 3,000P未満：今のまま／3,000Pを超えたらの2つ', $$('.ids-lbr:not(.off) .ids-lbk').length === 2 && $('.ids-lbr:not(.off)').textContent.indexOf('GSV 3,000P以上') >= 0);
  c('あと必要はバー（フロントBR・系列LTSV）・小さい説明文はなし', $$('.ids-lbr:not(.off) .ids-lbq').length === 3 && $('.ids-lbup').textContent.indexOf('範囲の世代') < 0 && !!$('.ids-lbup .ids-ib'));
  w.lbUpInfo(); c('(i)で計算の説明', !!$('#uxInfo') && $('#uxInfo').textContent.indexOf('第1世代×10%') >= 0); w.uxInfoClose();
  ms[0].ptCurrent = 3500; box.innerHTML = w._lbUpHtml(ms);
  c('GSV 3,000P以上：1つだけ', $$('.ids-lbr:not(.off) .ids-lbk').length === 1 && $('.ids-lbup').textContent.indexOf('GSV 3,000P以上') < 0);
  box.remove();
  console.log('=== 説明はタップ／マウスで ===');
  w.state.members = ms; w.localStorage.setItem('gm_idsOpen', '1');
  w.switchView('ideal'); w.renderIdealSum(); await sleep(30);
  const tp = $$('#idealSum .ids-tp');
  const html = require('fs').readFileSync(require('path').join(__dirname, '../../../index.html'), 'utf8');
  c('バーの下・SB/BB/LBの説明は吹き出しの中（最初は隠す・マウスで出す）', tp.length >= 5 && html.indexOf('.ids-card .ids-tp{display:none;') >= 0 && html.indexOf('@media (hover:hover){.ids-card .has-tp:hover .ids-tp{display:block}}') >= 0 && $$('#idealSum .ids-cb>div.has-tp').length === 3);
  const card = $$('#idealSum .ids-cb>div')[1]; w.idsTip(card);
  c('タップで吹き出し（BB：早見表）', card.classList.contains('tp-on') && card.querySelector('.ids-tp').textContent.indexOf('早見表') >= 0);
  w.idsTip($$('#idealSum .ids-lb.has-tp')[0]); c('ほかを押すと前のは閉じる', !card.classList.contains('tp-on'));
});
