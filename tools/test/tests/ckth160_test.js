// 受付 v160：受付の画面全部をコムギニュースと同じ色に（大事なボタンは青・丸いボタン・ライトはうすいグレー／ダークは濃いグレー）。
//   受付・名簿・イベント・会計・集計・会員証を、ライト／ダーク・PC／スマホで開いて、緑が残っていないか・エラーがないかを見る（架空データ）
const path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const OWNER = 'j2DPDAccCygHmR9i5K3bTvHnH0V2';
const pad = n => (n < 10 ? '0' : '') + n, d = new Date(), TODAY = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const data = () => ({
  'checkinUnions/GRANT': { name: 'GRANT', unionAdmins: [OWNER] },
  'checkinMembers/GR0001': { no: 'GR0001', name: '見本 一郎', union: 'GRANT', cardTitle: 'RUBY', group: '見本', cardToken: 'tokA' },
  'checkinMembers/GR0002': { no: 'GR0002', name: '見本 二郎', union: 'GRANT', grade: 'BR', group: '見本' },
  'checkinMembers/GR0003': { no: 'GR0003', name: '見本 三郎', union: 'GRANT', trainee: true, group: '見本' },
  'checkinEvents/ev1': { date: TODAY, month: TODAY.slice(0, 7), name: 'PG', hostUnion: 'GRANT', unions: ['GRANT'], fee: 1000 },
  'cards/tokA': { no: 'GR0001', name: '見本 一郎', union: 'GRANT', cardTitle: 'RUBY', active: true },
});
// 緑っぽい色か（G が R・B より 25 以上大きい）
const greenish = rgb => { const m = /(\d+), (\d+), (\d+)/.exec(rgb || ''); return !!m && (+m[2] - Math.max(+m[1], +m[3]) >= 25); };
const GREEN_SCAN = `(function(){ var out = []; [].forEach.call(document.querySelectorAll('body *'), function(el){
  if(!el.offsetParent && el.tagName !== 'BODY') return; if(el.closest('.mc, .mcard, .ckcard, canvas, svg, img, .tcg')) return;
  var s = getComputedStyle(el); [['bg', s.backgroundColor], ['fg', s.color], ['bd', s.borderTopColor]].forEach(function(p){
    var m = /(\\d+), (\\d+), (\\d+)(, ([\\d.]+))?/.exec(p[1]); if(!m || (m[5] !== undefined && +m[5] < .2)) return;
    if(+m[2] - Math.max(+m[1], +m[3]) >= 25 && (p[0] !== 'bd' || parseFloat(s.borderTopWidth) > 0)) out.push((el.id || el.className || el.tagName) + ':' + p[0] + ':' + p[1]); }); });
  return out.slice(0, 8); })()`;
(async () => {
  const b = await P.browser();
  for (const dark of [false, true]) for (const vw of [1280, 390]) {
    const W = (dark ? 'ダーク' : 'ライト') + '・' + (vw > 500 ? 'PC' : 'スマホ');
    const { page, ev, wt, errs, ctx } = await P.open(b, { data: data(), dark, vw, vh: vw > 500 ? 860 : 844, wait: 2000 });
    await ev(`(function(){ var x=document.getElementById('gxHintOk'); if(x) x.click(); [].forEach.call(document.querySelectorAll('button'), function(b){ if(/^(OK|閉じる)/.test(b.textContent.trim()) && b.offsetParent && b.closest('.gx, .rn, #rnBox, .modal')) b.click(); }); })()`); await wt(200);
    const bg = await ev(`getComputedStyle(document.body).backgroundColor`);
    c('背景（' + W + '）', bg === (dark ? 'rgb(31, 32, 35)' : 'rgb(242, 242, 243)'), bg);
    for (const pane of ['pKiosk', 'pRoster', 'pEvents', 'pFin', 'pStats']) {
      await ev(`(function(){ var t=document.querySelector('nav button[data-pane="${pane}"]'); if(t) t.click(); })()`); await wt(500);
      const g = await ev(GREEN_SCAN);
      c('緑が残っていない：' + pane + '（' + W + '）', !g.length, g.join(' | '));
      await page.screenshot({ path: OUT + '/ckth160_' + pane + '_' + (dark ? 'd' : 'l') + (vw > 500 ? '' : '_m') + '.png' });
    }
    const pr = await ev(`(function(){ var b=document.getElementById('btnAddMember'); var s=getComputedStyle(b); return [s.backgroundColor, s.color, s.borderTopLeftRadius]; })()`);
    c('大事なボタン（＋メンバー追加）は青・白い文字・丸い（' + W + '）', pr[0] === (dark ? 'rgb(91, 156, 246)' : 'rgb(59, 130, 246)') && pr[1] === 'rgb(255, 255, 255)' && parseFloat(pr[2]) >= 15, pr.join(' / '));
    c('横にはみ出さない（' + W + '）', (await ev(`document.documentElement.scrollWidth`)) <= vw);
    c('エラーなし（' + W + '）', !errs.length, errs.join('/'));
    await ctx.close();
  }
  // 会員証（会員が見る画面）
  for (const dark of [false, true]) {
    const { page, ev, errs, ctx } = await P.open(b, { data: data(), dark, hash: '#c=tokA', wait: 2200 });
    c('会員証のページの背景（' + (dark ? 'ダーク' : 'ライト') + '）', (await ev(`getComputedStyle(document.body).backgroundColor`)) === (dark ? 'rgb(31, 32, 35)' : 'rgb(242, 242, 243)'));
    c('会員証のページ：エラーなし（' + (dark ? 'ダーク' : 'ライト') + '）', !errs.length, errs.join('/'));
    await page.screenshot({ path: OUT + '/ckth160_card_' + (dark ? 'd' : 'l') + '.png', fullPage: true });
    await ctx.close();
  }
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
