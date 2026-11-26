// v923（ユニオン予定の「予定係」）の firestore.rules を、Firestore エミュレータで試す（架空のデータだけ）
//   予定係は所属ユニオンの予定だけ 作る・直す・消す ができる（plan_meta は不可）。付ける・外すのはオーナーとそのユニオンの管理者だけ
//   準備・実行は ckpf109_rules.js と同じ
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, deleteDoc, arrayUnion } = require('firebase/firestore');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const ok = p => p.then(() => true, () => false);
const _e = console.error; console.error = (...a) => { if (!/PERMISSION_DENIED|evaluation error/.test(String(a[0]) + String(a[1] || ''))) _e(...a); };
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'eved-test', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: +(process.env.PORT || 8089) } });
  await env.clearFirestore();
  const OWN = 'j2DPDAccCygHmR9i5K3bTvHnH0V2';
  await env.withSecurityRulesDisabled(async (cx) => {
    const d = cx.firestore();
    await setDoc(doc(d, 'users/' + OWN), { name: 'owner', union: 'REVE', status: 'active' });
    await setDoc(doc(d, 'users/adm1'), { name: '見本 管理', union: 'REVE', status: 'active', role: 'admin' });
    await setDoc(doc(d, 'users/ed1'), { name: '見本 係', union: 'REVE', status: 'active' });
    await setDoc(doc(d, 'users/ed2'), { name: '見本 止めた係', union: 'REVE', status: 'disabled' });
    await setDoc(doc(d, 'users/ed3'), { name: '見本 よその係', union: 'OTHER', status: 'active' });
    await setDoc(doc(d, 'users/mem1'), { name: '見本 メンバー', union: 'REVE', status: 'active' });
    await setDoc(doc(d, 'users/adm2'), { name: '見本 よその管理', union: 'OTHER', status: 'active', role: 'admin' });
    await setDoc(doc(d, 'unions/REVE/meta/evEditors'), { uids: ['ed1', 'ed2', 'ed3'], at: 'x', by: OWN });
    await setDoc(doc(d, 'unions/REVE/events/e1'), { id: 'e1', union: 'REVE', title: '見本のセミナー', date: '2026-12-01', createdBy: 'adm1' });
    await setDoc(doc(d, 'unions/REVE/events/plan_meta'), { pm2: true, coef: 1 });
  });
  const F = (u) => env.authenticatedContext(u).firestore();
  const ED1 = F('ed1'), ED2 = F('ed2'), ED3 = F('ed3'), MEM = F('mem1'), ADM = F('adm1'), ADM2 = F('adm2'), OW = F(OWN);
  const ev = (id) => ({ id, union: 'REVE', title: '見本の予定', date: '2026-12-10', createdBy: 'ed1' });
  // 予定係
  c('予定係は所属ユニオンの予定を作れる', await ok(setDoc(doc(ED1, 'unions/REVE/events/n1'), ev('n1'))));
  c('予定係はほかの人が作った予定も直せる', await ok(setDoc(doc(ED1, 'unions/REVE/events/e1'), { title: '直した' }, { merge: true })));
  c('予定係は予定を消せる', await ok(deleteDoc(doc(ED1, 'unions/REVE/events/n1'))));
  c('予定係は PLAN の係数（plan_meta）は変えられない', !(await ok(setDoc(doc(ED1, 'unions/REVE/events/plan_meta'), { coef: 9 }, { merge: true }))));
  c('予定係は自分を予定係の一覧に足したり外したりできない', !(await ok(setDoc(doc(ED1, 'unions/REVE/meta/evEditors'), { uids: ['ed1', 'mem1'] }, { merge: true }))));
  c('予定係は別のユニオンの予定は作れない', !(await ok(setDoc(doc(ED1, 'unions/OTHER/events/n2'), ev('n2')))));
  // 一覧にいても書けない人
  c('止めた（無効の）人は一覧にいても作れない', !(await ok(setDoc(doc(ED2, 'unions/REVE/events/n3'), ev('n3')))));
  c('所属がちがう人は一覧にいても作れない', !(await ok(setDoc(doc(ED3, 'unions/REVE/events/n4'), ev('n4')))));
  c('ふつうのメンバーは作れない', !(await ok(setDoc(doc(MEM, 'unions/REVE/events/n5'), ev('n5')))));
  c('ふつうのメンバーは予定を読める（今まで通り）', await ok(getDoc(doc(MEM, 'unions/REVE/events/e1'))));
  // 一覧の読み書き
  c('同じユニオンの人は予定係の一覧を読める', await ok(getDoc(doc(MEM, 'unions/REVE/meta/evEditors'))));
  c('よそのユニオンの人は一覧を読めない', !(await ok(getDoc(doc(ED3, 'unions/REVE/meta/evEditors')))));
  c('そのユニオンの管理者は予定係を付けられる', await ok(setDoc(doc(ADM, 'unions/REVE/meta/evEditors'), { uids: arrayUnion('mem1'), at: 'y', by: 'adm1' }, { merge: true })));
  c('よそのユニオンの管理者は付けられない', !(await ok(setDoc(doc(ADM2, 'unions/REVE/meta/evEditors'), { uids: arrayUnion('adm2'), at: 'y', by: 'adm2' }, { merge: true }))));
  c('オーナーは付けられる', await ok(setDoc(doc(OW, 'unions/REVE/meta/evEditors'), { uids: arrayUnion('mem1'), at: 'z', by: OWN }, { merge: true })));
  c('一覧に決まった項目以外は入れられない', !(await ok(setDoc(doc(OW, 'unions/REVE/meta/evEditors'), { uids: [], role: 'admin' }, { merge: true }))));
  c('一覧は消せない（外す時は uids から外す）', !(await ok(deleteDoc(doc(OW, 'unions/REVE/meta/evEditors')))));
  c('ほかの meta の書類は作れない', !(await ok(setDoc(doc(OW, 'unions/REVE/meta/other'), { uids: [] }))));
  // 付けてもらった人は作れるようになる
  c('付けてもらったメンバーは作れるようになる', await ok(setDoc(doc(MEM, 'unions/REVE/events/n6'), ev('n6'))));
  // 管理者は今まで通り
  c('管理者は今まで通り plan_meta も変えられる', await ok(setDoc(doc(ADM, 'unions/REVE/events/plan_meta'), { coef: 2 }, { merge: true })));
  await env.cleanup();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
