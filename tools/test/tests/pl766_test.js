// v766：#5 直近の目標が最終目標と同じ数字にならない・直せる ／ #7 シートを印刷はアプリ内のプレビュー（戻れる・大きさ自動／±） ／ #8 印刷の左右の列の下をそろえる
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '小川', firstName: '拓郎', title: 'ゴールド', parentId: '', mapType: 'both' }, { id: 'a', lastName: 'A', title: 'B1', parentId: 'r', mapType: 'both' }];
  w.switchView('plan'); await sleep(20);
  const p = w.state.goals.plan; p.title = 'ルビー'; p.income = 1000000; p.deadline = w._p2YmAdd(w._p2Ym(0), 8); w._p2().next = null;
  let nx = w._p2Next();
  c('#5 直近の目標の例は最終目標と同じにならない（一つ上のタイトル・途中の月）', nx.title === 'LAPIS' && nx.deadline < p.deadline && nx.inc !== 100 && !nx.isFinal, JSON.stringify(nx));
  w.p2Go('year'); await sleep(20);
  c('#5 ロードマップの直近の目標は選べる・書ける', $$('.yr-near select').length === 2 && !$('.yr-near select').disabled && !!$('.yr-near input'));
  w.p2NxSetInc('60'); w.p2NxDl(w._p2YmAdd(w._p2Ym(0), 5)); nx = w._p2Next();
  c('#5 直近の目標の月収・期日を変えられる', nx.inc === 60 && nx.deadline === w._p2YmAdd(w._p2Ym(0), 5));
  // 一つ上が最終目標の時（同じになる時）も、目標の画面で直せる
  w.state.members[0].title = 'ラピス'; w._p2().next = null; nx = w._p2Next();
  c('#5 一つ上が最終目標の時は同じ（例）', nx.isFinal);
  w.p2GoalEdit(); await sleep(20);
  const tx = $('#uxBody') ? $('#uxBody').textContent : w.document.body.textContent;
  c('#5 目標の画面でも直近の目標を直せる（前は「最終目標がそのまま次の山です」だけ）', /直近の目標/.test(tx) && /今は最終目標と同じです/.test(tx) && $$('[onclick^="p2NxPick"]').length >= 1 && $$('input[onchange^="p2NxSetInc"]').length === 1 && $$('input[onchange*="p2NxDl"]').length === 1);
  w.p2NxDl(w._p2YmAdd(w._p2Ym(0), 4)); nx = w._p2Next();
  c('#5 期日を前にすると最終目標と別の通過点に', !nx.isFinal && nx.deadline === w._p2YmAdd(w._p2Ym(0), 4));
  // #7
  w.p2Go('sheet'); await sleep(30);
  let opened = 0; const wo = w.open; w.open = () => { opened++; return null; };
  w.p2ShPrint(); await sleep(20);
  c('#7 印刷はアプリ内のプレビュー（新しい窓を開かない）', !!$('#p2ShPv') && opened === 0 && /戻る/.test($('#p2ShPv .pv-hd').textContent));
  const f = $('#p2ShPvF');
  c('#7 シートは自動印刷しない', !/window\.print/.test(w._p2ShPvHtml) && /計画立案シート/.test(w._p2ShPvHtml));
  c('#8 大きさ：自動（画面に合わせる）', /自動/.test($('#p2ShPvZl').textContent) && $('#p2ShPvZl').classList.contains('on'));
  w.p2ShPvZ(1); c('#8 ＋で大きく（％が出る）', /%/.test($('#p2ShPvZl').textContent)); w.p2ShPvZ(0); c('#8 自動に戻す', /自動/.test($('#p2ShPvZl').textContent));
  c('#8 左右の列を紙の高さいっぱいに（表を伸ばして下をそろえる）', /\.pg>div\{display:flex;flex-direction:column;height:279mm/.test(w._p2ShPvHtml) && /\.al table\{flex:1 1 0/.test(w._p2ShPvHtml) && /\.kp\{margin-top:2mm;flex:1 1 0/.test(w._p2ShPvHtml));
  let printed = 0; const wp = w.print; w.print = () => { printed++; };
  w.p2ShPvPrint(); await sleep(260);
  c('#7 印刷ボタン：印刷用の層（CSSは層の中だけ）', printed === 1 && !!$('#p2ShPrintLayer') && /#p2ShPrintLayer \.l\{/.test($('#p2ShPrintLayer style').textContent) && !/[}]\.l\{/.test($('#p2ShPrintLayer style').textContent));
  w.p2ShPvX(); await sleep(10);
  c('#7 戻るで計画シートに戻る', !$('#p2ShPv') && !$('#p2ShPrintLayer') && !w.document.body.classList.contains('printing-sheet') && w._p2Pg === 'sheet');
  w.open = wo; w.print = wp;
});
