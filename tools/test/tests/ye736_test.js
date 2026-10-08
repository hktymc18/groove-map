// v736：やることで登録したものを直せる（タスク：名前・人／数値の目標：名前・目標・単位・月・人・消す）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'G', parentId: '', mapType: 'both' }, { id: 'a', lastName: '井上', firstName: '花', title: 'LOI', parentId: 'r', mapType: 'both' }];
  w.switchView('plan'); w.p2Go('yk'); await sleep(30);
  $('#p2YkIn').value = '本を読む'; w.p2YkAdd(); await sleep(20);
  const t = w.state.events.find(e => e.title === '本を読む');
  w.p2YkOpen(t.id); await sleep(20);
  c('タスクを押すと名前と人を直す欄', !!$('.yk-r.op .yk-et') && $('.yk-r.op .yk-et').value === '本を読む' && !!$('.yk-r.op .yk-ed select'));
  const et = $('.yk-r.op .yk-et'); et.value = '本を2冊読む'; et.onchange(); await sleep(20);
  c('名前を直す', t.title === '本を2冊読む');
  w.p2YkWhoSet(t.id, 'a'); await sleep(20);
  c('人を直す（井上さん）', t.memberId === 'a' && /井上/.test($('.yk-r .who').textContent));
  w.p2YkTy(); await sleep(10); $('#p2YkIn').value = '本読む'; $('#p2YkG').value = '8'; $('#p2YkU').value = '冊'; w.p2YkAdd(); await sleep(20);
  const n = w._p2YkN().find(x => x.t === '本読む');
  w.p2YkOpen(n.id); await sleep(20);
  c('数値の目標を押すと直す欄（名前・目標・単位・月・人）', !!$('.yk-r.nm .yk-et') && !!$('.yk-r.nm .yk-en') && !!$('.yk-r.nm .yk-eu') && $$('.yk-r.nm select').length === 2);
  w.p2YkNF(n.id, 't', '本を読む'); w.p2YkNF(n.id, 'g', '10'); w.p2YkNF(n.id, 'u', '冊'); w.p2YkNF(n.id, 'who', 'a'); await sleep(20);
  c('直すと反映（/10冊・井上さん）', n.t === '本を読む' && n.g === 10 && n.mid === 'a' && /\/10冊/.test($('.yk-r.nm .nv').textContent));
  w.confirm = () => true; w.p2YkNF(n.id, 'del'); await sleep(20);
  c('消す', !w._p2YkN().some(x => x.id === n.id));
});
