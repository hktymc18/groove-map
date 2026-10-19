// v820：Googleカレンダー連携をなくした（同期・連携の設定・「Googleカレンダーに追加」・Googleのスクリプト）
const T = require('../lib/head.js')();
const { w, c, sleep, $ } = T;
const fs = require('fs'), path = require('path');
T.run(async () => {
  T.login();
  const app = fs.readFileSync(path.join(__dirname, '../../../app.js'), 'utf8'), html = fs.readFileSync(path.join(__dirname, '../../../index.html'), 'utf8');
  c('連携の関数はもう無い', ['gcalConnect', 'gcalUpsertEvent', 'gcalDeleteRemote', 'gcalSyncAll', 'gcalOpenTemplate', 'gcalDisconnect'].every(f => typeof w[f] === 'undefined'));
  c('Googleのログイン用スクリプトを読み込まない', html.indexOf('accounts.google.com/gsi/client') < 0);
  c('前に連携していた人も連携しない状態で開く', (() => { w.state.gcalConnected = true; return true; })() && /state\.gcalConnected = false; state\.gcalCalendarId = '';/.test(app));
  // カレンダー設定に「Googleカレンダー同期」が出ない
  w.openCalSettings(); await sleep(20);
  const ov = w.document.querySelector('.ms-overlay.show, .ms-overlay');
  const calTx = Array.from(w.document.querySelectorAll('.ms-overlay')).map(e => e.textContent).join('');
  c('カレンダー設定にGoogleカレンダーの項目が出ない', !!ov && /カレンダー設定/.test(calTx) && !/Google/.test(calTx));
  try { w.closeCalSettings(); } catch (e) {}
  // 予定を保存・削除してもエラーにならない（前に連携していた人でも）
  w.state.gcalConnected = true;
  w.state.events = [];
  w.openEventModal(null, '', '2026-10-20', 'event'); await sleep(20);
  w.document.getElementById('evTitle').value = 'テストの予定';
  let err = null; try { w.saveEvent(); } catch (e) { err = e; } await sleep(20);
  c('予定を保存してもエラーにならない', !err && w.state.events.some(e => e.title === 'テストの予定'));
  const e0 = w.state.events.find(e => e.title === 'テストの予定');
  err = null; try { w._evDeleteById(e0.id); } catch (e) { err = e; } await sleep(10);
  c('消してもエラーにならない', !err && !w.state.events.some(e => e.id === e0.id));
  w.openEventModal(e0 ? null : null, '', '2026-10-20', 'event'); await sleep(10);
  const gr = w.document.getElementById('evGcalRow');
  c('予定の画面に「Googleカレンダーに追加」は出ない', !gr || gr.style.display === 'none');
  try { w.closeEventModal(true); } catch (e) {}
});
