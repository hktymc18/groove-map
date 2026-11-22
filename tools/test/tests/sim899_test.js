// v899：シミュレーションを開いた時、LOIの月は今月（前に開いた月のままにしない）。開いた後に変えた月は、その画面の間は残る
const T = require('../lib/head.js')();
const { w, c, sleep } = T;
T.run(async () => {
  T.login();
  w.switchView('plan'); await sleep(150);
  const cfg = w._p2SimCfg(); cfg.sy = 2026; cfg.sm = 3; // 前に開いた時の月が残っている
  const d = new w.Date(), y = d.getFullYear(), m = d.getMonth() + 1;
  w.p2Go('sim'); await sleep(150);
  c('開くとLOIの月は今月', cfg.sy === y && cfg.sm === m, cfg.sy + '-' + cfg.sm + ' / ' + y + '-' + m);
  w.p2SimStart(1); await sleep(100);
  const t = y * 12 + (m - 1) + 1;
  c('＋で1か月後に変えられる', cfg.sy === Math.floor(t / 12) && cfg.sm === t % 12 + 1);
  w.p2SimMo(2); await sleep(100); w.p2Go('sim'); await sleep(100);
  c('シミュレーションの中で動いても、変えた月は残る', cfg.sy === Math.floor(t / 12) && cfg.sm === t % 12 + 1);
  w.p2Go(''); await sleep(100); w.p2Go('sim'); await sleep(150);
  c('一度出てまた開くと今月に戻る', cfg.sy === y && cfg.sm === m);
});
