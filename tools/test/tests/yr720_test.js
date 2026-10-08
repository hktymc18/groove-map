// v720：ロードマップの③で、今の数・単価もその場で直す（前の「今の数・単価」の画面に飛ばない）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  const ms = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'ゴールド', parentId: '', mapType: 'both', ptCurrent: 1500 }];
  for (let i = 0; i < 16; i++) ms.push({ id: 'x' + i, lastName: '山田' + i, firstName: '太', title: i === 0 ? 'BR' : 'B1', parentId: i < 4 ? 'r' : 'x' + (i % 4), mapType: 'both' });
  w.state.members = ms; w.switchView('plan'); await sleep(30);
  w.state.goals.plan.income = 0; w._p2().next = { title: 'DIAMOND', tm: true, inc: 100, deadline: w._p2YmAdd(w._p2Ym(0), 8) };
  w.p2Go('year'); await sleep(30);
  const row = k => $$('.yr-gp tr').find(tr => tr.querySelector('input[onchange*="\'' + k + '\'"]'));
  c('前の画面へのリンクはない', !/今の数・単価を直す/.test($('#view-plan').textContent) && !/gapset/.test($('#view-plan').innerHTML));
  const inNow = k => $$('.yr-gp input').find(i => i.getAttribute('onchange') === "p2GapSet('c','" + k + "',this.value)");
  c('今の数は入力欄（空ならMAPの数が薄く）', !!inNow('br') && inNow('br').placeholder === '1' && inNow('dist').placeholder === '1500');
  inNow('exp').value = '1'; inNow('exp').onchange(); await sleep(20);
  c('書くとその場で差が変わり、この画面のまま', w._p2Pg === 'year' && w._p2YrCalc().rows[4].c === 1 && !!$('.yr-gp'));
  inNow('br').value = '3'; inNow('br').onchange(); await sleep(20);
  c('MAPと違う数にしたら「MAP 1 に戻す」', w._p2YrCalc().rows[0].c === 3 && /MAP 1 に戻す/.test($('.yr-gp').textContent));
  $$('.yr-gp i.rs')[0].onclick(); await sleep(20);
  c('戻すとMAPの数', w._p2YrCalc().rows[0].c === 1 && !$('.yr-gp i.rs'));
  c('v721: 計算の設定はふだん隠す（⚙ 設定で開く）', !$('.yr-sp') && !!$('.yr-gear'));
  w.p2YrSetTgl(); await sleep(20);
  c('v721: 開くと1行ずつの設定（BR 1本のフロント・単価・候補）', $$('.yr-sp .yr-sr').length === 4 && !/1ヶ月に/.test($('.yr-sp').textContent));
  const rate = $$('.yr-sp input').find(i => /qrYen/.test(i.getAttribute('onchange')));
  rate.value = '10'; rate.onchange(); await sleep(20);
  c('単価もこの画面で（1Qルビー10万→必要10人）・設定は開いたまま', w._p2Gap().rates.qrYen === 10 && w._p2YrCalc().rows[2].t === 10 && w._p2Pg === 'year' && !!$('.yr-sp'));
  w.p2YrSetTgl(); await sleep(20);
  c('v721: 閉じる', !$('.yr-sp'));
});
