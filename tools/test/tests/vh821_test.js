// v821（#16）：はじめて開いた時（前回の高さを覚えていない）も、カレンダーが画面の下にはみ出さない
//   ・iOSが「画面いっぱい（ステータスバー分も含む）」の高さを返しても、ページ本来の高さ（clientHeight）に合わせる
//   ・キーボードの後に小さいまま戻らない時も、画面いっぱいではなくページ本来の高さに戻す（ステータスバー分はみ出さない）
//   ・CSSでも、ブラウザの実際の高さ（100dvh）より大きくしない
const T = require('../lib/head.js')();
const { w, c, setWH } = T;
const fs = require('fs'), path = require('path');
T.run(async () => {
  T.login(); setWH(402, 874);
  let vvH = 874, ch = 812; // iPhone 17 Pro：画面 874・ステータスバーの下は 812
  Object.defineProperty(w, 'visualViewport', { value: { get height() { return vvH; }, scale: 1, offsetTop: 0, addEventListener() {} }, configurable: true });
  Object.defineProperty(w.screen, 'width', { value: 402, configurable: true }); Object.defineProperty(w.screen, 'height', { value: 874, configurable: true });
  Object.defineProperty(w.navigator, 'standalone', { value: true, configurable: true });
  Object.defineProperty(w.document.documentElement, 'clientHeight', { get: () => ch, configurable: true });
  w.isPCMode = () => false;
  w.localStorage.removeItem(w._vvhOkKey());
  const vvh = () => parseInt(w.document.documentElement.style.getPropertyValue('--vvh'), 10);
  w._vvhUpdate();
  c('はじめて開いた直後（画面いっぱいの値）でも、ページ本来の高さ 812 に', vvh() === 812);
  vvH = 812; w._vvhUpdate();
  c('正しい値の時はそのまま', vvh() === 812);
  vvH = 500; w._vvhUpdate();
  c('キーボードの後に小さいまま → 画面いっぱい（874）ではなく 812 に戻す', vvh() === 812);
  ch = 874; vvH = 874; w._vvhUpdate();
  c('ステータスバーの下まで使う端末（clientHeightも画面いっぱい）はそのまま', vvh() === 874);
  const html = fs.readFileSync(path.join(__dirname, '../../../index.html'), 'utf8');
  c('CSS：全画面のカレンダーは 100dvh より大きくしない', /#evCalendar\.full,[^{]*\{height:var\(--vvh,100dvh\);height:min\(var\(--vvh,100dvh\),100dvh\)/.test(html));
  clearInterval(w._vvhSetT);
});
