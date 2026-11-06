// 受付 v125：DLR予約の候補に、全角・半角の混ざった名前（「P＆P① P＆P②」など）のイベントも出す
const fs = require('fs'), path = require('path');
const H = fs.readFileSync(path.join(__dirname, '../../../checkin/index.html'), 'utf8');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const m = /  function isDlrEvent\(name\)\{ return (\/.+\/i)\.test\(String\(name \|\| ''\)\); \}/.exec(H);
c('判定の式がある', !!m);
const re = eval(m[1]);
for (const n of ['DLR', 'DLR①②', 'DLR1/DLR2', 'P&P', 'SL① P&P', 'P＆P① P＆P②', 'Ｐ＆Ｐ', 'ＤＬＲ', 'P & P', 'P&P／DUP', 'dlr']) c('拾う: ' + n, re.test(n));
for (const n of ['SEED', 'T＆T① T＆T②', 'FT BT', 'DAY', 'TEAM RIDE', 'PG', 'PA']) c('拾わない: ' + n, !re.test(n));
c('APP_VER v125以降・v125のお知らせ', (+(H.match(/var APP_VER = 'v(\d+)';/) || [0, 0])[1]) >= 125 && /\n  \{ v: 'v125', d: '2026\/11\/06'/.test(H));
console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
