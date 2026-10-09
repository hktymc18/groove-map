// v719：シミュレーション →「ロードマップのペースに入れる」（月ごとのフロントをロードマップのFへ。今月は理想MAPにも。BRを目指す人は直近の目標の月もそろえる）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login();
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'Q2', parentId: '', mapType: 'both', ptCurrent: 300 }]; // 先月LOI＝今月Q2
  w.state.idealMembers = [];
  setWH(390, 844); w._uxSync && w._uxSync(); w.switchView('plan'); await sleep(30);
  const cur = w._p2Ym(0), lm = w._p2Ym(-1);
  const cfg = w._p2SimCfg(); cfg.preset = 0; cfg.fronts = [1, 2, 3, 0, 0]; cfg.sy = +lm.slice(0, 4); cfg.sm = +lm.slice(5);
  w.p2Go('sim'); await sleep(30);
  c('ボタンは「ロードマップのペースに入れる」', /ロードマップのペースに入れる/.test($('.ux-btm').textContent));
  w.p2SimApply(); await sleep(30);
  const nx1 = w._p2YmAdd(cur, 1);
  c('今月から先の月のフロントがロードマップのFに（過ぎた月はそのまま）', w._p2FrontTgt(cur) === 2 && w._p2FrontTgt(nx1) === 3 && w._p2FrontTgt(w._p2YmAdd(cur, 2)) === 0 && w._p2M(nx1).front === 3 && w._p2Rm().rows.front[lm] === undefined);
  c('v775: 理想MAPとは連動しない（理想MAPに人を足さない）', w._idealStats(w.state.idealMembers || []).newFront === 0);
  c('BRを目指す人は直近の目標（BRの月）もそろえる', w._p2Next().title === 'BR' && w._p2Next().deadline === w._p2YmAdd(lm, 4));
  c('そのままロードマップを開く', w._p2Pg === 'year' && !!$('.yr-tl'));
  c('ロードマップのペースにその数字（今月も手で直せる）', $$('.yr-pace input')[0].value === '2' && $$('.yr-pace input')[1].value === '3');
  c('古い案内（「設定」で確定）は出ない', !/「設定」で確定/.test(w.document.body.textContent));
});
