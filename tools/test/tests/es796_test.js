// v796：やる理由などの作文を消せる（作文のページ・理想のページ。↩ 元に戻す）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'G', parentId: '', mapType: 'both' }];
  const N = w._p2Notes(); N.why.cur = '家族との時間を増やしたい'; N.why.curAt = '2026-10-01';
  w.switchView('plan'); w.p2Go('essay', 0); await sleep(40);
  const del = $('.es-ab .del');
  c('作文のページに「消す」', !!del && /消す/.test(del.textContent));
  del.click(); await sleep(20);
  c('消すと白紙に', w._p2Notes().why.cur === '' && $('#uxEssay').value === '' && !$('.es-ab .del'));
  w._gmUndoFn(); await sleep(20);
  c('↩ 元に戻す', w._p2Notes().why.cur === '家族との時間を増やしたい' && w._p2Notes().why.curAt === '2026-10-01' && $('#uxEssay').value === '家族との時間を増やしたい');
  // 理想のページからも
  const g = w._p2G(); g.ans.housing_cost = 20; g.p1 = true;
  w.p2Go('ideal', 0); await sleep(40);
  const x = $$('.p2id-es .eh span.x');
  c('理想のページの作文にも「消す」（書いた作文だけ）', x.length === 1);
  x[0].click(); await sleep(20);
  c('理想のページからも消せる', w._p2Notes().why.cur === '' && !$$('.p2id-es .eh span.x').length && /まだ書いていません/.test($$('.p2id-es .e')[0].textContent));
});
