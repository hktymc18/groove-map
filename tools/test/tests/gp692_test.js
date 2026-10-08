// v692：ギャップを1画面に（目標・今・差の表 → 単価・倍率 → 割り振り）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  w.state.members = [{ id: 'r', lastName: '山内', title: 'ゴールド', parentId: '', ptCurrent: 2000 }, { id: 'a', lastName: '佐藤', title: 'BR', parentId: 'r' }, { id: 'b', lastName: '伊藤', title: 'ルビー', parentId: 'a', priority: '高' }];
  w.switchView('plan'); await sleep(40);
  const p = w.state.goals.plan; p.income = 1000000; p.title = 'エメラルド'; p.deadline = w._p2YmAdd(w._p2Ym(0), 10);
  w.p2Go('rm'); w.p2Go('gap'); await sleep(20);
  c('1画面に 表・単価・割り振り', $$('.gp1 tr').length === 7 && $$('.gp1-r .sp-in').length === 5 && /ロードマップへの割り振り/.test($('#view-plan').textContent));
  c('目標は月収から自動（薄い数字）・今はMAPから自動', $$('.gp1 tr')[3].querySelectorAll('.sp-in')[0].placeholder === '5' && $$('.gp1 tr')[3].querySelectorAll('.sp-in')[1].placeholder === '1');
  const t0 = $$('.gp1 tr')[1].querySelectorAll('.sp-in')[0]; t0.value = '4'; t0.onchange(); await sleep(10);
  c('フロントBRの目標を書く→差', w._p2GapCalc().items[0].t === 4 && /あと3/.test($$('.gp1 tr')[1].textContent));
  const r0 = $$('.gp1-r .sp-in')[0]; r0.value = '25'; r0.onchange(); await sleep(10);
  c('単価をその場で直す', w._p2Gap().rates.qrYen === 25 && w._p2GapCalc().items[2].t === 4);
  c('割り振りの中身が見える', /フロント（BR逆算）/.test($('.gp1-al').textContent) && /Qルビー/.test($('.gp1-al').textContent));
  c('戻るは来た所（ロードマップ）', /p2Go\('rm'\)/.test($('.ux-btm').innerHTML));
  w.p2GapAllocDo(); await sleep(20);
  c('割り振る→ロードマップの1画面へ', w._p2Pg === 'rm' && !!$('.rm1'));
});
