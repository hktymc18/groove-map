// v643：シミュレーションを組織図のページに（月を選ぶと木が育つ・数字はその場で保存）
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
  setWH(1400, 900); w._uxSync && w._uxSync(); w.switchView('plan'); w.p2Go('sim'); await sleep(30);
  c('PCは左に組織図・右に入力の2列', !!$('.p2sm-pc .p2sm-tree') && !!$('.p2sm-pc input[type=month]'));
});
