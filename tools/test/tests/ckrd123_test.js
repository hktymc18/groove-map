// 受付 v123：読み取りを減らす（第2弾）。月のイベントは1分・出席は2分使い回す（受付を終了・再開したイベントは読み直す）／
//   稼働率の確かめは端末ごとに1日1回／会計はイベント一覧の結果を使い回す／面談シートのお知らせは5分に1回
const fs = require('fs'), path = require('path');
const H = fs.readFileSync(path.join(__dirname, '../../../checkin/index.html'), 'utf8');
const { JSDOM } = require(path.join(__dirname, '../node_modules/jsdom'));
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const slice = (a, b) => { const i = H.indexOf(a), j = H.indexOf(b, i); if (i < 0 || j < 0) throw new Error('slice ' + a); return H.slice(i, j); };
(async () => {
  const W = new JSDOM('', { runScripts: 'outside-only' }).window;
  W.eval('var reads = []; var db = { collection: function(c){ var q = { _p: c, where: function(f, op, v){ q._p += "?" + f + "=" + v; return q; }, doc: function(id){ return { collection: function(s){ q._p += "/" + id + "/" + s; return q; } }; }, get: function(){ reads.push(q._p); return Promise.resolve({ forEach: function(){} }); } }; return q; } };');
  W.eval(slice('var gMonthEvCache = {}, gAttCache = {};', 'function ckRefreshRecentSnapshot(union){'));
  await W.ckMonthEvents('2026-11'); await W.ckMonthEvents('2026-11');
  c('同じ月のイベントは1分のあいだ1回だけ読む', W.reads.filter(r => /month=2026-11/.test(r)).length === 1, W.reads.join(' | '));
  await W.ckMonthEvents('2026-11', true);
  c('fresh（イベント一覧）の時はサーバーから読み直す', W.reads.filter(r => /month=2026-11/.test(r)).length === 2);
  await W.ckAttOf('E1', 'UA'); await W.ckAttOf('E1', 'UA'); await W.ckAttOf('E1', 'UB');
  c('同じイベント・同じユニオンの出席は2分のあいだ1回だけ（ユニオンが違えば別）', W.reads.filter(r => /E1\/attendance/.test(r)).length === 2, W.reads.join(' | '));
  W.ckAttForget('E1'); await W.ckAttOf('E1', 'UA');
  c('受付を終了・再開したイベントの出席は読み直す', W.reads.filter(r => /E1\/attendance\?union=UA/.test(r)).length === 2);
  W.gMonthEvCache['2026-11'].at = Date.now() - 61000; await W.ckMonthEvents('2026-11');
  c('1分たったら読み直す', W.reads.filter(r => /month=2026-11/.test(r)).length === 3);
  c('受付終了の作り直しは、そのイベントの出席と月のイベントを読み直してから', /ckAttForget\(ev\.id\); ckMonthForget\(\);/.test(H));
  c('今月・直近1ヶ月の作り直しは同じ読み方（使い回し）を使う', (H.match(/return ckAttOf\(ev\.id, union\)\.then/g) || []).length === 2 && /keys\.map\(function\(k\)\{ return ckMonthEvents\(k\); \}\)/.test(H) && /return ckMonthEvents\(key\)\.then\(function\(qs\)\{\n    var evs = \[\];/.test(H));
  c('稼働率の確かめは端末ごとに1日1回', /var gk = 'bci_rf_' \+ union;\n  try\{ if\(localStorage\.getItem\(gk\) === todayStr\(\)\) return;/.test(H));
  c('集計タブ：再集計ボタンは全部読み直す・ふだんは使い回す', /\$\('btnStatReload'\)\.onclick = function\(\)\{ loadStatsNow\(true\); \};/.test(H) && /if\(fresh\)\{ ckMonthForget\(key\); gAttCache = \{\}; \}/.test(H) && /return ckAttOf\(ev\.id, gStatUnion\)\.then/.test(H));
  c('イベント一覧は毎回サーバーから・会計はその結果を使い回す', /ckMonthEvents\(key, true\)\.then\(function\(qs\)\{   \/\/ v123: イベント一覧/.test(H) && /ckMonthEvents\(key\)\.then\(function\(qs\)\{   \/\/ v123: イベント一覧で読んだ結果を1分使い回す/.test(H));
  c('面談シートのお知らせ：名簿を読み直すたびではなく5分に1回（承認の後などは今までどおり）', /coOverdueLoad\(true\);/.test(H) && /if\(lazy && gCoOverAt\[un\] && Date\.now\(\) - gCoOverAt\[un\] < 300000\) return;/.test(H));
  c('APP_VER v123以降・v123のお知らせ', (+(H.match(/var APP_VER = 'v(\d+)';/) || [0, 0])[1]) >= 123 && /\n  \{ v: 'v123', d: '2026\/11\/05'/.test(H));
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
