// v903：計画シート・カレンダーもトーン表に（予定の色は本人が決めるので変えない）
const T = require('../lib/head.js')();
const { c } = T;
const fs = require('fs'), path = require('path');
T.run(async () => {
  const html = fs.readFileSync(path.join(__dirname, '../../../index.html'), 'utf8');
  c('計画シートの色（見出し＝バイオレット・リンク＝ターコイズ・届かない＝金・届いた＝ターコイズ・赤）', /body \.s3\{--pk:var\(--purple\);--ok:var\(--green\);--md:var\(--green\);--lo:var\(--gold\);--ng:var\(--red\)\}/.test(html));
  c('計画シートの上の切り替えは、選んだ方がチャコール', /body \.s3-tb span\.on\{background:var\(--nv-ink\)!important;color:var\(--nv-sel-ink\)!important/.test(html));
  c('達成度のカードはターコイズ（紺を使わない）', /body \.s3-cd\{background:linear-gradient\(155deg,#26C7B3 0%,#1C9586 55%,#115A51 100%\)/.test(html));
  c('カレンダーの「＋ 予定」はイエローの地にチャコールの字', /body \.cv-add\{background:#EFFF40!important;color:#373334!important/.test(html));
  c('カレンダーの月・週・日・ToDo は、選んだ方がチャコール', /body \.cv-seg span\.on\{background:var\(--nv-ink\)!important;color:var\(--nv-sel-ink\)!important\}/.test(html));
});
