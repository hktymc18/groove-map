// v809（#16）：ホーム画面アプリを開いた直後、iOSがステータスバー分まで含む高さを返しても、カレンダーが画面の下にはみ出さない
const T = require('../lib/head.js')();
const { w, c, sleep, setWH } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  let vvH = 844; // 開いた直後：ステータスバー分も含んだ画面いっぱいの高さ（誤り）
  Object.defineProperty(w, 'visualViewport', { value: { get height() { return vvH; }, scale: 1, offsetTop: 0, addEventListener() {} }, configurable: true });
  Object.defineProperty(w.screen, 'width', { value: 390, configurable: true }); Object.defineProperty(w.screen, 'height', { value: 844, configurable: true });
  Object.defineProperty(w.navigator, 'standalone', { value: true, configurable: true });
  Object.defineProperty(w.document.documentElement, 'clientHeight', { get: () => vvH, configurable: true });
  w.isPCMode = () => false;
  const key = w._vvhOkKey();
  w.localStorage.removeItem(key);
  const vvh = () => parseInt(w.document.documentElement.style.getPropertyValue('--vvh'), 10);
  w._vvhUpdate();
  c('はじめての時は返ってきた値のまま（覚えた値がない）', vvh() === 844);
  // 0.15秒ごとの取り直し：iOSが正しい値（ステータスバーを除く）に変わったらすぐ合わせる
  w._vvhSettle(); vvH = 797; await sleep(400);
  c('開いた直後の5秒間は、正しい値になったらすぐ取り直す（4秒待たない）', vvh() === 797);
  // 落ち着いた高さを覚える
  w.localStorage.setItem(key, '797');
  // 次に開いた直後：また画面いっぱいの値が返る → 覚えた値を使う
  vvH = 844; w._vvhUpdate();
  c('次に開いた直後は、画面いっぱいの値の代わりに前回の落ち着いた高さ', vvh() === 797);
  // 横向き（ステータスバーなし）では関係しない
  setWH(844, 390); Object.defineProperty(w.document.documentElement, 'clientHeight', { get: () => 390, configurable: true }); vvH = 390;
  w._vvhUpdate();
  c('横向きはそのまま', vvh() === 390);
  clearInterval(w._vvhSetT);
});
