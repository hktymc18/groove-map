// v629：想い→理想（①理想の生活をページの中で → ひと区切り → ②③ → まとめ）・作文と夢100はツールへ
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login();
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'ゴールド', parentId: '', mapType: 'both' }];
  setWH(390, 844); w._uxSync();
  w.switchView('plan'); await sleep(30);
  c('入口のタイルが「理想」に', $('#view-plan').textContent.indexOf('理想') >= 0 && $('#view-plan').textContent.indexOf('想い') < 0);
  w.p2Go('ideal', 0); await sleep(30);
  c('①理想の生活：質問がページの中に（ポップアップなし）', !!$('#p2GwWrap .gw2-bubble') && !$('#p2GwOv') && !!$('#p2IdList'));
  c('最初の質問から', $('#p2GwWrap').textContent.indexOf('理想の住まい') >= 0);
  w.p2GwSel('持ち家'); await sleep(400);
  c('答えると次の質問・一覧にすぐ出る', $('#p2GwWrap').textContent.indexOf('どんなタイプ') >= 0 && $('#p2IdList').textContent.indexOf('持ち家') >= 0);
  w.p2IdealCat('travel'); await sleep(20);
  c('一覧の分野を押すとその質問へ', $('#p2GwWrap').textContent.indexOf('旅行') >= 0);
  // 最後まで進める
  const g = w._p2G(); g.ans.housing_cost = 20; g.ans.food_cost = 10; w.state.goals.plan.income = 0;
  let guard = 0; while (w._p2Pg === 'ideal' && !w._p2PgI && guard++ < 40) { w.p2GwNext(true); await sleep(5); }
  c('最後まで答えると「ひと区切り」へ（目標月収は勝手に変えない）', w._p2PgI === 1 && $('#view-plan').textContent.indexOf('ひと区切り') >= 0 && !w.state.goals.plan.income && g.p1 === true);
  c('「目標月収にしますか？」', $('#view-plan').textContent.indexOf('目標月収にしますか') >= 0);
  w.p2IdealApply(); await sleep(10);
  c('目標にする→目標月収が理想の生活の合計に', w.state.goals.plan.income === w._p2GwTotal() * 10000 && w._p2GwTotal() >= 30);
  w.p2PgSub(2); await sleep(10);
  c('②やりたいこと（候補ボタン・一覧）', $('#view-plan').textContent.indexOf('やりたいこと') >= 0 && $$('#view-plan .ux-ex span').length >= 3);
  w.p2LstEx('want_do', '家族と海外旅行'); await sleep(10);
  c('候補を押すと足せる', w._p2Lst('want_do').indexOf('家族と海外旅行') >= 0);
  w.p2PgSub(6); await sleep(10);
  c('まとめ：理想の生活と4つの一覧', $('#view-plan').textContent.indexOf('わたしの理想') >= 0 && $('#view-plan').textContent.indexOf('なりたくない自分') >= 0 && $('#view-plan').textContent.indexOf('家族と海外旅行') >= 0);
  console.log('=== ツール ===');
  w.p2Go('tool'); await sleep(10);
  c('ツールに夢100とやる理由（作文）', $('#view-plan').textContent.indexOf('夢100') >= 0 && $('#view-plan').textContent.indexOf('やる理由（作文）') >= 0);
  w.p2Go('essay'); await sleep(10);
  c('作文のページ（やる理由）', !!$('#uxEssay'));
  w.p2Go('why', 8); await sleep(10);
  c('前のリンク（想いの夢100）は夢100のページへ', w._p2Pg === 'dream');
  w.p2GwOpen(1); await sleep(30);
  c('「20問から作り直す」も理想のページへ（ポップアップなし）', w._p2Pg === 'ideal' && !$('#p2GwOv'));
  console.log('=== PC ===');
  setWH(1400, 900); w._uxSync(); w.p2Go('ideal', 0); await sleep(30);
  c('PC：左に質問・右に答えの一覧', !!$('.pcx2 .p2id #p2GwWrap .gw2-bubble') && !!$('.pcx2 #p2IdList') && $$('.pcx-tabs span').length === 7);
});
