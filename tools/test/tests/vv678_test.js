// v678：ホーム画面アプリでキーボードを閉じた後も見えている高さが小さいまま（カレンダーが上6割だけ）→ 画面の高さに戻す
const T = require('../lib/head.js')();
const { w, c } = T;
T.run(async () => {
  const set = (o, k, v) => Object.defineProperty(o, k, { value: v, configurable: true });
  w.navigator.standalone !== undefined || set(w.navigator, 'standalone', true);
  set(w.navigator, 'standalone', true);
  set(w, 'innerWidth', 402); set(w, 'innerHeight', 874);
  set(w, 'screen', { width: 402, height: 874 });
  set(w, 'visualViewport', { height: 535, scale: 1, offsetTop: 0, addEventListener() {} });
  w.isPCMode = () => false;
  c('入力中でなく、見えている高さがキーボード分小さいまま → 画面の高さ（縦）', w._vvhTarget() === 874, w._vvhTarget());
  set(w, 'visualViewport', { height: 860, scale: 1, offsetTop: 0, addEventListener() {} });
  c('差が小さい時は実測値のまま', w._vvhTarget() === 860);
  set(w, 'innerWidth', 874); set(w, 'visualViewport', { height: 250, scale: 1, offsetTop: 0, addEventListener() {} });
  c('横向きは screen.width を本来の高さに', w._vvhTarget() === 402);
  set(w, 'innerWidth', 402); set(w, 'visualViewport', { height: 535, scale: 1, offsetTop: 0, addEventListener() {} });
  const inp = w.document.createElement('input'); w.document.body.appendChild(inp); inp.focus();
  c('入力中（キーボード表示中）は見えている高さぴったり', w._vvhTarget() === 535);
});
