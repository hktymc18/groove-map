// 受付 v109（#21 プロフィール）の firestore.rules を、Firestore エミュレータで実際に試す（架空のデータだけ）
// 準備: npm i firebase-tools@13 @firebase/rules-unit-testing@3 firebase@10 を入れた場所で
//   java -jar ~/.cache/firebase/emulators/cloud-firestore-emulator-*.jar --host 127.0.0.1 --port 8089 &
//   NODE_PATH=<その場所>/node_modules node tools/test/rules/ckpf109_rules.js
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, writeBatch, deleteDoc, updateDoc } = require('firebase/firestore');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const ok = p => p.then(() => true, () => false);
const _e = console.error; console.error = (...a) => { if (!/PERMISSION_DENIED|evaluation error/.test(String(a[0]) + String(a[1] || ''))) _e(...a); };
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'pf-test', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: +(process.env.PORT || 8089) } });
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (cx) => {
    const d = cx.firestore();
    const card = (t, no, x) => setDoc(doc(d, 'cards/' + t), Object.assign({ no, name: '見本', union: 'U1', active: true }, x));
    await card('tokRuby', 'ZZ0001', { cardTitle: 'RUBY' });
    await card('tokOldBadge', 'ZZ0002', { badge: 'DIAMOND' });        // 古いデータ（badge に宝石）
    await card('tokGold', 'ZZ0003', { cardTitle: 'GOLD', badges: ['EXPERT'] });
    await card('tokTrainee', 'ZZ0004', { cardTitle: 'RUBY', trainee: true });
    await card('tokOff', 'ZZ0005', { cardTitle: 'RUBY', active: false });
    for (const [no, t] of [['ZZ0001', 'tokRuby'], ['ZZ0002', 'tokOldBadge'], ['ZZ0003', 'tokGold'], ['ZZ0004', 'tokTrainee'], ['ZZ0005', 'tokOff']])
      await setDoc(doc(d, 'checkinMembers/' + no), { no, name: '見本', union: 'U1', cardToken: t });
    await setDoc(doc(d, 'users/reader'), { union: 'U2', status: 'active' });
    await setDoc(doc(d, 'users/admin1'), { union: 'U1', role: 'admin', status: 'active' });
  });
  const anon = env.unauthenticatedContext().firestore();
  const P = (o) => Object.assign({ intro: '自己紹介', good: '得意', bad: '苦手', atMs: Date.now() }, o);
  const save = (db, tok, no, p) => { const b = writeBatch(db); b.set(doc(db, 'cards/' + tok + '/prof/me'), p); b.set(doc(db, 'cardProfiles/' + no), Object.assign({ no }, p)); return b.commit(); };

  c('本人（RUBY・ログインなし）が保存できる', await ok(save(anon, 'tokRuby', 'ZZ0001', P())));
  c('古いデータ（badge が DIAMOND）でも保存できる', await ok(save(anon, 'tokOldBadge', 'ZZ0002', P())));
  c('GOLD（ルビー未満）は保存できない', !(await ok(save(anon, 'tokGold', 'ZZ0003', P()))));
  c('研修生は保存できない', !(await ok(save(anon, 'tokTrainee', 'ZZ0004', P()))));
  c('無効の会員証は保存できない', !(await ok(save(anon, 'tokOff', 'ZZ0005', P()))));
  c('自己紹介200字はOK', await ok(save(anon, 'tokRuby', 'ZZ0001', P({ intro: 'あ'.repeat(200) }))));
  c('自己紹介201字は保存できない', !(await ok(save(anon, 'tokRuby', 'ZZ0001', P({ intro: 'あ'.repeat(201) })))));
  c('得意101字は保存できない', !(await ok(save(anon, 'tokRuby', 'ZZ0001', P({ good: 'あ'.repeat(101) })))));
  c('苦手101字は保存できない', !(await ok(save(anon, 'tokRuby', 'ZZ0001', P({ bad: 'あ'.repeat(101) })))));
  c('ほかの項目は足せない（本人の分）', !(await ok(setDoc(doc(anon, 'cards/tokRuby/prof/me'), P({ cardTitle: 'TEAM ELITE' })))));
  // 他人のトークン・番号
  c('自分のトークンで他人（ZZ0002）の写しは書けない', !(await ok(save(anon, 'tokRuby', 'ZZ0002', P({ intro: 'なりすまし' })))));
  c('写しだけを書くことはできない（本人の分を変えずに）', !(await ok(setDoc(doc(anon, 'cardProfiles/ZZ0001'), Object.assign({ no: 'ZZ0001' }, P({ intro: '偽' }))))));
  let cur; await env.withSecurityRulesDisabled(async cx => { cur = (await getDoc(doc(cx.firestore(), 'cards/tokRuby/prof/me'))).data(); });
  c('写しだけ・本人の分と同じ中身でも書けない（atMs が同じ＝本人の分を書き換えていない）', !(await ok(setDoc(doc(anon, 'cardProfiles/ZZ0001'), Object.assign({ no: 'ZZ0001' }, cur, { intro: cur.intro })))));
  c('ログインした人でも他人の写しは書けない', !(await ok(setDoc(doc(env.authenticatedContext('reader').firestore(), 'cardProfiles/ZZ0001'), Object.assign({ no: 'ZZ0001' }, P({ intro: '偽' }))))));
  c('存在しないトークンでは書けない', !(await ok(save(anon, 'tokNope', 'ZZ0001', P()))));
  // 本人はプロフィール以外を変えられない
  c('本人（ログインなし）は会員証の項目を変えられない', !(await ok(updateDoc(doc(anon, 'cards/tokRuby'), { cardTitle: 'TEAM ELITE' }))));
  c('本人（ログインなし）は会員証にプロフィールを書き込めない（cards 本体）', !(await ok(updateDoc(doc(anon, 'cards/tokRuby'), { intro: 'x' }))));
  // 読む
  c('ログインした人は番号で写しを読める', await ok(getDoc(doc(env.authenticatedContext('reader').firestore(), 'cardProfiles/ZZ0001'))));
  c('ログインしていない人は写しを読めない', !(await ok(getDoc(doc(anon, 'cardProfiles/ZZ0001')))));
  c('本人は自分の分をトークンで読める', await ok(getDoc(doc(anon, 'cards/tokRuby/prof/me'))));
  // 再発行: 受付・管理者が新しい会員証に戻せる（タイトル判定なし）／無効化後の発行も
  await env.withSecurityRulesDisabled(async cx => { const d = cx.firestore(); await deleteDoc(doc(d, 'cards/tokRuby')); await setDoc(doc(d, 'cards/tokNew'), { no: 'ZZ0001', cardTitle: 'RUBY', union: 'U1' }); await setDoc(doc(d, 'checkinMembers/ZZ0001'), { no: 'ZZ0001', union: 'U1', cardToken: 'tokNew' }); });
  const adm = env.authenticatedContext('admin1').firestore();
  const pr = (await getDoc(doc(adm, 'cardProfiles/ZZ0001'))).data();
  c('再発行: 管理者が写しから新しい会員証へ戻せる', await ok(setDoc(doc(adm, 'cards/tokNew/prof/me'), { intro: pr.intro, good: pr.good, bad: pr.bad, atMs: pr.atMs })));
  c('再発行のあと: 古いトークンでは書けない', !(await ok(save(anon, 'tokRuby', 'ZZ0001', P()))));
  c('再発行のあと: 新しいトークンで書ける', await ok(save(anon, 'tokNew', 'ZZ0001', P({ intro: '新しいカード' }))));
  // 削除
  c('他ユニオンの人は写しを消せない', !(await ok(deleteDoc(doc(env.authenticatedContext('reader').firestore(), 'cardProfiles/ZZ0001')))));
  c('そのユニオンの管理者は写しを消せる', await ok(deleteDoc(doc(adm, 'cardProfiles/ZZ0001'))));
  await env.cleanup();
  console.log(fails ? 'FAILS ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
