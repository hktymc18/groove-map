// v734：やることのサブタスク（いつも下に出す・「＋ サブタスク」で大きい欄・Enterで続けて・押して直す）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'G', parentId: '', mapType: 'both' }];
  w.switchView('plan'); w.p2Go('yk'); await sleep(30);
  $('#p2YkIn').value = 'ST会場を探す'; w.p2YkAdd(); await sleep(20);
  const t = w.state.events.find(e => e.title === 'ST会場を探す');
  c('タスクの下に「＋ サブタスク」（開かなくても）', !!$('.yk-k .yk-sa'));
  w.p2YkSubOpen('t', t.id); await sleep(40);
  const si = $('#p2YkSi');
  c('押すと大きい書く欄（16px・枠つき）', !!si && w.getComputedStyle(si).fontSize === '16px');
  const ent = { key: 'Enter', isComposing: false, preventDefault() {} };
  si.value = '候補を3つ出す'; w.p2YkSiKey(ent, 't', t.id, si); await sleep(40);
  const si2 = $('#p2YkSi'); si2.value = '下見の日を決める'; w.p2YkSiKey(ent, 't', t.id, si2); await sleep(40);
  c('Enterで続けて何個でも', t.subs.length === 2 && !!$('#p2YkSi') && $$('.yk-k .sr').length === 2);
  c('サブタスクはいつも見える（進み 0/2）', /0\/2/.test($('.yk-r .sb').textContent) && /候補を3つ出す/.test($('.yk-k').textContent));
  $('#p2YkSi').value = '予約する'; $('#p2YkSi').onblur(); await sleep(200);
  c('欄から離れると、書いた分は足して閉じる', t.subs.length === 3 && !$('#p2YkSi') && !!$('.yk-sa'));
  w.p2YkSub('t', t.id, 0); await sleep(20);
  c('チェックで進む（1/3）', /1\/3/.test($('.yk-r .sb').textContent) && !!$('.yk-k .sr.dn'));
  w.prompt = () => '候補を5つ出す'; w.p2YkSubEd('t', t.id, 0); await sleep(20);
  c('押して直す', t.subs[0].t === '候補を5つ出す');
  w.prompt = () => ''; w.p2YkSubEd('t', t.id, 2); await sleep(20);
  c('空にすると消す', t.subs.length === 2);
});
