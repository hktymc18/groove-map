// v922：夢100 上の帯はスクロールしても残す・月ごとに「＋ この月に追加」。夢はすべて見本
const T = require('../lib/head.js')({ now: '2026-11-25T03:00:00Z' });
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  const D = [['2026-12', 'ソファ', 12], ['2026-12', 'ノートパソコン', 18], ['2027-03', 'カメラ', 22], ['2027-04', 'テーブル', 20], ['2027-04', 'オーディオ', 60],
    ['2027-05', '温泉', 30], ['2027-05', '旅行', 88], ['', 'いつか行きたい島', 0], ['2026-10', 'イヤホン', 3, 1]];
  w._p2().dreams = D.map((x, i) => ({ id: 'd' + i, t: x[1], dl: x[0], amt: x[2] ? String(x[2]) : '', done: !!x[3] }));
  try { w.localStorage.removeItem('gm_drTo'); } catch (e) {}
  w._uxLists = {}; w.switchView('plan'); await sleep(60); w.p2Go('dream'); await sleep(80);
  const stk = $('.dr-stk');
  c('v922 上の帯（達成の数・＋ 夢を追加）は sticky', !!stk && !!stk.querySelector('.dr-add') && w.getComputedStyle(stk).position === 'sticky');
  c('v922 スマホは期間のボタンは帯に入れない（帯を小さく）', !stk.querySelector('.dr-f') && !!$('.dr-f'));
  c('v922 下の「＋ 夢を追加」は出さない（上にいつもある）', ![...$$('.ux-lk')].some(e => /夢を追加/.test(e.textContent)));
  w._uxLists['dream:all'] = 1; w.renderPlan(); await sleep(60);
  const tiles = [...$$('.dr-addc')].map(e => e.textContent);
  c('v922 月ごとに「＋ この月に追加」・期日なしは「期日なしで追加」・過ぎた月には出さない', tiles.join() === '＋ この月に追加,＋ この月に追加,＋ この月に追加,＋ この月に追加,＋ 期日なしで追加', tiles.join());
  $$('.dr-addc')[2].onclick(); await sleep(150);
  const y = $('#p2drDY'), m = $('#p2drDM');
  c('v922 押すと期日にその月（2027年4月）が入った入力画面', !!$('#p2DrFormOv') && y && m && y.value === '2027' && String(+m.value) === '4', (y && y.value) + '-' + (m && m.value));
  $('#p2drT').value = '見本の夢'; w.p2DrSave(); await sleep(60);
  c('v922 そのまま足すとその月の夢になる', w._p2().dreams.some(d => d.t === '見本の夢' && d.dl === '2027-04'));
  w._p2SheetClose && w._p2SheetClose('p2DrFormOv');
  setWH(1440, 900); w._uxSync && w._uxSync(); w.renderPlan(); await sleep(80);
  if (w.document.body.classList.contains('px3')) c('v922 PC は期間のボタンも帯に入れる', !!$('.dr-stk .dr-f'));
});
