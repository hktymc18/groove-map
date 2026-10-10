// v789：理想MAPの「＋ 追加」は理想のかんたん追加（ビジネス／ユーザーを足す）。現状MAPのフロント追加を開いていた
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $ } = T;
T.run(async () => {
  T.login();
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'G', parentId: '', mapType: 'both' }, { id: 'a', lastName: '鈴木', firstName: '', title: 'B2', parentId: 'r', mapType: 'both' }];
  for (const [W, H, lb] of [[390, 844, 'スマホ'], [1440, 900, 'PC']]) {
    setWH(W, H); w._uxSync && w._uxSync();
    w.switchView('ideal'); await sleep(30);
    w._selectedCardId = '';
    w.onFabClick(); await sleep(20);
    c(lb + '：選んでいない時は自分の下の理想のかんたん追加', !!$('#idqOv') && !$('#naPg') && !$('#qaOv') && w._idq && w._idq.id === 'r' && /ビジネスを足す/.test($('#idqOv').textContent));
    w.idqClose(true); await sleep(10);
    w._selectedCardId = 'a'; w.onFabClick(); await sleep(20);
    c(lb + '：選んでいる人の下に', !!$('#idqOv') && w._idq.id === 'a');
    w.idqClose(true); await sleep(10);
    w.selectedParentId = 'a'; w.openQuickAdd(); await sleep(20);
    c(lb + '：「誰の直下に追加？」から選んでも理想のかんたん追加', !!$('#idqOv') && w._idq.id === 'a' && !$('#naPg'));
    w.idqClose(true); await sleep(10);
    const n0 = w.state.members.length;
    w.switchView('current'); await sleep(20); w._selectedCardId = '';
    w.onFabClick(); await sleep(20);
    c(lb + '：現状MAPは今までどおり（理想のかんたん追加は出さない）', !$('#idqOv') && w.state.members.length === n0);
    const na = $('#naPg'); if (na) w.naClose(); const qa = $('#qaOv'); if (qa) qa.remove(); w.closeFabMenu && w.closeFabMenu();
  }
});
