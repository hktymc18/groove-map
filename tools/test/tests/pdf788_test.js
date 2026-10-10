// v788：スマホの計画シートからPDF（上に「PDF」「印刷」・プレビューの上の帯は2段で画面からはみ出さない）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'G', parentId: '', mapType: 'both' }];
  w.switchView('plan'); w.p2Go('sheet'); await sleep(40);
  const b = $$('.sm-bar .sh-pdf');
  c('スマホの計画シートの上に「PDF」「印刷」', b.length === 2 && /PDF/.test(b[0].textContent) && /印刷/.test(b[1].textContent) && /p2ShPrint\(1\)/.test(b[0].getAttribute('onclick')));
  let called = 0; const o = w.p2ShPvPdf; w.p2ShPvPdf = () => { called++; };
  b[0].click(); await sleep(700);
  c('「PDF」を押すとプレビューを開いて、すぐPDFを作り始める', !!$('#p2ShPv') && called === 1);
  w.p2ShPvPdf = o; w.p2ShPvX();
  b[1].click(); await sleep(700);
  c('「印刷」はプレビューだけ（PDFは作らない）', !!$('#p2ShPv') && called === 1);
  const css = w.document.getElementById('p2ShPvCss').textContent;
  c('スマホは上の帯を2段に（右の印刷・PDFが画面の外に出ない）', /@media \(max-width:640px\)\{#p2ShPv \.pv-hd\{flex-wrap:wrap/.test(css) && !!$('#p2ShPv .pv-br') && /\.pv-br\{display:block;flex-basis:100%/.test(css));
  w.p2ShPvX();
});
