// 受付 v153：名簿の「タイトル」列（並べ替え・〇〇以上で絞り込み）／CSV出力にグレード・タイトル・順位／
//   「📋 名前をコピー」（タイトルで絞った名前を1行に1人。NAVIGATORの先行利用に貼り付け用）。架空データ
const path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const OWNER = 'j2DPDAccCygHmR9i5K3bTvHnH0V2';
const M = (no, name, un, x) => Object.assign({ no, name, union: un }, x || {});
const data = () => ({
  'checkinUnions/GRANT': { name: 'GRANT', unionAdmins: [OWNER] }, 'checkinUnions/DEFI': { name: 'DEFI', unionAdmins: [OWNER] },
  'checkinMembers/GR0001': M('GR0001', '見本 一郎', 'GRANT', { cardTitle: 'TEAM ELITE' }),
  'checkinMembers/GR0002': M('GR0002', '見本 二郎', 'GRANT', { cardTitle: 'RUBY' }),
  'checkinMembers/GR0003': M('GR0003', '見本 三郎', 'GRANT', { cardTitle: 'GOLD', grade: 'BR' }),
  'checkinMembers/GR0004': M('GR0004', '見本 四郎', 'GRANT', { grade: 'JETCLUB' }),            // タイトル無し・グレードだけ → BR扱い
  'checkinMembers/GR0005': M('GR0005', '見本 五郎', 'GRANT', {}),                             // タイトル無し
  'checkinMembers/GR0006': M('GR0006', '見本 六郎', 'GRANT', { cardTitle: 'DIAMOND', active: false }),   // 無効
  'checkinMembers/GR0007': M('GR0007', '見本 七郎', 'GRANT', { trainee: true }),               // 研修生
  'checkinMembers/GR0008': M('GR0008', '見本 八郎', 'GRANT', { badge: 'EMERALD' }),            // 古いデータ（badge に宝石）
  'checkinMembers/DF0001': M('DF0001', '見本 花子', 'DEFI', { cardTitle: 'BLUE DIAMOND' }),
  'checkinMembers/DF0002': M('DF0002', '見本 一郎', 'DEFI', { cardTitle: 'BR' }),              // 別ユニオンの同じ名前
  'checkinMembers/DF0003': M('DF0003', '見本 桃子', 'DEFI', {}),
});
(async () => {
  const b = await P.browser();
  for (const vw of [1280, 390]) {
    const { ctx, page, ev, wt, errs } = await P.open(b, { data: data(), vw, vh: vw > 500 ? 900 : 844, evalHook: true });
    await ev(`(function(){ var x=document.getElementById('gxHintOk'); if(x) x.click(); })()`);
    await ev(`document.querySelector('nav button[data-pane="pRoster"]').click()`); await wt(600);
    await ev(`(function(){ var s=document.getElementById('rosterUnionSel'); s.value='GRANT'; s.dispatchEvent(new Event('change')); })()`); await wt(600);
    if (vw < 500) await ev(`document.getElementById('btnRosterMore').click()`);
    // 練習用のデータベースはユニオンで絞らずに全員を返すので、GRANT の人（GR…）だけを見る
    const rowNames = () => ev(`[].map.call(document.querySelectorAll('#rosterBody tr'), function(tr){ var n=tr.querySelector('.rc-nm b'), no=tr.querySelector('.rc-no'); return n && no && /^GR/.test(no.textContent) ? n.textContent : ''; }).filter(Boolean)`);
    const W = vw > 500 ? '' : '（スマホ）';
    c('タイトルの列がある' + W, /タイトル/.test(await ev(`document.getElementById('rosterHead').innerText`)));
    const t1 = await ev(`document.getElementById('rosterBody').innerText`);
    c('タイトルが表示される（グレードだけの人は「BR（グレード）」・古いデータも）' + W, /TEAM ELITE/.test(t1) && /RUBY/.test(t1) && /BR（グレード）/.test(t1) && /EMERALD/.test(t1), t1);
    // 並べ替え：最初は高い順
    await ev(`document.querySelector('#rosterHead th[data-sk=ti]').click()`); await wt(200);
    const n1 = await rowNames();
    c('タイトルの見出しを押すと高い順' + W, n1[0] === '見本 一郎' && n1[1] === '見本 八郎' && n1[2] === '見本 二郎' && n1[3] === '見本 三郎', n1.join(','));
    await ev(`document.querySelector('#rosterHead th[data-sk=ti]').click()`); await wt(200);
    const n2 = await rowNames();
    c('もう一度押すと低い順' + W, n2[n2.length - 1] === '見本 一郎' && n2.indexOf('見本 五郎') < n2.indexOf('見本 四郎'), n2.join(','));
    // 絞り込み
    await ev(`(function(){ var s=document.getElementById('qTitle'); s.value='4'; s.dispatchEvent(new Event('change')); })()`); await wt(200);
    const n3 = await rowNames();
    c('「RUBY 以上」で絞り込み（無効の人は出ない）' + W, n3.slice().sort().join(',') === ['見本 一郎', '見本 二郎', '見本 八郎'].sort().join(','), n3.join(','));
    c('件数の表示に絞り込みが出る' + W, /RUBY 以上だけ/.test(await ev(`document.getElementById('rosterCount').textContent`)));
    await ev(`(function(){ var s=document.getElementById('qTitle'); s.value='1'; s.dispatchEvent(new Event('change')); })()`); await wt(200);
    const n4 = await rowNames();
    c('「BR 以上」＝タイトルのある人＋グレードがBR・JETCLUBの人' + W, n4.length === 5 && n4.indexOf('見本 四郎') >= 0 && n4.indexOf('見本 五郎') < 0 && n4.indexOf('見本 七郎') < 0, n4.join(','));
    c('横にはみ出さない' + W, (await ev(`document.documentElement.scrollWidth`)) === vw);
    await page.screenshot({ path: OUT + '/ckti153_roster' + (vw > 500 ? '' : '_m') + '.png', fullPage: vw < 500 });
    if (vw > 500) {
      // CSV出力
      await ev(`window.__csv = null; __ckEval("csvDownload = function(n, rows){ window.__csv = { n: n, rows: rows }; }")`);
      await ev(`document.getElementById('btnCsvOut').click()`); await wt(200);
      const csv = await ev(`window.__csv`);
      const hd = csv && csv.rows[0], r4 = csv && csv.rows.filter(r => r[0] === 'GR0004')[0], r1 = csv && csv.rows.filter(r => r[0] === 'GR0001')[0];
      c('CSV出力にグレード・タイトル・タイトル順位（前の列はそのまま）', hd && hd.join(',') === '番号,氏名,系列,かな,状態,性別,グレード,タイトル,タイトル順位' && r1[7] === 'TEAM ELITE' && r1[8] === 8 && r4[6] === 'JETCLUB' && r4[7] === 'BR（グレード）' && r4[8] === 1, JSON.stringify(csv && csv.rows.slice(0, 3)));
      c('CSV出力は今までどおり全員（絞り込みに関係なく）', csv && csv.rows.filter(r => /^GR/.test(r[0])).length === 8, csv && csv.rows.length);
      // 名前をコピー
      await ev(`document.getElementById('btnNameCopy').click()`); await wt(500);
      const o1 = await ev(`document.getElementById('ncOut').value`);
      c('名前をコピー：初めは表示中の絞り込み（BR以上）・1行に1人・高い順', o1 === ['見本 一郎', '見本 八郎', '見本 二郎', '見本 三郎', '見本 四郎'].join('\n'), JSON.stringify(o1));
      await ev(`(function(){ var s=document.getElementById('ncTi'); s.value='4'; s.dispatchEvent(new Event('change')); })()`); await wt(400);
      c('RUBY以上に変えると減る（無効・研修生は入らない）', (await ev(`document.getElementById('ncOut').value`)) === '見本 一郎\n見本 八郎\n見本 二郎');
      await ev(`(function(){ var s=document.getElementById('ncUn'); s.value='all'; s.dispatchEvent(new Event('change')); })()`); await wt(500);
      const o3 = await ev(`document.getElementById('ncOut').value`);
      c('見られる全ユニオンにすると DEFI の人も入る', o3.split('\n').indexOf('見本 花子') >= 0 && o3.split('\n').length === 4, JSON.stringify(o3));
      await ev(`(function(){ var s=document.getElementById('ncTi'); s.value='1'; s.dispatchEvent(new Event('change')); })()`); await wt(500);
      const o4 = await ev(`document.getElementById('ncOut').value`), cnt = await ev(`document.getElementById('ncCnt').textContent`);
      c('同じ名前（別ユニオン）は1行にまとめる', o4.split('\n').filter(x => x === '見本 一郎').length === 1 && /同じ名前を1つにまとめました・全7人/.test(cnt) && /^6人/.test(cnt), cnt + ' / ' + JSON.stringify(o4));
      await page.screenshot({ path: OUT + '/ckti153_copy.png' });
      await ev(`window.__copied = null; navigator.clipboard.writeText = function(t){ window.__copied = t; return Promise.resolve(); }; document.getElementById('ncCopy').click();`); await wt(200);
      c('コピーで名前の一覧がクリップボードへ', (await ev(`window.__copied`)) === o4);
      await ev(`window.__csv = null; document.getElementById('ncCsv').click()`); await wt(200);
      const c2 = await ev(`window.__csv`);
      c('CSVで保存：番号・氏名・ユニオン・系列・グレード・タイトル・順位（同じ名前も別の行）', c2 && c2.rows[0].join(',') === '番号,氏名,ユニオン,系列,グレード,タイトル,タイトル順位' && c2.rows.length === 8 && /BR以上_全ユニオン/.test(c2.n), JSON.stringify(c2 && [c2.n, c2.rows.length]));
      await ev(`document.getElementById('ncClose').click()`);
    }
    c('エラーなし' + W, !errs.length, errs.join('/'));
    await ctx.close();
  }
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
