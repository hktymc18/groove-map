/**
 * NAVIGATOR Beauty: ユーザー（お客さん）のスマホの通知（受付 v129）
 *   毎日20時（index.js の beautyDailyから）:
 *   thanks … 来場した日: 今日のイベントに受付したユーザー（出席の kind=user）に、来場のお礼を送る
 *   dayEve … DAYの前日: 明日のイベントのうち「ユーザーのカードに次のDAYとして出す」（uDay）にしたものを、
 *            そのユニオンで通知を受け取っているユーザーに知らせる
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
async function sendTo(messaging, subs, title, body, tag) {
  let ok = 0, ng = 0;
  for (let i = 0; i < subs.length; i += 500) {
    const part = subs.slice(i, i + 500);
    const msgs = part.map((s) => ({
      token: s.d.t,
      data: { title, body, url: CARD + s.d.card, tag },
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

async function dayEve(db, messaging, now) {
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
    const body = (ev.uInfo ? String(ev.uInfo) + '。' : '') + 'カードを開いて、受付で見せてください。';
    const r = await sendTo(messaging, subs, title.slice(0, 60), body.slice(0, 120), 'nb-eve-' + e.id);
    out.sent += r.ok; out.ng += r.ng;
  }
  return out;
}

async function thanks(db, messaging, now) {
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
  out.sent = r.ok; out.ng = r.ng;
  return out;
}

module.exports = { jstYmd, dayEve, thanks, CARD };
