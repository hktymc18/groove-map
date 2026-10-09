// v772：理想MAPのかんたん編集を作り直し（足すと閉じる・タイトルは大きいタイル・BMはB11の後・GSVは3桁区切り）
const T = require('../lib/head.js')();
const { w, c, sleep, $, $$ } = T;
T.run(async () => {
  T.login();
  w.state.members = [{ id: 'r', lastName: '本田', firstName: '圭佑', title: 'ラピス', parentId: '', mapType: 'both', ptCurrent: 11120, activity: 'S', actRate: 100 },
    { id: 'a', lastName: '鈴木', firstName: '一', title: 'B2', parentId: 'r', mapType: 'both', ptCurrent: 800 }];
  w.state.idealMembers = [];
  w.switchView('ideal'); await sleep(30);
  w.idqOpen('r'); await sleep(20);
  c('シートが開く（名前・タイトル・現状）', !!$('#idqOv') && /本田 圭佑/.test($('.iq-nm').textContent) && /現状 ラピス・11,120P・S 100%/.test($('.iq-hn small').textContent));
  const tiles = $$('#idqTitles .idq-s').map(e => e.dataset.v);
  c('タイトルは25個のタイル', tiles.length === 25, tiles.length);
  c('BMはB11の後ろ', tiles.indexOf('BM') === tiles.indexOf('B11') + 1);
  c('1段目は LOI・Q2〜Q4・BR', $$('.iq-tl')[0].textContent === 'LOIQ2Q3Q4BR');
  c('今のタイトル（ラピス）が選ばれている', $('#idqTitles .idq-s.sel').dataset.v === 'ラピス');
  c('GSVは3桁区切り', $('#idqGsv').value === '11,120');
  w.idqStep(500); await sleep(10);
  const r = w.state.idealMembers.find(x => x.id === 'r');
  c('＋で500増える', $('#idqGsv').value === '11,620' && r.ptCurrent === 11620);
  w.idqGsvSet('12,000'); await sleep(10);
  c('区切り付きで入れても読める', r.ptCurrent === 12000);
  w.idqClose(true); w.idqOpen('a'); await sleep(20);
  w.idqTitle('BM'); await sleep(10);
  c('タイトルを押すと選び直し・見出しの色も変わる', $('#idqTitles .idq-s.sel').dataset.v === 'BM' && $('.iq-tp').textContent === 'BM' && /#C583FF/i.test($('#idqHd').getAttribute('style')), $('#idqHd').getAttribute('style'));
  w.idqClose(true); w.idqOpen('r'); await sleep(20);
  w.idqAct('A'); w.idqRate(50); await sleep(10);
  c('稼働・稼働率', r.activity === 'A' && r.actRate === 50 && $('#idqActs .sel').dataset.a === 'A' && $('#idqRates .sel').dataset.r === '50');
  // 足すと閉じる
  const n0 = w.state.idealMembers.length;
  $('.iq-ab.biz').click(); await sleep(30);
  const nw = w.state.idealMembers.filter(x => x.idealNew);
  c('ビジネスを押すと1人足して閉じる', w.state.idealMembers.length === n0 + 1 && nw.length === 1 && nw[0].parentId === 'r' && nw[0].title === 'LOI' && !$('#idqOv.show'));
  await sleep(250);
  c('シートが消える', !$('#idqOv'));
  w.idqOpen('a'); await sleep(20);
  $('#idqUserPt').value = '350'; $('.iq-ab.usr').click(); await sleep(30);
  const u = w.state.idealMembers.filter(x => x.idealKind === 'user');
  c('ユーザーは入れたPで1人足して閉じる', u.length === 1 && u[0].parentId === 'a' && u[0].ptCurrent === 350);
  w.idqUndoAdd(u[0].id); await sleep(20);
  c('元に戻す', !w.state.idealMembers.some(x => x.idealKind === 'user'));
  // 新しい人：名前と「消す」
  w.idqOpen(nw[0].id); await sleep(20);
  c('新しい人は名前欄と「この新しい人を消す」', !!$('#idqLast') && /この新しい人を消す/.test($('.iq-ft').textContent));
  w.idqClose(true);
  // スマホの理想MAPも同じシート
  w.ppOpen('a', 'ideal'); await sleep(20);
  c('スマホの理想MAP（メンバーページ）も同じかんたん編集', !!$('#idqOv .iq-add') && !$('#ppPg'));
  w.idqClose(true);
  // 現状MAPで名前を変えたら、理想MAPの同じ人も同じ名前に（理想の数字はそのまま）
  const cm = w.state.members.find(x => x.id === 'a'); cm.lastName = '平'; cm.firstName = '愛梨';
  const im = w.state.idealMembers.find(x => x.id === 'a'); const t0 = im.title;
  const L = w.membersForMap('ideal').find(x => x.id === 'a');
  c('現状で変えた名前が理想MAPにも出る（タイトルは理想のまま）', L.lastName === '平' && L.firstName === '愛梨' && L.title === t0);
  const nn = w.state.idealMembers.find(x => x.idealNew);
  c('理想で足した新しい人の名前は変えない', nn && /新規/.test(nn.lastName));
});
