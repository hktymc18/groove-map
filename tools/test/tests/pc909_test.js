// v909：PC の選んだ印・押すボタン・タブの下線・計画シートの達成度のカード・下のページの印
const T = require('../lib/head.js')();
const { c } = T;
const fs = require('fs'), path = require('path');
T.run(async () => {
  const html = fs.readFileSync(path.join(__dirname, '../../../index.html'), 'utf8');
  c('PC の選んだ印はチャコール（ビジネス｜ユーザー・編集｜サマリー・左右｜上下・今月｜来月・ToDo の左）', /body \.umseg-pc \.pt-ms\.active,body \.sm-seg span\.on,body \.st-h \.lay span\.on,body \.pcx-b\.on,body \.pcts-row\.sel\{background:var\(--nv-ink\)!important/.test(html));
  c('PC の押すボタンはイエロー（ToDo の＋・OL の企画）', /body \.ev-cal-nav\[onclick\^="openTaskQuickSheet"\],body \.olt-new,body \.pcx-b\.p\{background:#EFFF40!important/.test(html));
  c('タブの下線はチャコール', /body \.pcx2-tabs span\.on\{border-bottom-color:var\(--nv-ink\)!important\}/.test(html) && /body \.px3-tabs span\.on\{border-color:var\(--nv-ink\)!important\}/.test(html));
  c('達成度のカードは濃いターコイズ（全部達成の金はそのまま）', /body \.s3-cd:not\(\.gold\)\{background:linear-gradient\(155deg,#1C9586 0%,#167A6E 50%,#115A51 100%\)!important\}/.test(html));
  c('下のページの印はチャコール', /body \.ux-dots \.on i\{background:var\(--nv-ink\)!important\}/.test(html));
});
