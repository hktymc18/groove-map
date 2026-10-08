// v728：ロードマップ③の計算の設定で小数を入れられる（小数点のキーボード・結果は切り上げ）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  const ms = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'ゴールド', parentId: '', mapType: 'both' }];
  for (let i = 0; i < 16; i++) ms.push({ id: 'x' + i, lastName: '山田' + i, firstName: '太', title: i === 0 ? 'BR' : 'B1', parentId: i < 4 ? 'r' : 'x' + (i % 4), mapType: 'both' });
  w.state.members = ms; w.switchView('plan'); await sleep(30);
  w._p2().next = { title: 'RUBY', tm: true, inc: 80, deadline: w._p2YmAdd(w._p2Ym(0), 8) };
  w.p2Go('year'); await sleep(20); w.p2YrSetTgl(); await sleep(20);
  c('設定の欄は小数点の出るキーボード', $$('.yr-sp input').every(i => i.getAttribute('inputmode') === 'decimal' && i.getAttribute('autocomplete') === 'off'));
  w.p2YrSet('ratio', '1.5'); await sleep(10);
  const C = w._p2YrCalc();
  c('1.5人でBR1本 → 必要なフロントは切り上げ（3本×1.5＝4.5→5人）', w._p2Yr().ratio === 1.5 && C.needBR === 3 && C.needFr === 5);
  w.p2GapRate('candX', '１．５'); await sleep(10);
  c('全角でも小数（候補＝Qルビー×1.5、切り上げ）', w._p2Gap().rates.candX === 1.5 && w._p2YrCalc().rows[3].t === Math.ceil(w._p2YrCalc().rows[2].t * 1.5));
  w.p2GapRate('qrYen', '17.5'); await sleep(10);
  c('1Qルビーあたり17.5万', w._p2Gap().rates.qrYen === 17.5 && w._p2YrCalc().rows[2].t === Math.ceil(80 / 17.5));
  c('表示も小数のまま', $$('.yr-sp input')[0].value === '1.5');
});
