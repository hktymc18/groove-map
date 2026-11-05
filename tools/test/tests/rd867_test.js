// v867：読み取りを減らす（第2弾）。分析の推移の「先月より前の月」は端末の控えから／共有のアップ判定の全員の名前は3日覚える（判定の項目だけ）／
//   結合したメンバーの予定は直近の分だけ／ログイン時の連鎖共有の配布は1日1回（架空データ）
const T = require('../lib/head.js')();
const { w, c, sleep } = T;
T.run(async () => {
  T.login();
  const log = [];
  w.db.doc = p => ({ get: o => { log.push((o && o.source === 'cache' ? 'cache:' : 'server:') + p); return Promise.resolve({ exists: true, data: () => ({ members: [{ id: 'a' }] }) }); }, set: () => Promise.resolve() });
  w.state.currentMonth = '2026.10';
  const old = w.addMonths('2026.10', -3), last = w.addMonths('2026.10', -1);
  await w._fsGetPast('maps/U/months/' + old + '_current', old);
  c('先月より前の月は端末の控えから読む', log[0] === 'cache:maps/U/months/' + old + '_current', log.join(' | '));
  log.length = 0;
  w.db.doc = p => ({ get: o => { log.push((o && o.source === 'cache' ? 'cache:' : 'server:') + p); return o && o.source === 'cache' ? Promise.reject(new Error('not in cache')) : Promise.resolve({ exists: true, data: () => ({}) }); } });
  await w._fsGetPast('maps/U/months/' + old + '_current', old);
  c('控えに無ければサーバーから', log.join('|') === 'cache:maps/U/months/' + old + '_current|server:maps/U/months/' + old + '_current', log.join(' | '));
  log.length = 0;
  await w._fsGetPast('maps/U/months/' + last + '_current', last);
  c('先月・今月はいつもどおりサーバーから（変わることがあるため）', log.length === 1 && /^server:/.test(log[0]), log.join(' | '));
  // 全員の名前（アップ判定）
  let colReads = 0;
  const qsL = L => L;
  w.fsGetCol = p => { if (p === 'users') colReads++; return Promise.resolve([{ id: 'u1', name: '架空 一郎', email: 'x@example.com', referrer: '架空 二郎', upRuby: '', upBd: '', phone: '000' }]); };
  w.localStorage.removeItem('gm_shUsers'); w._shUsers = null;
  await w._shLoadUsers(); w._shUsers = null; await w._shLoadUsers();
  c('アップ判定の全員の名前は端末に3日覚える（開き直しても読まない）', colReads === 1);
  const st = JSON.parse(w.localStorage.getItem('gm_shUsers'));
  c('覚えるのは判定に使う項目だけ（メール・電話は覚えない）', st.L[0].name === '架空 一郎' && st.L[0].referrer === '架空 二郎' && !('email' in st.L[0]) && !('phone' in st.L[0]));
  await w._shLoadUsers(true);
  c('force の時は読み直す', colReads === 2);
  const H = require('fs').readFileSync(require('path').join(__dirname, '../../../app.js'), 'utf8');
  c('結合したメンバーの予定は直近の分だけ（全部は読まない）', /_evFetchRecent\(p\.uid\)\.then\(function\(list\) \{ c\.list = list/.test(H) && !/fsGetCol\('maps\/' \+ p\.uid \+ '\/events'\)/.test(H));
  c('ログイン時の連鎖共有の配布は1日1回', /var _pk = 'gm_pds_' \+ currentUser\.uid; if \(localStorage\.getItem\(_pk\) !== evTodayYmd\(\)\)/.test(H));
  c('分析の推移の読み込みは _fsGetPast を通す（3か所）', (H.match(/_fsGetPast\('maps\/' \+ uid \+ '\/(months|stats)\//g) || []).length === 4);
});
