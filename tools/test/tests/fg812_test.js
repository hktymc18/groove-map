// v812（#17）：共有（結合）メンバーにカーソルを合わせた時、自分のMAPでその人に付けた予定・タスクも出す（「予定・タスクはありません」と出ていた）
const T = require('../lib/head.js')();
const { w, c, sleep } = T;
T.run(async () => {
  T.login();
  w.document.body.dispatchEvent(Object.assign(new w.Event('pointerdown', { bubbles: true }), { pointerType: 'mouse' }));
  const OU = 'abcdef999';
  w.state.members = [{ id: 'r', lastName: '架空', firstName: '一郎', title: 'BR', parentId: '', mapType: 'both' }];
  w.state.mergedMaps = [{ uid: OU, graftId: 'r', name: '試験' }];
  w.state.mergedData = { [OU]: [{ id: 's1', lastName: '試験', firstName: '二郎', title: 'BR', parentId: '' }, { id: 's2', lastName: '見本', firstName: '三郎', title: 'B3', parentId: 's1' }] };
  const mid = 'MG_abcdef_s2', today = w.evTodayYmd();
  let ownerEv = [], deny = false;
  const fg = w.fsGetCol;
  w.fsGetCol = p => p === 'maps/' + OU + '/events' ? (deny ? Promise.reject(new Error('denied')) : Promise.resolve(ownerEv)) : fg(p);
  const tipTx = async () => { w._mgFindCache = null; w._fgnEv = {}; w.showPcTooltip(mid, { clientX: 50, clientY: 50 }); await sleep(30); const t = w.document.getElementById('pcTooltip'); return t ? t.textContent : ''; };
  // ① 持ち主のMAPには無く、自分のMAPで付けたタスクだけある
  w.state.events = [{ id: 'e1', type: 'task', title: 'フォローの電話', date: today, done: false, memberId: mid }];
  let tx = await tipTx();
  c('自分のMAPで付けたタスクが出る（「ありません」と出ない）', /フォローの電話/.test(tx) && tx.indexOf('予定・タスクはありません') < 0);
  // ② 持ち主の予定＋自分の分の両方
  ownerEv = [{ id: 'o1', type: 'event', title: '面談', date: today, memberId: 's2' }];
  tx = await tipTx();
  c('持ち主の予定と自分の分の両方が出る', /面談/.test(tx) && /フォローの電話/.test(tx) && /あなたの分/.test(tx));
  // ③ 読めない共有でも、自分の分は出る
  deny = true; tx = await tipTx();
  c('持ち主の予定が読めない時も自分の分は出る', /フォローの電話/.test(tx));
  // ④ 本当に無い時は今までどおり
  deny = false; ownerEv = []; w.state.events = [{ id: 'e2', type: 'task', title: '別の人', date: today, memberId: 'r' }];
  tx = await tipTx();
  c('どちらにも無い時は「予定・タスクはありません」', tx.indexOf('予定・タスクはありません') >= 0 && !/別の人/.test(tx));
  // ⑤ 「自分のみ」の予定は出さない
  w.state.events = [{ id: 'e3', type: 'task', title: '自分だけのメモ', date: today, memberId: mid, vis: 'self' }];
  tx = await tipTx();
  c('「自分のみ」の予定は出さない', !/自分だけのメモ/.test(tx));
  w.fsGetCol = fg;
});
