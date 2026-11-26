// 受付 v181（DAYスタッフに相談・DM）の firestore.rules を、Firestore エミュレータで試す（架空のデータだけ）
//   ひもづいた端末のお客さんと、相談相手のスタッフだけが読み書きできる。オーナーは報告があった時だけ、読んだ記録を残してから
//   スタッフから先に送るのは月1回まで・止められていたら不可。引き継ぎ
//   準備・実行は ckpf109_rules.js と同じ
const fs = require('fs'), path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, getDocs, updateDoc, collection, query, where, writeBatch, serverTimestamp } = require('firebase/firestore');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const ok = p => p.then(() => true, () => false);
const _e = console.error; console.error = (...a) => { if (!/PERMISSION_DENIED|evaluation error/.test(String(a[0]) + String(a[1] || ''))) _e(...a); };
(async () => {
  const env = await initializeTestEnvironment({ projectId: 'dm-test', firestore: { rules: fs.readFileSync(path.join(__dirname, '../../../firestore.rules'), 'utf8'), host: '127.0.0.1', port: +(process.env.PORT || 8089) } });
  await env.clearFirestore();
  const TK = 'a'.repeat(32), OWN = 'j2DPDAccCygHmR9i5K3bTvHnH0V2';
  await env.withSecurityRulesDisabled(async (cx) => {
    const d = cx.firestore();
    await setDoc(doc(d, 'checkinUnions/REVE'), { name: 'REVE', dayStaff: ['host1'] });
    for (const u of ['st1', 'st2', 'st3', 'mem1', 'host1']) await setDoc(doc(d, 'users/' + u), { name: u, union: 'REVE', status: 'active' });
    await setDoc(doc(d, 'users/' + OWN), { name: 'owner', union: 'REVE', status: 'active' });
    await setDoc(doc(d, 'cards/' + TK), { kind: 'user', no: 'u1', name: '見本 はなこ', union: 'REVE' });
    await setDoc(doc(d, 'ckBind/' + TK), { uids: ['dev1'], by: 'self', at: 1 });
    await setDoc(doc(d, 'ckCs/REVE/s/st1'), { name: '見本 りな', tags: ['skin'], off: false, ord: 1 });
    await setDoc(doc(d, 'ckCs/REVE/s/st2'), { name: '見本 まい', tags: ['inner'], off: false, ord: 2 });
    await setDoc(doc(d, 'ckCs/REVE/s/st3'), { name: '見本 さら', tags: ['body'], off: true, ord: 3 });
  });
  const anon = (u) => env.authenticatedContext(u, { firebase: { sign_in_provider: 'anonymous' } }).firestore();
  const A1 = anon('dev1'), A2 = anon('dev2');
  const S1 = env.authenticatedContext('st1').firestore(), S2 = env.authenticatedContext('st2').firestore(), M1 = env.authenticatedContext('mem1').firestore(), OW = env.authenticatedContext(OWN).firestore();
  const now = Date.now();
  const TH = (sUid, x) => Object.assign({ tk: TK, un: 'REVE', cno: 'u1', cname: '見本 はなこ', sUid, sName: 'x', topic: 'skin', st: 'open', last: { by: 'u', t: '朝つっぱります', at: now }, uRead: now, sRead: 0, byStaff: false, at: serverTimestamp(), upAt: now }, x || {});
  const MSG = (by, uid, t) => ({ by, uid, t: t || '相談です', at: serverTimestamp() });
  const start = async (dbx, id, th, m) => { const b = writeBatch(dbx); b.set(doc(dbx, 'ckDm/' + id), th); b.set(doc(dbx, 'ckDm/' + id + '/m/m1'), m); return b.commit(); };

  c('ひもづいた端末のお客さんは、相談を始められる', await ok(start(A1, 't1', TH('st1'), MSG('u', 'dev1'))));
  c('別の端末は、その会員証で相談を始められない', !(await ok(start(A2, 't2', TH('st1'), MSG('u', 'dev2')))));
  c('受付を休んでいるスタッフには相談できない', !(await ok(start(A1, 't3', TH('st3'), MSG('u', 'dev1')))));
  c('相談スタッフでない人には相談できない', !(await ok(start(A1, 't4', TH('mem1'), MSG('u', 'dev1')))));
  c('お客さんは自分の相談の一覧を読める', await ok(getDocs(query(collection(A1, 'ckDm'), where('tk', '==', TK)))));
  c('別の端末は一覧を読めない', !(await ok(getDocs(query(collection(A2, 'ckDm'), where('tk', '==', TK))))));
  c('相談相手のスタッフは読める（相談とメッセージ）', await ok(getDoc(doc(S1, 'ckDm/t1'))) && await ok(getDocs(collection(S1, 'ckDm/t1/m'))));
  c('ほかのスタッフは読めない', !(await ok(getDoc(doc(S2, 'ckDm/t1')))) && !(await ok(getDocs(collection(S2, 'ckDm/t1/m')))));
  c('一般メンバーは読めない', !(await ok(getDoc(doc(M1, 'ckDm/t1')))));
  c('スタッフは自分あての一覧を読める', await ok(getDocs(query(collection(S1, 'ckDm'), where('sUid', '==', 'st1')))));
  const reply = async (dbx, uid, mid, extra) => { const b = writeBatch(dbx); b.set(doc(dbx, 'ckDm/t1/m/' + mid), MSG('s', uid, '化粧水のあとにすぐクリームを')); b.update(doc(dbx, 'ckDm/t1'), Object.assign({ last: { by: 's', t: '化粧水のあとに', at: now + 1 }, sRead: now + 1, upAt: now + 1 }, extra || {})); return b.commit(); };
  c('相談相手のスタッフは返事できる', await ok(reply(S1, 'st1', 'm2')));
  c('ほかのスタッフは返事できない', !(await ok(reply(S2, 'st2', 'm3'))));
  c('お客さんは既読にできる', await ok(updateDoc(doc(A1, 'ckDm/t1'), { uRead: now + 2 })));
  c('お客さんは相談相手を変えられない', !(await ok(updateDoc(doc(A1, 'ckDm/t1'), { sUid: 'st2' }))));
  c('メッセージは1000文字まで', !(await ok(setDoc(doc(A1, 'ckDm/t1/m/m9'), MSG('u', 'dev1', 'あ'.repeat(1001))))));
  c('お客さんはスタッフとして書けない', !(await ok(setDoc(doc(A1, 'ckDm/t1/m/m8'), MSG('s', 'dev1')))));
  c('（v182）オーナーは、報告がなくても相談とメッセージを読める', await ok(getDoc(doc(OW, 'ckDm/t1'))) && await ok(getDocs(collection(OW, 'ckDm/t1/m'))));
  c('お客さんは報告できる', await ok(updateDoc(doc(A1, 'ckDm/t1'), { rep: { at: now + 3 }, upAt: now + 3 })));
  c('報告のあとも、オーナーは相談を読める', await ok(getDoc(doc(OW, 'ckDm/t1'))));
  c('オーナーが読んだ記録を残すと、メッセージを読める', await ok(setDoc(doc(OW, 'ckDm/t1/olog/' + OWN), { at: serverTimestamp() })) && await ok(getDocs(collection(OW, 'ckDm/t1/m'))));
  c('ほかの人の名前で読んだ記録は残せない', !(await ok(setDoc(doc(S1, 'ckDm/t1/olog/st1'), { at: serverTimestamp() }))));
  // 引き継ぎ
  c('同じユニオンの相談スタッフへ引き継げる', await ok(reply(S1, 'st1', 'm4', { sUid: 'st2', sName: '見本 まい' })));
  c('引き継いだあと、前のスタッフは読めない・新しいスタッフは読める', !(await ok(getDoc(doc(S1, 'ckDm/t1')))) && await ok(getDoc(doc(S2, 'ckDm/t1'))));
  // 止める
  const stop = async () => { const b = writeBatch(A1); b.update(doc(A1, 'ckDm/t1'), { stop: true, upAt: now + 5 }); b.set(doc(A1, 'ckDmStop/' + TK + '_st2'), { at: serverTimestamp() }); return b.commit(); };
  c('お客さんは「このスタッフを止める」ができる', await ok(stop()));
  c('止められたスタッフは、もう書けない', !(await ok(setDoc(doc(S2, 'ckDm/t1/m/m5'), MSG('s', 'st2')))));
  // スタッフから先に送る
  const d = new Date(), cap = (u) => TK + '_' + u + '_' + d.getUTCFullYear() + '_' + (d.getUTCMonth() + 1);
  const first = async (dbx, uid, id) => { const b = writeBatch(dbx); b.set(doc(dbx, 'ckDm/' + id), TH(uid, { byStaff: true, last: { by: 's', t: 'その後どう？', at: now }, uRead: 0, sRead: now })); b.set(doc(dbx, 'ckDm/' + id + '/m/m1'), MSG('s', uid, 'その後どうですか？')); b.set(doc(dbx, 'ckDmCap/' + cap(uid)), { by: uid, at: serverTimestamp() }); return b.commit(); };
  c('スタッフから先に送れる（月1回の印つき）', await ok(first(S1, 'st1', 'f1')));
  c('同じ月に2回目は送れない', !(await ok(first(S1, 'st1', 'f2'))));
  c('止められているスタッフは先に送れない', !(await ok(first(S2, 'st2', 'f3'))));
  c('お客さんは、スタッフから届いた相談を読める', await ok(getDoc(doc(A1, 'ckDm/f1'))) && await ok(getDocs(collection(A1, 'ckDm/f1/m'))));
  c('一般メンバーは、相談スタッフでないので先に送れない', !(await ok(first(M1, 'mem1', 'f4'))));
  await env.cleanup();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
