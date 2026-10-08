// v753：フロント追加で研修生を選ぶと、研修の日・Aさんが「研修生」のカードの中に出る（今日／昨日／日付）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'g', lastName: '山内', firstName: '北斗', title: 'ゴールド', parentId: '', mapType: 'both' }];
  w.switchView('current'); await sleep(20);
  w.naOpen('g'); await sleep(5); w.naTitle('PG'); await sleep(5);
  const card = $$('#naPg .ttc').find(x => /研修生/.test(x.querySelector('.hd').textContent));
  c('研修生のカードの中に「研修の記録」', !!card && !!card.querySelector('.tre #naDate') && !!card.querySelector('.tre #naAsan'));
  c('最初は「今日」・進んだで入ると出る', card.querySelector('.dch .on').textContent === '今日' && /進んだ/.test(card.querySelector('.tre .st').textContent));
  $$('#naPg .dch span')[1].click(); await sleep(5);
  const td = w.evTodayYmd(), yd = w.evYmd(new Date(Date.parse(td.replace(/-/g, '/')) - 864e5));
  c('昨日を押すと昨日', w._na.date === yd && $('#naPg .dch .on').textContent === '昨日');
  $('#naLast').value = '佐藤'; $('#naAsan').value = '山内'; w.naSave(''); await sleep(10);
  const m = w.state.members.find(x => x.lastName === '佐藤');
  c('保存すると昨日の日付・進んだ・Aさん', m.traineeHistory[0].date === yd && m.traineeHistory[0].result === 'next' && m.aSan === '山内');
  w.naOpen('g'); await sleep(5); w.naTitle('B1'); await sleep(5);
  c('研修生以外は研修の記録を出さない（稼働・GSV）', !$('#naPg .tre') && !!$('#naGsv'));
});
