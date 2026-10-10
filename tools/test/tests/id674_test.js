// v674：PLAN › 理想 — 答え終わっている時は一覧の下に「やり直す」などのボタン（✎・やり直すで質問）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $ } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  w.switchView('plan'); w.p2Go('ideal', 0); await sleep(80);
  c('まだ答えていない時は質問が出る', !$('#p2GwWrap .p2id-dn') && $('#p2GwWrap').innerHTML.length > 0);
  w._p2G().p1 = true; w.p2Go('ideal', 0); await sleep(80);
  c('答え終わったら「すべて答えました」・v787: 答え直すはページのいちばん下に小さく', !!$('#p2GwWrap .p2id-dn') && !/理想の生活を答え直す/.test($('#p2GwWrap').textContent) && /理想の生活を答え直す/.test($('.p2id-redo').textContent) && $('.p2id').lastElementChild.contains($('.p2id-redo')));
  w.p2IdealRedo(); await sleep(50);
  c('「はじめから答え直す」で1問目の質問', !$('#p2GwWrap .p2id-dn') && w._p2GwStep === w.P2GW_Q.indexOf(w._p2IdealQs()[0]));
  w.p2Go('ideal', 0); await sleep(80);
  c('開き直すとまたボタン', !!$('#p2GwWrap .p2id-dn'));
  w.p2IdealCat('food'); await sleep(50);
  c('✎（分野）を押すとその質問', !$('#p2GwWrap .p2id-dn'));
});
