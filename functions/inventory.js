/**
 * 🧹 受付 v168: 棚卸しの自動のお知らせ（研修を聞いたけど進まない人・やめた人を、定期的に確かめて無効化する）
 *   overdueReminders（1日5回: 9・12・15・18・21時）の最後に run()（回答の反映・force）、
 *   sendReminders（5分ごと）の最初に weeklyTick()（v170: 毎週日曜11時の計算とお知らせ）を呼ぶ
 *   （新しい関数を作ると、作る時に呼び出しの権限の設定が要るため、今ある関数に入れる）。
 *
 *   ① 回答の反映（毎回）: checkinInventory/{ユニオン}/ans/{会員番号} = { a: 'ok'|'wait'|'quit', by: uid, at }
 *      お知らせを受けた人（who に入っている人）か、そのユニオンの管理者の回答だけを反映して、回答は消す。
 *        ok   = 続けている … 名簿の invAt＝今日（今日から数え直し）
 *        wait = 様子見     … 名簿の invSnooze＝14日後（その日まで候補に出さない）
 *        quit = やめた     … 名簿と会員証を無効（active=false）。研修生も正規メンバーも（オーナーの指定）
 *   ② 棚卸しの計算とお知らせ（v170: 週1・日曜11時。appStats/inventory.force=true なら 1日5回の回でその場で1回）
 *      最後の動き＝直近1ヶ月の出席・研修の受講・面談シート・名簿に登録した日・「続けている」にした日 のいちばん新しい日。
 *      14日以上＝1回目、28日以上＝2回目（研修生も正規メンバーも同じ。受付の画面 ckInvStage と同じ判定）。
 *      お知らせの相手（who）＝ 研修生：登録した担当・受講済みにした担当／全員：UPルビー（系列の名前と同じ名前のアカウント）。
 *      同じ人に同じ段階のお知らせは1回だけ（sent）。スマホの通知は1人1通にまとめる（NAVIGATOR の通知の登録先へ）。
 *      v169: 受付管理者・ユニオン管理者には、候補がいる週は毎週「ユニオンの棚卸し：〇人（28日以上 〇人）」のまとめも送る。
 *      結果は checkinInventory/{ユニオン} に1つにまとめる（受付の画面は1回読むだけ）。
 */
const D1 = 14, D2 = 28;
const OWNERS = ['j2DPDAccCygHmR9i5K3bTvHnH0V2', 'E4WT7EHai5c6WANUgASz42Euu1y1'];
const LINK = 'https://hktymc18.github.io/groove-map/checkin/index.html#inv';

// 日本時間の日付
function jst(ms) { return new Date((ms == null ? Date.now() : ms) + 9 * 3600000); }
function ymd(d) { return d.toISOString().slice(0, 10); }
function addDays(day, n) { return ymd(new Date(Date.parse(day + 'T00:00:00Z') + n * 86400000)); }
function daysBetween(a, b) { return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000); }
// 名前の比べ方（スペース・全角半角を気にしない）
function normName(s) { return String(s || '').normalize('NFKC').replace(/[\s　]/g, ''); }
function tsDay(t) {
  if (!t) return '';
  const ms = typeof t.toMillis === 'function' ? t.toMillis() : (t.seconds ? t.seconds * 1000 : (typeof t === 'number' ? t : Date.parse(t)));
  return isNaN(ms) ? '' : ymd(jst(ms));
}
function memberOff(m) { return m.active === false || !!m.resting; }

// 最後の動き { d, why }（無ければ null）。att = その人の直近1ヶ月の最後の出席 { d, why }
function lastActOf(m, att) {
  const c = [];
  if (att) c.push(att);
  const tr = m.trainings || {};
  Object.keys(tr).forEach((k) => { if (tr[k] && tr[k].at) c.push({ d: String(tr[k].at).slice(0, 10), why: k + ' 受講' }); });
  if (m.coSheet && m.coSheet.atMs) c.push({ d: ymd(jst(m.coSheet.atMs)), why: '面談シート' });
  const since = tsDay(m.createdAt); if (since) c.push({ d: since, why: '名簿に登録' });
  if (m.invAt) c.push({ d: String(m.invAt).slice(0, 10), why: '棚卸しで続けている' });
  let best = null;
  c.forEach((x) => { if (x.d && (!best || x.d > best.d)) best = x; });
  return best;
}
// 0＝まだ・1＝14日以上・2＝28日以上（無効・様子見中は 0）
function stageOf(m, att, today) {
  if (memberOff(m)) return 0;
  if (m.invSnooze && String(m.invSnooze) >= today) return 0;
  const la = lastActOf(m, att), n = la ? daysBetween(la.d, today) : 9999;
  return n >= D2 ? 2 : n >= D1 ? 1 : 0;
}
// お知らせの相手（uid の一覧）
function whoOf(m, usersByName) {
  const s = new Set();
  if (m.trainee) {
    if (m.regBy) s.add(m.regBy);
    const tr = m.trainings || {};
    Object.keys(tr).forEach((k) => { if (tr[k] && tr[k].by) s.add(tr[k].by); });
  }
  (usersByName[normName(m.group)] || []).forEach((u) => s.add(u));
  return Array.from(s);
}

// ① 回答の反映
async function applyAnswers(db, today, FV) {
  const qs = await db.collectionGroup('ans').get();
  const byUnion = {};
  qs.docs.forEach((d) => {
    const inv = d.ref.parent.parent;
    if (!inv || !inv.parent || inv.parent.id !== 'checkinInventory') return;
    (byUnion[inv.id] = byUnion[inv.id] || []).push(d);
  });
  let n = 0;
  for (const un of Object.keys(byUnion)) {
    const invRef = db.collection('checkinInventory').doc(un);
    const [invS, unS] = await Promise.all([invRef.get(), db.collection('checkinUnions').doc(un).get()]);
    const inv = invS.exists ? invS.data() : {}, ud = unS.exists ? unS.data() : {};
    const admins = new Set([].concat(ud.unionAdmins || [], ud.admins || [], OWNERS));
    const log = (inv.log || []).slice(-40), done = new Set();
    for (const d of byUnion[un]) {
      const no = d.id, a = d.data() || {};
      const ok = a.by && ['ok', 'wait', 'quit'].indexOf(a.a) >= 0 && (admins.has(a.by) || ((inv.who || {})[no] || []).indexOf(a.by) >= 0);
      if (ok) {
        const mRef = db.collection('checkinMembers').doc(no), mS = await mRef.get();
        if (mS.exists && (mS.data().union || '') === un) {
          const m = mS.data();
          if (a.a === 'ok') await mRef.set({ invAt: today, invSnooze: FV.delete() }, { merge: true });
          if (a.a === 'wait') await mRef.set({ invSnooze: addDays(today, 14) }, { merge: true });
          if (a.a === 'quit') {
            await mRef.set({ active: false }, { merge: true });
            if (m.cardToken) await db.collection('cards').doc(m.cardToken).set({ active: false }, { merge: true }).catch(() => {});
          }
          let byName = '';
          try { const u = await db.collection('users').doc(a.by).get(); byName = (u.exists && u.data().name) || ''; } catch (e) {}
          log.push({ no, name: m.name || '', a: a.a, by: a.by, byName, day: today });
          done.add(no); n++;
        }
      }
      await d.ref.delete();
    }
    if (done.size) {
      const list = (inv.list || []).filter((x) => !done.has(x.no));
      await invRef.set({ log: log.slice(-40), list }, { merge: true });
    }
  }
  return n;
}

// ② 棚卸しの計算とお知らせ
async function weekly(db, today, send) {
  const from = addDays(today, -30), months = Array.from(new Set([today.slice(0, 7), from.slice(0, 7)]));
  // 直近1ヶ月の出席（全ユニオンまとめて読む）
  const evQs = await db.collection('checkinEvents').where('month', 'in', months).get();
  const lastAtt = {};   // ユニオン → 番号 → { d, why }
  for (const e of evQs.docs) {
    const ev = e.data() || {};
    if (!ev.date || ev.date < from || ev.date > today) continue;
    const aq = await e.ref.collection('attendance').get();
    aq.docs.forEach((a) => {
      const x = a.data() || {};
      if (x.status === 'pending' || x.status === 'rejected' || !x.union) return;
      const L = (lastAtt[x.union] = lastAtt[x.union] || {});
      if (!L[a.id] || ev.date > L[a.id].d) L[a.id] = { d: ev.date, why: '出席（' + (ev.name || '') + '）' };
    });
  }
  const unQs = await db.collection('checkinUnions').get();
  const digest = {};   // uid → [{ name, stage, union }]
  const adminSum = {}; // uid → [{ un, n, two }]（v169: 受付管理者・ユニオン管理者へのまとめ）
  let total = 0;
  for (const u of unQs.docs) {
    const un = u.id;
    const [mQs, usQs, invS] = await Promise.all([
      db.collection('checkinMembers').where('union', '==', un).get(),
      db.collection('users').where('union', '==', un).get(),
      db.collection('checkinInventory').doc(un).get()
    ]);
    const usersByName = {};
    usQs.docs.forEach((x) => { const d = x.data() || {}; if (d.status === 'disabled' || d.deleted) return; const k = normName(d.name); if (k) (usersByName[k] = usersByName[k] || []).push(x.id); });
    const prev = invS.exists ? invS.data() : {}, prevSent = prev.sent || {};
    const list = [], who = {}, sent = {};
    mQs.docs.forEach((d) => {
      const m = d.data() || {}; m.no = d.id;
      const att = (lastAtt[un] || {})[d.id];
      const st = stageOf(m, att, today);
      if (!st) return;
      const la = lastActOf(m, att), w = whoOf(m, usersByName);
      list.push({ no: m.no, name: m.name || '', group: m.group || '', trainee: !!m.trainee, stage: st, last: la || null });
      who[m.no] = w;
      sent[m.no] = Math.max(st, prevSent[m.no] || 0);
      if (st > (prevSent[m.no] || 0)) w.forEach((uid) => (digest[uid] = digest[uid] || []).push({ name: m.name || m.no, stage: st, union: un }));
    });
    list.sort((a, b) => ((a.last ? a.last.d : '') < (b.last ? b.last.d : '') ? -1 : 1));
    if (list.length) {
      const ud = u.data() || {}, two = list.filter((x) => x.stage === 2).length;
      new Set([].concat(ud.admins || [], ud.unionAdmins || [])).forEach((uid) => (adminSum[uid] = adminSum[uid] || []).push({ un, n: list.length, two }));
    }
    total += list.length;
    await db.collection('checkinInventory').doc(un).set({ union: un, day: today, at: Date.now(), list, who, sent, log: (prev.log || []).slice(-40) });
  }
  // スマホの通知（1人1通にまとめる。同じ tag なので、担当・UPルビーのお願いと管理者のまとめは1通に入れる）
  let pushed = 0;
  const sumText = (S) => S.map((x) => `${x.un}：${x.n}人` + (x.two ? `（28日以上 ${x.two}人）` : '')).join('・');
  const uids = Array.from(new Set(Object.keys(digest).concat(Object.keys(adminSum))));
  for (const uid of uids) {
    const L = digest[uid] || [], S = adminSum[uid] || [];
    let title, body;
    if (L.length) {
      const two = L.filter((x) => x.stage === 2).length;
      const names = L.slice(0, 3).map((x) => x.name).join('・') + (L.length > 3 ? ` ほか${L.length - 3}人` : '');
      title = `🧹 棚卸しのお願い（${L.length}人）`;
      body = `${names}：研修・出席が${two ? '28' : '14'}日以上ありません。続けているか教えてください（タップで回答）` + (S.length ? `\nユニオン全体の棚卸し… ${sumText(S)}` : '');
    } else {
      title = `🧹 今週の棚卸し（${S.reduce((a, x) => a + x.n, 0)}人）`;
      body = `${sumText(S)}。研修・出席が14日以上ない人です。タップして確かめてください（受付の名簿の「🧹 棚卸し」からも）`;
    }
    try { if (await send(uid, title, body)) pushed++; } catch (e) { console.log(`inventory push error uid=${uid}: ${e}`); }
  }
  return { unions: unQs.size, candidates: total, notified: Object.keys(digest).length, admins: Object.keys(adminSum).length, pushed };
}

// NAVIGATOR の通知の登録先（users/{uid}/fcmTokens）へ送る。タップで受付の棚卸しの回答ページを開く（sw.js の gm-inv）
function makeSend(admin, db) {
  return async (uid, title, body) => {
    const ts = await db.collection('users').doc(uid).collection('fcmTokens').get();
    const tokens = ts.docs.map((t) => t.id);
    if (!tokens.length) return false;
    const res = await admin.messaging().sendEachForMulticast({
      tokens,
      data: { title, body, url: LINK },
      webpush: {
        headers: { Urgency: 'normal', TTL: '86400' },
        notification: { title, body, icon: 'https://hktymc18.github.io/groove-map/checkin/icon-192.png', badge: 'https://hktymc18.github.io/groove-map/checkin/icon-192.png', tag: 'gm-inv' },
        fcmOptions: { link: LINK },
      },
    });
    return res.successCount > 0;
  };
}

async function doWeekly(admin, db, today, opt) {
  const w = await weekly(db, today, opt.send || makeSend(admin, db));
  await db.collection('appStats').doc('inventory').set({ lastDay: today, lastAt: Date.now(), force: false, last: w }, { merge: true });
  return w;
}
// 1日5回（overdueReminders）：回答の反映と、force の時だけ計算
async function run(admin, opt) {
  opt = opt || {};
  const db = admin.firestore(), today = ymd(jst(opt.now));
  const applied = await applyAnswers(db, today, admin.firestore.FieldValue);
  const flag = (await db.collection('appStats').doc('inventory').get()).data() || {};
  const w = flag.force === true ? await doWeekly(admin, db, today, opt) : null;
  console.log(`inventory: applied=${applied}` + (w ? ` weekly(force)=${JSON.stringify(w)}` : ''));
  return { applied, weekly: w };
}
// 5分ごと（sendReminders）：v170 毎週日曜11時台の最初の回だけ計算とお知らせ（ほかの時間は何も読まない）
async function weeklyTick(admin, opt) {
  opt = opt || {};
  const now = jst(opt.now);
  if (now.getUTCDay() !== 0 || now.getUTCHours() !== 11) return null;   // 日曜11時（日本時間）
  const db = admin.firestore(), today = ymd(now);
  const flag = (await db.collection('appStats').doc('inventory').get()).data() || {};
  if (flag.lastDay === today) return null;
  const w = await doWeekly(admin, db, today, opt);
  console.log(`inventory: weekly=${JSON.stringify(w)}`);
  return w;
}

module.exports = { run, weeklyTick, lastActOf, stageOf, whoOf, normName, D1, D2 };
