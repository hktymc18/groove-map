// v921：夢100（上に「＋ 夢を追加」・「月を選ぶ」は期日の月だけ・月ごとの見出し・PC は全部出す）。夢はすべて見本
const T = require('../lib/head.js')({ now: '2026-11-25T03:00:00Z' });
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  const D = [['2026-12', 'ソファ', 12], ['2026-12', 'ノートパソコン', 18], ['2027-03', 'カメラ', 22], ['2027-04', 'テーブル', 20], ['2027-04', 'オーディオ', 60],
    ['2027-05', '温泉', 30], ['2027-05', '旅行', 88], ['', 'いつか行きたい島', 0], ['2026-10', 'イヤホン', 3, 1]];
  w._p2().dreams = D.map((x, i) => ({ id: 'd' + i, t: x[1], dl: x[0], amt: x[2] ? String(x[2]) : '', done: !!x[3] }));
  try { w.localStorage.removeItem('gm_drTo'); } catch (e) {}
  w._uxLists = {}; w.switchView('plan'); await sleep(60); w.p2Go('dream'); await sleep(80);
  c('上に「＋ 夢を追加」があり、押すと入力画面が開く', !!$('.dr-top .dr-add') && (() => { let o = 0; const f = w.p2DrFormOpen; w.p2DrFormOpen = () => { o++; }; $('.dr-top .dr-add').onclick(); w.p2DrFormOpen = f; return o === 1; })());
  const opts = [...$$('.dr-f select option')].map(o => o.value + ':' + o.textContent);
  c('「月を選ぶ」は期日にした月だけ（今月より前・期日なしは出ない）・右に夢の数', JSON.stringify(opts) === JSON.stringify([':月を選ぶ', '2026-12:2026年12月まで（3個）', '2027-03:2027年3月まで（4個）', '2027-04:2027年4月まで（6個）', '2027-05:2027年5月まで（8個）']), opts.join(' | '));
  const gh = () => [...$$('.dr-gh b')].map(e => e.textContent);
  c('スマホは6個まで・見出しは期日の月ごと', $$('.dr-lw').length === 6 && gh().join() === '2026年12月まで,2027年3月まで,2027年4月まで,2027年5月まで', gh().join() + ' / ' + $$('.dr-lw').length);
  c('金額はカードの右', $('.dr-lw .dr-am') && $('.dr-lw .dr-am').textContent === '12万円');
  w._uxLists['dream:all'] = 1; w.renderPlan(); await sleep(60);
  c('すべて見ると、期日なし → 全部叶えた月 の順で後ろに', gh().join() === '2026年12月まで,2027年3月まで,2027年4月まで,2027年5月まで,期日なし,2026年10月まで' && /ぜんぶ叶えた/.test($$('.dr-gh')[5].textContent), gh().join());
  // 月を選んだ時
  w.p2DrTo('2027-03'); await sleep(60);
  c('月を選ぶとその月までの夢だけ・選んだ月が選ばれている', $$('.dr-lw').length === 4 && $('.dr-f select').value === '2027-03' && !!$('.dr-need'));
  w.p2DrTo(''); await sleep(30);
  // PC
  w._uxLists = {}; setWH(1440, 900); w._uxSync && w._uxSync(); w.renderPlan(); await sleep(80);
  c('PC は最初から全部出す（すべて見る は出ない）', !w.document.body.classList.contains('px3') || ($$('.dr-lw').length === 9 && !$('.ux-more')), w.document.body.className + ' ' + $$('.dr-lw').length);
});
