// v642：年別目標（スマホ）を新しいページに：頂上→今の縦の道・−［］＋・タイトルはリスト・その場で保存・例に戻す
//        次の山もページでその場で決める（古いシートはスマホで出さない）／「書き出し」を丸ごと削除
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login();
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'ゴールド', parentId: '', mapType: 'both', ptCurrent: 2500 }];
  setWH(390, 844); w._uxSync && w._uxSync(); w.switchView('plan'); await sleep(50);
  w.state.goals.plan.income = 3410000; w.state.goals.plan.title = 'チームエリート'; w.state.goals.plan.deadline = '2029-12';
  const p2 = w._p2(); delete p2.ladder; delete p2.years;
  setWH(390, 844); w._uxSync && w._uxSync();
  w.p2YearsOpen(); await sleep(30);
  c('スマホは新しい年別目標のページ（古いシートは出ない）', !!$('.yr1') && !$('#p2GeOv') && $('.ux-crumb').textContent.indexOf('年別目標') >= 0);
  const rows = $$('.yr1 tr').slice(1); // v693: 表1つ
  c('頂上（最終ゴール）→ 3年目 → 2年目 → 1年目 → 今 の順', rows.length === 5 && rows[0].classList.contains('fin') && rows[0].textContent.indexOf('2029年12月') >= 0 && rows[1].textContent.indexOf('2028年') >= 0 && rows[3].textContent.indexOf('2026年') >= 0 && rows[4].classList.contains('now'));
  c('最初は「例」', $$('.yr1 .ex').length === 3);
  const L0 = w._p2Ladder(), ym1 = L0.rows[0].ym, inc0 = L0.rows[0].inc;
  w.p2YrStep(ym1, 1); await sleep(10);
  c('＋でその年が保存される（例が外れる）', p2.ladder && p2.ladder[ym1] && p2.ladder[ym1].inc > inc0 && $$('.yr1 .ex').length === 2 && !!$('.yr1 td.x .rs'));
  w.p2YrInc(ym1, '60'); await sleep(10);
  c('数字を打って保存', p2.ladder[ym1].inc === 60 && w._p2Ladder().rows[0].inc === 60);
  w.p2YrTitle(ym1, 'RUBY'); await sleep(10);
  c('タイトルをリストで選ぶ（手動）', p2.ladder[ym1].title === 'RUBY' && w._p2Ladder().rows[0].title === 'RUBY' && w._p2Ladder().rows[0].tm);
  w.p2YrReset(ym1); await sleep(10);
  c('例に戻す', !p2.ladder[ym1] && $$('.yr1 .ex').length === 3);
  c('戻る＝入口（v693：来た所へ）', $('.ux-btm') && $('.ux-btm').innerHTML.indexOf("p2Go('')") >= 0);
  w.p2YearsOpen('tool'); await sleep(10);
  c('ツールから開いたら戻る＝ツール', $('.ux-btm').innerHTML.indexOf("p2Go('tool')") >= 0);
  w.state.goals.plan.deadline = '2027-06'; w.renderPlan(); await sleep(10);
  c('1年以内なら案内だけ', !$('.yr1') && $('.ux-empty').textContent.indexOf('1年以内') >= 0);
  console.log('=== 次の山（スマホ） ===');
  w.state.goals.plan.deadline = '2029-12'; delete p2.next; delete p2.ladder;
  w.p2Go('goal', 3); await sleep(20);
  c('次の山のページに月収・タイトル・いつまでに（例つき）', $('#view-plan').textContent.indexOf('月収') >= 0 && $$('#view-plan .ux-ex span').length >= 3 && $('#view-plan').textContent.indexOf('期日') >= 0 && $('#view-plan').textContent.indexOf('この例で決める') >= 0); // v690: 1画面の「次の山」
  w.p2NxSetInc('60'); await sleep(10);
  c('月収を入れるとその場で保存・タイトルは自動', p2.next && p2.next.inc === 60 && !p2.next.tm && p2.next.title === w._p2NxAuto9(60, w._p2Next()) && $('#view-plan').textContent.indexOf('この例で決める') < 0);
  w.p2NxPick('RUBY'); await sleep(10);
  c('タイトルを選ぶ（手動）', p2.next.title === 'RUBY' && p2.next.tm && p2.next.inc === 60);
  w.p2NxAutoT(); c('月収に合わせる', !p2.next.tm && p2.next.title !== 'RUBY');
  const d0 = w._p2Next().deadline; w.p2NxDlStep(1); c('いつまでに −／＋', p2.next.deadline === w._p2YmAdd(d0, 1));
  w.p2NxIncOpen(); await sleep(10); c('スマホでは古い「次の山の目標月収」シートは出ない', !$('#p2NxOv') && w._p2Pg === 'goal' && w._p2PgI === 3);
  w.p2GoalEdit(); await sleep(10); c('スマホでは古い「目標をなおす」シートは出ない（目標のページへ）', !$('#p2GeOv') && w._p2Pg === 'goal');
  w.p2GoalEdit('next'); await sleep(10); c('横線の⛰次の山の旗からは次の山のページ', w._p2Pg === 'goal' && w._p2PgI === 3);
  console.log('=== 書き出しは削除 ===');
  w.p2Go('tool'); await sleep(10);
  c('ツールに「書き出し」はない', $('#view-plan').textContent.indexOf('書き出し') < 0 && !w.P2_PG.inb);
  c('右下の✍️ボタン・書く画面・PCのメモパッドもない', !$('#p2Fab') && !$('#p2Ink') && typeof w.p2InkOpen === 'undefined' && typeof w.p2PadToggle === 'undefined' && typeof w._p2InboxHtml === 'undefined');
  setWH(1400, 900); w._uxSync && w._uxSync(); w.state.goals.plan.deadline = '2029-12';
  let called = ''; const ge = w.p2GoalEdit; w.p2GoalEdit = (f) => { called = f; }; w.p2YearsOpen(); w.p2GoalEdit = ge;
  c('PCは今まで通り（目標のページの1年ごとの目標）', called === 'years');
});
