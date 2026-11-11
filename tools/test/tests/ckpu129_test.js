// 受付 v129・v135（通知の行はマイページ）：ユーザーのカードの「スマホの通知」（NAVIGATOR Beauty・準備中）。通知を受け取る／やめる・iPhone はホーム画面に追加してから・
//   ユーザーのカードだけ「ホーム画面のアプリ」の印（架空データ。通知の許可・サービスワーカー・通知の宛先はにせもの）
const path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
// 通知の許可・サービスワーカー・端末の種類を、ページより先に差し替える
const fake = (o) => `(function(){
  window.__FBMSG = ${JSON.stringify(o.tok || '')};
  var perm = ${JSON.stringify(o.perm || 'default')};
  window.Notification = function(){}; Object.defineProperty(window.Notification, 'permission', { get: function(){ return perm; } });
  window.Notification.requestPermission = function(){ perm = ${JSON.stringify(o.answer || 'granted')}; return Promise.resolve(perm); };
  window.PushManager = window.PushManager || function(){};
  window.__swReg = [];
  Object.defineProperty(navigator, 'serviceWorker', { value: { register: function(u, x){ window.__swReg.push(u + '|' + (x && x.scope)); return Promise.resolve({}); }, ready: Promise.resolve({ scope: './' }) } });
  ${o.ua ? `Object.defineProperty(navigator, 'userAgent', { get: function(){ return ${JSON.stringify(o.ua)}; } });` : ''}
})();`;
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
(async () => {
  const b = await P.browser();
  const tok = '0123456789abcdef0123456789abcdef', uid = 'u17620000000001';
  const card = (x) => Object.assign({ kind: 'user', no: uid, name: '見本 はなこ', union: 'ANTARES', referrer: '架空 太郎', active: true, visits: 3 }, x);
  // ① Android など：通知を受け取る → やめる
  for (const dark of [false, true]) {
    const { ctx, page, ev, wt, errs } = await P.open(b, { dark, hash: '#c=' + tok, data: { ['cards/' + tok]: card() }, init: fake({ tok: 'fcm-token-1' }) });
    const t0 = await ev(`document.getElementById('uaMeNw').innerText`);
    c('マイページに「スマホの通知」と「通知を受け取る」（v135：アプリの形）' + (dark ? '（ダーク）' : ''), /スマホの通知/.test(t0) && /DAYの前日のお知らせと、来場のお礼が届きます/.test(t0) && /通知を受け取る/.test(t0), t0);
    if (!dark) {
      await page.screenshot({ path: OUT + '/ckpu129_off.png' });
      await ev(`document.getElementById('nwPush').click()`); await wt(800);
      const d = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['ckPush/${uid}']||null)`));
      c('受け取ると、送り先が入る（カード・ユニオン・宛先・オン）', d && d.card === tok && d.union === 'ANTARES' && d.t === 'fcm-token-1' && d.on === true, JSON.stringify(d));
      c('通知の仕組みは /checkin/ の範囲だけで登録する（push-sw.js）', (await ev(`window.__swReg.join(',')`)) === 'push-sw.js|./');
      const t1 = await ev(`document.getElementById('uaMeNw').innerText`);
      c('受け取り中の表示と「通知をやめる」', /受け取っています/.test(t1) && /通知をやめる/.test(t1), t1);
      await page.screenshot({ path: OUT + '/ckpu129_on.png' });
      await ev(`document.getElementById('nwPush').click()`); await wt(600);
      const d2 = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['ckPush/${uid}'])`));
      c('やめると、送り先がオフになる', d2.on === false && d2.t === 'fcm-token-1' && /通知を受け取る/.test(await ev(`document.getElementById('uaMeNw').innerText`)), JSON.stringify(d2));
    }
    c('エラーなし' + (dark ? '（ダーク）' : ''), !errs.length, errs.join('/'));
    await ctx.close();
  }
  // ② 許可されなかった・止められている
  {
    const o = await P.open(b, { hash: '#c=' + tok, data: { ['cards/' + tok]: card() }, init: fake({ tok: 'fcm-token-1', answer: 'denied' }) });
    await o.ev(`document.getElementById('nwPush').click()`); await o.wt(500);
    c('許可されなかった時は案内が出て、送り先は入らない', /許可されませんでした/.test(await o.ev(`document.getElementById('toast').textContent`)) && !(await o.ev(`!!window.__FBDATA['ckPush/${uid}']`)));
    await o.ctx.close();
    const o2 = await P.open(b, { hash: '#c=' + tok, data: { ['cards/' + tok]: card() }, init: fake({ perm: 'denied' }) });
    const t = await o2.ev(`document.getElementById('uaMeNw').innerText`);
    c('止められている時は「設定から許可してください」（ボタンなし）', /通知が止められています/.test(t) && !(await o2.ev(`!!document.getElementById('nwPush')`)), t);
    await o2.ctx.close();
  }
  // ③ iPhone（ホーム画面に追加していない）
  {
    const o = await P.open(b, { hash: '#c=' + tok, data: { ['cards/' + tok]: card() }, init: fake({ tok: 'x', ua: IPHONE }) });
    const t = await o.ev(`document.getElementById('nwArea').innerText`);
    c('iPhone（Safari）は通知のボタンを出さず、ホーム画面に追加の案内に「通知も受け取れます」', !(await o.ev(`!!document.getElementById('nwPush')`)) && /お知らせの通知も受け取れます/.test(t), t);
    const h = JSON.parse(await o.ev(`(function(){ var m=document.querySelector('link[rel="manifest"]'); var mf=m?JSON.parse(decodeURIComponent(m.href.replace(/^data:application\\/manifest\\+json,/,''))):null; return JSON.stringify({ cap: (document.querySelector('meta[name="apple-mobile-web-app-capable"]')||{}).content||'', title: (document.querySelector('meta[name="apple-mobile-web-app-title"]')||{}).content||'', mf: mf }); })()`));
    c('ユーザーのカードは「ホーム画面のアプリ」の印（このカードを開く・standalone）', h.cap === 'yes' && h.title === 'NAVIGATOR Beauty' && h.mf && h.mf.display === 'standalone' && h.mf.start_url === 'https://hktymc18.github.io/groove-map/checkin/index.html#c=' + tok, JSON.stringify(h));
    await o.page.screenshot({ path: OUT + '/ckpu129_iphone.png' });
    c('エラーなし（iPhone）', !o.errs.length, o.errs.join('/'));
    await o.ctx.close();
  }
  // ④ ビジネスの会員証・研修生になった人には印を付けない
  {
    const o = await P.open(b, { hash: '#c=tokM', data: { 'cards/tokM': { no: 'ZZ0001', name: '架空 太郎', union: 'ANTARES', active: true } } });
    c('ビジネスの会員証には「ホーム画面のアプリ」の印を付けない（今までどおり）', !(await o.ev(`!!document.querySelector('link[rel="manifest"]') || !!document.querySelector('meta[name="apple-mobile-web-app-capable"]')`)));
    await o.ctx.close();
    const o2 = await P.open(b, { hash: '#c=' + tok, data: { ['cards/' + tok]: card({ toMember: 'P0006', toCard: 'feed' }) } });
    c('研修生になったユーザーのカードにも付けない', !(await o2.ev(`!!document.querySelector('link[rel="manifest"]')`)));
    await o2.ctx.close();
  }
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
