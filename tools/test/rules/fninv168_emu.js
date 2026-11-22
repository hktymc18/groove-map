// 受付 v168：サーバーの棚卸し（functions/inventory.js）を Firestore エミュレータで動かす（本物の firebase-admin・架空データ）
//   準備: ckpf109_rules.js と同じ場所に firebase-admin@12 も入れる。FIRESTORE_EMULATOR_HOST=127.0.0.1:8089 で起動
//   NODE_PATH=<その場所>/node_modules FIRESTORE_EMULATOR_HOST=127.0.0.1:8089 node tools/test/rules/fninv168_emu.js
const path = require('path');
process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8089';
const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'inv-test' });
const INV = require(path.join(__dirname, '../../../functions/inventory.js'));
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const db = admin.firestore();
// 2026-11-23（月）9:10 日本時間
const NOW = Date.parse('2026-11-23T00:10:00Z');
const d = n => new Date(Date.parse('2026-11-23T00:00:00Z') - n * 86400000).toISOString().slice(0, 10);
(async () => {
  await fetch('http://' + process.env.FIRESTORE_EMULATOR_HOST + '/emulator/v1/projects/inv-test/databases/(default)/documents', { method: 'DELETE' });
  const set = (p, v) => db.doc(p).set(v);
  await set('checkinUnions/U1', { unionAdmins: ['adm'], admins: ['rc1', 'up1'] });   // v169: 受付管理者 rc1・up1（UPルビーでもある）
  await set('checkinUnions/U2', {});
  await set('users/up1', { name: '見本 UP', union: 'U1' });          // UPルビー（系列の名前と同じ）
  await set('users/tr1', { name: '見本 担当', union: 'U1' });
  await set('users/old', { name: '見本UP', union: 'U1', status: 'disabled' });   // 無効のアカウントには送らない
  const M = (no, x) => set('checkinMembers/' + no, Object.assign({ no, name: '見本 ' + no, union: 'U1', group: '見本　UP' }, x));
  await M('A1', {});                                                                   // 何もない → 2回目
  await M('A2', { trainee: true, regBy: 'tr1', trainings: { PG: { at: d(20), by: 'tr1' } } });   // 20日前 → 1回目
  await M('A3', {});                                                                   // 3日前に出席 → 出ない
  await M('A4', { invSnooze: d(-3) });                                                 // 様子見中 → 出ない
  await M('A5', { active: false });                                                    // 無効 → 出ない
  await M('A6', { cardToken: 'tok6' });                                                // 何もない → 2回目（あとで「やめた」）
  await set('cards/tok6', { no: 'A6', active: true });
  await M('A7', { coSheet: { atMs: Date.parse(d(16) + 'T03:00:00Z') } });             // 16日前の面談シート → 1回目
  await set('checkinEvents/e1', { date: d(3), month: d(3).slice(0, 7), name: 'PG', unions: ['U1'] });
  await set('checkinEvents/e1/attendance/A3', { union: 'U1' });
  await set('checkinEvents/e1/attendance/A1', { union: 'U1', status: 'pending' });     // 承認待ちは出席にしない
  const sent = [];
  const send = async (uid, t, b) => { sent.push({ uid, t, b }); return true; };
  // ── 月曜9時：計算とお知らせ ──
  let r = await INV.run(admin, { now: NOW, send });
  const inv = (await db.doc('checkinInventory/U1').get()).data();
  const nos = inv.list.map(x => x.no).sort().join(',');
  c('候補：A1・A6（28日以上）・A2・A7（14日以上）', nos === 'A1,A2,A6,A7', nos);
  c('段階', inv.list.filter(x => x.stage === 2).map(x => x.no).sort().join(',') === 'A1,A6' && inv.list.filter(x => x.stage === 1).map(x => x.no).sort().join(',') === 'A2,A7');
  c('最後の動きの中身', inv.list.find(x => x.no === 'A2').last.why === 'PG 受講' && inv.list.find(x => x.no === 'A7').last.why === '面談シート' && inv.list.find(x => x.no === 'A1').last === null);
  c('相手：研修生は担当＋UPルビー、正規はUPルビー（無効のアカウントは入れない・スペース違いも同じ名前）', JSON.stringify(inv.who.A2.slice().sort()) === '["tr1","up1"]' && JSON.stringify(inv.who.A1) === '["up1"]', JSON.stringify(inv.who));
  c('通知は1人1通にまとめる（up1 に4人・tr1 に1人）', /4人/.test(sent.find(x => x.uid === 'up1').t) && /1人/.test(sent.find(x => x.uid === 'tr1').t), JSON.stringify(sent));
  c('v169: 受付管理者・ユニオン管理者にもまとめ（U1：4人・28日以上 2人）', sent.length === 4 && /今週の棚卸し（4人）/.test((sent.find(x => x.uid === 'rc1') || {}).t) && /U1：4人（28日以上 2人）/.test((sent.find(x => x.uid === 'adm') || {}).b), JSON.stringify(sent));
  c('v169: UPルビーで受付管理者の人は1通（お願い＋ユニオン全体）', sent.filter(x => x.uid === 'up1').length === 1 && /ユニオン全体の棚卸し… U1：4人/.test(sent.find(x => x.uid === 'up1').b));
  c('v169: 候補0人のユニオンの管理者には送らない', !sent.some(x => /U2/.test(x.b)));
  c('U2 の文書も作る（候補0人）', (await db.doc('checkinInventory/U2').get()).data().list.length === 0);
  // ── 同じ日の次の回（12時）：計算しない・送らない ──
  sent.length = 0;
  r = await INV.run(admin, { now: NOW + 3 * 3600000, send });
  c('同じ日の次の回は計算しない', r.weekly === null && sent.length === 0);
  // ── 回答：やめた（UPルビー）・続けている（担当）・他人の回答・相手でない人 ──
  await set('checkinInventory/U1/ans/A6', { a: 'quit', by: 'up1', at: 1 });
  await set('checkinInventory/U1/ans/A2', { a: 'ok', by: 'tr1', at: 1 });
  await set('checkinInventory/U1/ans/A7', { a: 'quit', by: 'tr1', at: 1 });            // tr1 は A7 の相手ではない → 反映しない
  await set('checkinInventory/U1/ans/A1', { a: 'wait', by: 'adm', at: 1 });            // 管理者は誰でも
  r = await INV.run(admin, { now: NOW + 6 * 3600000, send });
  const m = async no => (await db.doc('checkinMembers/' + no).get()).data();
  c('やめた → 名簿と会員証を無効', (await m('A6')).active === false && (await db.doc('cards/tok6').get()).data().active === false);
  c('続けている → 今日から数え直し', (await m('A2')).invAt === '2026-11-23');
  c('管理者の様子見 → 14日後まで', (await m('A1')).invSnooze === '2026-12-07');
  c('相手でない人の回答は反映しない', (await m('A7')).active !== false);
  c('回答は消える', (await db.collection('checkinInventory/U1/ans').get()).size === 0);
  const inv2 = (await db.doc('checkinInventory/U1').get()).data();
  c('記録（log）に残り、一覧から外れる', inv2.log.length === 3 && inv2.log.find(x => x.no === 'A6').byName === '見本 UP' && inv2.list.map(x => x.no).sort().join(',') === 'A7', JSON.stringify(inv2.list.map(x => x.no)));
  // ── 次の週：同じ段階はもう送らない・2回目になった人だけ送る ──
  sent.length = 0;
  await db.doc('checkinMembers/A2').update({ invAt: d(29), 'trainings.PG.at': d(29) });   // 最後の動きを29日前に
  r = await INV.run(admin, { now: NOW + 7 * 86400000, send });
  // 1週間後：A7 は 23日 → 1回目のまま（送らない）、A2 は 36日 → 2回目（送る）、A4 は様子見が終わって2回目（送る）、A1 は様子見中
  const inv3 = (await db.doc('checkinInventory/U1').get()).data();
  const up = sent.find(x => x.uid === 'up1'), tr = sent.find(x => x.uid === 'tr1');
  c('次の週：同じ段階はもう送らない・2回目になった人だけ送る', up && /2人/.test(up.t) && tr && /1人/.test(tr.t) && /28日/.test(tr.b) && inv3.sent.A7 === 1 && inv3.sent.A2 === 2 && inv3.sent.A4 === 2 && !inv3.sent.A1, JSON.stringify(sent) + ' ' + JSON.stringify(inv3.sent));
  c('v169: 管理者のまとめは毎週（候補がいる週）', sent.length === 4 && sent.some(x => x.uid === 'rc1') && sent.some(x => x.uid === 'adm'), JSON.stringify(sent.map(x => x.uid)));
  // ── force ──
  sent.length = 0;
  await db.doc('appStats/inventory').set({ force: true }, { merge: true });
  r = await INV.run(admin, { now: NOW + 7 * 86400000 + 4 * 3600000, send });
  c('force でその場で1回計算（そのあと force は消える）', r.weekly && (await db.doc('appStats/inventory').get()).data().force === false);
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
