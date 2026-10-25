// v837：使い勝手レビューにまだ答えていない人は、HOMEのいちばん上にお願いのカードが出続ける（答えると消える）。
//   アプリを開いてHOMEにいる間に「答えたか」の確認が終わった時も、スマホのHOMEを描き直してカードを出す（前はPCのホームだけ）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.currentUser.uid = 'u1'; w.currentUser.name = '架空 一郎';
  const ymd = n => { const d = new w.Date(); d.setDate(d.getDate() + n); return w._fbYmd(d); };
  const cfg = { round: 'r1', title: 'NAVIGATORの使い勝手レビュー', from: ymd(-1), to: ymd(5), viewers: [], names: {} };
  const DB = {};
  w._rvLoadCfg = () => Promise.resolve(cfg);
  w._rvLoadMine = round => Promise.resolve(DB[round + '_' + w.currentUser.uid] || null);
  w._rvWrite = (doc) => { DB[doc.round + '_' + w.currentUser.uid] = JSON.parse(JSON.stringify(doc)); return Promise.resolve(); };
  if (!w.firebase.firestore.FieldValue) w.firebase.firestore.FieldValue = { serverTimestamp: () => 'ts' };
  w.switchView('menu'); await sleep(20);
  c('確認が終わる前はまだ出ない', !$('#view-menu .rv-card'));
  await w.rvInit(); await sleep(20);
  const card = () => $('#view-menu .rv-card');
  c('HOMEにいる間に確認が終わったら、そのままカードが出る', !!card());
  const first = $('#view-menu .ux-hub').children;
  c('カードはHOMEのいちばん上（見出しのすぐ下・タイルより上）', first[1] && first[1].classList.contains('rv-card'));
  w.switchView('current'); await sleep(10); w.switchView('menu'); await sleep(20);
  c('ほかの画面から戻っても出続ける', !!card());
  // 答えると消える
  w.rvOpen(); await sleep(20);
  w._rv.a = { all: 4 }; w.rvSubmit && w.rvSubmit(); await sleep(40);
  c('答えたらHOMEのカードは消える', !card() && !!w._rv.mine);
  w.switchView('current'); await sleep(10); w.switchView('menu'); await sleep(20);
  c('答えたあとは出ない', !card());
});
