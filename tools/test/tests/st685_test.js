// v685：PLAN › 戦略（最終目標→最短目標→ギャップ→必要な数→ペース→戦略）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  const s = w.state;
  s.members = [{ id: 'r', lastName: '山内', title: 'ゴールド', parentId: '', ptCurrent: 3000 },
    { id: 'b1', lastName: '木村', title: 'BR', parentId: 'r', ptCurrent: 4000, priority: '高' },
    { id: 'b2', lastName: '林', title: 'B2', parentId: 'r', ptCurrent: 1000 },
    { id: 'c1', lastName: '伊藤', title: 'ルビー', parentId: 'b2', ptCurrent: 9000 }];
  w.switchView('plan'); await sleep(50);
  w._p2(); const p = s.goals.plan; p.income = 1000000; p.title = 'エメラルド'; p.deadline = w._p2Ym(15);
  w._p2().next = { title: 'RUBY', inc: 20, deadline: w._p2Ym(9), tm: true };
  w._p2Al = { n: 5, apo: 0, at: Date.now() + 1e9, err: false, busy: false };
  w.renderPlan(); await sleep(20);
  c('入口に「戦略」', /戦略/.test($('#view-plan').textContent));
  w.p2Go('tool'); await sleep(20);
  c('ツールの一番上に「戦略を立てる」', /戦略を立てる/.test($('#view-plan .ux-li').textContent));
  w.p2Go('stg', 0); await sleep(20);
  c('1/6 最終目標', /1 \/ 6/.test($('#view-plan .ux-step').textContent) && /最終目標/.test($('#view-plan .ux-h2').textContent));
  c('下の帯は次へ（最短目標）', /最短目標/.test($('.ux-btm .ux-nx').textContent));
  w.p2PgSub(1); await sleep(20);
  c('2/6 最短目標（次の山）', /最短目標/.test($('#view-plan .ux-h2').textContent) && /RUBY/.test($('#view-plan').textContent));
  w.p2PgSub(2); await sleep(20);
  const tb = $('#view-plan .st-tb').textContent;
  c('ギャップの表に今・最短・最終', /今/.test(tb) && /RUBY/.test(tb) && /EMERALD/.test(tb));
  const A = w._p2StGoal('nx'), F = w._p2StGoal('fin');
  c('ルビー＝月収÷20万・候補＝×2', A.qr.t === 1 && A.cand.t === 2 && F.qr.t === 5 && F.cand.t === 10, [A.qr.t, A.cand.t, F.qr.t, F.cand.t]);
  c('今の数はMAPから（第1世代BR2・ルビー1・候補1・直下2）', A.br.c === 2 && A.qr.c === 1 && A.cand.c === 1 && A.fr.c === 2, [A.br.c, A.qr.c, A.cand.c, A.fr.c]);
  c('フロントはタイトルの目安−今（ルビー6−2）', A.need.front === 4, A.need.front);
  c('リスト＝フロント×3・ST＝不足分', A.need.list === 12 && A.need.listNow === 5 && A.need.st === 7, [A.need.list, A.need.st]);
  w.p2PgSub(3); await sleep(20);
  w.p2StHl(1); await sleep(10);
  c('1フロントのリストを4に→リスト16・ST11', w._p2StGoal('nx').need.list === 16 && w._p2StGoal('nx').need.st === 11);
  w.p2StSet('fr', 'nx', 2); await sleep(10);
  c('フロントを自分で直せる（2）', w._p2StGoal('nx').need.front === 2);
  w.p2StSet('fr', 'nx', ''); w.p2StHl(0, 3); await sleep(10);
  w.p2PgSub(4); await sleep(20);
  const o = w._p2StGoal('nx'), P = w._p2StPace(o);
  c('LOIカウント月＝期日−3', o.loi === w._p2Ym(6), o.loi);
  c('今月〜LOI月にフロント4人を割り振る', P.sum === 4 && P.rows.filter(r => r.before).length === 7, [P.sum]);
  c('ペースの見出しにLOIを揃える月', /LOIのカウントを揃える月/.test($('#view-plan .st-sum').textContent));
  c('フロントBRの不足→LOIスタートの人数', /フロントBR あと/.test($('#view-plan .st-sum').textContent));
  w.p2StPace('nx', w._p2Ym(0), 1); await sleep(10);
  c('月の数を＋できる', w._p2StPace(w._p2StGoal('nx')).rows[0].v === 2);
  w.p2StToRm('nx'); await sleep(10);
  c('ロードマップに入れる', w._p2Rm().rows.front[w._p2Ym(0)] === 2);
  w.p2PgSub(5); await sleep(20);
  c('戦略に候補（木村）', $$('#view-plan .st-cd').length === 1 && /木村/.test($('#view-plan .st-cd').textContent));
  w.p2StPk(); await sleep(10);
  c('候補を選ぶリスト（自分は出ない）', !!$('#p2StPkL') && /林/.test($('#p2StPkL').textContent) && !/山内/.test($('#p2StPkL').textContent));
  w.p2StCand('b2', 1); await sleep(10);
  c('選ぶと優先度「高」＝候補', s.members.find(m => m.id === 'b2').priority === '高' && $$('#view-plan .st-cd').length === 2);
  w.p2StMemo('front', '月2人'); c('メモを保存', w._p2().strat.memo.front === '月2人');
  c('最後は「✓ 完了」', /完了/.test($('.ux-btm .ux-nx').textContent));
  w.p2StTg('fin'); await sleep(10);
  c('最終目標に切りかえ', /EMERALD を/.test($('#view-plan .st-sum').textContent));
});
