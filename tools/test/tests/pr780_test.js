// v780（#8）：計画シートの印刷 — 紙がA3より小さい時は全体を縮めて1枚に（右の行動の欄が切れない）・空の欄も線の長さをそろえる
const T = require('../lib/head.js')();
const { w, c, sleep } = T;
T.run(async () => {
  T.login(); w.switchView('plan'); await sleep(40);
  const html = w._p2ShPrintHtml(w._p2Ym(0));
  const css = (html.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || '';
  c('A3横はそのまま（縮めない）', /@page\{size:A3 landscape/.test(css) && /max-width:403mm/.test(css) && !/max-width:40[4-9]mm/.test(css));
  c('A4横（幅281mm）は0.65倍', /@media print and \(max-width:281mm\),print and \(max-height:194mm\)\{\.pg\{zoom:0\.65\}\}/.test(css));
  c('A4縦（幅194mm）まで縮める段がある', /\{\.pg\{zoom:0\.45\}\}/.test(css) && /\{\.pg\{zoom:0\.3\}\}/.test(css));
  c('小さい紙ほど後ろ（重なった時は小さい倍率が勝つ）', css.indexOf('zoom:0.95') < css.indexOf('zoom:0.3'));
  c('空の欄も同じ長さの線（文字ずれ対策）', /\.l u\{display:inline-block;min-width:14mm/.test(css));
  c('数字の表の項目名は1行（フロント（B1）が折れない）', /\.kp tr>th:first-child\{text-align:left;width:34mm;white-space:nowrap\}/.test(css));
  const sc = w._p2ShCssScope(css, '#L');
  c('アプリ内の印刷の層でも効く（@media の中も #p2ShPrintLayer だけに）', /@media print and \(max-width:281mm\),print and \(max-height:194mm\)\{#L \.pg\{zoom:0\.65\}\}/.test(sc));
});
