// v673：PLAN › 理想（スマホ）は記入済みの「理想の生活」が上、質問が下
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $ } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  w.switchView('plan'); w.p2Go('ideal', 0); await sleep(80);
  c('理想のページが出る', !!$('.p2id .p2id-l') && !!$('.p2id .p2id-q'));
  const css = [...w.document.querySelectorAll('style')].map(x => x.textContent).join('');
  c('スマホは一覧（理想の生活）が上（v791: 並び順そのものを一覧→左の列に）', !!w.document.querySelector('.p2id') ? w.document.querySelector('.p2id').firstElementChild.id === 'p2IdList' : /<div class="p2id"><div class="p2id-l" id="p2IdList">/.test(w._p2IdealPageHtml(0)));
  c('PCは左右2列のまま（質問が左）', css.indexOf('.pcx .p2id>.p2id-l,.pcx2 .p2id>.p2id-l{order:0}') >= 0);
  c('一覧の✎で質問まで送る', /scrollIntoView/.test(String(w.p2IdealCat)));
});
