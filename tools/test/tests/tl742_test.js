// v742：PLANの整理（年別目標・ギャップのリンクをなくす／ツールは作文とBB早見表だけ／チェックを入口のタイルに）＋やる理由の作文のアーカイブ
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'G', parentId: '', mapType: 'both' }];
  w.switchView('plan'); w.p2Go(''); await sleep(30);
  const tiles = $$('#view-plan .ux-t').map(t => t.textContent);
  c('入口のタイルにチェック', tiles.some(t => /チェック/.test(t)));
  w.p2Go('tool'); await sleep(20);
  const tx = $('#view-plan').textContent;
  c('ツールはやる理由（作文）とBB早見表だけ', $$('#view-plan .ux-li').length === 2 && ['ギャップ', '年別目標', 'ロードマップ', 'シミュレーション', '夢100', 'チェック', '今週やること'].every(t => tx.indexOf(t) < 0));
  w.p2Go('goal'); await sleep(20);
  c('目標のページに年別目標・ギャップのリンクがない', !/年別目標 ›|ギャップ ›/.test($('#view-plan').textContent));
  // 作文のアーカイブ
  w.confirm = () => true;
  w.p2Go('essay', 0); await sleep(20);
  const ta = $('#uxEssay'); ta.value = '家族に楽をさせたいから、今やる。'; w.p2Essay(ta, 'why'); await sleep(10);
  c('作文のページに「アーカイブする」「過去の作文」', /アーカイブする/.test($('#view-plan').textContent) && /過去の作文/.test($('#view-plan').textContent));
  w.p2EsArc('why'); await sleep(20);
  const n = w._p2Notes().why;
  c('アーカイブすると日付つきで残り、白紙になる', n.vers.length === 1 && n.vers[0].text === '家族に楽をさせたいから、今やる。' && !n.cur && $('#uxEssay').value === '');
  c('過去の作文の数が出る', /過去の作文1/.test($('.es-ab').textContent));
  w.p2EsArcList('why'); await sleep(10);
  c('過去の作文の一覧（日付・字数）', $$('#p2EsArcOv .it').length === 1 && /字/.test($('#p2EsArcOv .it').textContent));
  w.p2EsArcList('why', 0); await sleep(10);
  c('押すと全文が読める', /家族に楽をさせたいから/.test($('#p2EsArcOv .tx').textContent));
  const ta2 = $('#uxEssay'); ta2.value = '新しい作文'; w.p2Essay(ta2, 'why'); await sleep(10);
  w.p2EsArcUse('why', 0); await sleep(20);
  c('この作文から書き直す（いまの作文はアーカイブ）', n.cur === '家族に楽をさせたいから、今やる。' && n.vers.some(v => v.text === '新しい作文') && !$('#p2EsArcOv'));
  w.p2EsArcList('why'); await sleep(10); const k0 = n.vers.length; w.p2EsArcDel('why', 0); await sleep(10);
  c('過去の作文を消せる', n.vers.length === k0 - 1);
  w.p2EsArcX();
});
