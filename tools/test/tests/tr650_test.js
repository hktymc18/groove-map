// v650：研修タブを推移と同じ形に（上にグラフ・下に選んだ月のタイル）。予定・削除した人は数えない
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login();
  const cm = w.state.currentMonth, cd = cm.replace('.', '-'), pm = w.addMonths(cm, -1).replace('.', '-');
  const ms = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'ゴールド', parentId: '', mapType: 'both' }];
  for (let i = 0; i < 6; i++) ms.push({ id: 't' + i, lastName: '研修' + i, title: 'PG', parentId: 'r', mapType: 'both', trainee: true,
    traineeHistory: [{ status: 'PG', date: (i < 2 ? pm : cd) + '-05', result: 'next', aSan: 'A' }, { status: 'DLR', date: cd + '-12', result: i === 5 ? 'planned' : 'next', aSan: 'A' }].concat(i < 2 ? [{ status: 'BPC', date: cd + '-20', result: 'next' }] : []),
    traineeResult: i < 2 ? 'BC' : (i === 2 ? '流れた' : ''), traineeResultMonth: i < 3 ? cm : '' });
  ms.push({ id: 'del', lastName: '削除', title: 'PG', parentId: 'r', mapType: 'both', trainee: true, deleted: true, traineeHistory: [{ status: 'PG', date: cd + '-03', result: 'next' }] });
  w.state.members = ms;
  setWH(390, 844); w._uxSync && w._uxSync(); w.switchView('menu'); w.switchView('stats'); w.dtTab('train'); await sleep(30);
  const M = w._dtTrMonth(cm), P = w._dtTrMonth(w.addMonths(cm, -1));
  c('今月：研修生6・PG4・DLR5（予定の1人は数えない）・BPC2・BC2・流れた1・決定率67%', M.n === 6 && M.PG === 4 && M.DLR === 5 && M.BPC === 2 && M.BC === 2 && M['流れた'] === 1 && M.rate === 67);
  c('削除した人は数えない・先月のPGは先月に', P.PG === 2 && !M.L.PG.some(m => m.id === 'del'));
  c('推移と同じ形：項目のボタン・グラフ・月の数字のタイル', $$('#dtTrain .dt-chips .dt-chip').length === w.DT_TR_K.length && !!$('#dtTrain .dt-chart') && $$('#dtTrain .an-t.big').length === 4 && $$('#dtTrain .an-g.sm .an-t').length === 8);
  w.dtTrTile('DLR'); await sleep(5);
  c('タイルを押すとグラフがその項目に', w._dtTrSel.join() === 'DLR' && $('#dtTrain .dt-th').textContent.indexOf('DLR') >= 0);
  w.dtTrPick(10); await sleep(5);
  c('グラフの月を選ぶとタイルもその月', $('#dtTrain .an-sec').textContent.indexOf('今月に戻す') >= 0);
  w.dtTrPick(11);
  c('推移タブのグラフ・選択は変わらない', w._dtSel.indexOf('DLR') < 0 && w._dtSrc === null);
  c('Aさん別は下に残る', $('#dtTrain').textContent.indexOf('Aさん別') >= 0);
});
