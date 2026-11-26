// 受付 v180（相談の守りの土台）の firestore.rules を、Firestore エミュレータで試す（架空のデータだけ）
//   ・匿名ログインは「ログインした人」に入らない（メンバーの情報を読めない）
//   ・ckBind/{トークン}：最初の端末がひもづく・別の端末は読めない／ひもづけられない・スタッフが付け替え（空にする）と次の端末がひもづく
//   ・ckCs/{ユニオン}/s/{uid}：DAY HOST・ユニオン管理者が登録、本人は「受付を休む」だけ、ほかの人・ほかのユニオンは不可
//   準備・実行は ckpf109_rules.js と同じ
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, getDocs, deleteDoc, collection, serverTimestamp } = require('firebase/firestore');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const ok = p => p.then(() => true, () => false);
const _e = console.error; console.error = (...a) => { if (!/PERMISSION_DENIED|evaluation error/.test(String(a[0]) + String(a[1] || ''))) _e(...a); };
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'cs-test', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: +(process.env.PORT || 8089) } });
  await env.clearFirestore();
  const TK = 'a'.repeat(32), TK2 = 'b'.repeat(32);
  await env.withSecurityRulesDisabled(async (cx) => {
    const d = cx.firestore();
    await setDoc(doc(d, 'checkinUnions/REVE'), { name: 'REVE', unionAdmins: ['adm1'], dayStaff: ['host1'] });
    await setDoc(doc(d, 'checkinUnions/ANTARES'), { name: 'ANTARES', dayStaff: ['host2'] });
    for (const [u, un] of [['adm1', 'REVE'], ['host1', 'REVE'], ['mem1', 'REVE'], ['mem2', 'REVE'], ['host2', 'ANTARES'], ['memx', 'ANTARES']]) await setDoc(doc(d, 'users/' + u), { name: u, union: un, status: 'active' });
    await setDoc(doc(d, 'cards/' + TK), { kind: 'user', no: 'u1', name: '見本 はなこ', union: 'REVE' });
    await setDoc(doc(d, 'cards/' + TK2), { kind: 'user', no: 'u2', name: '見本 ゆり', union: 'ANTARES' });
  });
  const anon = (u) => env.authenticatedContext(u, { firebase: { sign_in_provider: 'anonymous' } }).firestore();
  const A1 = anon('dev1'), A2 = anon('dev2'), A3 = anon('dev3');
  const host = env.authenticatedContext('host1').firestore(), adm = env.authenticatedContext('adm1').firestore(), host2 = env.authenticatedContext('host2').firestore();
  const mem1 = env.authenticatedContext('mem1').firestore(), mem2 = env.authenticatedContext('mem2').firestore(), none = env.unauthenticatedContext().firestore();
  const B = (u, by) => ({ uids: u, by, at: serverTimestamp() });

  c('匿名ログインの人は、メンバーの情報（users）を読めない', !(await ok(getDoc(doc(A1, 'users/mem1')))));
  c('ログインしたメンバーは、今までどおり読める', await ok(getDoc(doc(mem1, 'users/mem2'))));
  c('まだひもづいていない会員証は、だれでも「まだ」と分かる', await ok(getDoc(doc(A1, 'ckBind/' + TK))));
  c('ない会員証にはひもづけられない', !(await ok(setDoc(doc(A1, 'ckBind/' + 'z'.repeat(32)), B(['dev1'], 'self')))));
  c('ログインしていない接続ではひもづけられない', !(await ok(setDoc(doc(none, 'ckBind/' + TK), B(['dev1'], 'self')))));
  c('ほかの人の uid ではひもづけられない', !(await ok(setDoc(doc(A1, 'ckBind/' + TK), B(['dev2'], 'self')))));
  c('最初の端末がひもづく', await ok(setDoc(doc(A1, 'ckBind/' + TK), B(['dev1'], 'self'))));
  c('ひもづいた端末は読める', await ok(getDoc(doc(A1, 'ckBind/' + TK))));
  c('別の端末は読めない', !(await ok(getDoc(doc(A2, 'ckBind/' + TK)))));
  c('別の端末は上書きできない', !(await ok(setDoc(doc(A2, 'ckBind/' + TK), B(['dev2'], 'self')))));
  c('ひもづいた端末でも、ほかの端末を足せない', !(await ok(setDoc(doc(A1, 'ckBind/' + TK), B(['dev1', 'dev3'], 'self')))));
  c('ログインしていない接続は読めない', !(await ok(getDoc(doc(none, 'ckBind/' + TK)))));
  c('同じユニオンの一般メンバーは読めない', !(await ok(getDoc(doc(mem1, 'ckBind/' + TK)))));
  c('そのユニオンの DAY HOST は読める', await ok(getDoc(doc(host, 'ckBind/' + TK))));
  c('ほかのユニオンの DAY HOST は付け替えできない', !(await ok(setDoc(doc(host2, 'ckBind/' + TK), B([], 'host2')))));
  c('一般メンバーは付け替えできない', !(await ok(setDoc(doc(mem1, 'ckBind/' + TK), B([], 'mem1')))));
  c('スタッフでも、別の端末をひもづけることはできない（空にするだけ）', !(await ok(setDoc(doc(host, 'ckBind/' + TK), B(['dev2'], 'host1')))));
  c('DAY HOST は付け替え（空にする）ができる', await ok(setDoc(doc(host, 'ckBind/' + TK), B([], 'host1'))));
  c('付け替えのあと、新しい端末がひもづく', await ok(setDoc(doc(A2, 'ckBind/' + TK), B(['dev2'], 'self'))));
  c('前の端末はもう読めない', !(await ok(getDoc(doc(A1, 'ckBind/' + TK)))));
  c('ユニオン管理者も付け替えできる', await ok(setDoc(doc(adm, 'ckBind/' + TK), B([], 'adm1'))));
  c('一覧は見られない', !(await ok(getDocs(collection(host, 'ckBind')))));

  const S = (by, x) => Object.assign({ name: '見本 りな', tags: ['skin', 'bust'], bio: '乾燥肌のケアならおまかせください', off: false, ord: 1, by, at: serverTimestamp() }, x || {});
  c('DAY HOST は、同じユニオンのアカウントを相談スタッフに登録できる', await ok(setDoc(doc(host, 'ckCs/REVE/s/mem1'), S('host1'))));
  c('ほかのユニオンのアカウントは登録できない', !(await ok(setDoc(doc(host, 'ckCs/REVE/s/memx'), S('host1')))));
  c('ほかのユニオンの DAY HOST は登録できない', !(await ok(setDoc(doc(host2, 'ckCs/REVE/s/mem2'), S('host2')))));
  c('一般メンバーは登録できない', !(await ok(setDoc(doc(mem2, 'ckCs/REVE/s/mem2'), S('mem2')))));
  c('決まった分野だけ（ほかの言葉は入れられない）', !(await ok(setDoc(doc(host, 'ckCs/REVE/s/mem2'), S('host1', { tags: ['diet'] })))));
  c('ひとことは60文字まで', !(await ok(setDoc(doc(host, 'ckCs/REVE/s/mem2'), S('host1', { bio: 'あ'.repeat(61) })))));
  c('だれでも一覧を読める（お客さんの相談相手の一覧）', await ok(getDocs(collection(none, 'ckCs/REVE/s'))));
  c('本人は「受付を休む」にできる', await ok(setDoc(doc(mem1, 'ckCs/REVE/s/mem1'), S('mem1', { off: true }))));
  c('本人は分野を変えられない', !(await ok(setDoc(doc(mem1, 'ckCs/REVE/s/mem1'), S('mem1', { off: true, tags: ['inner'] })))));
  c('ほかの人の「受付を休む」は変えられない', !(await ok(setDoc(doc(mem2, 'ckCs/REVE/s/mem1'), S('mem2', { off: false })))));
  c('匿名ログインの人は登録できない', !(await ok(setDoc(doc(A1, 'ckCs/REVE/s/mem2'), S('dev1')))));
  c('ユニオン管理者は外せる', await ok(deleteDoc(doc(adm, 'ckCs/REVE/s/mem1'))));
  await env.cleanup();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
