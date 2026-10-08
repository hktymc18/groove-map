// v731：夢100を期間で絞る（〜その月まで）・その期間に必要な金額と月あたり
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.switchView('plan'); await sleep(20);
  const cur = w._p2Ym(0), m2 = w._p2YmAdd(cur, 2), m8 = w._p2YmAdd(cur, 8);
  w._p2().dreams = [
    { id: 'd1', t: 'パンツ2着', amt: '1', dl: cur, done: false },
    { id: 'd2', t: 'セイルチェア', amt: '13', dl: m2, done: false },
    { id: 'd3', t: '旅行', amt: '50', dl: m8, done: false },
    { id: 'd4', t: 'イヤホン', amt: '4', dl: m2, done: true },
    { id: 'd5', t: 'いつか家', amt: '1000', dl: '', done: false }
  ];
  w.p2Go('dream'); await sleep(30);
  c('期間のボタン（すべて・今月・3ヶ月…）と月を選ぶ', $$('.dr-f span').length >= 5 && !!$('.dr-f select'));
  c('すべて：5個・残り必要は全部', /0 \/ 5|1 \/ 5/.test($('.ux-sum').textContent) && /1,064万円/.test($('.dr-nt').textContent));
  w.p2DrTo(m2); await sleep(20);
  c('3ヶ月：その月までの夢だけ（期日なしは入れない）', $$('.ux-sk').length === 3 && /1 \/ 3/.test($('.ux-sum').textContent) && !/旅行|いつか家/.test($('#view-plan').textContent));
  c('その期間に必要な金額（達成ずみは除く）と月あたり', /14万円/.test($('.dr-need').textContent) && /あと3ヶ月/.test($('.dr-need').textContent) && /4\.7万円/.test($('.dr-need').textContent));
  c('期日なしの夢は入らないと書く', /期日を決めていない夢 1個/.test($('.dr-nt').textContent));
  c('選んだ期間は端末で覚える', w.localStorage.getItem('gm_drTo') === m2);
  const sel = $('.dr-f select'); sel.value = m8; sel.onchange(); await sleep(20);
  c('月を選ぶ（〜9ヶ月後まで）', $$('.ux-sk').length === 4 && /64万円/.test($('.dr-need').textContent));
  w.p2DrTo(''); await sleep(10);
  c('すべてに戻す', $$('.ux-sk').length === 5 && !$('.dr-need'));
});
