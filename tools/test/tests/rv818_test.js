// v818：PCでも使い勝手レビューを開ける（左のメニュー「レビュー」・設定（プロフィール）の画面に「答える」「結果」）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $ } = T;
T.run(async () => {
  T.login(); setWH(1440, 900);
  w.currentUser.name = '架空 一郎';
  const ymd = n => { const d = new w.Date(); d.setDate(d.getDate() + n); return w._fbYmd(d); };
  let cfg = null, fail = true;
  w._rvLoadCfg = () => fail ? Promise.reject(new Error('permission-denied')) : Promise.resolve(cfg);
  w._rvLoadMine = () => Promise.resolve(null);
  const vis = id => { const e = w.document.getElementById(id); return !!e && e.style.display !== 'none'; };
  // ルール反映前（設定が読めない）でも、オーナーには結果・設定の入口
  await w.rvInit(); await sleep(10);
  c('設定が読めなくてもオーナーには「レビューの結果（期間の設定）」', vis('profileRvWrap') && vis('profileRvRes') && !vis('profileRvAns') && !vis('pcsRv'));
  // 期間中
  fail = false; cfg = { round: 'r1', title: '使い勝手レビュー', from: ymd(-1), to: ymd(5) };
  await w.rvInit(); await sleep(10);
  c('期間中は左のメニューに「レビュー」・設定の画面に「答える」', vis('pcsRv') && vis('profileRvAns') && /答える/.test(w.document.getElementById('profileRvAns').textContent));
  w._rv.mine = { a: {} }; w._rvSyncEntry();
  c('答えたら「回答ずみ」', /回答ずみ/.test(w.document.getElementById('profileRvAns').textContent) && /✓/.test(w.document.querySelector('#pcsRv .pcs-lb').textContent));
  // 一般の人・期間外
  w.currentUser.uid = 'uX'; cfg.to = ymd(-1); cfg.from = ymd(-5); w._rv.mine = null;
  await w.rvInit(); await sleep(10);
  c('一般の人・期間外は出さない', !vis('profileRvWrap') && !vis('pcsRv'));
  w.currentUser.uid = T.OWNER;
});
