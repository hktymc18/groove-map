// v814（#19）：研修の記録を押した時のシートに「直す」。ステップ・日にち・Aさん・結果（フォローは内容）を直せる
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  const fut = w._ppYmd(6), fut2 = w._ppYmd(8);
  w.state.members = [{ id: 'r', lastName: '架空', firstName: '一郎', title: 'BR', parentId: '', mapType: 'both' },
    { id: 't', lastName: '試験', firstName: '二郎', title: 'DLR', parentId: 'r', mapType: 'both', trainee: true,
      traineeHistory: [{ status: 'PG', date: '2026-10-14', aSan: '見本三郎', result: 'next' }, { status: 'DLR', date: '2026-10-14', aSan: '見本三郎', result: 'next' },
        { status: 'PA', date: fut, aSan: '見本三郎', result: 'planned', evId: 'ev1' }, { status: 'ごはんフォロー', date: '2026-10-10', aSan: '', result: 'next', ir: true }] }];
  w.state.events = [{ id: 'ev1', type: 'event', title: 'PA', date: fut, memberIds: ['t'] }];
  w.switchView('current'); await sleep(30);
  const M = () => w.state.members.find(x => x.id === 't'), H = () => M().traineeHistory;
  w.openEdit('t'); await sleep(20); w.ppGo('tr'); await sleep(20);
  // ① 予定の記録（PA）：メニューに「直す」
  w.ppTrMenu(2); await sleep(5);
  c('記録のメニューに「直す」がある', /直す/.test($('#ppSh').textContent) && /進んだ/.test($('#ppSh').textContent));
  w.ppTrEdit(2); await sleep(5);
  c('直すシートが開く（いまの内容が入っている）', /記録を直す/.test($('#ppSh').textContent) && $('#ppShA').value === '見本三郎' && $('#ppSh .ppch span.on').textContent === 'PA' && $('#ppShDate').value === fut);
  $('#ppShA').value = '例題四郎'; w.ppShDate(fut2); await sleep(5);
  w.ppShSave(); await sleep(20);
  const pa = H()[2];
  c('Aさん・日にちを直せる（予定のまま）', pa.aSan === '例題四郎' && pa.date === fut2 && pa.result === 'planned' && !$('#ppSh'));
  c('カレンダーの予定とつながっていた記録は切り離す（予定を保存しても戻らない）', !pa.evId && w.state.events[0].tsOff && w.state.events[0].tsOff.t === 1);
  w.saveEventDoc(w.state.events[0]); await sleep(10);
  c('予定を保存しても直した内容のまま', H()[2].date === fut2 && H()[2].aSan === '例題四郎');
  c('画面の記録も新しい内容', $$('#ppPg .pprc').some(x => /例題四郎/.test(x.textContent)));
  // ② 済んだ記録（DLR）：ステップ・日にちを直す
  w.ppTrMenu(1); await sleep(5);
  c('済んだ記録にも「直す」', /直す/.test($('#ppSh').textContent));
  w.ppTrEdit(1); w.ppShSet('step', 'EXP'); w.ppShDate('2026-09-15'); await sleep(5);
  w.ppShSave(); await sleep(20);
  c('ステップと日にちを直せる', H()[1].status === 'EXP' && H()[1].date === '2026-09-15' && H()[1].result === 'next');
  c('タイトルも進んだステップに合わせる', M().title === 'EXP');
  // ③ 結果を直す（予定→進んだ は今までと同じ処理）
  const iPa = 2;
  w.ppTrEdit(iPa); w.ppShSet('res', 'next'); await sleep(5); w.ppShSave(); await sleep(30);
  c('結果を進んだに直すとタイトルも PA に', H()[iPa].result === 'next' && M().title === 'PA');
  // ④ フォローの記録は内容を直す（ステップの選択は出ない）
  w.ppTrEdit(3); await sleep(5);
  c('フォローは内容の欄（ステップの選択なし）', $('#ppShFr').value === 'ごはんフォロー' && !$$('#ppSh .ppch span').some(x => x.textContent === 'PG'));
  $('#ppShFr').value = '電話で状況確認'; w.ppShSave(); await sleep(10);
  c('フォローの内容を直せる', H()[3].status === '電話で状況確認' && H()[3].ir === true);
  $('#ppShFr') && w._ppShClose();
  w.ppTrEdit(3); $('#ppShFr').value = ''; w.ppShSave(); await sleep(5);
  c('内容が空なら直さない', H()[3].status === '電話で状況確認' && !!$('#ppSh'));
  w._ppShClose();
  // ⑤ 日程調整中：日にちを選ばなければ調整中のまま
  H().push({ status: 'BPC', date: '', aSan: '', result: 'planned', tbd: true }); const iB = H().length - 1; w._ppRender();
  w.ppTrEdit(iB); $('#ppShA').value = '見本三郎'; w.ppShSave(); await sleep(10);
  c('日程調整中はAさんだけ直しても調整中のまま', H()[iB].tbd === true && H()[iB].aSan === '見本三郎' && !H()[iB].date);
  w.ppTrEdit(iB); w.ppShDate(fut); w.ppShSave(); await sleep(10);
  c('日にちを選ぶとその日の予定に', !H()[iB].tbd && H()[iB].date === fut && H()[iB].result === 'planned');
  // ⑥ 何も変えずに保存
  const before = JSON.stringify(H());
  w.ppTrEdit(0); w.ppShSave(); await sleep(5);
  c('何も変えなければそのまま', JSON.stringify(H()) === before && !$('#ppSh'));
});
