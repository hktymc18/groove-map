// v926（MAP の結合は許可制）の firestore.rules を、Firestore エミュレータで試す（架空のデータだけ）
//   結合の設定（maps/{uid}/meta/merged）を増やせるのは、オーナー・管理者・canMerge の人だけ。連鎖共有（派生共有）も同じ。
//   canMerge は本人が付けられない。付けるのはオーナーとそのユニオンの管理者。準備・実行は ckpf109_rules.js と同じ
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, updateDoc, deleteDoc, getDoc } = require('firebase/firestore');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const ok = p => p.then(() => true, () => false);
const _e = console.error; console.error = (...a) => { if (!/PERMISSION_DENIED|evaluation error/.test(String(a[0]) + String(a[1] || ''))) _e(...a); };
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'mg-test', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: +(process.env.PORT || 8089) } });
  await env.clearFirestore();
  const OWN = 'j2DPDAccCygHmR9i5K3bTvHnH0V2';
  await env.withSecurityRulesDisabled(async (cx) => {
    const d = cx.firestore();
    await setDoc(doc(d, 'users/' + OWN), { name: 'owner', union: 'REVE', status: 'active' });
    await setDoc(doc(d, 'users/adm1'), { name: '見本 管理', union: 'REVE', status: 'active', role: 'admin' });
    await setDoc(doc(d, 'users/ok1'), { name: '見本 許可', union: 'REVE', status: 'active', canMerge: true });
    await setDoc(doc(d, 'users/no1'), { name: '見本 なし', union: 'REVE', status: 'active' });
    await setDoc(doc(d, 'users/kid'), { name: '見本 下', union: 'REVE', status: 'active' });
    await setDoc(doc(d, 'users/sub'), { name: '見本 共有先', union: 'REVE', status: 'active' });
    await setDoc(doc(d, 'users/adm2'), { name: '見本 よその管理', union: 'OTHER', status: 'active', role: 'admin' });
    // 下の人（kid）が MAP を ok1・no1 に共有している
    await setDoc(doc(d, 'maps/kid/shared/ok1'), { perm: 'view', recipientUid: 'ok1' });
    await setDoc(doc(d, 'maps/kid/shared/no1'), { perm: 'view', recipientUid: 'no1' });
    await setDoc(doc(d, 'maps/no1/meta/merged'), { maps: [{ uid: 'kid', name: '見本 下', graftId: 'x' }] }); // 前からしていた結合
  });
  const F = (u) => env.authenticatedContext(u).firestore();
  const OK1 = F('ok1'), NO1 = F('no1'), ADM = F('adm1'), ADM2 = F('adm2'), OW = F(OWN);
  const cfg = (n) => ({ maps: Array.from({ length: n }, (_, i) => ({ uid: 'k' + i, name: 'x', graftId: 'g' })), updatedAt: 't' });
  // 結合の設定
  c('許可のある人は結合を足せる', await ok(setDoc(doc(OK1, 'maps/ok1/meta/merged'), cfg(1))));
  c('管理者は札が無くても結合を足せる', await ok(setDoc(doc(ADM, 'maps/adm1/meta/merged'), cfg(2))));
  c('オーナーは結合を足せる', await ok(setDoc(doc(OW, 'maps/' + OWN + '/meta/merged'), cfg(1))));
  c('許可の無い人は結合を増やせない', !(await ok(setDoc(doc(NO1, 'maps/no1/meta/merged'), cfg(2)))));
  c('許可の無い人も、外す（0個にする）のはできる', await ok(setDoc(doc(NO1, 'maps/no1/meta/merged'), cfg(0))));
  c('許可の無い人は、0個から足すこともできない', !(await ok(setDoc(doc(NO1, 'maps/no1/meta/merged'), cfg(1)))));
  c('ほかの meta（merged 以外）は今まで通り書ける', await ok(setDoc(doc(NO1, 'maps/no1/meta/unionPrefs'), { off: false })));
  // 連鎖共有（派生共有）
  const der = (via) => ({ derived: true, via, perm: 'view', recipientUid: 'sub', email: '' });
  c('許可のある人は連鎖共有を配れる', await ok(setDoc(doc(OK1, 'maps/kid/shared/sub'), der('ok1'))));
  await env.withSecurityRulesDisabled(async (cx) => { await deleteDoc(doc(cx.firestore(), 'maps/kid/shared/sub')); });
  c('許可の無い人は連鎖共有を配れない', !(await ok(setDoc(doc(NO1, 'maps/kid/shared/sub'), der('no1')))));
  await env.withSecurityRulesDisabled(async (cx) => { await setDoc(doc(cx.firestore(), 'maps/kid/shared/sub'), der('no1')); });
  c('許可の無い人も、前に配った連鎖共有を片付けられる', await ok(deleteDoc(doc(NO1, 'maps/kid/shared/sub'))));
  // 許可（canMerge）の付け外し
  c('本人は自分に結合の許可を付けられない', !(await ok(updateDoc(doc(NO1, 'users/no1'), { canMerge: true }))));
  c('本人は名前などは今まで通り直せる', await ok(updateDoc(doc(NO1, 'users/no1'), { name: '見本 なし2' })));
  c('同じユニオンの管理者は許可を付けられる', await ok(updateDoc(doc(ADM, 'users/no1'), { canMerge: true, canMergeBy: 'adm1' })));
  c('よそのユニオンの管理者は付けられない', !(await ok(updateDoc(doc(ADM2, 'users/kid'), { canMerge: true }))));
  c('許可を付けてもらった人は結合を足せるようになる', await ok(setDoc(doc(NO1, 'maps/no1/meta/merged'), cfg(1))));
  c('本人は自分の許可を外すこともできない（変えられない）', !(await ok(updateDoc(doc(NO1, 'users/no1'), { canMerge: false }))));
  c('オーナーは許可を外せる', await ok(updateDoc(doc(OW, 'users/no1'), { canMerge: false })));
  await env.cleanup();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
