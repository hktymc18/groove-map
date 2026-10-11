// v795：共有された側からも共有を外せる（共有MAPのカードに「共有を外す」）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  const dels = []; let deny = false;
  const d0 = T.dbStub.doc;
  w.db = Object.assign({}, T.dbStub, { doc(p) { const r = d0(p); r.delete = () => deny && /^maps\//.test(p) ? Promise.reject({ code: 'permission-denied' }) : (dels.push(p), Promise.resolve()); return r; } });
  w.sharedOwners = [{ uid: 'o1', perm: 'view', name: '架空 一', org: 'DEAR', union: 'BASE REVE', area: '福岡' }, { uid: 'o2', perm: 'view', name: '架空 二', org: 'BLOOM', union: 'BASE REVE', area: '福岡' }];
  w.confirm = () => true;
  w.openSharedDashboard(); await sleep(20);
  const btn = () => $$('#sharedDashboard .sd-leave');
  c('共有MAPのカードに「共有を外す」', btn().length === 2);
  btn()[0].click(); await sleep(20);
  c('外すと、相手の共有と自分の一覧の両方を消す', dels.indexOf('maps/o1/shared/' + w.currentUser.uid) >= 0 && dels.indexOf('sharedWith/' + w.currentUser.uid + '/from/o1') >= 0);
  c('一覧から消える', w.sharedOwners.length === 1 && w.sharedOwners[0].uid === 'o2' && btn().length === 1);
  let asked = 0; w.confirm = () => { asked++; return false; };
  btn()[0].click(); await sleep(20);
  c('確認で「キャンセル」なら外さない', asked === 1 && w.sharedOwners.length === 1);
  w.confirm = () => true; deny = true;
  btn()[0].click(); await sleep(20);
  c('ルールで断られた時は外したことにしない（一覧に残す）', w.sharedOwners.length === 1);
  const rules = require('fs').readFileSync(require('path').join(__dirname, '../../../firestore.rules'), 'utf8');
  c('ルール：共有された本人は自分の共有を外せる', /match \/maps\/\{uid\}\/shared\/\{rid\}[\s\S]{0,900}allow delete: if ownerActive\(uid\)\s*\|\| isSelf\(rid\)/.test(rules));
  w.closeSharedDashboard();
});
