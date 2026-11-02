// v863：カレンダー縦（連続）で、iPhoneのキーボードで表示が低くなっても、1年後の11月などに飛ばない（上に見えている週を保つ）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $ } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  w.localStorage.setItem('gm_calScroll', 'v'); w._calScrollMode = 'v'; w._calScrollInit = false;
  w.switchView('events'); w.setEventsMode('calendar'); await sleep(40);
  const g = $('#evCalGrid');
  // jsdom は大きさを計算しないので、縦の大きさを決める（1週＝表示の高さの20%）
  let ch = 700, top = 0;
  const weeks = () => w._calRangeWeeks;
  Object.defineProperty(g, 'clientHeight', { get: () => ch, configurable: true });
  Object.defineProperty(g, 'scrollHeight', { get: () => Math.round(weeks() * ch * 0.2), configurable: true });
  Object.defineProperty(g, 'scrollTop', { get: () => top, set: v => { top = Math.max(0, Math.min(v, g.scrollHeight - ch)); }, configurable: true });
  w._calScrollInit = false; w.renderCalendar(); await sleep(10);
  const title = () => ($('#evCalTitle') || {}).textContent || '';
  const t0 = title(), top0 = top;
  c('最初は今月（今日の週が上）', /2026年 10月/.test(t0) && top0 > 0);
  const scroll = async () => { g.dispatchEvent(new w.Event('scroll')); await sleep(40); };
  // ① キーボードが出て表示がとても低くなる（ピクセルの位置はいちばん下まで押し下げられる）
  ch = 160; top = top; top = Math.min(top, g.scrollHeight - ch);
  w.dispatchEvent(new w.Event('resize')); await sleep(5); await scroll();
  c('キーボード中も、上の週は同じ（月が飛ばない）', title() === t0);
  // ② そのまま保存（再描画）
  w.renderEvents(); await sleep(20);
  c('保存して再描画しても今月のまま', title() === t0);
  // ③ キーボードが閉じて高さが戻る
  ch = 700; w.dispatchEvent(new w.Event('resize')); await sleep(5); await scroll();
  c('キーボードを閉じたら元の位置（1年後の11月に飛ばない）', title() === t0 && Math.abs(top - top0) < 3);
  // ④ ふつうのスクロールは今まで通り月が変わる
  w._calResizeHold = 0; // テストの時計は止まっているので、0.7秒たった扱いにする
  top = top0 + 140 * 18; await scroll();
  c('自分でスクロールした時は月が変わる（約4ヶ月先）', title() !== t0 && /2027年 [1-3]月|2026年 12月/.test(title()));
  const t4 = title(); w.renderEvents(); await sleep(20);
  c('スクロールした先も、再描画で保たれる', title() === t4);
  // ⑤ 横（1ヶ月ずつ）は今まで通り
  w.localStorage.setItem('gm_calScroll', 'h'); w._calScrollMode = 'h'; w.renderCalendar(); await sleep(10);
  c('横の時はスクロールしない（前のまま）', top === 0);
});
