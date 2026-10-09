// v775：PLAN 改善（理想MAPと目標の連動をやめる・進捗は − ＋ の手入力と達成率%・スマホの計画シートはMAPのツリー・理想はパートごとに答え直す）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login();
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'ゴールド', parentId: '', mapType: 'both', ptCurrent: 3000, activity: 'S' },
    { id: 'a', lastName: '鈴木', firstName: '一', title: 'B2', parentId: 'r', mapType: 'both' }, { id: 'b', lastName: '高橋', firstName: '光', title: 'B1', parentId: 'a', mapType: 'both' }];
  // 理想MAPに新規B1が3人いても、PLANの目標は変わらない
  w.state.idealMembers = JSON.parse(JSON.stringify(w.state.members)).map(m => Object.assign(m, { mapType: 'ideal' }));
  ['n1', 'n2', 'n3'].forEach(id => w.state.idealMembers.push({ id, lastName: '新規', firstName: id, title: 'LOI', parentId: 'r', mapType: 'ideal', idealNew: true, idealKind: 'biz', ptCurrent: 1500, ptSelf: 1500 }));
  const ym = w._p2Ym(0);
  c('理想MAPの数字はPLANの目標にならない', w._p2FrontIdeal(ym) === null && w._p2FrontTgt(ym) !== 3 && w.syncIdealToPlan() === false);
  w.p2RmCell('front', ym, '2');
  c('NEWフロントの目標を自分で変えられる', w._p2FrontTgt(ym) === 2);
  // 計画シート
  setWH(390, 844); w._uxSync && w._uxSync(); w.switchView('plan'); w.p2Go('sheet'); await sleep(40);
  const M = w._p2ShM(ym); M.kpi.ct = 8; w.renderPlan(); await sleep(20);
  const ctRow = $$('.sp-kr').find(r => /CT数/.test(r.querySelector('.nm').textContent));
  c('進捗は − ＋（全部の行）', $$('.sp-kr').every(r => !!r.querySelector('.sp-st')));
  c('カレンダーは数えない（入れるまで0）', ctRow.querySelector('.sp-st input').value === '0');
  const plus = ctRow.querySelector('.sp-st i:last-child');
  for (let i = 0; i < 6; i++) plus.click();
  await sleep(10);
  c('＋で増える・画面を作り直さない（同じ欄のまま）', ctRow.isConnected && ctRow.querySelector('.sp-st input').value === '6' && M.man.ct === 6);
  c('達成率が出る（6/8＝75%）', /75%/.test(ctRow.querySelector('.sp-rt').textContent) && ctRow.querySelector('.sp-rt').classList.contains('md'));
  ctRow.querySelector('.sp-st i').click(); await sleep(5);
  c('−で減る', M.man.ct === 5 && /63%/.test(ctRow.querySelector('.sp-rt').textContent));
  // 先月の達成率
  const pv = w._p2YmAdd(ym, -1), P = w._p2ShM(pv); P.kpi.ct = 10; P.man.ct = 7; w.renderPlan(); await sleep(20);
  const ctRow2 = $$('.sp-kr').find(r => /CT数/.test(r.querySelector('.nm').textContent));
  c('先月も達成率（7/10＝70%）', /70%/.test(ctRow2.querySelector('.b .pv').textContent));
  // スマホのMAPは最初ツリー（MAPのツリーと同じ行）
  w._p2ShMapMode = 'cur'; w.renderPlan(); await sleep(40);
  c('スマホの計画シートは最初ツリー', $('#p2ShMF') && $('#p2ShMF').getAttribute('data-kind') === 'tree' && /ツリー/.test($('.sp-vw').textContent));
  c('MAPのツリーと同じ行（.mr）が出る', $$('#p2ShMI .mr[data-cid]').length === 3 && !$('#p2ShMI #nc-r'));
  w.p2ShTreeTgl('a'); await sleep(20);
  c('開け閉めできる', $$('#p2ShMI .mr[data-cid]').length === 2);
  w.p2ShTreeTgl('a'); await sleep(20);
  w.p2ShMapView('circle', 1); await sleep(20);
  c('サークルにも切り替えられる（スマホの選び方として覚える）', w._p2Sh().mapViewM === 'circle' && !w._p2Sh().mapView);
  // PCはツリーなし（今のまま）
  setWH(1440, 1000); w._uxSync && w._uxSync(); w.renderPlan(); await sleep(40);
  c('PCはツリーの切替を出さない', $('.sp-vw') && !/ツリー/.test($('.sp-vw').textContent));
  // 理想：パートごとに答え直す
  setWH(390, 844); w._uxSync && w._uxSync(); w.p2Go('ideal', 6); await sleep(30);
  const parts = $$('.p2id-pt .ux-li').map(e => e.textContent);
  c('まとめにパート①②③の答え直し', parts.length === 3 && /理想のライフスタイル/.test(parts[0]) && /やりたいこと/.test(parts[1]) && /やる理由作文/.test(parts[2]));
  w.p2IdealRedoPart(2); await sleep(20);
  c('②はやりたいことのページから', w._p2Pg === 'ideal' && w._p2PgI === 2);
  w.p2IdealFinish(1); await sleep(20);
  c('②を終えるとまとめに戻る', /わたしの理想/.test(($('.ux-h2') || {}).textContent || ''));
  w.p2IdealRedoPart(1); await sleep(30);
  c('①は理想の生活の1問目から', w._p2PgI === 0 && /（1\//.test(($('#p2GwWrap .gw2-phase') || {}).textContent || ''), ($('#p2GwWrap .gw2-phase') || {}).textContent);
});
