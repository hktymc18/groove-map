// v927：夢100の期日に「日にち」（入れなくてもいい・あと○日・期日を過ぎました・同じ月は日にち順）。夢はすべて見本
const T = require('../lib/head.js')({ now: '2026-11-27T03:00:00Z' });
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w._p2().dreams = [
    { id: 'a', t: '登山の靴', dl: '2026-11', dd: 20, amt: 3, done: false },
    { id: 'b', t: 'シャツ', dl: '2026-11', dd: 30, amt: 3, done: false },
    { id: 'c', t: '海外の研修', dl: '2026-11', amt: 47, done: false },
    { id: 'd', t: 'イヤホン', dl: '2026-11', dd: 10, amt: 3, done: true },
    { id: 'e', t: '家族で旅行', dl: '2026-12', dd: 24, amt: 20, done: false },
    { id: 'f', t: '腕時計', dl: '2026-12', amt: 6, done: false }];
  try { w.localStorage.removeItem('gm_drTo'); } catch (e) {}
  w._uxLists = { 'dream:all': 1 }; w.switchView('plan'); await sleep(60); w.p2Go('dream'); await sleep(80);
  const due = id => { const r = w.document.querySelector('.dr-lw[data-drid="' + id + '"] .dr-due'); return r ? r.className.replace('dr-due', '').trim() + ':' + r.textContent : ''; };
  c('期日を過ぎた夢は赤で「期日を過ぎました」', due('a') === 'over:11/20まで・期日を過ぎました', due('a'));
  c('7日以内は紫で「あと○日」', due('b') === 'soon:11/30まで・あと3日', due('b'));
  c('7日より先は日にちだけ', due('e') === ':12/24まで', due('e'));
  c('日にちが無い夢は今まで通り何も出ない', due('c') === '' && due('f') === '');
  c('叶えた夢は日にちだけ（過ぎた知らせは出さない）', due('d') === ':11/10まで', due('d'));
  const ord = [...$$('.dr-lw')].map(e => e.getAttribute('data-drid')).join();
  c('同じ月の中は日にちの早い順・日にちの無い夢は後ろ・叶えた夢は最後', ord === 'a,b,c,d,e,f', ord);
  // 入力
  w.p2DrFormOpen(); await sleep(150);
  const sel = id => $('#' + id);
  c('期日に「日」の欄があり、最初は「—」（月だけで保存できる）', !!sel('p2drDD') && sel('p2drDD').value === '' && sel('p2drDD').options[0].textContent === '—');
  sel('p2drT').value = '見本の夢'; sel('p2drA').value = '10';
  sel('p2drDY').value = '2027'; sel('p2drDM').value = '2'; w._p2DrDayFix('p2drD');
  c('2027年2月は28日まで選べる', sel('p2drDD').options.length === 29 && sel('p2drDD').options[28].value === '28');
  sel('p2drDD').value = '14'; w.p2DrSave(); await sleep(60);
  const nd = w._p2().dreams.find(x => x.t === '見本の夢');
  c('日にちを入れて保存できる（期日の月は今まで通り「年-月」）', nd && nd.dl === '2027-02' && nd.dd === 14, JSON.stringify(nd));
  sel('p2drT').value = '見本の夢2'; sel('p2drDY').value = '2027'; sel('p2drDM').value = '3'; w._p2DrDayFix('p2drD'); sel('p2drDD').value = ''; w.p2DrSave(); await sleep(60);
  const nd2 = w._p2().dreams.find(x => x.t === '見本の夢2');
  c('日にちを入れなければ月だけ', nd2 && nd2.dl === '2027-03' && nd2.dd === '', JSON.stringify(nd2));
  w._p2SheetClose('p2DrFormOv'); await sleep(30);
  w.p2DrFormOpen('e'); await sleep(150);
  c('直す時は入っている日にちが選ばれている', sel('p2drDD').value === '24');
  sel('p2drDD').value = '31';
  sel('p2drDM').value = '2'; sel('p2drDY').value = '2027'; w._p2DrDayFix('p2drD');
  c('31日のまま月を2月に変えると、その月の最後（28日）に合わせる', sel('p2drDD').value === '28');
  w._p2SheetClose('p2DrFormOv');
});
