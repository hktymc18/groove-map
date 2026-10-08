// v749：MAPで研修生の人は、研修の記録がまだ無くても分析 › 研修の「研修生」に数える
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login();
  const cur = w.state.currentMonth || w.currentMonthStr(), ymd = cur.replace('.', '-') + '-05';
  w.state.members = [
    { id: 'r', lastName: '山内', firstName: '北斗', title: 'G', parentId: '', mapType: 'both' },
    { id: 't1', lastName: '佐藤', firstName: '花', title: '', trainee: true, parentId: 'r', mapType: 'both' },                    // 記録なし
    { id: 't2', lastName: '田中', firstName: '健', title: '', trainee: true, parentId: 'r', mapType: 'both', traineeHistory: [{ status: 'PG', date: ymd, result: 'planned' }] }, // 予定だけ
    { id: 't3', lastName: '森', firstName: '一', title: '', trainee: true, parentId: 'r', mapType: 'both', traineeHistory: [{ status: 'マケ', date: ymd }] }, // 記録あり
    { id: 'o', lastName: '木村', firstName: '空', title: 'OUT', trainee: true, parentId: 'r', mapType: 'both' }];
  c('MAPの研修生は3人（OUTは除く）', w.state.members.filter(m => w.memberCat(m) === '研修生' && m.title !== 'OUT').length === 3);
  const M = w._dtTrMonth(cur);
  c('今月の研修生＝3人（記録なし・予定だけの人も）', M.n === 3);
  c('じょうごは記録がある人だけ（マケ1人）', M['マケ'] === 1 && M.PG === 0);
  setWH(390, 844); w._uxSync && w._uxSync(); w.switchView('stats'); await sleep(30); w.dtTab('train'); await sleep(40);
  c('研修タブのタイルに 3人', /研修生\s*3/.test($('#dtTrain').textContent.replace(/\s+/g, ' ')) || $$('#dtTrain .an-t.big b')[0].textContent.indexOf('3') === 0);
  w.state.members.forEach(m => { if (m.id !== 'r') m.traineeHistory = []; });
  w._dtTrRender(); await sleep(10);
  c('記録が無い時は「研修生は N人いますが、記録はまだ」', /研修生は 3人いますが/.test($('#dtTrain').textContent));
});
