// v884：NAVIGATOR Beauty 第1弾。ユーザー台帳（MAPの「ユーザー」）に、アプリの活動（マイプラン：連続日数・この7日・最後のチェック）を受付から取り込む。
//   「⏸ アプリが止まっている」（3日以上チェックなし）の絞り込み・表の「アプリ」の列（架空データ）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH } = T;
const pad = n => (n < 10 ? '0' : '') + n, ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
T.run(async () => {
  T.login();
  const day = n => { const d = new w.Date(); d.setDate(d.getDate() + n); return ymd(d); }; setWH(390, 844); w._uxSync && w._uxSync();
  const M = (id, ln, fn, t, o) => Object.assign({ id, lastName: ln, firstName: fn, title: t, parentId: 'r', mapType: 'both', traineeHistory: [] }, o || {});
  w.state.members = [M('r', '架空', '一郎', 'ゴールド', { parentId: '', checkinNo: 'A001' })];
  const cus = [
    { uid: 'u1', name: '見本 はなこ', union: 'UA', referrerNo: 'A001', cardToken: 'tok1', visits: 1, lastAt: 1, active: true },
    { uid: 'u2', name: '見本 さくら', union: 'UA', referrerNo: 'A001', cardToken: 'tok2', visits: 2, lastAt: 1, active: true },
    { uid: 'u3', name: '見本 ゆり', union: 'UA', referrerNo: 'A001', cardToken: 'tok3', visits: 1, lastAt: 1, active: true }];
  const d1 = {}; for (let i = 0; i <= 4; i++) d1[day(-i)] = ['am'];   // 今日まで5日連続
  const store = { 'cards/tok1': { kind: 'user' }, 'cards/tok2': { kind: 'user' }, 'cards/tok3': { kind: 'user' },
    'cards/tok1/plan/me': { course: 'yuragi', start: day(-10), qs: ['am'], days: d1, atMs: 1 },
    'cards/tok2/plan/me': { course: 'diet', start: day(-20), qs: ['water'], days: { [day(-6)]: ['water'], [day(-8)]: ['water'] }, atMs: 1 } };
  const qs = L => ({ forEach: f => L.forEach(r => f({ id: r.uid || r.id, data: () => JSON.parse(JSON.stringify(r)) })) });
  w.db.collection = name => ({
    where: (f, op, v) => ({ get: () => Promise.resolve(qs(name === 'checkinUsers' ? cus.filter(r => r[f] === v) : [])) }),
    get: () => Promise.resolve(qs(name === 'checkinUnions' ? [{ id: 'UA' }] : [])),
    doc: id => w.db.doc(name + '/' + id)
  });
  w.db.doc = p => ({ get: () => { const d = p.indexOf('checkinConfig') === 0 ? { testers: [] } : store[p]; return Promise.resolve({ exists: !!d, data: () => d && JSON.parse(JSON.stringify(d)) }); },
    set: () => Promise.resolve() });
  w.currentUser.union = 'UA'; w.currentUser.uid = 'someone'; w._bxTesters = null;
  w._featCfg = { bxall: { on: true, testers: [] } };
  w.umCkSync(true); await sleep(150);
  const u = id => w.state.members.find(m => m.ckNo === id);
  c('アプリの活動を取り込む：連続日数・この7日・最後・コース', u('u1') && u('u1').uAct && u('u1').uAct.st === 5 && u('u1').uAct.wk === 5 && u('u1').uAct.last === day(0) && u('u1').uAct.co === 'yuragi', JSON.stringify(u('u1') && u('u1').uAct));
  c('6日前で止まっている人：連続0・この7日1日', u('u2').uAct.st === 0 && u('u2').uAct.wk === 1 && u('u2').uAct.last === day(-6), JSON.stringify(u('u2').uAct));
  c('マイプランをまだ始めていない人は null', u('u3').uAct === null);
  c('止まっている（3日以上チェックなし）の判定', !w._umActStop(u('u1')) && w._umActStop(u('u2')) && !w._umActStop(u('u3')));
  c('保存で落とさない項目に uAct', w.UM_KEYS.indexOf('uAct') >= 0);
  w._umMode = true; w._umRef = ''; w._umFlt = 'all'; w.switchView('current'); await sleep(60);
  let tx = (w.document.getElementById('treeCurrent') || {}).textContent || '';
  c('一覧に「5日連続・この7日 5日」・「6日チェックなし」・「まだマイプランを始めていない」', /5日連続・この7日 5日・最後/.test(tx) && /6日チェックなし・この7日 1日/.test(tx) && /まだマイプランを始めていない/.test(tx), tx.slice(0, 600));
  c('止まっている人はオレンジ（stop）', w.document.querySelectorAll('#treeCurrent .umact.stop').length === 1);
  c('絞り込み「アプリが止まっている 1」', /アプリが止まっている 1/.test(tx));
  w.umFlt('stop'); await sleep(40);
  tx = (w.document.getElementById('treeCurrent') || {}).textContent || '';
  c('「止まっている」で絞ると、その人だけ', /見本 さくら/.test(tx) && !/見本 はなこ/.test(tx), tx.slice(0, 400));
  // 変わっていなければ保存しない（2回目の取り込み）
  const a0 = JSON.stringify(u('u1').uAct); w.umCkSync(true); await sleep(150);
  c('同じなら同じ値のまま', JSON.stringify(u('u1').uAct) === a0);
  // PC の表に「アプリ」の列
  setWH(1400, 900); w._uxSync && w._uxSync(); w.umFlt('all'); w.switchView('current'); await sleep(80);
  const html = (w.document.getElementById('umPane') || {}).innerHTML || '';
  c('PCの表に「アプリ」の列と、その人の活動', /<th>アプリ<\/th>/.test(html) && /5日連続・この7日 5日/.test(html), html.slice(0, 300));
  c('APP_JS_VERSION v884 以上', +(/APP_JS_VERSION = 'v(\d+)'/.exec(require('fs').readFileSync(require('path').join(__dirname, '../../../app.js'), 'utf8')) || [0, 0])[1] >= 884);
});
