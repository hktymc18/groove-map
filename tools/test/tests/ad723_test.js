// v723：計画シートの行動の実行期日（空いた行でも日付を選べる・名前を書いてすぐ日付を押しても消えない）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'ゴールド', parentId: '', mapType: 'both' }];
  w.switchView('plan'); w.p2Go('sheet'); await sleep(100);
  const nd = () => $$('.sp-at .r.nw .d input[type=date]');
  c('空いた行にも日付の入力がある', nd().length >= 4);
  const d0 = nd()[0]; d0.value = '2026-10-20'; d0.onchange(); await sleep(20);
  c('先に日付を選ぶと表示（まだ行動は作らない）', /10\/20/.test(d0.parentNode.textContent) && !w.state.events.some(e => e.planCat === 'front'));
  const t0 = $('#p2ShIn_front_0'); t0.value = 'リストアップ'; t0.onchange(); await sleep(80);
  const e1 = w.state.events.find(e => e.title === 'リストアップ');
  c('名前を書くと、選んだ日付で行動に', !!e1 && e1.date === '2026-10-20' && e1.planCat === 'front');
  await sleep(80);
  const t1 = $('#p2ShIn_dist_0'); t1.value = 'サンプルを渡す'; t1.onchange();
  const dd = t1.closest('.r').querySelector('input[type=date]'); dd.focus(); // 名前を書いてすぐ日付を押した
  await sleep(80);
  c('日付の欄を触っている間は描き直さない（入力が消えない）', w.document.body.contains(dd));
  dd.value = '2026-10-25'; dd.onchange(); await sleep(80);
  const e2 = w.state.events.find(e => e.title === 'サンプルを渡す');
  c('その行の行動に日付が入る', !!e2 && e2.date === '2026-10-25');
  dd.blur(); await sleep(100);
  c('離れたら描き直して行動の行に', $$('.sp-at .r:not(.nw) .x input').some(i => i.value === 'サンプルを渡す'));
  const ed = $$('.sp-at .r:not(.nw)').find(r => r.querySelector('.x input').value === 'リストアップ').querySelector('input[type=date]');
  c('行動の行の日付はタップで開ける（全体を覆う入力）', !!ed && /_p2ShPick/.test(ed.getAttribute('onclick')));
});
