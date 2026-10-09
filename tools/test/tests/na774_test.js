// v774：名前を入れた後にタイトルを選んでも名前が消えない（フロント追加・理想のかんたん編集）
const T = require('../lib/head.js')();
const { w, c, sleep, $, $$ } = T;
T.run(async () => {
  T.login(); T.setWH(390, 844);
  w.state.members = [{ id: 'r', lastName: '本田', firstName: '圭佑', title: 'ラピス', parentId: '', mapType: 'both' }];
  w.naOpen('r'); await sleep(20);
  $('#naLast').value = '長友'; $('#naFirst').value = '佑都';
  // タイトルのカード（グループ）を押して開く → 名前が残る
  const hds = $$('#naPg .ttc .hd'); hds[hds.length - 1].click(); await sleep(10);
  c('カードを開いても名前が残る', $('#naLast').value === '長友' && $('#naFirst').value === '佑都');
  hds[0] && $$('#naPg .ttc .hd')[0].click(); await sleep(10);
  c('別のカードに切り替えても残る', $('#naLast').value === '長友' && $('#naFirst').value === '佑都');
  const it = $('#naPg .ttc.on .ls span, #naPg .ttc.on .ls div'); if (it) it.click(); await sleep(10);
  c('タイトルを選んでも残る', $('#naLast').value === '長友' && $('#naFirst').value === '佑都');
  w.naClose();
  // 理想のかんたん編集：新しい人の名前を入れて（欄から出ずに）タイトルを押す
  w.state.idealMembers = []; w.switchView('ideal'); await sleep(20);
  w.idqOpen('r'); await sleep(10); w.idqAdd('biz'); await sleep(250);
  const nw = w.state.idealMembers.find(x => x.idealNew);
  w.idqOpen(nw.id); await sleep(10);
  $('#idqLast').value = '香川'; $('#idqFirst').value = '真司';
  w.idqTitle('B1'); await sleep(10);
  c('理想：名前を入れてタイトルを押しても名前が入る', nw.lastName === '香川' && nw.firstName === '真司' && $('#idqLast').value === '香川');
  $('#idqFirst').value = '慎司'; w.idqClose(true); await sleep(10);
  c('理想：入れてすぐ閉じても名前が入る', nw.firstName === '慎司');
});
