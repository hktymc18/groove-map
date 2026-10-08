// v730：やることの書く欄（大きく1行・基本はタスク・「🔢 数値」で目標・単位・今）・今の数を直接入れる
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'G', parentId: '', mapType: 'both' }];
  w.switchView('plan'); w.p2Go('yk'); await sleep(30);
  c('書く欄は大きい1行・タスク/数値の切りかえはない', !!$('.yk-add input.in') && !$('.yk-add .ty') && !$('#p2YkG') && /やることを書く/.test($('#p2YkIn').placeholder));
  $('#p2YkIn').value = '本を読む'; w.p2YkAdd(); await sleep(20);
  c('ふつうに足すとタスク', w.state.events.some(e => e.title === '本を読む' && e.yk === 1));
  $('#p2YkIn').value = 'ST開催'; w.p2YkTy(); await sleep(20);
  c('文字を書いてから「🔢 数値」→ 書いた文は残って、目標・単位・今の欄', $('#p2YkIn').value === 'ST開催' && !!$('#p2YkG') && !!$('#p2YkU') && !!$('#p2YkV') && $('.yk-add .nb.on'));
  $('#p2YkG').value = '8'; $('#p2YkU').value = '回'; $('#p2YkV').value = '3'; w.p2YkAdd(); await sleep(20);
  const n = w._p2YkN().find(x => x.t === 'ST開催');
  c('数値の目標（目標8回・今3）', !!n && n.g === 8 && n.u === '回' && n.v === 3 && $('.yk-r.nm .nvi').value === '3' && /\/8回/.test($('.yk-r.nm .nv').textContent));
  c('足したら数値はオフに戻る', !$('#p2YkG') && !$('.yk-add .nb.on'));
  const vi = $('.yk-r.nm .nvi'); vi.value = '7'; vi.onchange(); await sleep(20);
  c('今の数を直接入れて進み具合（7/8）', n.v === 7 && $('.yk-r.nm .nvi').value === '7');
  w.p2YkNV(n.id, 1); await sleep(20);
  c('＋でも進む・届いたら色が変わる', n.v === 8 && !!$('.yk-r.nm.ok'));
  w.p2YkTy(); await sleep(10); $('#p2YkIn').value = '名刺'; w.p2YkAdd(); await sleep(10);
  c('目標の数が無い時は足さない', !w._p2YkN().some(x => x.t === '名刺'));
});
