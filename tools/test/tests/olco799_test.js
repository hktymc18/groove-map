// v799：OLチェックアウト（受付システム）の感想・気づき・タスクを、受付の番号でつないで活動タブにリアルタイム表示／本人のToDo・予定に取り込む
const T = require('../lib/head.js')();
const { w, c, sleep, setWH } = T;
T.run(async () => {
  T.login();
  setWH(390, 844);
  w.currentUser.union = 'ANTARES';
  w.state.members = [
    { id: 'm1', lastName: '受講', firstName: '花子', parentId: '', mapType: 'both', title: 'B1', checkinNo: 'AN0002' },
    { id: 'm2', lastName: '未紐付', firstName: '太郎', parentId: 'm1', mapType: 'both', title: 'B1' },
  ];
  // olCheckouts の購読をとらえる
  const subs = [];
  const col0 = w.db.collection;
  const mkQ = (path, f) => ({
    where(a, op, v) { return mkQ(path, f.concat([[a, op, v]])); },
    onSnapshot(cb, eb) { subs.push({ path, f, cb, eb }); return () => { subs.splice(subs.findIndex(x => x.cb === cb), 1); }; },
    get() { return Promise.resolve({ forEach() {}, docs: [] }); },
    doc(id) { return w.db.doc(path + '/' + id); },
  });
  w.db.collection = (p) => (p === 'olCheckouts' ? mkQ(p, []) : col0.call(w.db, p));
  w._olCoStart();
  const s1 = subs.find(x => x.f.some(y => y[0] === 'no' && y[1] === 'in'));
  c('オーナー: メンバーの受付番号で購読（全ユニオン）', s1 && JSON.stringify(s1.f) === JSON.stringify([['no', 'in', ['AN0002']]]), s1 && JSON.stringify(s1.f));
  // 一般のアップライン: 自分のユニオン＋番号（ルール: 名簿と同じ範囲）
  const cu = w.currentUser; w.currentUser = { uid: 'u2', name: 'アップ', union: 'ANTARES' };
  subs.length = 0; w._olCoStart();
  const s0 = subs.find(x => x.f.some(y => y[0] === 'no' && y[1] === 'in'));
  c('アップライン: 自分のユニオン＋番号で購読', s0 && JSON.stringify(s0.f) === JSON.stringify([['union', '==', 'ANTARES'], ['no', 'in', ['AN0002']]]), s0 && JSON.stringify(s0.f));
  w.currentUser = cu; subs.length = 0; w._olCoStart();
  const s1b = subs.find(x => x.f.some(y => y[0] === 'no' && y[1] === 'in'));
  if (s1b) s1.cb = s1b.cb;
  const now = Date.now();
  const recs = [
    { no: 'AN0002', name: '受講 花子', aName: '馬場 太郎', impression: 'とても分かりやすかった', notice: '目標を数字にする', task: { text: '名刺を作る', date: '2026-10-20', mode: 'todo' }, ymd: '20261013', atMs: now - 3600e3, special: true, serial: 12 },
  ];
  const snap = (L) => ({ forEach(fn) { L.forEach((r, i) => fn({ id: 'k_' + r.no + '_' + r.ymd + i, data: () => Object.assign({}, r), ref: { update: (d) => { r._upd = d; return Promise.resolve(); } } })); } });
  s1.cb(snap(recs));
  await sleep(400);
  const m1 = w._mFind('m1');
  const items = w._meActItems(m1).filter(x => x.kind === 'olco');
  c('活動にOLチェックアウトが入る', items.length === 1 && items[0].d === '2026-10-13');
  const html = w._ppActHtml ? (w._pp = { id: 'm1', map: 'current', pg: 'act' }, w._ppActHtml(m1)) : '';
  c('新しいメンバー画面の活動に表示（感想・Aさん・タスク）', /とても分かりやすかった/.test(html) && /A：馬場 太郎/.test(html) && /名刺を作る/.test(html), html.slice(0, 120));
  w._pp = null;
  c('最後の活動に数える', w.memberLastActivity(m1) >= '2026-10-13');
  // 新着の印（開くと消える）
  w.localStorage.removeItem('gm_olco_seen');
  c('MAPのカードに新着の印', /🎓1/.test(w._olCoBadge(m1, 'bd2')));
  w._olCoMarkSeen(m1);
  c('開いたら印が消える', w._olCoBadge(m1, 'bd2') === '');
  // くわしく
  w.olCoOpen(items[0].r._id);
  const dlg = w.document.getElementById('olCoDlg');
  c('押すとくわしく（感想・気づき・タスク・カード番号）', dlg && /目標を数字にする/.test(dlg.textContent) && /本人のToDo/.test(dlg.textContent) && /No\.12/.test(dlg.textContent));
  dlg && dlg.remove();
  // 紐付いていない人には出ない
  c('紐付いていないメンバーには出ない', w._meActItems(w._mFind('m2')).every(x => x.kind !== 'olco'));
  // 本人（NAVIGATORが受付の番号と紐付いている）: タスクを自分のToDoに取り込む
  w.currentUser.ckNo = 'AN0002';
  w._evLoadedUid = w.currentUser.uid;
  w.state.events = [];
  const saved = []; const sv = w.saveEventDoc; w.saveEventDoc = (e) => { saved.push(e); };
  w._olCoSelf();
  const s2 = subs.find(x => x.f.length === 1 && x.f[0][0] === 'no' && x.f[0][1] === '==');
  c('自分宛ての購読（番号＝自分）', !!s2);
  const mine = [Object.assign({}, recs[0]), Object.assign({}, recs[0], { ymd: '20261014', task: { text: '記録だけ', mode: 'none' } }), Object.assign({}, recs[0], { ymd: '20261015', task: { text: '振り返り', date: '2026-10-21', mode: 'event' } })];
  s2.cb(snap(mine));
  await sleep(100);
  c('ToDo と 予定 を取り込む（記録だけは入れない）', saved.length === 2 && saved[0].type === 'task' && saved[0].title === '名刺を作る' && saved[0].date === '2026-10-20' && saved[1].type === 'event' && saved[1].title === '振り返り');
  c('取り込んだ印を付ける', mine[0]._upd && mine[0]._upd.taskImported === true && !mine[1]._upd);
  s2.cb(snap(mine.map(r => Object.assign({}, r, { taskImported: !!r._upd }))));
  await sleep(100);
  c('二重に取り込まない', saved.length === 2);
  w.saveEventDoc = sv; w.db.collection = col0;
});
