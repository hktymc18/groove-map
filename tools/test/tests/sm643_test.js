// v643：シミュレーションを組織図のページに（月を選ぶと木が育つ・数字はその場で保存）
// v644：カスタム（月ごとのフロント・LOIの月も）／多すぎる時は段ごとの人数で
// v702：LOI→Q2→Q3→Q4→BR の5ヶ月（BRの月＝5ヶ月目）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login();
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'B1', parentId: '', mapType: 'both', ptCurrent: 0 }];
  setWH(390, 844); w._uxSync && w._uxSync(); w.switchView('plan'); await sleep(50);
  delete w._p2().sim; w._p2SimMo = 4;
  w.p2SimOpen(); await sleep(20);
  c('シートではなくページで開く', !$('#p2SimOv') && w._p2Pg === 'sim' && $('.ux-crumb').textContent.indexOf('シミュレーション') >= 0);
  const cfg = w._p2SimCfg(), R = w._p2SimFb(cfg.preset, cfg);
  const dots = () => $$('.p2sm-tree circle').length;
  c('組織図（自分＋BRの月までの全員）＝組織人数', dots() === R.org && $('.sm1-r .k').textContent.indexOf(R.org) >= 0 && $('.sm1-r .k').textContent.indexOf('人') >= 0);
  c('v704: ファーストボーナスは最初は隠す（押して見る）', !!$('.sm1-r .fbq') && $('.sm1-r .fb').textContent.indexOf(R.fb.toLocaleString()) < 0 && !$('.sm1-r .fb .ux-ib'));
  w.p2FbReveal(); await sleep(80); // 回し始めは少しあと（並列だと遅れる）
  c('v704: 押すと数字がぐるぐる回る（桁ごとのリール）', !!$('#p2FbR.fbsp') && $$('#p2FbR .rs').length === String(R.fb).length && $('#p2FbR').getAttribute('aria-label') === '¥' + R.fb.toLocaleString());
  c('v704: 右の桁から順に止まる（左ほど長く回る）', (() => { const cs = $$('#p2FbR .rs'); return cs.length > 1 && parseFloat(cs[0].style.transition.split(' ')[1]) > parseFloat(cs[cs.length - 1].style.transition.split(' ')[1]) && /translateY\(-/.test(cs[0].style.transform); })());
  await sleep(3500);
  c('ファーストボーナスはBRの月の額（止まったら金色に光る）', $('#p2FbR').classList.contains('hit') && !$('#p2FbR').classList.contains('fbsp') && !!$('.sm1-r .fb .ux-ib'));
  w.renderPlan(); await sleep(20);
  c('v704: 同じ金額なら描き直しても回らない', !$('#p2FbR .rs') && /618|,/.test($('#p2FbR').textContent));
  c('v709: ファーストボーナスは組織図の下', (() => { const h = $('#view-plan').innerHTML; return h.indexOf('p2sm-lg') < h.indexOf('sm1-r'); })());
  w.p2SimStart(1); await sleep(20);
  c('v709: BRの月以外はファーストボーナスを出さない（BRを選ぶ案内）', !$('#p2FbR') && !$('.fbq') && /（BR）を選ぶと見られます/.test($('.sm1-r').textContent));
  w.p2SimMo(4); await sleep(10);
  c('v709: 金額が変わらない変更（LOIの月）では隠さない', !!$('#p2FbR') && !$('.fbq'));
  const fb1 = w._p2SimFb(w._p2SimCfg().preset, w._p2SimCfg()).fb;
  w.p2SimNSet(w._p2SimCfg().preset + 1); w.p2SimMo(4); await sleep(20);
  c('v709: 人数を変えたら、また隠す（その瞬間に金額は見えない）', !!$('.sm1-r .fbq') && !$('#p2FbR') && /条件が変わりました/.test($('.sm1-r').textContent));
  w.p2FbReveal(); await sleep(20);
  const fb2 = w._p2SimFb(w._p2SimCfg().preset, w._p2SimCfg()).fb;
  c('v709: 押すとまた回る・前回との差の札（止まってから出る）', !!$('#p2FbR.fbsp') && !!$('#p2FbD') && !$('#p2FbD.on') && $('#p2FbD').textContent.indexOf('前回より ＋¥' + (fb2 - fb1).toLocaleString()) >= 0);
  await sleep(3500);
  c('v709: 止まったら差の札が出る', !!$('#p2FbD.on'));
  w.p2SimStart(-1); w.p2SimNSet(w._p2SimCfg().preset - 1); await sleep(20);
  w.p2SimMo(1); await sleep(5);
  c('月を選ぶとその月までに入った人だけ（Q2＝自分＋フロント）', dots() === 1 + cfg.preset);
  w.p2SimNSet(3); w.p2SimDupSet(2); w.p2SimMo(4); await sleep(5);
  const c2 = w._p2SimCfg(), R2 = w._p2SimFb(3, c2);
  c('フロント・つなぐ人数を変えると木と数字が変わる（保存）', c2.preset === 3 && c2.dup === 2 && c2.fronts[1] === 3 && (dots() === R2.org || $('.p2sm-num').textContent.indexOf((R2.org - 1).toLocaleString() + '人') >= 0) && R2.org > R.org); // v702: 5ヶ月だと多くて人数表示になることも
  w.p2SimPsv(1000); w.p2SimAdp(1); w.p2SimStart(1); await sleep(5);
  c('BPCポイント・ADP・LOIの月', w._p2SimCfg().psv === 1000 && w._p2SimCfg().myPsv === 400 && $$('.p2sm-seg span')[0].textContent.indexOf('月') >= 0);
  w.uxInfo('sim'); c('(i)のボタンは「楽勝!!」', !!$('#uxInfo') && $('#uxInfo .ok').textContent === '楽勝!!'); w.uxInfoClose();
  c('戻る＝入口（v652）・次＝ロードマップのペースに入れる（v719）', $('.ux-btm').innerHTML.indexOf("p2Go('')") >= 0 && $('.ux-btm').textContent.indexOf('ロードマップのペースに入れる') >= 0);
  console.log('=== v644 カスタム ===');
  w.p2SimPsv(1500); w.p2SimMode(1); w.p2SimDupSet(1); w.p2SimFSet(0, 1); w.p2SimFSet(1, 2); w.p2SimFSet(2, 1); w.p2SimFSet(3, 0); w.p2SimMo(4); await sleep(5);
  const c3 = w._p2SimCfg(), R3 = w._p2SimFbF(c3.fronts, c3);
  c('カスタム：月ごとの入力（LOIの月も）', c3.preset === 0 && c3.fronts.join() === '1,2,1,0,0' && $$('.sm1-fc input').length === 5 && dots() === R3.org);
  w.p2SimMo(0); await sleep(5);
  c('LOIの月に出したフロントが組織図に（LOIの色）', dots() === 2 && $('.p2sm-lg').textContent.indexOf('LOI') >= 0 && R3.mons[0].gsv === c3.psv * 2);
  c('いつもの形は今まで通り（Q2・Q3に同じ人数）', w._p2SimFb(2, c3).org === w._p2SimFbF([0, 2, 2, 0, 0], c3).org && w._p2SimFb(2, c3).mons[0].gsv === c3.psv);
  w.p2SimFSet(0, 3); w.p2SimFSet(1, 5); w.p2SimFSet(2, 5); w.p2SimDupSet(3); w.p2SimMo(4); await sleep(5);
  const c4 = w._p2SimCfg(), R4 = w._p2SimFbF(c4.fronts, c4);
  c('多すぎる時は段ごとの人数で表示（合計＝組織−自分）', !$('.p2sm-tree') && !!$('.p2sm-num') && $('.p2sm-num').textContent.indexOf((R4.org - 1).toLocaleString() + '人') >= 0);
  w.p2SimMode(0); w.p2SimDupSet(1); w.p2SimNSet(2); await sleep(5);
  c('同じ人数に戻す', w._p2SimCfg().preset > 0 && w._p2SimCfg().fronts[0] === 0 && !$('.sm1-fc'));
  setWH(1400, 900); w._uxSync && w._uxSync(); w.switchView('plan'); w.p2Go('sim'); await sleep(30);
  c('PCは左に組織図・右に入力の2列', !!$('.p2sm-pc .p2sm-tree') && !!$('.p2sm-pc input[type=month]'));
});
