// 受付 v136：ユーザーのアプリの赤丸（ホーム・ベル＝新しいお知らせ／なかま・ラウンジ＝新しい投稿・自分の投稿が出せなかった）。架空データ
//   はじめて開いた時は今あるものを「見た」にする。その画面を見たら消える
const path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const pad = n => (n < 10 ? '0' : '') + n, ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };
const TA = '0123456789abcdef0123456789abcdef', UA = 'u17620000000001';
(async () => {
  const b = await P.browser();
  const base = {
    ['cards/' + TA]: { kind: 'user', no: UA, name: '見本 はなこ', union: 'ANTARES', referrer: '架空 太郎', active: true, visits: 1 },
    ['cardClaims/' + UA]: { t: TA },
    'ckNotice/ANTARES': { items: [{ t: '12月のDAYは14時から。', d: day(-3) }] },
    'ckLounge/p1': { union: 'ANTARES', uid: 'u2', n: '見本 さくら', t: '毎日歩けました。', st: 'ok', okAt: 2000 } };
  const { ctx, page, ev, wt, errs } = await P.open(b, { hash: '#c=' + TA, data: base, wait: 2600 });
  const dots = () => ev(`[].map.call(document.querySelectorAll('.ua-dot'), function(d){ return (d.closest('[data-tab]') ? d.closest('[data-tab]').getAttribute('data-tab') : d.closest('#uaBell') ? 'bell' : 'seg') + ':' + (d.hidden ? 0 : 1); }).join(',')`);
  const reopen = async (more) => {   // データを足して、端末の控え（お知らせ30分・ラウンジ10分）を消して開き直す
    await page.addInitScript(d => { window.__FBDATA = Object.assign(window.__FBDATA || {}, d); }, more);
    await ev(`localStorage.removeItem('bci_ntc_ANTARES'); localStorage.removeItem('bci_lg_ANTARES');`);
    await page.reload(); await wt(2800);
  };
  c('はじめて開いた時は赤丸なし（今あるものは「見た」）', (await dots()).split(',').sort().join(',') === 'bell:0,friends:0,home:0,seg:0', await dots());
  await page.click('#uaTabs [data-tab="plan"]'); await wt(200);
  // ① 新しいお知らせ
  await reopen({ 'ckNotice/ANTARES': { items: [{ t: '12月のDAYは14時から。', d: day(-3) }, { t: '持ち物：タオル', d: day(0) }] } });
  c('新しいお知らせ → ホームのタブとベルに赤丸（プランを見ている間）', /home:1/.test(await dots()) && /bell:1/.test(await dots()) && /friends:0/.test(await dots()), await dots());
  await page.screenshot({ path: OUT + '/ckbg136_dot.png' });
  await page.click('#uaTabs [data-tab="home"]'); await wt(300);
  c('ホームを見ると消える', /home:0/.test(await dots()) && /bell:0/.test(await dots()), await dots());
  await page.click('#uaTabs [data-tab="me"]'); await wt(200);
  await reopen({});
  c('同じお知らせのままなら、開き直しても赤丸なし', /home:0/.test(await dots()), await dots());
  // ② ラウンジの新しい投稿（ほかの人）
  await reopen({ 'ckLounge/p2': { union: 'ANTARES', uid: 'u3', n: '見本 ゆり', t: 'スキンケア3日目！', st: 'ok', okAt: 3000 } });
  c('ラウンジに新しい投稿 → なかまのタブとラウンジに赤丸', /friends:1/.test(await dots()) && /seg:1/.test(await dots()) && /home:0/.test(await dots()), await dots());
  await page.click('#uaTabs [data-tab="friends"]'); await wt(300);
  c('なかま（ラウンジ）を見ると消える', /friends:0/.test(await dots()) && /seg:0/.test(await dots()), await dots());
  await page.click('#uaTabs [data-tab="home"]'); await wt(200);
  // ③ 自分の投稿が出せなかった
  await reopen({ 'ckLounge/m1': { union: 'ANTARES', uid: UA, n: '見本 はなこ', t: 'やせた！', st: 'ng', at: 1 }, ['cards/' + TA + '/lounge/m1']: { at: 1 } });
  c('自分の投稿が「出せませんでした」→ なかまに赤丸', /friends:1/.test(await dots()), await dots());
  await page.click('#uaTabs [data-tab="friends"]'); await wt(300);
  c('見ると消える', /friends:0/.test(await dots()), await dots());
  // ④ 自分の投稿が出た（ほかの人の投稿ではない）→ 赤丸なし
  await page.click('#uaTabs [data-tab="home"]'); await wt(200);
  await reopen({ 'ckLounge/m2': { union: 'ANTARES', uid: UA, n: '見本 はなこ', t: '7日続きました', st: 'ok', okAt: 9000 } });
  c('自分の投稿が出ただけでは赤丸なし', /friends:0/.test(await dots()), await dots());
  c('エラーなし', !errs.length, errs.join(' / '));
  await ctx.close(); await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
