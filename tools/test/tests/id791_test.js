// v791：理想（PCは列ごとに積む・想い（作文）3つ・続きを読む）／PCの印刷・PDFはサマリーから
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(1440, 900); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'G', parentId: '', mapType: 'both' }];
  const g = w._p2G(); g.ans.housing_cost = 20; g.ans.food_cost = 10; g.p1 = true; g.ans.want_do = ['好きな時に好きな場所へ']; g.ans.want_be = ['感謝される自分'];
  const N = w._p2Notes(); N.why.cur = 'あ'.repeat(200); N.ifnot.cur = '短い文'; N.success.cur = '';
  w.switchView('plan'); w.p2Go('ideal', 0); await sleep(60);
  c('PC：左の列に金額・やりたいこと・作文、右の列に理想の生活の一覧', !!$('.p2id > .p2id-c1 .p2id-q') && !!$('.p2id > .p2id-c1 .sm-wns') && !!$('.p2id > .p2id-c1 .p2id-es') && !!$('.p2id > #p2IdList'));
  c('まとめ・答え直すは下（横いっぱい）', !!$('.p2id-ft .p2id-redo') && !$('.p2id .p2id-redo'));
  const es = $$('.p2id-es .e');
  c('想い（作文）は3つ', es.length === 3 && /やる理由/.test(es[0].textContent) && /1年後/.test(es[1].textContent) && /成功した毎日/.test(es[2].textContent));
  c('長い作文は「続きを読む」・短い作文は出さない・書いていない時は「書く ›」', !!es[0].querySelector('.more') && !es[1].querySelector('.more') && /まだ書いていません/.test(es[2].textContent) && /書く/.test(es[2].querySelector('.eh span').textContent));
  es[0].querySelector('.more').click();
  c('続きを読む → 全文（閉じる）', es[0].querySelector('p').classList.contains('op') && es[0].querySelector('.more').textContent === '閉じる');
  es[0].querySelector('.eh span').click(); await sleep(30);
  c('「直す」で作文のページ（やる理由）', w._p2Pg === 'essay' && w._p2PgI === 0);
  // PCの印刷・PDFはサマリーから
  w.p2Go('sheet'); await sleep(30); w.p2SumTgl('sh', 0); await sleep(30);
  c('PC 計画シート：編集の時は印刷・PDFを出さない', !$$('.st-h .pr').some(x => /印刷・PDF/.test(x.textContent)));
  w.p2SumTgl('sh', 1); await sleep(30);
  c('PC 計画シート：サマリーの時に印刷・PDF', $$('.st-h .pr').some(x => /印刷・PDF/.test(x.textContent)));
  w.p2SumTgl('sh', 0);
  // スマホ：1列（理想の生活の一覧が先）
  setWH(390, 844); w._uxSync && w._uxSync(); w.p2Go('ideal', 0); await sleep(60);
  const t = $('#uxBody').textContent;
  c('スマホ：理想の生活 → 金額 → やりたいこと → 作文 → まとめ → 答え直す', t.indexOf('あなたの理想の生活') < t.indexOf('理想の生活に必要な月収') && t.indexOf('理想の生活に必要な月収') < t.indexOf('やりたいこと・なりたい自分') && t.indexOf('やりたいこと・なりたい自分') < t.indexOf('想い（作文）') && t.indexOf('想い（作文）') < t.indexOf('わたしの理想（まとめ）') && t.indexOf('わたしの理想（まとめ）') < t.indexOf('理想の生活を答え直す'));
});
