// v761：やること → 立案（名前・ⓘの説明）・期間（月間/中期/長期）と名前で探す・期日は計画シートと同じ窓（ToDo／予定）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'G', parentId: '', mapType: 'both' }, { id: 'a', lastName: '井上', firstName: '花', title: 'LOI', parentId: 'r', mapType: 'both' }];
  w.switchView('plan'); w.p2Go(''); await sleep(20);
  c('v786：PLANの入口に「立案」は出さない', !$$('.ux-tile').some(x => /立案/.test(x.textContent)));
  w.p2Go('yk'); await sleep(30);
  c('ページの名前は「立案」', /PLAN › 立案/.test($('.ux-crumb').textContent));
  const ib = $('.ux-top .ux-ib'); c('ⓘがある', !!ib);
  ib.click(); await sleep(10);
  c('ⓘの説明', /月間、中期、長期のタスクを管理するページです。書いた後にToDo、カレンダーに追加することもできます。/.test($('#uxInfo').textContent)); w.uxInfoClose();
  const cur = w._p2Ym(0);
  const add = (t, ym, who) => { w._p2YkAddYm = ym; w._p2YkAddWho = who || 'me'; $('#p2YkIn').value = t; w.p2YkAdd(); };
  add('本を2冊読む', cur); add('井上さんの審査フォロー', w._p2YmAdd(cur, 2), 'a'); add('家を買う', 'someday'); add('合宿の準備', w._p2YmAdd(cur, 9));
  await sleep(20);
  const per = async k => { w._p2YkPer = k; w.renderPlan(); await sleep(10); return $('#p2YkList').textContent; };
  let tx = await per('m'); c('月間＝今月だけ', /本を2冊/.test(tx) && !/審査フォロー/.test(tx) && !/家を買う/.test(tx));
  tx = await per('mid'); c('中期＝来月〜6ヶ月先', /審査フォロー/.test(tx) && !/本を2冊/.test(tx) && !/家を買う/.test(tx) && !/合宿/.test(tx));
  tx = await per('long'); c('長期＝7ヶ月先〜・いつか', /家を買う/.test(tx) && /合宿/.test(tx) && !/本を2冊/.test(tx));
  tx = await per(''); c('すべて', /本を2冊/.test(tx) && /家を買う/.test(tx));
  const q = $('#p2YkQ'); q.value = '井上'; q.dispatchEvent(new w.Event('input')); await sleep(10);
  tx = $('#p2YkList').textContent; c('人の名前で探す', /審査フォロー/.test(tx) && !/本を2冊/.test(tx) && $('#p2YkQ') === q);
  q.value = '本'; q.dispatchEvent(new w.Event('input')); await sleep(10);
  tx = $('#p2YkList').textContent; c('やることの名前で探す', /本を2冊/.test(tx) && !/審査フォロー/.test(tx));
  q.value = 'ぜんぜんない'; q.dispatchEvent(new w.Event('input')); await sleep(10);
  c('見つからない時', /見つかりません/.test($('#p2YkList').textContent));
  w._p2YkQ = ''; w.renderPlan(); await sleep(10);
  // 期日：計画シートと同じ窓
  const t1 = w.state.events.find(e => e.title === '本を2冊読む');
  const chip = $$('.yk-r .ykd').find(x => x.closest('.yk-r').textContent.indexOf('本を2冊') >= 0);
  c('期日は未設定（勝手に入らない）', !!chip && /期日/.test(chip.textContent) && !t1.date);
  chip.click(); await sleep(10);
  c('期日の窓（ToDo／予定を選ぶ）', !!$('#p2ShDtOv') && /ToDo/.test($('#p2ShDtOv').textContent) && /予定/.test($('#p2ShDtOv').textContent) && /日付だけ/.test($('#p2ShDtOv').textContent) /* v787: 3択 */);
  const nx = w._p2YmAdd(cur, 1), d1 = nx + '-12';
  $('#p2ShDtD').value = d1; w.p2ShDtOk(); await sleep(10);
  c('ToDoに入る（期日の月へ移る）', t1.type === 'task' && t1.date === d1 && t1.planYm === nx && $$('.ykd.td').some(x => /\d+\/12/.test(x.textContent)));
  const t2 = w.state.events.find(e => e.title === '家を買う');
  w.p2YkDt(t2.id); await sleep(10); w.p2ShDtKind('ev'); await sleep(10);
  $('#p2ShDtD').value = d1; $('#p2ShDtT').value = '19:00'; w.p2ShDtOk(); await sleep(10);
  c('予定に入る（立案にも残る）', t2.type === 'event' && t2.time === '19:00' && t2.endTime === '20:00' && w._p2YkTasks().indexOf(t2) >= 0 && $$('.ykd.ev').some(x => /\d+\/12 19:00/.test(x.textContent)));
  w.p2YkDone(t2.id); await sleep(10); c('予定にしたものも□で済み', t2.done === true);
  // 書いてすぐ期日
  $('#p2YkIn').value = 'CT取り5件'; w.p2YkAddDt(); await sleep(10);
  const t3 = w.state.events.find(e => e.title === 'CT取り5件');
  c('足す欄の「📅 期日」：足して、そのまま期日の窓', !!t3 && !!$('#p2ShDtOv') && /CT取り5件/.test($('#p2ShDtOv .tt').textContent)); w.p2ShDtX();
  // 直す画面の期日
  w.p2YkOpen(t1.id); await sleep(10);
  c('直す画面の期日も同じ窓のボタン', !!$('.yk-fm .ykd.big') && !$('.yk-fm input[type=date]'));
  // PC
  setWH(1400, 900); w._uxSync && w._uxSync(); w.switchView('plan'); w.p2Go('yk'); await sleep(30);
  c('PC：見出し「立案」とⓘ', /立案/.test(($('.pcx-h h2') || {}).textContent || '') && !!$('.pcx-h .ux-ib'));
});
