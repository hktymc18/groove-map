// 読み込みの確認（土台が動くか）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $$ } = T;
T.run(async () => {
  c('state あり', !!w.state && typeof w.renderCalendar === 'function');
  T.login();
  setWH(390, 844); w.switchView('events'); w.setEventsMode('calendar'); await sleep(50);
  c('カレンダーが描ける', $$('#evCalGrid .ev-cell').length >= 28);
  c('今日は10/14（時計の固定）', w.evTodayYmd() === '2026-10-14', w.evTodayYmd());
  const v = require('fs').readFileSync(__dirname + '/../../../sw.js', 'utf8').match(/CACHE = 'groove-map-(v\d+)'/)[1];
  c('バージョンがそろっている（app.js・index.html・sw.js）', w.APP_JS_VERSION === v && w.GM_EXPECT_JS === v, w.APP_JS_VERSION + '/' + v);
  const n = require('fs').readFileSync(__dirname + '/../../../sw.js', 'utf8').split('/checkin').length - 1;
  c('sw.js の /checkin 除外が残っている', n >= 2, n);
});
