// v807：読み取りを減らす（ユニオン予定は過去120日から・手元のリストは端末に6時間・研修の取り込みの1日1回・保存前の数字の読み直しは60秒に1回）
const T = require('../lib/head.js')();
const { w, c, sleep } = T;
T.run(async () => {
  T.login(); w.currentUser.union = 'U1';
  const log = [];
  const qs = L => ({ docs: L.map(x => ({ id: x.id, data: () => x })), forEach(f) { L.forEach(x => f({ id: x.id, data: () => x })); }, size: L.length });
  const q = (p, fs) => ({
    where(f, op, v) { return q(p, fs.concat([f + op + JSON.stringify(v)])); },
    count() { return { get: () => { log.push('count ' + p + ' ' + fs.join('&')); const n = { '': 10, 'status>=""': 8, 'statusin["未着手","連絡中"]': 3, 'status=="CT予定"': 2 }[fs.join('&')]; return Promise.resolve({ data: () => ({ count: n }) }); } }; },
    get() { log.push('get ' + p + ' ' + fs.join('&')); return Promise.resolve(qs(p.indexOf('unions/') === 0 ? [{ id: 'e1', date: '2026-10-20', title: 'DLR' }] : [])); },
    doc: id => w.db.doc(p + '/' + id)
  });
  const odoc = w.db.doc;
  w.db.collection = p => q(p, []);
  w.db.doc = p => Object.assign(odoc(p), { get() { log.push('doc ' + p); return Promise.resolve(p.endsWith('/plan_meta') ? { exists: true, data: () => ({ pm2: true, coef: 3 }) } : { exists: false, data: () => null }); } });
  // ① ユニオン予定
  w.loadUnionEvents(); await sleep(30);
  c('ユニオン予定は日付で絞って読む（全部は読まない）', log.some(x => /^get unions\/U1\/events date>="\d{4}-\d{2}-\d{2}"$/.test(x)) && !log.some(x => x === 'get unions/U1/events '));
  c('設定（plan_meta）は1件だけ読んで、PLANで使える', log.indexOf('doc unions/U1/events/plan_meta') >= 0 && w._unPlanMeta && w._unPlanMeta.coef === 3 && w._unionRaw.length === 1);
  // ② 手元のリスト
  log.length = 0; w._p2Al = { n: null, apo: null, at: 0, err: false, busy: false }; w.localStorage.removeItem('gm_p2Al_' + w.currentUser.uid);
  w._p2AlLoad(); await sleep(30);
  c('人数は数えるだけ（全員は読まない）', log.filter(x => /^count users\/.*\/people/.test(x)).length === 4 && !log.some(x => /^get users\/.*\/people/.test(x)));
  c('未着手・連絡中＋状態なし＝3+2＝5人・CT予定2人', w._p2Al.n === 5 && w._p2Al.apo === 2, JSON.stringify(w._p2Al));
  log.length = 0; w._p2Al = { n: null, apo: null, at: 0, err: false, busy: false };
  w._p2AlLoad(); await sleep(20);
  c('開き直しても6時間は端末に覚えた数を使う（読まない）', log.length === 0 && w._p2Al.n === 5);
  // count が無いSDK（今のcompat）では今までどおり全員を読んで数える
  log.length = 0; w._p2Al = { n: null, apo: null, at: 0, err: false, busy: false }; w.localStorage.removeItem('gm_p2Al_' + w.currentUser.uid);
  w.db.collection = p => { const o = q(p, []); delete o.count; if (/people$/.test(p)) o.get = () => { log.push('get ' + p); return Promise.resolve(qs([{ id: 'a', status: '未着手' }, { id: 'b' }, { id: 'c', status: 'CT予定' }, { id: 'd', status: '成約' }])); }; return o; };
  w._p2AlLoad(); await sleep(30);
  c('count が無い時は全員を読んで数える（未着手・状態なし＝2人・CT予定1人）', log.some(x => /^get users\/.*\/people$/.test(x)) && w._p2Al.n === 2 && w._p2Al.apo === 1, JSON.stringify(w._p2Al));
  w.db.collection = p => q(p, []);
  // ③ 研修の取り込み：受付に自分のユニオンが無い時も「今日は確認済み」に
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'G', parentId: '', mapType: 'both' }];
  const key = 'gm_ckTr_' + w.currentUser.uid; w.localStorage.removeItem(key); w._ckTrBusy = false;
  w.db.collection = p => p === 'checkinUnions' ? { get: () => Promise.resolve(qs([{ id: 'OTHER', area: '' }])) } : q(p, []);
  w.ckTrAuto(); await sleep(30);
  c('受付に自分のユニオンが無い時も今日は確認済み（開くたびに読み直さない）', w.localStorage.getItem(key) === w.evTodayYmd());
  // ④ 保存前の数字の読み直し：60秒に1回
  w.db.collection = p => q(p, []);
  log.length = 0; const uid = w.currentUser.uid, mon = w.state.currentMonth, sp = 'maps/' + uid + '/stats/' + mon;
  w._stReadAt[sp] = 0; w._fsSavedSig[sp] = 'x';
  w.state.commission = { a: 1 }; await w.fsSaveToFirestore(uid);
  const n1 = log.filter(x => x === 'doc ' + sp).length;
  w.state.commission = { a: 2 }; await w.fsSaveToFirestore(uid);
  const n2 = log.filter(x => x === 'doc ' + sp).length;
  c('保存の前の読み直しは60秒に1回まで', n1 === 1 && n2 === 1, n1 + '/' + n2);
});
