// v682：PLAN › 理想は2セット（①理想の生活＝答え終わったら同じページに金額→完了／②やりたいこと〜なりたくない自分の4ページ→完了）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  w.switchView('plan'); w.p2Go('ideal', 0); await sleep(60);
  c('答える前は「完了」なし', !$('.ux-btm .ux-nx'));
  const g = w._p2G(); g.ans.housing_cost = 20; g.ans.food_cost = 10; g.p1 = true; w.p2Go('ideal', 0); await sleep(60);
  c('①答え終わったら同じページに金額（○万円/月・タイトル）', !!$('#p2GwWrap .p2id-amt') && /30/.test($('#p2GwWrap .p2id-amt').textContent));
  c('①下の帯は「✓ 完了」（ひと区切りへは行かない）', /完了/.test($('.ux-btm .ux-nx').textContent) && !/ひと区切り/.test($('.ux-btm').textContent));
  w.p2Go('ideal', 1); await sleep(30);
  c('ひと区切りのページは①の同じページに', w._p2PgI === 0 && !!$('#p2GwWrap .p2id-amt'));
  $('.ux-btm .ux-nx').click(); await sleep(30);
  c('①完了→PLANの入口へ', w._p2Pg === '' );
  w.p2Go('ideal', 2); await sleep(30);
  const dots = $$('.ux-btm .ux-dots span');
  c('②は4ページで1セット（●が4つ）', dots.length === 4 && dots[0].classList.contains('on'));
  c('②の1ページ目の戻るは入口へ', /p2Go\(''\)/.test($('.ux-btm .ux-bk').getAttribute('onclick')));
  w.p2Go('ideal', 5); await sleep(30);
  c('②の最後（なりたくない自分）は「✓ 完了」', /完了/.test($('.ux-btm .ux-nx').textContent) && $$('.ux-btm .ux-dots span')[3].classList.contains('on'));
  $('.ux-btm .ux-nx').click(); await sleep(30);
  c('②完了→PLANの入口へ（記録）', w._p2Pg === '' && g.p2done === true);
});
