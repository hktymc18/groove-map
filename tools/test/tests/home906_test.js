// v906：HOME もトーン表に（CALENDAR のタイルはチャコール・下のボタンは端が半円・「次はここ」はイエロー）
const T = require('../lib/head.js')();
const { w, c, sleep, $ } = T;
const fs = require('fs'), path = require('path');
T.run(async () => {
  const html = fs.readFileSync(path.join(__dirname, '../../../index.html'), 'utf8');
  T.login(); w.switchView('menu'); await sleep(80);
  const cal = [...w.document.querySelectorAll('.ux-t')].find(e => /CALENDAR/.test(e.textContent));
  c('CALENDAR のタイルはチャコール（ux-c-ink）', !!cal && cal.classList.contains('ux-c-ink'), cal && cal.className);
  c('チャコールの色の指定がある', /body \.ux-c-ink,body \.pcx-t\.ux-c-ink\{--c:var\(--nv-ink\)\}/.test(html));
  c('下のボタンは端が半円', /body \.ux-sb\{border-radius:999px!important\}/.test(html));
  c('「次はここ」はイエローの地にチャコールの字', /body \.ux-t\.next \.bd,body \.pcx-t \.bd\.nx\{background:#EFFF40!important;color:#373334!important\}/.test(html));
});
