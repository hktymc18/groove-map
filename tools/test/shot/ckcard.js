// 受付（checkin/index.html）のスマホ会員証の写真。架空のデータだけで表示する
// 使い方: CASES='[["名前",{"name":"見本 太郎","cardTitle":"RUBY","badges":["EXPERT"]}]]' VW=390 VH=844 DARK=1 PFX=x node tools/test/shot/ckcard.js
//   → tools/test/out/x_名前.png（横向きは VW=844 VH=390・DARK=1 でダークモード）
//   DATA='{"パス":{…}}' で架空のデータを足す・FULL=1 でページ全体・RM=1 で動きを止める（変更前後の比較用）
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const DIR = require('path').resolve(__dirname, '../../..');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const ctx = await b.newContext({ serviceWorkers: 'block', colorScheme: process.env.DARK ? 'dark' : 'light', reducedMotion: process.env.RM ? 'reduce' : 'no-preference', viewport: { width: +(process.env.VW || 390), height: +(process.env.VH || 844) }, deviceScaleFactor: 2 });
  const OUT = process.env.OUT || (__dirname + '/../out'); fs.mkdirSync(OUT, { recursive: true });
  const cases = JSON.parse(process.env.CASES || '[["plain",{}]]');
  for (const [nm, card] of cases) {
    const page = await ctx.newPage();
    await page.clock.setFixedTime(new Date('2026-10-28T13:00:00+09:00'));
    page.on('pageerror', e => console.log('PAGEERR', nm, e.message));
    const data = { 'cards/tok1': Object.assign({ no: 'ZZ0001', name: '見本 太郎', group: '', union: 'ANTARES', grade: '', active: true }, card), 'checkinConfig/launch': { platinum: true } };
    Object.assign(data, JSON.parse(process.env.DATA || '{}'));   // 例: DATA='{"cards/tok1/prof/me":{"intro":"…"}}'
    await page.addInitScript(d => { window.__FBDATA = d; }, data);
    await page.route('**/*', async (route) => {
      const u = route.request().url();
      if (u.indexOf('firebase-app-compat.js') >= 0) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(__dirname + '/fbstub.js', 'utf8') });
      if (u.indexOf('firebasejs') >= 0) return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
      if (u.indexOf('qrcode.min.js') >= 0) return route.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.QRCode=function(el){el.innerHTML="<div style=\\"width:100%;aspect-ratio:1;background:repeating-conic-gradient(#000 0 25%,#fff 0 50%) 0 0/12px 12px\\"></div>";};window.QRCode.CorrectLevel={L:1,M:0,Q:3,H:2};' });
      const m = u.match(/\/groove-map\/checkin\/([\w./-]*)/);
      if (m) { const f = DIR + '/checkin/' + (m[1].split('?')[0] || 'index.html'); if (fs.existsSync(f) && fs.statSync(f).isFile()) return route.fulfill({ status: 200, body: /index\.html$/.test(f) ? fs.readFileSync(f, 'utf8').replace(/\n\}\)\(\);\n<\/script>\s*<\/body>/, '\nwindow.__ck = { cardModal: cardModal, renderCard: renderCard, olDesign: olDesign, ckTcgBuild: ckTcgBuild };\n})();\n</script></body>') : fs.readFileSync(f), contentType: /\.html$/.test(f) ? 'text/html; charset=utf-8' : /\.webp$/.test(f) ? 'image/webp' : /\.woff2$/.test(f) ? 'font/woff2' : /\.png$/.test(f) ? 'image/png' : 'application/octet-stream' }); }
      return route.fulfill({ status: 404, body: '' });
    });
    await page.goto('https://hktymc18.github.io/groove-map/checkin/index.html' + (process.env.HASH != null ? process.env.HASH : '#c=tok1'));   // HASH='' で管理画面
    await page.waitForTimeout(+(process.env.WAIT || 1500));   // PLATINUMの解禁の演出（約4秒）を待つ時は WAIT=4500
    const P = OUT + '/' + (process.env.PFX || 'ck') + '_' + nm + '.png';
    const r = await page.evaluate(() => { const c = document.getElementById('memberCard'); window.scrollTo(0, Math.max(0, c.getBoundingClientRect().top + scrollY - 20)); return { cls: c.className, badge: document.getElementById('mcBadge').innerText.replace(/\n/g, '|'), sw: document.documentElement.scrollWidth, iw: innerWidth }; });
    if (process.env.JS) { console.log('JS', await page.evaluate(process.env.JS)); await page.waitForTimeout(400); }   // 例: JS='__ck.cardModal({no:"ZZ0001",union:"ANTARES",cardTitle:"GOLD"})'
    await page.waitForTimeout(200);
    await page.screenshot({ path: P, fullPage: !!process.env.FULL });
    console.log(nm, JSON.stringify(r));
    await page.close();
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
