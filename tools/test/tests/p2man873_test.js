// v873：計画シートの「今」は手で入れる数だけ（2026年11月から）。名前はすべて架空
//  NEWフロント＝その月に新しく作るフロントの人数（目標も今も − ＋）。MAPからは数えない
//  FT・CT は予定とは連動しない（予定・ToDoに入れても＋1しない）。10月までは前の数え方の数を記録として残す
const T = require('../lib/head.js')({ now: '2026-11-12T03:00:00Z' });
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login();
  w.state.members = [{ id: 'r', lastName: '架空', firstName: '一郎', title: 'B5', parentId: '', mapType: 'both', ptCurrent: 1200, activity: 'S' },
    { id: 'n1', lastName: '見本', firstName: '新', title: 'B1', parentId: 'r', mapType: 'both', startMonth: '2026.11', activity: 'A' },
    { id: 'o1', lastName: '見本', firstName: '十', title: 'B1', parentId: 'r', mapType: 'both', startMonth: '2026.10', activity: 'A' }];
  w.state.events = [
    { id: 'eN', title: 'FT', date: '2026-11-05', time: '10:00', type: 'event', memberId: 'n1', memberIds: ['n1'] },
    { id: 'eC', title: 'CT', date: '2026-11-06', time: '10:00', type: 'event', memberId: 'n1', memberIds: ['n1'] },
    { id: 'eO', title: 'FT', date: '2026-10-05', time: '10:00', type: 'event', memberId: 'o1', memberIds: ['o1'] }];
  const ym = w._p2Ym(0);
  c('テストの今月は 2026-11', ym === '2026-11');
  setWH(390, 844); w._uxSync && w._uxSync(); w.switchView('plan');
  w._featCfg = { sheet2: { on: false, testers: [w.currentUser.uid] } };
  w.p2Go('sheet'); await sleep(40);
  c('1画面の計画シート', !!$('#p2S3'));

  // ① 11月：MAP・予定からは数えない
  const A = w._p2Act(ym);
  c('11月：直下に11月スタートの人がいても、NEWフロントの今は 0（MAPから数えない）', A.front === 0);
  c('11月：FT・CT の予定があっても数えない', A.ft === 0 && A.ct === 0 && w._p2ActAuto(ym, 'ft') === 0 && w._p2ActAuto(ym, 'ct') === 0);
  const top = () => $$('.s3-top .s3-lr').find(r => /フロント/.test(r.querySelector('.n').textContent));
  c('上の行の名前は「NEWフロント」・今は 0', top() && top().querySelector('.n').textContent === 'NEWフロント' && top().querySelector('.v').textContent === '0');
  const self = (lb) => $$('#p2S3P .s3-sc .s3-lr').find(r => r.querySelector('.n').textContent === lb);
  c('自分自身の目標：FT・CT の今は 0（予定の分は入らない）', self('FT').querySelector('.v').textContent === '0' && self('CT').querySelector('.v').textContent === '0');

  // ② NEWフロント：目標も今も − ＋
  top().click(); await sleep(30);
  const sh = () => $('.s3-sh');
  c('押すと「NEWフロント」・新しく作る人数の説明・目標と今の両方に − ＋', /NEWフロント/.test(sh().querySelector('h3').textContent) && /新しく作るフロントの人数/.test(sh().textContent) && $$('.s3-sh .s3-pm').length === 2 && !/MAPの直下/.test(sh().textContent));
  $$('.s3-sh .s3-pm')[0].querySelectorAll('i')[1].click(); await sleep(30);
  c('目標の＋で 1（ロードマップのその月の数と同じ）', w._p2FrontTgt(ym) === 1 && w._p2Rm().rows.front[ym] === 1);
  $$('.s3-sh .s3-pm')[1].querySelectorAll('i')[1].click(); await sleep(30);
  $$('.s3-sh .s3-pm')[1].querySelectorAll('i')[1].click(); await sleep(30);
  c('今の＋を2回で 2（計画シートに保存）', w._p2ShM(ym).man.front === 2 && $$('.s3-sh .s3-pm')[1].querySelector('input').value === '2');
  $$('.s3-sh .s3-pm')[1].querySelectorAll('i')[0].click(); await sleep(30);
  c('今の − で 1', w._p2ShM(ym).man.front === 1);
  const inp = $$('.s3-sh .s3-pm')[1].querySelector('input'); inp.value = '3'; inp.dispatchEvent(new w.Event('change')); await sleep(30);
  c('今に直接 3 と入れられる', w._p2ShM(ym).man.front === 3);
  c('ほかの画面も同じ数（_p2Act のフロント）', w._p2Act(ym).front === 3);
  w.p2S3Sheet(''); await sleep(30);
  c('閉じると上の行も 1 ▶ 3（達成）', top().querySelector('.t').textContent === '1' && top().querySelector('.v').textContent === '3' && top().querySelector('.v').classList.contains('ok'));

  // ③ FT：予定・ToDoに入れても＋1しない
  w.p2S3Sheet('kp:ft'); await sleep(30);
  c('FT のシート：予定とは連動しない説明・「＋1」の言葉はない', /予定とは連動しません/.test(sh().textContent) && !/＋1/.test(sh().textContent));
  $('.s3-sh .sp-st i:last-child').click(); await sleep(10);
  c('FT の今は − ＋ で入れる', w._p2ShM(ym).man.ft === 1);
  const n0 = w.state.events.length;
  w.p2S3Sheet(''); w.p2SmKpAdd('ft', 'ev'); await sleep(10);
  w.document.getElementById('p2ShDtD').value = ym + '-20'; w.p2ShDtOk(); await sleep(20);
  c('予定に入れると予定はできるが、FT の数は 1 のまま', w.state.events.length === n0 + 1 && w._p2ShM(ym).man.ft === 1 && /予定に入れました/.test($('#toast').textContent));

  // ④ 10月まで：前の数え方の数を記録として残す
  const pv = '2026-10', Ap = w._p2Act(pv);
  c('10月：予定の FT 1件は今まで通り数える（記録）', Ap.ft === 1 && w._p2ActAuto(pv, 'ft') === 1);
  c('10月：NEWフロントは MAP の10月スタートの直下 1人（記録）', Ap.front === 1);
  const kFt = w._p2ShK('ft');
  c('計画シートの10月：FT は入れていなければ記録の 1', w._p2ShKv(pv, kFt).v === 1);
  w._p2ShM(pv).man.ft = 4;
  c('10月も手で入れた数があればそちら', w._p2ShKv(pv, kFt).v === 4);
  c('今週の数（10月の予定は入る・11月の予定は入らない）', w._p2ActAuto(ym, 'ft', '2026-10-01', '2026-11-30') === 1);
});
