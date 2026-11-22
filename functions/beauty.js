/**
 * NAVIGATOR Beauty: ユーザー（お客さん）のスマホの通知（受付 v129）
 *   毎日20時（index.js の beautyDailyから）:
 *   thanks … 来場した日: 今日のイベントに受付したユーザー（出席の kind=user）に、来場のお礼を送る
 *   nudge … v172: 今日まだクエストをチェックしていない人に「今日まだ」（お礼・前日のお知らせを送った人には送らない）
 *            v173: まだの人には今日できたバディの名前、今日できた人には今日の投稿への👏の数
 *   dayEve … DAYの前日: 明日のイベントのうち「ユーザーのカードに次のDAYとして出す」（uDay）にしたものを、
 *            そのユニオンで通知を受け取っているユーザーに知らせる
 *   v146: 前日のお知らせに、その人の体感（カードの exp_{イベント}：メニュー・担当・順番）を入れる
 *   cleanup … DAY のあと30日たった参加申し込み（ckReq・ckReqProof・紹介者の印）と、担当の会員証の事前情報（btp_）を消す
 * 送り先は ckPush/{ユーザーのID} = { card, union, t, on }（カードの「通知を受け取る」で本人が登録）。
 * 届かなくなった宛先は on=false にする。firebase-admin はここでは読み込まない（テストで、にせの db・messaging を渡せるように）
 */
const CARD = 'https://hktymc18.github.io/groove-map/checkin/index.html#c=';
const ICON = 'https://hktymc18.github.io/groove-map/checkin/icon-192.png';

// 日本時間の日付（YYYY-MM-DD）。add は日数
function jstYmd(ms, add) {
  return new Date(ms + 9 * 3600000 + (add || 0) * 86400000).toISOString().slice(0, 10);
}

// subs: [{ id, ref, d }]（d = ckPush の中身）。1人ずつ自分のカードを開くリンクで送る（500件ずつ）
async function sendTo(messaging, subs, title, body, tag, extra) {
  let ok = 0, ng = 0;
  for (let i = 0; i < subs.length; i += 500) {
    const part = subs.slice(i, i + 500);
    const msgs = part.map((s) => ({
      token: s.d.t,
      data: Object.assign({ title, body, url: CARD + s.d.card, tag }, extra || {}),
      webpush: {
        headers: { Urgency: 'high', TTL: '21600' },
        notification: { title, body, icon: ICON, badge: ICON, tag },
        fcmOptions: { link: CARD + s.d.card },
      },
    }));
    const res = await messaging.sendEach(msgs);
    res.responses.forEach((r, j) => {
      if (r.success) { ok++; return; }
      ng++;
      const code = String((r.error && (r.error.code || r.error)) || '');
      if (code.includes('registration-token-not-registered') || code.includes('invalid-argument')) {
        part[j].ref.set({ on: false }, { merge: true }).catch(() => {});
      }
    });
  }
  return { ok, ng };
}

function subOk(s) { return s && s.d && s.d.on === true && typeof s.d.t === 'string' && s.d.t && typeof s.d.card === 'string' && s.d.card.length === 32; }

async function dayEve(db, messaging, now, sentIds) {
  const tomorrow = jstYmd(now, 1);
  const evs = await db.collection('checkinEvents').where('date', '==', tomorrow).get();
  const out = { date: tomorrow, events: 0, sent: 0, ng: 0 };
  for (const e of evs.docs) {
    const ev = e.data() || {};
    if (ev.uDay !== true) continue;
    out.events++;
    const seen = {}, subs = [];
    for (const un of (ev.unions || [])) {
      const qs = await db.collection('ckPush').where('union', '==', un).where('on', '==', true).get();
      qs.docs.forEach((d) => { const s = { id: d.id, ref: d.ref, d: d.data() || {} }; if (!seen[d.id] && subOk(s)) { seen[d.id] = 1; subs.push(s); } });
    }
    if (!subs.length) continue;
    const title = '明日は' + String(ev.name || 'DAY') + 'です';
    const base = (ev.uInfo ? String(ev.uInfo) + '。' : '') + 'カードを開いて、受付で見せてください。';
    // 体感がある人は、メニュー・担当・順番を入れる（同じ文の人ごとにまとめて送る）
    const byBody = {};
    for (const s of subs) {
      let line = '';
      try {
        const cs = await db.collection('cards').doc(s.d.card).get();
        const x = cs.exists ? (cs.data() || {})['exp_' + e.id] : null;
        if (x && x.menu && x.st !== 'absent') line = '体感：' + x.menu + (x.staff ? '（担当 ' + x.staff + (x.ord ? '・' + x.ord + '番目' : '') + '）' : '') + '。';
      } catch (er) { line = ''; }
      const body = (line + base).slice(0, 120);
      (byBody[body] = byBody[body] || []).push(s);
    }
    for (const body of Object.keys(byBody)) {
      const r = await sendTo(messaging, byBody[body], title.slice(0, 60), body, 'nb-eve-' + e.id);
      if (sentIds) byBody[body].forEach((x) => { sentIds[x.id] = 1; });
      out.sent += r.ok; out.ng += r.ng;
    }
  }
  return out;
}

async function thanks(db, messaging, now, sentIds) {
  const today = jstYmd(now, 0);
  const evs = await db.collection('checkinEvents').where('date', '==', today).get();
  const uids = {};
  for (const e of evs.docs) {
    const qs = await e.ref.collection('attendance').where('kind', '==', 'user').get();
    qs.docs.forEach((a) => { uids[a.id] = 1; });
  }
  const subs = [];
  for (const uid of Object.keys(uids)) {
    const s = await db.collection('ckPush').doc(uid).get();
    const x = { id: uid, ref: s.ref, d: s.exists ? (s.data() || {}) : null };
    if (subOk(x)) subs.push(x);
  }
  const out = { date: today, users: Object.keys(uids).length, sent: 0, ng: 0 };
  if (!subs.length) return out;
  const r = await sendTo(messaging, subs, 'ご来場ありがとうございました', '今日の記録が、カードに届いています。', 'nb-thanks-' + today);
  if (sentIds) subs.forEach((x) => { sentIds[x.id] = 1; });
  out.sent = r.ok; out.ng = r.ng;
  return out;
}

// v172: 「今日まだ」。マイプランを始めていて、今日まだチェックしていない人だけ。
//   やめてしまった人にずっと送らないように、最後にチェックした日（無ければ始めた日）から14日までの人だけ。
//   同じ夜にお礼・前日のお知らせを送った人（skip）には送らない（1晩に1通まで）
// v173: 人からの反応を入れる（新しい定時の実行は増やさない）
//   ・まだの人：バディ（cards/{t}/buddy/me のリスト → ckBuddy/{k}.td）で今日できた人がいれば「バディの○○さんは今日できたよ」
//   ・今日できた人：自分の投稿（cards/{t}/lounge）に今日 👏 が付いていれば「あなたの投稿に👏が○こ届いたよ」（無ければ送らない）
async function nudge(db, messaging, now, skip) {
  const today = jstYmd(now, 0), from = jstYmd(now, -14);
  const t0 = Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10)) - 9 * 3600000;   // 日本時間の今日の0時
  const ms = (a) => (a && a.toMillis ? a.toMillis() : +a || 0);
  const qs = await db.collection('ckPush').where('on', '==', true).get();
  const byBody = {}, out = { date: today, subs: 0, sent: 0, ng: 0, buddy: 0, clap: 0 };
  const add = (body, tag, s) => { const k = tag + '|' + body; (byBody[k] = byBody[k] || { body, tag, subs: [] }).subs.push(s); };
  for (const d of qs.docs) {
    const s = { id: d.id, ref: d.ref, d: d.data() || {} };
    if (!subOk(s) || (skip && skip[d.id])) continue;
    out.subs++;
    const card = db.collection('cards').doc(s.d.card);
    const p = await card.collection('plan').doc('me').get();
    const pl = p.exists ? (p.data() || {}) : null;
    if (!pl || !pl.course) continue;
    const days = pl.days || {};
    if ((days[today] || []).length) {
      // 今日できた人：今日の 👏
      let n = 0;
      try {
        const mine = await card.collection('lounge').get();
        for (const m of mine.docs.slice(0, 10)) {
          const cs = await db.collection('ckLounge').doc(m.id).collection('clap').get();
          cs.docs.forEach((c) => { if (ms((c.data() || {}).at) >= t0) n++; });
        }
      } catch (e) { n = 0; }
      if (n) { add('今日もできたね！あなたの投稿に👏が' + n + 'こ届いたよ', 'nb-clap-' + today, s); out.clap++; }
      continue;
    }
    let last = String(pl.start || '');
    Object.keys(days).forEach((k) => { if ((days[k] || []).length && k > last) last = k; });
    if (!last || last < from) continue;
    // まだの人：今日できたバディ
    const names = [];
    try {
      const bm = await card.collection('buddy').doc('me').get();
      for (const b of ((bm.exists && (bm.data() || {}).list) || []).slice(0, 20)) {
        const x = await db.collection('ckBuddy').doc(String(b.k || '_')).get();
        const xd = x.exists ? (x.data() || {}) : {};
        if (xd.td === today) names.push(String(xd.n || b.n || '').trim().split(/\s+/).pop());
      }
    } catch (e) { names.length = 0; }
    if (names.length) {
      add('バディの' + names.slice(0, 2).join('さん・') + 'さん' + (names.length > 2 ? 'ほか' + (names.length - 2) + '人' : '') + 'は今日できたよ。あなたも1つやってみよう', 'nb-nudge-' + today, s);
      out.buddy++;
    } else add('今日のクエスト、まだだよ。1つだけでもチェックしよう', 'nb-nudge-' + today, s);
  }
  for (const k of Object.keys(byBody)) {
    const g = byBody[k];
    const r = await sendTo(messaging, g.subs, 'NAVIGATOR Beauty', g.body.slice(0, 120), g.tag, g.tag.indexOf('nb-nudge') === 0 ? { badge: '1' } : {});
    out.sent += r.ok; out.ng += r.ng;
  }
  return out;
}

// DAY のあと30日たった参加申し込みと事前情報を消す（del = FieldValue.delete() を渡す）
async function cleanup(db, now, del) {
  const cut = jstYmd(now, -30), from = jstYmd(now, -40), out = { reqs: 0, cards: 0 };
  const qs = await db.collection('ckReq').where('date', '<', cut).limit(300).get();
  for (const d of qs.docs) {
    const pf = await db.collection('ckReqProof').doc(d.id).get();
    const tk = pf.exists ? (pf.data() || {}).tk : '';
    if (tk) await db.collection('cards').doc(tk).collection('dreq').doc(d.id).delete().catch(() => {});
    await pf.ref.delete().catch(() => {});
    await d.ref.delete();
    out.reqs++;
  }
  // 担当の会員証の事前情報（btp_{イベント}）
  const evs = await db.collection('checkinEvents').where('date', '>=', from).where('date', '<', cut).get();
  for (const e of evs.docs) {
    const bs = await e.ref.collection('btDay').get();
    for (const b of bs.docs) {
      for (const s of ((b.data() || {}).staff || [])) {
        const m = await db.collection('checkinMembers').doc(String(s.no || '_')).get();
        const tk = m.exists ? (m.data() || {}).cardToken : '';
        if (!tk) continue;
        await db.collection('cards').doc(tk).update({ ['btp_' + e.id]: del }).then(() => { out.cards++; }, () => {});
      }
    }
  }
  return out;
}

module.exports = { jstYmd, dayEve, thanks, nudge, cleanup, CARD };
