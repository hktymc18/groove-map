/**
 * 📊 v885: Firestore 全体の回数（読み取り・書き込み・削除）を、日本時間の1日ごとに Cloud Monitoring から取り、
 *   appStats/usage（オーナーだけが読める）に書く。NAVIGATOR のアカウント管理「📊 利用状況」で見る（ブラウザからは Monitoring を読めないため）
 *   動かす: v886〜 overdueReminders（1日5回: 9・12・15・18・21時）の最後に run() を呼ぶ（v885 の usageStats は、新しい関数を作る時の権限で作れなかったため）。
 *   関数の実行用のサービスアカウントに「モニタリング閲覧者」の権限が要る（無い時は appStats/usage.err に理由を書く）
 */
const DAY = 86400000, JST = 9 * 3600000;
const jstDay = (ms) => new Date(ms + JST).toISOString().slice(0, 10);
// Monitoring の timeSeries（1日ごとの合計）を { 'YYYY-MM-DD': 回数 } に
function toDays(json) {
  const out = {};
  ((json && json.timeSeries) || []).forEach((ts) => (ts.points || []).forEach((p) => {
    const k = jstDay(Date.parse(p.interval.endTime) - 1);
    out[k] = (out[k] || 0) + (+(p.value && (p.value.int64Value || p.value.doubleValue)) || 0);
  }));
  return out;
}
function queryUrl(project, type, now) {
  const today0 = Math.floor((now + JST) / DAY) * DAY - JST, end = today0 + DAY, start = end - 8 * DAY;
  const q = new URLSearchParams({
    filter: 'metric.type="firestore.googleapis.com/document/' + type + '"',
    'interval.startTime': new Date(start).toISOString(), 'interval.endTime': new Date(end).toISOString(),
    'aggregation.alignmentPeriod': '86400s', 'aggregation.perSeriesAligner': 'ALIGN_SUM', 'aggregation.crossSeriesReducer': 'REDUCE_SUM',
  });
  return 'https://monitoring.googleapis.com/v3/projects/' + project + '/timeSeries?' + q;
}
// 直近8日を1日ごとに [{ d, r, w, x }]（古い順）
function merge(R, W, X) {
  const keys = Array.from(new Set([].concat(Object.keys(R), Object.keys(W), Object.keys(X)))).sort();
  return keys.map((d) => ({ d, r: R[d] || 0, w: W[d] || 0, x: X[d] || 0 }));
}
async function collect(admin, now) {
  const project = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || admin.app().options.projectId;
  const tok = (await admin.credential.applicationDefault().getAccessToken()).access_token;
  const get = async (type) => {
    const r = await fetch(queryUrl(project, type, now), { headers: { Authorization: 'Bearer ' + tok } });
    const t = await r.text();
    if (!r.ok) throw new Error('monitoring ' + r.status + ' ' + t.slice(0, 200));
    return toDays(JSON.parse(t || '{}'));
  };
  const [R, W, X] = await Promise.all([get('read_count'), get('write_count'), get('delete_count')]);
  return merge(R, W, X);
}
async function run(admin) {
  const db = admin.firestore(), ref = db.collection('appStats').doc('usage'), now = Date.now();
  try {
    const days = await collect(admin, now);
    await ref.set({ days, at: new Date(now).toISOString(), err: '' });
    console.log('usageStats: ' + days.map((x) => x.d.slice(5) + ' r=' + x.r).join(' '));
  } catch (e) {
    console.log('usageStats error: ' + e.message);
    await ref.set({ at: new Date(now).toISOString(), err: String(e.message || e).slice(0, 300) }, { merge: true });
  }
}
module.exports = { toDays, queryUrl, merge, run, jstDay };
