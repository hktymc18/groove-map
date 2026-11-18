// 受付 v158：研修生登録ページ（#trainer）は緑を使わない（受付の画面と同じ黒・白・グレー基調）。ほかの画面の緑はそのまま（架空データ）
const path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const data = () => ({
  'users/tr1': { name: '見本 担当', union: 'GRANT', area: '福岡', status: 'active', unionSelectedV2: true },
  'checkinUnions/GRANT': { trainers: ['tr1'], noPrefix: 'ZZ' },
  'trainerNda/tr1__2026-10-19': { uid: 'tr1' },
  'checkinMembers/ZZ0007': { no: 'ZZ0007', name: '見本 たろう', union: 'GRANT', trainee: true, regBy: 'tr1', trainings: { PG: { at: '2026-11-01', by: 'tr1', byName: '見本 担当' } } },
});
// 緑っぽい色か（G が R・B より 25 以上大きい）
const greenish = rgb => { const m = /(\d+), (\d+), (\d+)/.exec(rgb || ''); return !!m && (+m[2] - Math.max(+m[1], +m[3]) >= 25); };
(async () => {
  const b = await P.browser();
  for (const dark of [false, true]) {
    const W = dark ? '（ダーク）' : '';
    const { page, ev, wt, errs, ctx } = await P.open(b, { uid: 'tr1', hash: '#trainer', data: data(), dark, wait: 2200 });
    await ev(`[].forEach.call(document.querySelectorAll('button'), function(x){ if(/^OK/.test(x.textContent.trim()) && x.offsetParent) x.click(); })`);
    c('研修生登録ページの印（html.trm）' + W, await ev(`document.documentElement.classList.contains('trm')`));
    const go = await ev(`(function(){ var s=getComputedStyle(document.getElementById('trGo')); return [s.backgroundColor, s.color]; })()`);
    c('「登録して会員証QRを表示」が緑でない' + W, !greenish(go[0]), go.join(' / '));
    c('ボタンの文字が読める（背景と文字の色が違う）' + W, go[0] !== go[1]);
    await page.screenshot({ path: OUT + '/cktrc158_reg' + (dark ? '_d' : '') + '.png' });
    await ev(`document.getElementById('trOpenNo') || document.getElementById('trTabList').click()`); await wt(300);
    await ev(`document.getElementById('trTabList').click()`); await wt(300);
    await ev(`document.getElementById('trOpenNo').value='ZZ0007'; document.getElementById('trOpenGo').click();`); await wt(500);
    const mk = await ev(`(function(){ var b=document.querySelector('.modal button.primary[data-tk]'); var sp=[].filter.call(document.querySelectorAll('.modal span'), function(x){ return /✓ /.test(x.textContent); })[0]; return [b ? getComputedStyle(b).backgroundColor : '', sp ? getComputedStyle(sp).color : ''] })()`);
    c('研修生のページ：「受講済みにする」と「✓ 受講済み」が緑でない' + W, mk[0] && mk[1] && !greenish(mk[0]) && !greenish(mk[1]), mk.join(' / '));
    await page.screenshot({ path: OUT + '/cktrc158_check' + (dark ? '_d' : '') + '.png' });
    c('エラーなし' + W, !errs.length, errs.join('/'));
    await ctx.close();
  }
  // ほかの画面（受付管理）は今までどおり
  {
    const { ev, ctx } = await P.open(b, { data: {} });
    c('受付管理の画面には印が付かない（緑はそのまま）', !(await ev(`document.documentElement.classList.contains('trm')`)) && greenish(await ev(`getComputedStyle(document.getElementById('btnAddMember')).backgroundColor`)));
    await ctx.close();
  }
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
