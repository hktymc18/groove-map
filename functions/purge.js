/**
 * 🗑 v893: 削除したアカウントを「完全に消す」。
 *   アプリ（アカウント管理 › 削除したアカウント）で、オーナーが users/{uid}.purge = { req: true, by, at } を付ける（ルールでオーナーだけ）。
 *   overdueReminders（1日5回: 9・12・15・18・21時）の最後に run() を呼び、予約のあるアカウントを消す
 *   （新しい関数を作ると、作る時に呼び出しの権限の設定が要るため、今ある関数に入れる）。
 *   消すもの：ログインのアカウント（Authentication）・users/{uid}（中の fcmTokens も）・maps/{uid}（MAP・予定など全部）・
 *            fitness/{uid}・sharedWith/{uid}・ckFollow/{uid}・ckPush/{uid}
 *   消さないもの（理由を purge.err に書いて予約を外す）：
 *     ・削除したアカウントではない（deleted が true でない）
 *     ・オーナー・管理者（role=admin）
 *     ・受付のアカウント（checkinUsers/{uid}）がある（同じログインを受付でも使っているため）
 */
const OWNERS = ['j2DPDAccCygHmR9i5K3bTvHnH0V2', 'E4WT7EHai5c6WANUgASz42Euu1y1'];

// 消してよいか（だめなら理由）
function why(uid, d, hasCk) {
  if (OWNERS.indexOf(uid) >= 0) return 'オーナーのアカウントは消せません';
  if (!d || d.deleted !== true) return '削除したアカウントではないので消していません（先に「削除」してください）';
  if (d.role === 'admin') return '管理者のアカウントは消せません（先に管理者を外してください）';
  if (hasCk) return '受付のアカウントもあるので消していません（受付でも同じログインを使っています）';
  if (!d.purge || d.purge.req !== true || OWNERS.indexOf(d.purge.by) < 0) return 'オーナーの予約ではありません';
  return '';
}

async function purgeOne(admin, db, ref) {
  const uid = ref.id, d = (await ref.get()).data();
  const ck = await db.doc('checkinUsers/' + uid).get();
  const ng = why(uid, d, ck.exists);
  if (ng) { await ref.update({ 'purge.req': false, 'purge.err': ng, 'purge.errAt': new Date().toISOString() }); return { uid, ok: false, msg: ng }; }
  try { await admin.auth().deleteUser(uid); } catch (e) { if (!(e && e.code === 'auth/user-not-found')) throw e; }
  for (const p of ['maps/' + uid, 'fitness/' + uid, 'sharedWith/' + uid]) await db.recursiveDelete(db.doc(p));
  for (const p of ['ckFollow/' + uid, 'ckPush/' + uid]) await db.doc(p).delete();
  await db.recursiveDelete(ref);   // 最後に users/{uid}（消えたらアプリの一覧からも消える）
  return { uid, ok: true, email: d.email || '', name: d.name || '' };
}

async function run(admin) {
  const db = admin.firestore();
  const qs = await db.collection('users').where('purge.req', '==', true).limit(20).get();
  const out = [];
  for (const doc of qs.docs) {
    try { out.push(await purgeOne(admin, db, doc.ref)); }
    catch (e) {
      out.push({ uid: doc.id, ok: false, msg: String(e && e.message || e) });
      try { await doc.ref.update({ 'purge.req': false, 'purge.err': '消せませんでした: ' + String(e && e.message || e).slice(0, 200), 'purge.errAt': new Date().toISOString() }); } catch (e2) {}
    }
  }
  if (out.length) console.log('purge: ' + JSON.stringify(out));
  return out;
}

module.exports = { run, why, OWNERS };
