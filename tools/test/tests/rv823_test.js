// v823：使い勝手レビューの「見せる人」：みんな／開発メンバーだけ（オーナー＋バグ・要望・アイデアを見られる人）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  w.currentUser.name = '架空 一郎';
  const ymd = n => { const d = new w.Date(); d.setDate(d.getDate() + n); return w._fbYmd(d); };
  let cfg = { round: 'r1', title: '使い勝手レビュー', from: ymd(-1), to: ymd(5), scope: 'dev', viewers: [], names: {} };
  w._rvLoadCfg = () => Promise.resolve(cfg);
  w._rvSaveCfg = d => { cfg = JSON.parse(JSON.stringify(d)); return Promise.resolve(); };
  w._rvLoadMine = () => Promise.resolve(null);
  let fbMem = ['uD'];
  w._fbLoadCfg = () => Promise.resolve({ members: fbMem, names: {} });
  w._fbLoadItems = () => Promise.resolve([]);
  // 開発メンバーでない人
  w.currentUser.uid = 'uX'; w._fb.ok = null;
  await w.rvInit(); await sleep(20);
  c('開発メンバーだけの時：ほかの人にはお願いも入口も出ない', w._rvHomeCard() === '' && !/使い勝手レビュー/.test(w._rvStLis()));
  w.rvOpen(); await sleep(5);
  c('ほかの人は開けない', !$('#rvOv'));
  // 開発メンバー
  w.currentUser.uid = 'uD'; w._fb.ok = null;
  await w.rvInit(); await sleep(20);
  c('開発メンバーにはお願いが出る（開発メンバーか確かめてから）', w._fb.ok === true && /お願い/.test(w._rvHomeCard()));
  w.rvOpen(); await sleep(5);
  c('答える画面に「開発メンバーだけに表示中」', /開発メンバーだけに表示中/.test($('#rvOv').textContent));
  w._p2SheetClose('rvOv');
  // オーナー：結果の対象は開発メンバー
  w.currentUser.uid = T.OWNER; w._fb.ok = true; w._fb.cfg = { members: fbMem };
  await w.rvInit();
  w._rvLoadAll = () => Promise.resolve([{ id: 'r1_uD', round: 'r1', uid: 'uD', name: '架空 一郎', a: { all: 4 } }]);
  const users = [{ id: 'uD', name: '架空 一郎', status: 'active' }, { id: 'uX', name: '試験 二郎', status: 'active' }, { id: T.OWNER, name: '見本 三郎', status: 'active' }];
  const fgc = w.fsGetCol; w.fsGetCol = p => p === 'users' ? Promise.resolve(users) : fgc(p); w._rv.users = null;
  w.rvResOpen(); await sleep(30);
  const tx = () => $('#rvResOv').textContent;
  c('結果：開発メンバーだけに表示中・対象は開発メンバー', /開発メンバーだけに表示中/.test(tx()) && /1\/ 2人/.test(tx()) && /見本 三郎/.test(tx()) && !/試験 二郎/.test(tx()));
  // 設定で「みんな」に切りかえ
  w.rvCfgOpen(); await sleep(5);
  c('設定に「見せる人：みんな／開発メンバーだけ」', /見せる人/.test($('#rvCfgOv').textContent) && $$('#rvCS span.on')[0].textContent === '開発メンバーだけ');
  w.rvCfgScope('all'); w.rvCfgSave(1); await sleep(30);
  c('「みんな」で新しい回として保存', cfg.scope === 'all' && cfg.round !== 'r1' && cfg.rounds[0].id === 'r1');
  w.currentUser.uid = 'uX'; w._fb.ok = false; await w.rvInit(); await sleep(10);
  c('みんなにしたら、ほかの人にもお願いが出る', /お願い/.test(w._rvHomeCard()));
  w.currentUser.uid = T.OWNER; w.fsGetCol = fgc;
  w._p2SheetClose('rvResOv'); w._p2SheetClose('rvCfgOv');
});
