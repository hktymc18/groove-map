// v907：選んだ札（ToDo の絞り込み・PLAN の選択肢・データのかんたん表示・メンバー選び）はチャコールの地に白い字
const T = require('../lib/head.js')();
const { c } = T;
const fs = require('fs'), path = require('path');
T.run(async () => {
  const html = fs.readFileSync(path.join(__dirname, '../../../index.html'), 'utf8');
  c('選んだ札はチャコール（--nv-ink）の地に --nv-sel-ink の字', /body \.td-fchip\.sel,body \.ux-chips \.on,body \.dtez-chips span\.on,body \.ms-pchip\.on\{background:var\(--nv-ink\)!important;border-color:var\(--nv-ink\)!important;color:var\(--nv-sel-ink\)!important\}/.test(html));
});
