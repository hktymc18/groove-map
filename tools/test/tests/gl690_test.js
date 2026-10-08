// v690：目標を1画面で（最終目標の月収・タイトル・期日 → 次の山 → スローガン）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  w.state.members = [{ id: 'r', lastName: '山内', title: 'ゴールド', parentId: '' }];
  w.switchView('plan'); await sleep(40);
  w.p2Go('goal'); await sleep(20);
  const t = () => $('#view-plan').textContent;
  c('1画面に 最終目標・次の山・スローガン', /最終目標/.test(t()) && /次の山/.test(t()) && /スローガン/.test(t()));
  c('ページ送りの●はない', !/タイトル ›/.test($('.ux-btm').textContent) && /完了/.test($('.ux-btm .ux-nx').textContent));
  const inc = $('.g1-row .sp-in'); inc.value = '341'; inc.onchange(); await sleep(10);
  c('月収を書く→タイトルは目安で自動', w.state.goals.plan.income === 3410000 && w.state.goals.plan.title === 'チームエリート');
  const m = $('.g1-row input[type=month]'); m.value = '2027-12'; m.onchange(); await sleep(10);
  c('期日', w.state.goals.plan.deadline === '2027-12');
  c('次の山の欄（月収・タイトル・期日）', $$('#g1Nx ~ .g1-row').length >= 3);
  const mo = $('.g1-t'); mo.value = 'やる時はいましかない'; mo.onchange(); await sleep(10);
  c('スローガン', w._p2().motto === 'やる時はいましかない');
  c('完了で入口へ', $('.ux-btm .ux-nx').getAttribute('onclick') === "p2Go('')");
});
