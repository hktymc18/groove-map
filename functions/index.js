/**
 * GROOVE MAP - CAL-4 プッシュ通知の発射役
 * 5分ごとに notifQueue を見て、fireAt を過ぎた予約を対象ユーザーの全端末へ送信し、キューを削除する。
 * デプロイ: リポジトリ直下で `firebase deploy --only functions,firestore:indexes`
 *   （期限切れタスクの検索に複合インデックスが要る。firestore.indexes.json）
 */
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

admin.initializeApp();

// ユーザーの配信先トークン（古い・重複した登録は掃除）
async function getTokens(db, uid) {
  const toksSnap = await db.collection('users').doc(uid).collection('fcmTokens').get();
  return tokensFromDocs(toksSnap.docs);
}
// 読み込み済みのトークン文書から、送り先を選ぶ（45日以上更新のない登録・同じ端末の古い登録は掃除）
function tokensFromDocs(docs) {
  const tokens = [];
  const cutoff = new Date(Date.now() - 45 * 86400000).toISOString();
  const cand = [];
  docs.forEach((t) => {
    const dd = t.data() || {};
    const ts = dd.updatedAt || '';
    if (ts && ts < cutoff) { t.ref.delete().catch(() => {}); return; }
    cand.push({ ref: t.ref, id: t.id, ts, dev: dd.device || '' });
  });
  const newestByDev = {};
  cand.forEach((c) => {
    if (!c.dev) { tokens.push(c.id); return; }
    const cur = newestByDev[c.dev];
    if (!cur || c.ts > cur.ts) newestByDev[c.dev] = c;
  });
  Object.keys(newestByDev).forEach((dv) => tokens.push(newestByDev[dv].id));
  cand.forEach((c) => { if (c.dev && newestByDev[c.dev].id !== c.id) c.ref.delete().catch(() => {}); });
  return tokens;
}
async function pushTo(db, uid, tokens, title, body, eventId, tag) {
  if (!tokens.length) return;
  const res = await admin.messaging().sendEachForMulticast({
    tokens,
    data: { title, body, eventId },
    webpush: {
      headers: { Urgency: 'high', TTL: '3600' },
      notification: {
        title, body,
        icon: 'https://hktymc18.github.io/groove-map/icon-192.png',
        badge: 'https://hktymc18.github.io/groove-map/icon-192.png',
        tag: tag || ('gm-' + (eventId || 'push')),
      },
      fcmOptions: { link: 'https://hktymc18.github.io/groove-map/' + (eventId ? '?ev=' + encodeURIComponent(eventId) : '') },
    },
  });
  console.log(`push "${title}" uid=${uid}: ok=${res.successCount} ng=${res.failureCount}`);
  res.responses.forEach((r, i) => {
    if (!r.success && r.error) {
      const code = String(r.error.code || r.error);
      if (code.includes('registration-token-not-registered') || code.includes('invalid-argument')) {
        db.collection('users').doc(uid).collection('fcmTokens').doc(tokens[i]).delete().catch(() => {});
      }
    }
  });
}

// v533: 期限切れタスクの強制リマインド（9・12・15・18・21時）
//  サーバーが全員の未完了タスクを直接見て送るので、アプリを開いていなくても・アプリ内で通知をオフにしていても届く。
//  期限切れが0件になれば送らない。（端末の設定で通知そのものを切っている場合は届かない）
exports.overdueReminders = onSchedule(
  { schedule: '0 9,12,15,18,21 * * *', region: 'asia-northeast1', timeZone: 'Asia/Tokyo', memory: '256MiB' },
  async () => {
    const db = admin.firestore();
    const today = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10); // 日本時間の今日（YYYY-MM-DD）
    // v807: 読み取りを減らす。
    //   ① 全ユーザーを読むのをやめ、通知の登録（fcmTokens）がある人だけを対象に（トークンはまとめて1回で読む）
    //   ② その人の予定・タスクは「タスク・未完了・期限が今日より前」だけを読む（前は未完了の予定・タスクを全部読んでいた）
    //      ※複合インデックス（type・done・date）が要る。まだ作られていない時は今までの読み方に戻す
    //   ③ 無効にした人かどうかは、期限切れがあって送る時だけ確認する
    const tokSnap = await db.collectionGroup('fcmTokens').get();
    const tokByUid = {};
    tokSnap.docs.forEach((t) => {
      const u = t.ref.parent.parent;
      if (!u || !u.parent || u.parent.id !== 'users') return;
      (tokByUid[u.id] = tokByUid[u.id] || []).push(t);
    });
    let sent = 0, idxOk = 0, idxNg = 0;
    for (const uid of Object.keys(tokByUid)) {
      const tokens = tokensFromDocs(tokByUid[uid]);
      if (!tokens.length) continue;
      const evCol = db.collection('maps').doc(uid).collection('events');
      let snap;
      try { snap = await evCol.where('type', '==', 'task').where('done', '==', false).where('date', '<', today).get(); idxOk++; }
      catch (e0) {
        idxNg++;
        try { snap = await evCol.where('done', '==', false).get(); } catch (e) { console.log(`events read error uid=${uid}: ${e}`); continue; }
      }
      const od = [];
      snap.docs.forEach((d) => {
        const e = d.data() || {};
        if (e.type !== 'task' || e.deleted || !e.date || e.date >= today) return;
        // アプリの「自分のToDo」と同じ判定：メンバー専用のタスク（自分に表示しない）は除く
        const linked = (e.memberIds && e.memberIds.length) || e.memberId;
        if (linked && e.selfShow !== true) return;
        od.push(e);
      });
      if (!od.length) continue;
      try { const ud = (await db.collection('users').doc(uid).get()).data() || {}; if (ud.status === 'disabled') continue; } catch (eU) { continue; }
      od.sort((a, b) => (a.date < b.date ? -1 : (a.date > b.date ? 1 : 0)));
      const names = od.slice(0, 2).map((e) => String(e.title || '(無題)'));
      const body = names.join('、') + (od.length > 2 ? ` ほか${od.length - 2}件` : '') + '｜タップして一覧を開く';
      try { await pushTo(db, uid, tokens, `⚠️ 期限切れタスク ${od.length}件`, body, 'due-digest', 'gm-overdue'); sent++; } catch (e) { console.log(`overdue send error uid=${uid}: ${e}`); }
    }
    console.log(`overdueReminders: users=${Object.keys(tokByUid).length} sent=${sent} index=${idxOk}/${idxOk + idxNg}`);
  }
);

exports.sendReminders = onSchedule(
  // v307: 通知遅延を最大1分程度に短縮していたが、v807で5分ごとに戻した（空でも1回ごとに読み取りが1回かかるため。1日1,440回→288回）
  { schedule: 'every 5 minutes', region: 'asia-northeast1', timeZone: 'Asia/Tokyo', memory: '256MiB' },
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
        const cand = [];
        toksSnap.docs.forEach((t) => {
          const dd = t.data() || {};
          const ts = dd.updatedAt || '';
          if (ts && ts < cutoff) {
            t.ref.delete().catch(() => {});
            console.log(`stale token pruned uid=${uid}`);
            return;
          }
          cand.push({ ref: t.ref, id: t.id, ts, dev: dd.device || '' });
        });
        // v382: 同じ端末ID(device)のトークンが複数残っている場合は最新の1件だけに送り、古い方は削除
        //       （端末IDを持たないレガシー登録はそのまま送る）
        const newestByDev = {};
        cand.forEach((c) => {
          if (!c.dev) { tokens.push(c.id); return; }
          const cur = newestByDev[c.dev];
          if (!cur || c.ts > cur.ts) newestByDev[c.dev] = c;
        });
        Object.keys(newestByDev).forEach((dv) => tokens.push(newestByDev[dv].id));
        cand.forEach((c) => {
          if (c.dev && newestByDev[c.dev].id !== c.id) {
            c.ref.delete().catch(() => {});
            console.log(`duplicate device token pruned uid=${uid}`);
          }
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
