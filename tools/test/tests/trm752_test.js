// v752：分析 › 研修で表示する月を選べる
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login();
  const cur = w.state.currentMonth || w.currentMonthStr(), pm = w.addMonths(cur, -1), d = mon => mon.replace('.', '-') + '-05';
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'G', parentId: '', mapType: 'both' },
    { id: 'a', lastName: '佐藤', firstName: '花', title: '', trainee: true, parentId: 'r', mapType: 'both', traineeHistory: [{ status: 'マケ', date: d(pm) }, { status: 'PG', date: d(pm) }] }];
  setWH(390, 844); w._uxSync && w._uxSync(); w.switchView('stats'); await sleep(30); w.dtTab('train'); await sleep(40);
  const ch = $$('#dtTrain .dt-trm span');
  c('上に月のチップ（12ヶ月・新しい月から・今月が選ばれている）', ch.length === 12 && /今月/.test(ch[0].textContent) && ch[0].classList.contains('on'));
  ch[1].click(); await sleep(20);
  c('先月を押すと先月のフロー・数字に', w._dtTrIdx === 10 && /月の研修フロー/.test($('#dtTrain').textContent) && $$('#dtTrain .dt-trm span')[1].classList.contains('on') && /今月に戻す/.test($('#dtTrain').textContent));
  c('先月のマケ・PGが出る', w._dtTrData()[10]['マケ'] === 1 && /1人/.test($('#dtTrain .dt-funnel').textContent));
  $$('#dtTrain .dt-trm span')[0].click(); await sleep(20);
  c('今月に戻る', w._dtTrIdx === 11);
});
