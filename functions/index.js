/**
 * GROOVE MAP - CAL-4 プッシュ通知の発射役
 * 5分ごとに notifQueue を見て、fireAt を過ぎた予約を対象ユーザーの全端末へ送信し、キューを削除する。
 * デプロイ: リポジトリ直下で `firebase deploy --only functions`
 */
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

admin.initializeApp();

exports.sendReminders = onSchedule(
  // v307: 通知遅延を最大1分程度に短縮（毎分起動でも無料枠の2%程度）
  { schedule: 'every 1 minutes', region: 'asia-northeast1', timeZone: 'Asia/Tokyo', memory: '256MiB' },
  async () => {
    const db = admin.firestore();
    const nowIso = new Date().toISOString();
    const snap = await db.collection('notifQueue').where('fireAt', '<=', nowIso).limit(300).get();
    if (snap.empty) return;
    console.log(`sendReminders: queue=${snap.size}`); // v332: 原因調査用ログ

    // ユーザーごとにまとめてトークンを1回だけ読む
    const byUid = {};
    snap.docs.forEach((d) => {
      const q = d.data() || {};
      if (!q.uid) { d.ref.delete().catch(() => {}); return; }
      (byUid[q.uid] = byUid[q.uid] || []).push({ ref: d.ref, q });
    });

    for (const uid of Object.keys(byUid)) {
      let tokens = [];
      try {
        const toksSnap = await db.collection('users').doc(uid).collection('fcmTokens').get();
        // v375: 45日以上更新のない登録は配信せず削除（再インストール前の残骸による重複通知の対策。
        //        アプリを開くたびに updatedAt が更新されるため、現役の端末は消えない）
        const cutoff = new Date(Date.now() - 45 * 86400000).toISOString();
        toksSnap.docs.forEach((t) => {
          const ts = (t.data() || {}).updatedAt || '';
          if (ts && ts < cutoff) {
            t.ref.delete().catch(() => {});
            console.log(`stale token pruned uid=${uid}`);
            return;
          }
          tokens.push(t.id);
        });
      } catch (e) { console.log(`token read error uid=${uid}: ${e}`); }
      console.log(`uid=${uid} tokens=${tokens.length}`); // v332: トークン0ならこの端末が未登録

      for (const item of byUid[uid]) {
        if (tokens.length) {
          try {
            const title = String(item.q.title || 'GROOVE MAP');
            const body = String(item.q.body || '');
            const eventId = String(item.q.eventId || '');
            const res = await admin.messaging().sendEachForMulticast({
              tokens,
              data: { title, body, eventId },
              // v330: iOS(26)はデータのみのWebプッシュを表示しないため、notification付きで送る
              // （ロック画面・バナーにOSが直接表示。タップでリンクの ?ev= から該当予定を開く）
              webpush: {
                headers: { Urgency: 'high', TTL: '3600' },
                notification: {
                  title,
                  body,
                  icon: 'https://hktymc18.github.io/groove-map/icon-192.png',
                  badge: 'https://hktymc18.github.io/groove-map/icon-192.png',
                  tag: 'gm-' + (eventId || 'push'),
                },
                fcmOptions: { link: 'https://hktymc18.github.io/groove-map/' + (eventId ? '?ev=' + encodeURIComponent(eventId) : '') },
              },
            });
            console.log(`sent "${item.q.title}": ok=${res.successCount} ng=${res.failureCount}`); // v332
            // 失効トークンの掃除
            res.responses.forEach((r, i) => {
              if (!r.success && r.error) {
                const code = String(r.error.code || r.error);
                console.log(`token#${i} error=${code}`); // v332
                if (code.includes('registration-token-not-registered') || code.includes('invalid-argument')) {
                  db.collection('users').doc(uid).collection('fcmTokens').doc(tokens[i]).delete().catch(() => {});
                }
              }
            });
          } catch (e) { console.log(`send error: ${e}`); }
        }
        await item.ref.delete().catch(() => {});
      }
    }
  }
);
