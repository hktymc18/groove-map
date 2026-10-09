// v758：メンバー（一覧）の画面はなくす（PCの左メニュー・⌘K・使い方からも）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(1400, 900); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'G', parentId: '', mapType: 'both' }];
  c('PCの左メニューにメンバーがない', !$('.pcs-item[data-view="members"]') && !$$('.pcs-item').some(x => x.textContent.trim() === 'メンバー'));
  w.switchView('members'); await sleep(20);
  c('メンバーの画面を開こうとしてもMAPへ', w.currentView === 'current');
  c('⌘Kの画面一覧にメンバーがない', !w._px3PalItems().some(x => x.t === 'メンバー'));
  c('使い方のガイドにメンバー（一覧）がない', !w.GD_TOURS.members && !w.GD_MENU.some(g => g[1].indexOf('members') >= 0));
  w.gdMenu(); await sleep(5);
  c('使い方の画面にも出ない', !$$('#gdMenuOv .ls > div').some(x => x.textContent.replace(/✓ 見た/, '').trim() === 'メンバー')); w.gdMenuX();
  c('プロフィールの「メンバータブ 表示／非表示」もなし', !$('#rbMembersOn'));
});
