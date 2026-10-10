// v682→v776：PLAN › 理想は1本の流れ（①理想の生活 → ②やりたいこと〜なりたくない自分の4ページ → まとめ）。右は「次へ」、完了はまとめだけ、左は「前へ」
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  w.switchView('plan'); w.p2Go('ideal', 0); await sleep(60);
  c('最初のページは「‹ 戻る」でPLANへ（v786）・右は「やりたいこと ›」（完了ではない）', $('.ux-btm .ux-bk').getAttribute('onclick') === "p2Go('')" && /戻る/.test($('.ux-btm .ux-bk').textContent) && /やりたいこと/.test($('.ux-btm .ux-nx').textContent) && !/完了/.test($('.ux-btm').textContent));
  const g = w._p2G(); g.ans.housing_cost = 20; g.ans.food_cost = 10; g.p1 = true; w.p2Go('ideal', 0); await sleep(60);
  c('①答え終わったら同じページに金額（○万円/月・タイトル）', !!$('#p2GwWrap .p2id-amt') && /30/.test($('#p2GwWrap .p2id-amt').textContent));
  w.p2Go('ideal', 1); await sleep(30);
  c('ひと区切りのページは①の同じページに', w._p2PgI === 0 && !!$('#p2GwWrap .p2id-amt'));
  $('.ux-btm .ux-nx').click(); await sleep(30);
  c('①の「次へ」→ やりたいこと（入口へは戻らない）', w._p2Pg === 'ideal' && w._p2PgI === 2);
  const dots = $$('.ux-btm .ux-dots span');
  c('②は4ページで1セット（●が4つ）', dots.length === 4 && dots[0].classList.contains('on'));
  c('②の1ページ目の「前へ」は理想の生活へ', /前へ/.test($('.ux-btm .ux-bk').textContent) && /p2PgSub\(0\)/.test($('.ux-btm .ux-bk').getAttribute('onclick')));
  w.p2Go('ideal', 5); await sleep(30);
  c('②の最後（なりたくない自分）は「まとめ ›」', /まとめ/.test($('.ux-btm .ux-nx').textContent) && $$('.ux-btm .ux-dots span')[3].classList.contains('on'));
  $('.ux-btm .ux-nx').click(); await sleep(30);
  c('→ まとめへ（記録）', w._p2Pg === 'ideal' && w._p2PgI === 6 && g.p2done === true);
  c('完了はまとめだけ', /完了/.test($('.ux-btm .ux-nx').textContent) && /前へ/.test($('.ux-btm .ux-bk').textContent));
  $('.ux-btm .ux-nx').click(); await sleep(30);
  c('完了 → PLANの入口へ', w._p2Pg === '');
});
