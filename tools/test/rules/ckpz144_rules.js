// 受付 v144（本人が PRYSMiO を入れる: cards/{トークン}.pz_{イベント}・「📏 今日の測定」の出席の読み取り）の firestore.rules を、エミュレータで試す（架空のデータだけ）
// 準備・実行は ckpf109_rules.js と同じ
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, updateDoc, getDocs, collection, query, where } = require('firebase/firestore');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const ok = p => p.then(() => true, () => false);
const _e = console.error; console.error = (...a) => { if (!/PERMISSION_DENIED|evaluation error/.test(String(a[0]) + String(a[1] || ''))) _e(...a); };
const TA = 'abababababababababababababababab', TB = 'cdcdcdcdcdcdcdcdcdcdcdcdcdcdcdcd', TM = '0123456789abcdef0123456789abcdef', TT = 'efefefefefefefefefefefefefefefef', TO = '9898989898989898989898989898989a';
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'pz-test', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: +(process.env.PORT || 8089) } });
  await env.clearFirestore();
  const now = Date.now(), lv = { d: '2026-11-13', ev: '11月のDAY', id: 'evT', until: now + 3600e3 };
  await env.withSecurityRulesDisabled(async (cx) => {
    const d = cx.firestore();
    await setDoc(doc(d, 'cards/' + TA), { kind: 'user', no: 'u1', name: '見本 はなこ', union: 'U1', active: true, lastVisit: lv });
    await setDoc(doc(d, 'cards/' + TB), { kind: 'user', no: 'u2', name: '見本 さくら', union: 'U1', active: true, lastVisit: Object.assign({}, lv, { until: now - 1000 }) });
    await setDoc(doc(d, 'cards/' + TO), { kind: 'user', no: 'u4', name: '見本 まえ', union: 'U1', active: true, lastVisit: { d: '2026-11-13', ev: '11月のDAY' } });
    await setDoc(doc(d, 'cards/' + TT), { kind: 'user', no: 'u3', name: '見本 けんしゅう', union: 'U1', active: true, toMember: 'P0001', lastVisit: lv });
    await setDoc(doc(d, 'cards/' + TM), { no: 'ZZ0001', name: '架空 太郎', union: 'U1', active: true, lastVisit: lv });
    await setDoc(doc(d, 'checkinUnions/U1'), { name: 'U1', admins: ['adm1'], dayStaff: ['day1'] });
    for (const u of ['adm1', 'day1', 'm1']) await setDoc(doc(d, 'users/' + u), { union: 'U2', status: 'active' });
    await setDoc(doc(d, 'checkinEvents/evT'), { date: '2026-11-13', name: '11月のDAY', hostUnion: 'U1', unions: ['U1'] });
    await setDoc(doc(d, 'checkinEvents/evT/attendance/u1'), { no: 'u1', name: '見本 はなこ', kind: 'user', union: '', uUnion: 'U1', cardToken: TA });
  });
  const anon = env.unauthenticatedContext().firestore();
  const P = (x) => Object.assign({ v: 820, d: '2026-11-13', ev: '11月のDAY', at: now, by: 'self' }, x);
  c('本人（ログインなし）は、受付した日のうちに pz_{そのイベント} を入れられる', await ok(updateDoc(doc(anon, 'cards/' + TA), { pz_evT: P() })));
  c('同じ日のうちは直せる', await ok(updateDoc(doc(anon, 'cards/' + TA), { pz_evT: P({ v: 830 }) })));
  c('ほかのイベントの pz は入れられない', !(await ok(updateDoc(doc(anon, 'cards/' + TA), { pz_other: P() }))));
  c('ほかの項目（名前・来場回数）は一緒に変えられない', !(await ok(updateDoc(doc(anon, 'cards/' + TA), { pz_evT: P(), name: '別の人' }))) && !(await ok(updateDoc(doc(anon, 'cards/' + TA), { pz_evT: P(), visits: 99 }))));
  c('3000 より大きい・数字でない値は入れられない', !(await ok(updateDoc(doc(anon, 'cards/' + TA), { pz_evT: P({ v: 3001 }) }))) && !(await ok(updateDoc(doc(anon, 'cards/' + TA), { pz_evT: P({ v: '820' }) }))));
  c('「本人」の印（by: self）がないと入れられない', !(await ok(updateDoc(doc(anon, 'cards/' + TA), { pz_evT: P({ by: 'day1' }) }))));
  c('受付した日と違う日付では入れられない', !(await ok(updateDoc(doc(anon, 'cards/' + TA), { pz_evT: P({ d: '2026-11-14' }) }))));
  c('決まった項目以外は入れられない', !(await ok(updateDoc(doc(anon, 'cards/' + TA), { pz_evT: P({ memo: 'x' }) }))));
  c('受付した日が終わったら入れられない', !(await ok(updateDoc(doc(anon, 'cards/' + TB), { pz_evT: P() }))));
  c('前の版で受付した（イベントIDがない）カードには入れられない', !(await ok(updateDoc(doc(anon, 'cards/' + TO), { pz_: P() }))));
  c('研修生になったカード・ビジネスの会員証には入れられない', !(await ok(updateDoc(doc(anon, 'cards/' + TT), { pz_evT: P() }))) && !(await ok(updateDoc(doc(anon, 'cards/' + TM), { pz_evT: P() }))));
  c('スタッフ（ログイン）は今までどおり書ける', await ok(updateDoc(doc(env.authenticatedContext('day1').firestore(), 'cards/' + TB), { pz_evT: P({ by: 'day1' }) })));
  // 「📏 今日の測定」：ユーザーの出席を読む
  const Q = (fs2) => getDocs(query(collection(fs2, 'checkinEvents/evT/attendance'), where('kind', '==', 'user'), where('uUnion', '==', 'U1')));
  c('DAYスタッフ（ほかのユニオンの所属）でも、そのユニオンのユーザーの出席を読める', await ok(Q(env.authenticatedContext('day1').firestore())));
  c('受付管理者だけの人・関係ない人・ログインなしは読めない', !(await ok(Q(env.authenticatedContext('m1').firestore()))) && !(await ok(Q(anon))));
  await env.cleanup();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
