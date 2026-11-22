// v904：ユーザー台帳のアプリの活動の連続日数を、受付のアプリと同じ数え方にする（1日だけ空いた日は、その週に1回まで「おやすみ券」でつなぐ）。架空データ
const T = require('../lib/head.js')();
const { w, c } = T;
const pad = n => (n < 10 ? '0' : '') + n, ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
T.run(async () => {
  T.login();
  const day = n => { const d = new w.Date(); d.setDate(d.getDate() + n); return ymd(d); };
  const A = (ns) => { const days = {}; ns.forEach(n => { days[day(n)] = ['x']; }); return w._umActOf({ course: 'diet', start: day(-30), days }); };
  c('今日まだ・昨日が空いた → 昨日をおやすみにして2日（一昨日・その前）', A([-2, -3]).st === 2, JSON.stringify(A([-2, -3])));
  c('2日続けて空いた → 0日', A([-3, -4]).st === 0);
  c('毎日なら今までどおり（今日を入れて3日）', A([0, -1, -2]).st === 3);
  c('APP_JS_VERSION v904 以上', +(/APP_JS_VERSION = 'v(\d+)'/.exec(require('fs').readFileSync(require('path').join(__dirname, '../../../app.js'), 'utf8')) || [0, 0])[1] >= 904);
});
