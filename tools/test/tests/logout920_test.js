// v920：直したすぐ後にログアウトしても、保存の書き込みが終わってからログアウトする（名前が元に戻る対策）。名前はすべて架空
const T = require('../lib/head.js')({ now: '2026-11-25T03:00:00Z' });
const { w, c, sleep, setWH, $ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '見本', firstName: '太郎', title: 'BR', parentId: '', mapType: 'both', startMonth: '2026.01' },
    { id: 'a', lastName: '架空', firstName: 'ゆめ', title: 'B1', parentId: 'r', mapType: 'both', startMonth: '2026.01' }];
  const log = []; let finish = null, result = 'ok';
  w.fsSaveToFirestore = () => { log.push('save-start'); return new Promise((res, rej) => { finish = () => { log.push('save-done:' + w.state.members.find(m => m.id === 'a').firstName); result === 'ok' ? res() : rej(new Error('net')); }; }); };
  w.auth.signOut = () => { log.push('signout'); return Promise.resolve(); };
  w.location.reload = () => {}; // jsdom
  w.confirm = () => true;
  // 名前を直す（プロフィールの名前の欄と同じ道）
  w.switchView('current'); await sleep(80); w.mxTap('a'); await sleep(80); w.ppGo('prof'); await sleep(60);
  $('#ppNmA').value = '架空'; $('#ppNmB').value = '梨夢'; w.ppName(); await sleep(20);
  c('名前を直すと画面の中は「梨夢」', w.state.members.find(m => m.id === 'a').firstName === '梨夢');
  // 1.5秒待たずにすぐログアウト
  w.doLogout(); await sleep(30);
  c('ログアウトを押すと、まず保存を始める', log[0] === 'save-start', log.join());
  c('保存の書き込みが終わるまでログアウトしない', log.indexOf('signout') < 0, log.join());
  finish(); await sleep(30);
  c('書き込みが終わってから（直した名前で）ログアウトする', log.join() === 'save-start,save-done:梨夢,signout', log.join());
  // 保存に失敗した時は、そのままログアウトしてよいか聞く
  log.length = 0; result = 'ng'; let asked = [];
  w.confirm = m => { asked.push(m); return asked.length === 1; }; // 1回目（ログアウトしますか）は OK・2回目（保存できなかった）は キャンセル
  w.state.members.find(m => m.id === 'a').firstName = '直した2'; w.autoSave();
  w.doLogout(); await sleep(20); finish(); await sleep(30);
  c('保存に失敗した時は「保存ができませんでした」と聞き、キャンセルならログアウトしない', asked.length === 2 && /保存ができませんでした/.test(asked[1]) && log.indexOf('signout') < 0, asked.join(' | ') + ' / ' + log.join());
  // 直していない時はすぐログアウト
  log.length = 0; w.confirm = () => true;
  w.doLogout(); await sleep(20);
  c('保存する物が無い時はすぐログアウトする', log.join() === 'signout', log.join());
});
