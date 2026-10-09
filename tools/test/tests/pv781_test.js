// v781（#9）：iPhoneのホーム画面アプリでは印刷ボタンを押しても何も起きなかった → シートを画像にして共有シート（プリント）
const T = require('../lib/head.js')();
const { w, c, sleep, $ } = T;
T.run(async () => {
  T.login(); w.switchView('plan'); await sleep(40);
  let printed = 0, shared = null;
  w.print = () => { printed++; };
  // ふつうのブラウザ（PC・Safari）は今までどおり印刷
  w.isIOS = () => false; w.isStandalone = () => false;
  w.p2ShPrint(); await sleep(20);
  c('プレビューが開く', !!$('#p2ShPv') && !!w._p2ShPvHtml);
  w.p2ShPvPrint(); await sleep(300);
  c('ふつうのブラウザは今までどおり印刷の画面', printed === 1);
  w.p2ShPvX();
  // iPhoneのホーム画面アプリ
  w.isIOS = () => true; w.isStandalone = () => true;
  Object.defineProperty(w.navigator, 'canShare', { value: (d) => !!(d && d.files && d.files.length), configurable: true });
  Object.defineProperty(w.navigator, 'share', { value: (d) => { shared = d; return Promise.resolve(); }, configurable: true });
  let prep = 0; const p0 = w._p2ShPng; w._p2ShPng = () => { prep++; return Promise.resolve(new w.Blob(['x'], { type: 'image/png' })); };
  w.p2ShPrint(); await sleep(400);
  c('ホーム画面アプリは、開いた時に先に画像を作っておく', prep === 1 && !!w._p2ShPvPng);
  w.p2ShPvPrint(); await sleep(20);
  c('印刷ボタン → 画像（PNG）で共有シート（ブラウザの印刷は呼ばない）', printed === 1 && shared && shared.files && shared.files[0].type === 'image/png' && /計画立案シート_\d{4}-\d{2}\.png/.test(shared.files[0].name));
  // 画像がまだの時
  w._p2ShPvPng = null; w._p2ShPvPngErr = false; let msg = ''; const t0 = w.toast; w.toast = (m) => { msg = m; };
  w.p2ShPvPrint(); await sleep(10);
  c('準備中なら、もう一度押すよう案内', /準備中/.test(msg));
  w.toast = t0; w._p2ShPng = p0; w.p2ShPvX();
  // 共有できない端末は画像を出す（長押し→共有→プリント）
  Object.defineProperty(w.navigator, 'canShare', { value: () => false, configurable: true });
  w._p2ShPvHtml = '<html></html>'; w._p2ShPvPng = new w.Blob(['x'], { type: 'image/png' });
  w.URL.createObjectURL = w.URL.createObjectURL || (() => 'blob:x');
  w.p2ShPvPrint(); await sleep(10);
  c('共有できない時は画像を出す（長押しで共有→プリント）', !!$('#p2ShPvImg img') && /プリント/.test($('#p2ShPvImg').textContent));
});
