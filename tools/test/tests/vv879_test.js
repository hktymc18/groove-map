// v879：iPhone のホーム画面アプリで、カレンダーが上にずれて下に空白（ステータスバー1本分）ができていたのを直す。
//   開いた直後の「画面いっぱいの高さ」を、覚えた「ステータスバーを除いた高さ」で置き換えるのは、ページそのものが小さい時だけ
const T = require('../lib/head.js')();
const { w, c, setWH } = T;
T.run(async () => {
  T.login();
  setWH(393, 852);
  const env = (vvH, ch) => {
    Object.defineProperty(w.navigator, 'standalone', { value: true, configurable: true });
    Object.defineProperty(w, 'screen', { value: { width: 393, height: 852 }, configurable: true });
    Object.defineProperty(w, 'visualViewport', { value: { height: vvH, scale: 1, offsetTop: 0, addEventListener() {} }, configurable: true });
    Object.defineProperty(w.document.documentElement, 'clientHeight', { value: ch, configurable: true });
    Object.defineProperty(w, 'innerWidth', { value: 393, configurable: true });
  };
  const key = () => w._vvhOkKey();
  c('スマホの画面として扱う（PCではない）', !w.isPCMode());
  // ① 今回の不具合: ページも見えている高さも画面いっぱい（852）なのに、覚えた 793 で置き換えていた
  env(852, 852); w.localStorage.setItem(key(), '793');
  c('ページも画面いっぱいなら、画面いっぱいの高さを使う（覚えた小さい値で置き換えない）', w._vvhTarget() === 852, w._vvhTarget());
  c('覚えていた小さい値は消す（次に開いた時も使わない）', w.localStorage.getItem(key()) === null);
  // ② 前の対策（v809）はそのまま: 開いた直後に見えている高さだけがステータスバー分大きい（ページは 793）
  env(852, 793); w.localStorage.setItem(key(), '793');
  c('開いた直後の大きすぎる値（ページより大きい）は、今までどおり覚えた高さを使う', w._vvhTarget() === 793, w._vvhTarget());
  w.localStorage.removeItem(key());
  c('覚えた値が無くても、ページの高さに合わせる', w._vvhTarget() === 793, w._vvhTarget());
  // ③ キーボードを閉じたのに小さいまま（v678）も今までどおり
  env(500, 793);
  c('入力していないのに小さいままの時は、ページの高さに戻す', w._vvhTarget() === 793, w._vvhTarget());
  c('APP_JS_VERSION v879 以上', +(/APP_JS_VERSION = 'v(\d+)'/.exec(require('fs').readFileSync(require('path').join(__dirname, '../../../app.js'), 'utf8')) || [0, 0])[1] >= 879);
});
