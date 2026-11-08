// v871 #41：PCのMAPの上の帯（ツールバー）で、幅が足りない時に右のボタン（課題・受付連携・全画面・⋯）が切れていた。
//   足りない時だけ2行に折り返す。ブラウザ（Chromium）で幅を変えて、どのボタンも画面の外にはみ出さないことを確かめる（架空データ）
const PW = '/opt/node22/lib/node_modules/playwright';
const { chromium } = require(require('fs').existsSync(PW) ? PW : 'playwright');
const fs = require('fs'), path = require('path');
const DIR = path.resolve(__dirname, '../../..'), ST = DIR + '/tools/test/shot', OUT = DIR + '/tools/test/out';
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  for (const W of [1100, 1280, 1600]) for (const fsOn of [false, true]) {
    const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: W, height: 800 }, deviceScaleFactor: 1, colorScheme: 'dark' });
    const page = await ctx.newPage(), errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.route('**/*', async (route) => {
      const u = route.request().url();
      if (/app\.js/.test(u) && u.indexOf('firebase') < 0) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(DIR + '/app.js') });
      if (u.startsWith('https://hktymc18.github.io/groove-map/') && !/\.(png|js|webmanifest)/.test(u)) return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: fs.readFileSync(DIR + '/index.html') });
      if (u.indexOf('firebase-app-compat.js') >= 0) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(ST + '/fbstub.js', 'utf8') });
      if (u.indexOf('firebasejs') >= 0) return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
      return route.fulfill({ status: 404, body: '' });
    });
    await page.goto('https://hktymc18.github.io/groove-map/');
    await page.waitForFunction(() => window.state && document.getElementById('loginScreen') && document.getElementById('loginScreen').style.display === 'none' && typeof currentUser !== 'undefined' && currentUser, null, { timeout: 60000 });
    await page.evaluate(() => { state.isEditor = true; switchView('current'); });
    await page.waitForTimeout(800);
    if (fsOn) { await page.evaluate(() => mapFullscreen()); await page.waitForTimeout(500); }
    const r = await page.evaluate(() => {
      const tb = document.getElementById('pcToolbarC'), R = tb.getBoundingClientRect();
      const kids = [...tb.querySelectorAll('.pt-action,.pv-seg,.pt-search,.pt-ltsv,.pt-mapseg')].filter(x => x.offsetParent);
      return { n: kids.length, out: kids.filter(x => x.getBoundingClientRect().right > Math.min(R.right, window.innerWidth) + 1).map(x => x.textContent.trim().slice(0, 8)) };
    });
    c('幅' + W + (fsOn ? '・全画面' : '') + '：MAPの上の帯のボタンが右で切れない', r.n > 5 && !r.out.length, JSON.stringify(r));
    if (W === 1280) await page.screenshot({ path: OUT + '/tb871_' + W + (fsOn ? '_fs' : '') + '.png', clip: { x: 0, y: 0, width: W, height: 140 } });
    c('ページのエラーなし（幅' + W + (fsOn ? '・全画面' : '') + '）', !errs.length, errs.join(' / '));
    await ctx.close();
  }
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
