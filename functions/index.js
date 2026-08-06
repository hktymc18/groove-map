/**
 * GROOVE MAP - CAL-4 プッシュ通知の発射役
 * 5分ごとに notifQueue を見て、fireAt を過ぎた予約を対象ユーザーの全端末へ送信し、キューを削除する。
 * デプロイ: リポジトリ直下で `firebase deploy --only functions`
 */
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

admin.initializeApp();

exports.sendReminders = onSchedule(
  { schedule: 'every 5 minutes', region: 'asia-northeast1', timeZone: 'Asia/Tokyo', memory: '256MiB' },
  async () => {
    const db = admin.firestore();
    const nowIso = new Date().toISOString();
    const snap = await db.collection('notifQueue').where('fireAt', '<=', nowIso).limit(300).get();
    if (snap.empty) return;

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
        tokens = toksSnap.docs.map((t) => t.id);
      } catch (e) { /* トークン取得失敗でもキューは消化する */ }

      for (const item of byUid[uid]) {
        if (tokens.length) {
          try {
            const res = await admin.messaging().sendEachForMulticast({
              tokens,
              data: {
                title: String(item.q.title || 'GROOVE MAP'),
                body: String(item.q.body || ''),
                eventId: String(item.q.eventId || ''),
              },
              webpush: { headers: { Urgency: 'high', TTL: '3600' } },
            });
            // 失効トークンの掃除
            res.responses.forEach((r, i) => {
              if (!r.success && r.error) {
                const code = String(r.error.code || r.error);
                if (code.includes('registration-token-not-registered') || code.includes('invalid-argument')) {
                  db.collection('users').doc(uid).collection('fcmTokens').doc(tokens[i]).delete().catch(() => {});
                }
              }
            });
          } catch (e) { /* 送信失敗してもキューは削除（無限リトライ防止） */ }
        }
        await item.ref.delete().catch(() => {});
      }
    }
  }
);
