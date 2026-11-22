// v905：カレンダーの土曜（ライトは濃いターコイズ）・「今日」ボタン（白いボタン）・今日の日付（チャコールの丸）
const T = require('../lib/head.js')();
const { c } = T;
const fs = require('fs'), path = require('path');
T.run(async () => {
  const html = fs.readFileSync(path.join(__dirname, '../../../index.html'), 'utf8');
  c('土曜はライトで #1C9586（見出し・日付・週の見出し）', /body\.light \.ev-cal-weekdays \.ev-sat,body\.light \.ev-cell-num\.sat,body\.light \.wkv-days span\.sat\{color:#1C9586!important\}/.test(html));
  c('「今日」ボタンは白いボタンにチャコールの字', /body \.cv-td,body \.pcv-td,body #evCalendar\.full \.ev-cal-today\{color:var\(--text\)!important;border:1px solid var\(--border\)!important;background:var\(--surface\)!important/.test(html));
  c('今日の日付はチャコールの丸', /body \.ev-cell\.today \.ev-cell-num,body \.ev-cell\.today \.ev-cell-num\.m1\{background:var\(--nv-ink\)!important;color:var\(--nv-sel-ink\)!important\}/.test(html));
});
