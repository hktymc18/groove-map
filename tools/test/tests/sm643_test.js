// v643：シミュレーションを組織図のページに（月を選ぶと木が育つ・数字はその場で保存）
// v644：カスタム（月ごとのフロント・LOIの月も）／多すぎる時は段ごとの人数で
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login();
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'B1', parentId: '', mapType: 'both', ptCurrent: 0 }];
  setWH(390, 844); w._uxSync && w._uxSync(); w.switchView('plan'); await sleep(50);
  delete w._p2().sim; w._p2SimMo = 3;
  w.p2SimOpen(); await sleep(20);
  c('シートではなくページで開く', !$('#p2SimOv') && w._p2Pg === 'sim' && $('.ux-crumb').textContent.indexOf('シミュレーション') >= 0);
  const cfg = w._p2SimCfg(), R = w._p2SimFb(cfg.preset, cfg);
  const dots = () => $$('.p2sm-tree circle').length;
  c('組織図（自分＋BRの月までの全員）＝組織人数', dots() === R.org && $('.p2sm-k').textContent.indexOf(R.org + '人') >= 0);
  c('ファーストボーナスはBRの月の額', $('.p2sm-k .hi').textContent.indexOf(R.fb.toLocaleString()) >= 0);
  w.p2SimMo(1); await sleep(5);
  c('月を選ぶとその月までに入った人だけ（Q2＝自分＋フロント）', dots() === 1 + cfg.preset && $('.p2sm-k .hi').textContent.indexOf('BRの月に') >= 0);
  w.p2SimMo(3); w.p2SimNSet(3); w.p2SimDupSet(2); await sleep(5);
  const c2 = w._p2SimCfg(), R2 = w._p2SimFb(3, c2);
  c('フロント・つなぐ人数を変えると木と数字が変わる（保存）', c2.preset === 3 && c2.dup === 2 && c2.fronts[1] === 3 && dots() === R2.org && R2.org > R.org);
  w.p2SimPsv(1000); w.p2SimAdp(1); w.p2SimStart(1); await sleep(5);
  c('BPCポイント・ADP・LOIの月', w._p2SimCfg().psv === 1000 && w._p2SimCfg().myPsv === 400 && $$('.p2sm-seg span')[0].textContent.indexOf('月') >= 0);
  c('戻る＝ツール・次＝今月の目標に入れる', $('.ux-btm').innerHTML.indexOf("p2Go('tool')") >= 0 && $('.ux-btm').textContent.indexOf('今月の目標に入れる') >= 0);
  console.log('=== v644 カスタム ===');
  w.p2SimPsv(1500); w.p2SimMode(1); w.p2SimDupSet(1); w.p2SimFSet(0, 1); w.p2SimFSet(1, 2); w.p2SimFSet(2, 1); w.p2SimFSet(3, 0); await sleep(5);
  const c3 = w._p2SimCfg(), R3 = w._p2SimFbF(c3.fronts, c3);
  c('カスタム：月ごとの入力（LOIの月も）', c3.preset === 0 && c3.fronts.join() === '1,2,1,0' && $$('.p2sm-fc input').length === 4 && dots() === R3.org);
  w.p2SimMo(0); await sleep(5);
  c('LOIの月に出したフロントが組織図に（LOIの色）', dots() === 2 && $('.p2sm-lg').textContent.indexOf('LOI') >= 0 && R3.mons[0].gsv === c3.psv * 2);
  c('いつもの形は今まで通り（Q2・Q3に同じ人数）', w._p2SimFb(2, c3).org === w._p2SimFbF([0, 2, 2, 0], c3).org && w._p2SimFb(2, c3).mons[0].gsv === c3.psv);
  w.p2SimMo(3); w.p2SimFSet(0, 3); w.p2SimFSet(1, 5); w.p2SimFSet(2, 5); w.p2SimDupSet(3); await sleep(5);
  const c4 = w._p2SimCfg(), R4 = w._p2SimFbF(c4.fronts, c4);
  c('多すぎる時は段ごとの人数で表示（合計＝組織−自分）', !$('.p2sm-tree') && !!$('.p2sm-num') && $('.p2sm-num').textContent.indexOf((R4.org - 1).toLocaleString() + '人') >= 0);
  w.p2SimMode(0); w.p2SimDupSet(1); w.p2SimNSet(2); await sleep(5);
  c('同じ人数に戻す', w._p2SimCfg().preset > 0 && w._p2SimCfg().fronts[0] === 0 && !$('.p2sm-fc'));
  setWH(1400, 900); w._uxSync && w._uxSync(); w.switchView('plan'); w.p2Go('sim'); await sleep(30);
  c('PCは左に組織図・右に入力の2列', !!$('.p2sm-pc .p2sm-tree') && !!$('.p2sm-pc input[type=month]'));
});
