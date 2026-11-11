// 受付 v135：ユーザーのカードをアプリの形に（下のタブ：ホーム・プラン・受付QR・なかま・マイページ）。架空データ
//   今の各エリアはそのまま、置き場所だけをタブの画面へ。研修生になった人・ビジネスの会員証は今までの形
const path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const pad = n => (n < 10 ? '0' : '') + n, ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };
const TA = '0123456789abcdef0123456789abcdef', UA = 'u17620000000001';
const KA = 'b_aaaaaaaaaaaaaaaaaaaa', KB = 'b_bbbbbbbbbbbbbbbbbbbb';
const plan = (() => { const days = {}; for (let i = 1; i <= 6; i++) days[day(-i)] = ['water', 'walk']; return { course: 'diet', goal: '30日つづける', qs: ['water', 'walk', 'dinner'], start: day(-12), days, atMs: 1 }; })();
const data = (x) => Object.assign({
  ['cards/' + TA]: { kind: 'user', no: UA, name: '見本 はなこ', union: 'ANTARES', referrer: '架空 太郎', active: true, visits: 3, lastVisit: { d: day(-1), ev: '11月のDAY' },
    pz_a: { v: 760, d: day(-30), at: 1 }, pz_b: { v: 820, d: day(-1), at: 2 }, inv_u17620000000009: { n: '見本 さくら', d: day(-1), ev: '11月のDAY' } },
  ['cardClaims/' + UA]: { t: TA },
  ['cards/' + TA + '/plan/me']: plan,
  ['cards/' + TA + '/buddy/me']: { k: KA, list: [{ k: KB, n: '見本 さくら' }], at: 1 },
  ['ckBuddy/' + KA]: { uid: UA, n: '見本 はなこ', st: 6, bdg: 5, td: day(-1), at: 1 },
  ['ckBuddy/' + KB]: { uid: 'u17620000000009', n: '見本 さくら', st: 12, bdg: 6, td: day(0), at: 1 },
  'ckNotice/ANTARES': { items: [{ t: '12月のDAYは、14時からの開始です。', d: day(-2) }] },
  'checkinEvents/e2': { date: day(12), name: '12月のDAY', unions: ['ANTARES'], uDay: true, uInfo: '14:00〜 見本ホール' },
  'ckLounge/p1': { union: 'ANTARES', uid: 'u2', n: '見本 さくら', co: 'ダイエット編', t: '今週は毎日15分歩けました。', st: 'ok', okAt: 2000 },
  'ckLounge/p1/clap/u9': { at: 1 } }, x || {});
const vis = (id) => `(function(){ var e=document.getElementById('${id}'); return !!(e && e.offsetParent !== null && e.getBoundingClientRect().height > 0); })()`;
(async () => {
  const b = await P.browser();
  for (const dark of [false, true]) {
    const sfx = dark ? '_d' : '';
    const { ctx, page, ev, wt, errs } = await P.open(b, { dark, hash: '#c=' + TA, data: data(), wait: 2600 });
    await page.addStyleTag({ content: '#toast{display:none!important}' });
    c('アプリの形（下のタブ5つ：ホーム・プラン・受付QR・なかま・マイページ）' + (dark ? '（ダーク）' : ''), (await ev(`document.body.classList.contains('uapp') && [].map.call(document.querySelectorAll('#uaTabs [data-tab]'),function(b){return b.textContent;}).join('|')`)) === 'ホーム|プラン|受付QR|なかま|マイページ');
    c('開いた時はホーム（あいさつ・NEWS・今日のクエスト・PRYSMiO・ラウンジの新着）', /見本 はなこ さん/.test(await ev(`document.getElementById('uaHello').textContent`)) && (await ev(vis('nwArea'))) && /今日のクエスト/.test(await ev(`document.getElementById('uaHomeQ').innerText`)) && /820/.test(await ev(`document.getElementById('uaHomePz').innerText`)) && /今週は毎日15分/.test(await ev(`document.getElementById('uaHomeLg').innerText`)));
    c('ホームではQRのカードもプランも見えない', !(await ev(vis('memberCard'))) && !(await ev(vis('mpArea'))));
    c('下のタブが画面の下に固定（横にはみ出さない）', (await ev(`(function(){ var r=document.getElementById('uaTabs').getBoundingClientRect(); return Math.round(r.bottom) === innerHeight && r.width === innerWidth; })()`)) && (await ev('document.documentElement.scrollWidth')) === 390);
    await page.screenshot({ path: OUT + '/ckua135_home' + sfx + '.png' });
    if (!dark) {
      await page.click('#uaHomeQ [data-uq="dinner"]'); await wt(500);
      const pl = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['cards/${TA}/plan/me'])`));
      c('ホームの今日のクエストをその場でチェック（プランに保存・ホームのまま）', (pl.days[ymd(new Date())] || []).indexOf('dinner') >= 0 && (await ev(`document.querySelector('#uaApp .ua-pg.on').getAttribute('data-p')`)) === 'home' && /1\/3/.test(await ev(`document.getElementById('uaHomeQ').innerText`)));
      c('プランの画面にも同じチェック', /1\/3/.test(await ev(`document.querySelector('#mpArea .mp-h').textContent`)));
    }
    await page.click('#uaTabs [data-tab="plan"]'); await wt(300);
    c('プラン：MY PLAN だけ', (await ev(vis('mpArea'))) && !(await ev(vis('nwArea'))));
    await page.screenshot({ path: OUT + '/ckua135_plan' + sfx + '.png' });
    await page.click('#uaTabs [data-tab="qr"]'); await wt(300);
    c('受付QR：カード（QR）と来場回数', (await ev(vis('memberCard'))) && /来場 3 回/.test(await ev(`document.getElementById('uaVisits').textContent`)) && !(await ev(vis('mpArea'))));
    await page.screenshot({ path: OUT + '/ckua135_qr' + sfx + '.png' });
    await page.click('#uaTabs [data-tab="friends"]'); await wt(300);
    c('なかま：はじめはラウンジ（バディ・招待は隠れている）', (await ev(vis('lgArea'))) && !(await ev(vis('bdArea'))) && !(await ev(vis('fiArea'))));
    await page.screenshot({ path: OUT + '/ckua135_friends' + sfx + '.png' });
    await page.click('#uaApp .ua-seg [data-seg="buddy"]'); await wt(200);
    c('なかま：バディに切りかえ', (await ev(vis('bdArea'))) && !(await ev(vis('lgArea'))));
    await page.click('#uaApp .ua-seg [data-seg="invite"]'); await wt(200);
    c('なかま：招待に切りかえ', (await ev(vis('fiArea'))) && /見本 さくら/.test(await ev(`document.getElementById('fiArea').innerText`)));
    await page.click('#uaTabs [data-tab="me"]'); await wt(300);
    c('マイページ：名前・紹介者・PRYSMiO の記録・スマホの通知の欄', /見本 はなこ/.test(await ev(`document.getElementById('uaMe').innerText`)) && /紹介：架空 太郎/.test(await ev(`document.getElementById('uaMe').innerText`)) && (await ev(vis('pzArea'))) && (await ev(`!!document.querySelector('#uaMeNw')`)));
    await page.screenshot({ path: OUT + '/ckua135_me' + sfx + '.png' });
    if (!dark) {
      await page.click('#uaBell'); await wt(300);
      c('右上のベルでホーム（NEWS）へ', (await ev(`document.querySelector('#uaApp .ua-pg.on').getAttribute('data-p')`)) === 'home');
      await page.click('#uaTabs [data-tab="plan"]'); await wt(200);
      await page.reload(); await wt(2600);
      c('開き直しても、さっきの画面のまま（同じ見ている間）', (await ev(`document.querySelector('#uaApp .ua-pg.on').getAttribute('data-p')`)) === 'plan');
      await ev(`document.getElementById('mcHelp').click()`); await wt(300);
      c('モーダルはタブより上に出る', (await ev(`(function(){ var m=document.querySelector('.modalback'); return !!m && +getComputedStyle(m).zIndex > +getComputedStyle(document.getElementById('uaTabs')).zIndex; })()`)));
    }
    c('エラーなし' + (dark ? '（ダーク）' : ''), !errs.length, errs.join(' / '));
    await ctx.close();
  }
  // DAY の当日は、開くと受付QR
  {
    const o = await P.open(b, { hash: '#c=' + TA, data: data({ 'checkinEvents/e3': { date: day(0), name: '今日のDAY', unions: ['ANTARES'], uDay: true } }), wait: 2600 });
    c('DAY の当日（自分のユニオン）は、開くと受付QR', (await o.ev(`document.querySelector('#uaApp .ua-pg.on').getAttribute('data-p')`)) === 'qr' && (await o.ev(vis('memberCard'))));
    await o.ctx.close();
  }
  // 今までの形のまま
  {
    const o = await P.open(b, { hash: '#c=' + TA, data: data({ ['cards/' + TA]: { kind: 'user', no: UA, name: '見本 はなこ', union: 'ANTARES', active: true, toMember: 'P0006', toCard: 'feed' } }), wait: 2400 });
    c('研修生になったユーザーのカードは今までの形（タブなし）', !(await o.ev(`document.body.classList.contains('uapp')`)) && !(await o.ev(`!!document.getElementById('uaTabs')`)));
    await o.ctx.close();
    const o2 = await P.open(b, { hash: '#c=tokM', data: { 'cards/tokM': { no: 'ZZ0001', name: '架空 太郎', union: 'ANTARES', active: true } }, wait: 2400 });
    c('ビジネスメンバーの会員証は今までの形（タブなし）', !(await o2.ev(`document.body.classList.contains('uapp')`)) && (await o2.ev(vis('memberCard'))));
    c('エラーなし（今までの形）', !o.errs.length && !o2.errs.length, o.errs.concat(o2.errs).join(' / '));
    await o2.ctx.close();
  }
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
