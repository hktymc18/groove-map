// v868：受付で「友だちの招待」から来たユーザー（checkinUsers の invName）は、ユーザー台帳に「招待: 招待した人」が出る（架空データ）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  const M = (id, ln, fn, t, o) => Object.assign({ id, lastName: ln, firstName: fn, title: t, parentId: 'r', mapType: 'both', traineeHistory: [] }, o || {});
  w.state.members = [M('r', '架空', '一郎', 'ゴールド', { parentId: '', checkinNo: 'A001' })];
  const cus = [
    { uid: 'u1', name: '見本 はなこ', union: 'UA', referrerNo: 'A001', cardToken: 'tok1', visits: 2, lastAt: 1, active: true },
    { uid: 'u2', name: '見本 さくら', union: 'UA', referrerNo: 'A001', cardToken: 'tok2', visits: 1, lastAt: 1, active: true, invUid: 'u1', invName: '見本 はなこ' }];
  const qs = L => ({ forEach: f => L.forEach(r => f({ id: r.uid || r.id, data: () => JSON.parse(JSON.stringify(r)) })) });
  w.db.collection = name => ({
    where: (f, op, v) => ({ get: () => Promise.resolve(qs(name === 'checkinUsers' ? cus.filter(r => r[f] === v) : [])) }),
    get: () => Promise.resolve(qs(name === 'checkinUnions' ? [{ id: 'UA' }] : [])),
    doc: id => w.db.doc(name + '/' + id)
  });
  w.db.doc = p => ({ get: () => { const k = p.split('/'), d = k[0] === 'checkinConfig' ? { testers: ['someone'] } : k[0] === 'cards' ? { kind: 'user' } : null; return Promise.resolve({ exists: !!d, data: () => d && JSON.parse(JSON.stringify(d)) }); }, set: () => Promise.resolve() });
  w.currentUser.union = 'UA'; w.currentUser.uid = 'someone'; w._bxTesters = null;
  w.umCkSync(true); await sleep(80);
  const by = uid => w.state.members.find(m => m.ckNo === uid);
  c('友だちの招待で来た人に、招待した人の名前が入る', by('u2') && by('u2').uInvName === '見本 はなこ');
  c('招待で来ていない人には入らない', by('u1') && !by('u1').uInvName);
  c('ユーザー台帳の行に「招待: 見本 はなこ」', /招待: 見本 はなこ/.test(w._umCkLine(by('u2'))) && !/招待/.test(w._umCkLine(by('u1'))));
  c('バージョン v868 以降', +(w.APP_JS_VERSION || 'v0').slice(1) >= 868);
});
