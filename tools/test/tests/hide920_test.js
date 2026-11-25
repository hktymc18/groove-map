// v920：名前を直してすぐアプリを閉じても（iPhone で上にスワイプ）、画面が隠れた時点で書き込みを始める。名前はすべて架空
const T = require('../lib/head.js')({ now: '2026-11-25T03:00:00Z' });
const { w, c, sleep, setWH, $ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '見本', firstName: '太郎', title: 'BR', parentId: '', mapType: 'both', startMonth: '2026.01' },
    { id: 'a', lastName: '架空', firstName: 'ゆめ', title: 'B1', parentId: 'r', mapType: 'both', startMonth: '2026.01' }];
  w._fsReady = w.currentUser.uid + '|' + w.state.currentMonth; // 自分の MAP を読み終えた状態
  const log = [];
  const realDoc = w.db.doc.bind(w.db);
  w.db.doc = p => { const d = realDoc(p);
    d.get = o => { log.push('get:' + ((o && o.source) || 'server')); return o && o.source === 'cache' ? Promise.resolve({ exists: false, data: () => null }) : new Promise(() => {}); }; // サーバーは返ってこない（止められた）
    d.set = data => { if (/_current$/.test(p)) log.push('set:' + data.members.find(m => m.id === 'a').firstName); return new Promise(() => {}); };
    return d; };
  // 名前を直す
  w.switchView('current'); await sleep(80); w.mxTap('a'); await sleep(80); w.ppGo('prof'); await sleep(60);
  $('#ppNmA').value = '架空'; $('#ppNmB').value = '梨夢'; w.ppName(); await sleep(20);
  c('直した直後はまだ書き込んでいない（1.5秒まとめて保存）', !log.some(x => /^set/.test(x)), log.join());
  // すぐ上にスワイプ → 画面が隠れる
  log.length = 0; // プロフィールを開いた時の読み取りは数えない
  Object.defineProperty(w.document, 'hidden', { configurable: true, get: () => true });
  w.document.dispatchEvent(new w.Event('visibilitychange')); await sleep(20);
  c('画面が隠れたらサーバーを待たずに（端末の控えで）すぐ書き込みを始める', log.indexOf('set:梨夢') >= 0 && !log.includes('get:server'), log.join());
  Object.defineProperty(w.document, 'hidden', { configurable: true, get: () => false });
  // ふだんの保存はこれまで通りサーバーを読んでから
  log.length = 0; w.state.members.find(m => m.id === 'a').firstName = '直した2'; w.autoSave(); w.flushPendingSave(); await sleep(20);
  c('ふだんの保存はサーバーを読んでから（ほかの画面の変更を消さない）', log.includes('get:server') && !log.some(x => /^set/.test(x)), log.join());
});
