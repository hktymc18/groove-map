// v797：はじめての端末でログインした直後（クラウドのデータを読み込む前）は「自分を登録」を出さず・保存もしない
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login();
  setWH(1280, 800);
  const uid = w.currentUser.uid, mon = w.state.currentMonth;
  w.localStorage.removeItem('gm_hadRoot_' + uid);
  w.state.members = []; w.state.idealMembers = [];
  // 読み込みが遅い（まだ返ってこない）
  let res = {}; const fg = w.fsGet, fs = w.fsSet, writes = [];
  w.fsGet = (p) => new Promise((ok) => { res[p] = ok; });
  w.fsSet = (p, d) => { writes.push(p); return Promise.resolve(); };
  w.fsLoadFromFirestore(uid);
  w.switchView('current'); await sleep(30);
  const html = w.emptyStateHTML('map');
  c('読み込み中は「自分を登録」ではなく「読み込み中…」', /読み込み中/.test(html) && !/あなた自身/.test(html));
  // 読み込み中に何か保存しようとしても、クラウドには書かない（理想MAP・数字を空で上書きしない）
  let rej = null; await w.fsSaveToFirestore(uid).catch((e) => { rej = e; });
  c('読み込み前の保存は止める', rej && rej.gmNotReady && writes.length === 0);
  w.autoSave(); await sleep(1700);
  c('自動保存も書かない', writes.length === 0);
  // 読み込みが終わる
  const mem = [{ id: 'r', lastName: '範馬', firstName: '勇次郎', parentId: '', mapType: 'both', title: 'ゴールド', ptCurrent: 100 }];
  Object.keys(res).forEach((p) => { res[p](/_current$/.test(p) ? { members: mem } : /_ideal$/.test(p) ? { members: [{ id: 'i1', lastName: '理想', parentId: '' }] } : null); });
  await sleep(80); w.fsGet = () => Promise.resolve(null);
  c('読み込み後はMAPが出る', w.state.members.length === 1 && w.state.idealMembers.length === 1);
  rej = null; await w.fsSaveToFirestore(uid).catch((e) => { rej = e; });
  c('読み込み後は保存できる', !rej && writes.some((p) => /_current$/.test(p)));
  // 読み込みに失敗した時も、空のデータで上書きしない
  writes.length = 0;
  w.fsGet = () => Promise.reject(new Error('offline'));
  w.fsLoadFromFirestore(uid); await sleep(80);
  rej = null; await w.fsSaveToFirestore(uid).catch((e) => { rej = e; });
  c('読み込み失敗時は保存しない', rej && rej.gmNotReady && writes.length === 0);
  c('失敗時は「もう一度読み込む」', /もう一度読み込む/.test(w.emptyStateHTML('map')));
  w.fsGet = fg; w.fsSet = fs;
  void mon;
});
