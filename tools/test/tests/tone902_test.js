// v902：前の色（ミント・スカイ・紫・オレンジ）が残っていた所を新しいトーンに。名前の色分け（男女）は残す
const T = require('../lib/head.js')();
const { w, c, sleep, $ } = T;
const fs = require('fs'), path = require('path');
T.run(async () => {
  const app = fs.readFileSync(path.join(__dirname, '../../../app.js'), 'utf8');
  T.login(); w.setTheme('light'); await sleep(20);
  c('審査中の色はイエロー・研修生はターコイズ・BR以上はバイオレット', w.titleRingColor('Q2') === '#B3BF30' && w.titleRingColor('PG') === '#26C7B3' && w.titleRingColor('BR') === '#602BFC');
  c('タイトルの札もMAPと同じ色（審査中＝--nvt-ex）', /var\(--nvt-ex\)/.test(w.titleAvatarStyle('Q3')) && /var\(--nvt-br\)/.test(w.titleAvatarStyle('ゴールド')));
  w._mxCss && w._mxCss(); const mx = w.document.getElementById('mxCss');
  c('ライトでMAPの区分の色を前の色で上書きしない', !mx || !/--mxex:#EE5F1B/.test(mx.textContent));
  c('系列の色は4色（ツリー・表）', w.PC_FAMILY_COLORS === w.NV_LINE && w.FAMILY_COLORS === w.NV_LINE);
  c('シミュレーションの月の色は新しいトーン', w.P2_SIM_COL.join() === '#9B999A,#26C7B3,#B095FE,#B3BF30,#602BFC');
  c('稼働構成は S＝ターコイズ・A＝うすいターコイズ・B＝灰', w.DT_ACT_COLORS.S === '#26C7B3' && w.DT_ACT_COLORS.A === '#92E3D9' && w.DT_ACT_COLORS.B === '#B5B3AE');
  c('ANALYTICSの線の色に前のミント・紫が無く、10色すべて別', !w.DT_LN_COLS.some(x => /^#(2CE5B8|8B7CFF|5AD7FF|FFB454)$/i.test(x)) && new Set(w.DT_LN_COLS).size === w.DT_LN_COLS.length, w.DT_LN_COLS.join());
  c('メニューのタイル（スカイ・ローズ）も新しいトーン', /\.ux-c-rose\{--c:var\(--purple\)\}/.test(app) && /\.ux-c-sky\{--c:var\(--green\)\}/.test(app));
  c('アイコンの色指定に前の色が無い（color:#5AD7FF・#8B7CFF・#2CE5B8）', !/(?:^|[^\w-])color:#(5AD7FF|8B7CFF|2CE5B8)\b/i.test(app));
  c('名前の男女の色分けは残す', /span\.female|\.female\{/.test(app + fs.readFileSync(path.join(__dirname, '../../../index.html'), 'utf8')));
});
