// v745：新規B1の平均GSV／グラフはふだん1つ・「⇄ 比較」の時だけ2つ
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login();
  const cur = w.state.currentMonth || w.currentMonthStr();
  w.state.members = [
    { id: 'r', lastName: '山内', firstName: '北斗', title: 'G', parentId: '', mapType: 'both', ptCurrent: 30000 },
    { id: 'a', lastName: '佐藤', firstName: '花', title: 'B1', parentId: 'r', mapType: 'both', ptCurrent: 300 },
    { id: 'b', lastName: '田中', firstName: '健', title: 'LOI', parentId: 'r', mapType: 'both', ptCurrent: 500, traineeResult: 'BC', traineeHistory: [{ status: 'BC', date: cur.replace('.', '-') + '-03' }] },
    { id: 'c', lastName: '森', firstName: '一', title: 'BR', parentId: 'r', mapType: 'both', ptCurrent: 9000 }];
  const cnt = w._dtAutoCounts(w.state.members, w.state.members, cur);
  c('新規B1（タイトルB1・その月にBC）の平均GSV', cnt.b1n === (w.traineeDecidedMonth(w.state.members[2]) === cur ? 2 : 1) && cnt.b1g === (cnt.b1n === 2 ? 400 : 300));
  setWH(390, 844); w._uxSync && w._uxSync(); w.switchView('stats'); await sleep(30); w.dtTab('trend'); await sleep(30);
  c('タイルに「新規B1の平均GSV」', /新規B1の平均GSV/.test($('#dtTrend').textContent));
  w.dtToggleMetric('S'); await sleep(10);
  c('ふだんは押した1つだけ', w._dtSel.join() === 'S' && $$('#dtTrend .dt-thi').length === 1);
  w.dtToggleMetric('B1'); await sleep(10);
  c('別のを押すと切りかわる（比較しない）', w._dtSel.join() === 'B1');
  c('「⇄ 比較」ボタン', /⇄ 比較/.test($('#dtTrend .dt-cmp').textContent));
  w.dtCmp(); await sleep(10);
  w.dtToggleMetric('S'); await sleep(10);
  c('比較中はもう1つ足して2つ', w._dtSel.join() === 'B1,S' && $$('#dtTrend .dt-thi').length === 2 && /比較中/.test($('#dtTrend .dt-cmp').textContent));
  w.dtToggleMetric('総人数'); await sleep(10);
  c('比較中に3つ目を押すと2つ目が入れかわる', w._dtSel.join() === 'B1,総人数');
  w.dtCmp(); await sleep(10);
  c('比較をやめると1つに戻る', w._dtSel.join() === 'B1' && $$('#dtTrend .dt-thi').length === 1);
  // 研修も同じ
  w.dtTab('train'); await sleep(30);
  w.dtTrMetric('PG'); await sleep(10);
  c('研修もふだんは1つ', w._dtTrSel.join() === 'PG');
  w.dtCmp(true); w.dtTrMetric('BC'); await sleep(10);
  c('研修も比較中だけ2つ', w._dtTrSel.join() === 'PG,BC');
  w.dtCmp(false);
});
