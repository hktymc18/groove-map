// v750：かんたん追加（フロント追加）で研修生を足したら、選んだ研修の段階を「✓ 進んだ」で研修履歴に
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'g', lastName: '山内', firstName: '北斗', title: 'ゴールド', parentId: '', mapType: 'both' }];
  w.switchView('current'); await sleep(20);
  const td = w.evTodayYmd(), past = w.evYmd(new Date(Date.parse(td) - 3 * 864e5)), fut = w.evYmd(new Date(Date.parse(td) + 5 * 864e5));
  const add = async (nm, d, title) => {
    w.naOpen('g'); await sleep(5); if (title) { w.naTitle(title); await sleep(5); }
    $('#naLast').value = nm; $('#naFirst').value = '一'; if ($('#naDate')) $('#naDate').value = d;
    w.naSave(''); await sleep(10);
    return w.state.members.find(m => m.lastName === nm);
  };
  const a = await add('佐藤', past);
  c('過去の日：マケ ✓進んだ', a.traineeHistory.length === 1 && a.traineeHistory[0].status === 'マケ' && a.traineeHistory[0].result === 'next' && a.traineeHistory[0].date === past);
  const b = await add('田中', '');
  c('日付なし：今日の日付で ✓進んだ', b.traineeHistory.length === 1 && b.traineeHistory[0].date === td && b.traineeHistory[0].result === 'next');
  const f = await add('森', fut);
  c('先の日：予定のまま', f.traineeHistory[0].result === 'planned' && f.traineeHistory[0].date === fut);
  const cur = w.state.currentMonth || w.currentMonthStr();
  c('分析 › 研修のじょうご（マケ）にも入る', w._dtTrMonth(cur)['マケ'] >= 2);
  // 旧かんたん追加の保存（qaSave）も同じ
  const m = { traineeHistory: [] }; w._qaTrStep(m, 'BPC', past);
  c('BPCで進んだ → 研修結果はBC', m.traineeHistory[0].result === 'next' && m.traineeResult === 'BC');
});
