// v804：メンバー編集の活動は直近1か月だけ。それより前に終わった分はたたむ（「それより前の活動を見る」）。終わっていないものは古くても出す
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  const d = n => w._ppYmd(n);
  w.state.members = [{ id: 'r', lastName: '永尾', firstName: '歩夢', title: 'BR', parentId: '', mapType: 'both' },
    { id: 'a', lastName: '別所', firstName: '星哉', title: 'B3', parentId: 'r', mapType: 'both' }];
  w.state.freshData = { a: { olLog: [{ date: d(-70), what: '決起会', asan: '美沙子' }, { date: d(-60), what: '上映会' }, { date: d(-5), what: '個別相談' }, { date: d(-50), what: '古い企画', st: 'planned' }] } };
  w.state.events = [{ id: 'e1', title: '昔の終わったタスク', type: 'task', date: d(-45), done: true, memberId: 'a' },
    { id: 'e2', title: '昔のまだのタスク', type: 'task', date: d(-45), memberId: 'a' },
    { id: 'e3', title: 'ランチ', date: d(10), memberId: 'a' }, { id: 'e4', title: '昔の予定', date: d(-40), memberId: 'a' }];
  w.switchView('current'); await sleep(30);
  w.openEdit('a'); await sleep(20);
  const actTile = $('#ppPg [onclick="ppGo(\'act\')"]');
  c('活動のタイルは直近の件数（4件）', /4件/.test(actTile.textContent));
  actTile.click(); await sleep(20);
  const tx = () => $('#ppPg').textContent;
  c('直近1か月・これからの予定・まだのタスク・予定のOLは出る', /個別相談/.test(tx()) && /ランチ/.test(tx()) && /昔のまだのタスク/.test(tx()) && /古い企画/.test(tx()));
  c('1か月より前に終わったもの（OLの記録・済みのタスク・過ぎた予定）は出ない', !/決起会/.test(tx()) && !/上映会/.test(tx()) && !/昔の終わったタスク/.test(tx()) && !/昔の予定/.test(tx()));
  c('「それより前の活動を見る（4件）」', /それより前の活動を見る（4件）/.test(tx()));
  c('すべての件数も直近の分', /すべて\s*4/.test($('#ppPg .ppfil').textContent));
  $$('#ppPg .pplk').find(x => /それより前/.test(x.textContent)).click(); await sleep(20);
  c('押すと古い分も出る・たたむに', /決起会/.test(tx()) && /昔の予定/.test(tx()) && /1か月より前の活動をたたむ/.test(tx()) && /すべて\s*8/.test($('#ppPg .ppfil').textContent));
  $$('#ppPg .pplk').find(x => /たたむ/.test(x.textContent)).click(); await sleep(20);
  c('たたむと戻る', !/決起会/.test(tx()));
  // 直近が0件
  w.state.freshData.a.olLog = [{ date: d(-70), what: '決起会' }]; w.state.events = []; w._ppRender(); await sleep(10);
  c('直近が無い時は「直近1か月の活動はありません」＋見るボタン', /直近1か月の活動はありません/.test(tx()) && /それより前の活動を見る（1件）/.test(tx()));
});
