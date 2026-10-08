// v740：やること — 数値の目標にもサブタスク／直す時は名前1つ（その場で）／スワイプで消す（ToDoと同じ）・元に戻す
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
const touch = (el, type, x, y) => { const ev = new w.Event(type, { bubbles: true }); ev.touches = type === 'touchend' ? [] : [{ clientX: x, clientY: y }]; ev.changedTouches = [{ clientX: x, clientY: y }]; el.dispatchEvent(ev); };
const swipe = async (el, dx) => { touch(el, 'touchstart', 200, 100); touch(el, 'touchmove', 200 + dx / 2, 101); touch(el, 'touchmove', 200 + dx, 102); touch(el, 'touchend', 200 + dx, 102); await sleep(20); };
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'G', parentId: '', mapType: 'both' }];
  w.switchView('plan'); w.p2Go('yk'); await sleep(30);
  w.p2YkTy(); await sleep(10); $('#p2YkIn').value = '本読む'; $('#p2YkG').value = '8'; $('#p2YkU').value = '冊'; w.p2YkAdd(); await sleep(20);
  const n = w._p2YkN().find(x => x.t === '本読む');
  c('数値の目標にも「＋ サブタスク」', !!$('.yk-r.nm .yk-sa'));
  w.p2YkSubOpen('n', n.id); await sleep(40);
  const si = $('#p2YkSi'); si.value = '1冊目'; w.p2YkSiKey({ key: 'Enter', isComposing: false, preventDefault() {} }, 'n', n.id, si); await sleep(40);
  c('数値の目標のサブタスクを足せる（0/1）', (n.subs || []).length === 1 && /0\/1/.test($('.yk-r.nm .sb').textContent));
  w.p2YkSub('n', n.id, 0); await sleep(20);
  c('チェックできる', n.subs[0].dn === true);
  // 直す：名前は1つだけ
  w.p2YkOpen(n.id); await sleep(20);
  c('直す時は名前の欄が行になり、名前は1つだけ', $$('.yk-r.nm.op .yk-et').length === 1 && !$('.yk-r.nm.op .t') && !!$('.yk-r.nm.op .yk-ok'));
  c('今・目標・単位・だれの・月がラベル付き', ['今', '目標', '単位', 'だれの', '月'].every(t => $('.yk-r.nm.op .yk-fm').textContent.indexOf(t) >= 0));
  w.p2YkOpen(n.id); await sleep(20);
  c('完了で閉じる', !$('.yk-r.op'));
  // スワイプで消す（タスク）
  $('#p2YkIn').value = '本を読む'; w.p2YkAdd(); await sleep(20);
  const t = w.state.events.find(e => e.title === '本を読む');
  let lw = $('.yk-lw[data-ykid="' + t.id + '"]');
  await swipe(lw.querySelector('.t'), -100);
  c('左にスワイプすると🗑（消す）が出る', /-84px/.test(lw.querySelector('.ln').style.transform));
  w.p2YkOpen(t.id); await sleep(10);
  c('スワイプ直後のタップでは開かない', !$('.yk-r.op'));
  lw.querySelector('.yk-dl').onclick(); await sleep(30);
  c('🗑を押すと消える（ToDoからも）', !w.state.events.some(e => e.id === t.id && !e.deleted) && !$('.yk-lw[data-ykid="' + t.id + '"]'));
  w._gmUndoFn(); await sleep(30);
  c('↩ 元に戻す', w.state.events.some(e => e.id === t.id && !e.deleted) && !!$('.yk-lw[data-ykid="' + t.id + '"]'));
  await sleep(400);
  lw = $('.yk-lw[data-ykid="' + t.id + '"]'); await swipe(lw.querySelector('.t'), 100); await sleep(20);
  c('右にスワイプすると済み（ToDoと同じ）', t.done === true);
  // 数値の目標もスワイプで消す・戻す
  w._p2YkDn = true; w.renderPlan(); await sleep(20);
  await sleep(400);
  const nl = $('.yk-lw[data-ykid="' + n.id + '"]'); await swipe(nl.querySelector('.t'), -100);
  nl.querySelector('.yk-dl').onclick(); await sleep(20);
  c('数値の目標も消せる', !w._p2YkN().some(x => x.id === n.id));
  w._gmUndoFn(); await sleep(20);
  c('数値の目標も元に戻せる（サブタスクもそのまま）', w._p2YkN().some(x => x.id === n.id && x.subs.length === 1));
});
