// v883：メンバーの写真の画質を上げる（128px・画質62% → 192px・画質82%）。本物の写真（アプリのメニューの風景写真）で、
//   切り抜いた写真の大きさ・容量を測る。重い写真は約19KBまでに抑える（1人のMAPの写真＝8つの文書に約350人分）
const PW = '/opt/node22/lib/node_modules/playwright';
const { chromium } = require(require('fs').existsSync(PW) ? PW : 'playwright');
const fs = require('fs'), path = require('path');
const DIR = path.resolve(__dirname, '../../..'), ST = DIR + '/tools/test/shot', OUT = DIR + '/tools/test/out';
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(), errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.route('**/*', async (route) => {
    const u = route.request().url();
    if (/app\.js/.test(u) && u.indexOf('firebase') < 0) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(DIR + '/app.js') });
    const mImg = u.match(/groove-map\/(img\/[\w.-]+\.(webp|png))/); if (mImg) return route.fulfill({ status: 200, contentType: 'image/' + mImg[2], body: fs.readFileSync(DIR + '/' + mImg[1]) });
    if (u.startsWith('https://hktymc18.github.io/groove-map/') && !/\.(png|js|webmanifest)/.test(u)) return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: fs.readFileSync(DIR + '/index.html') });
    if (u.indexOf('firebase-app-compat.js') >= 0) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(ST + '/fbstub.js', 'utf8') });
    if (u.indexOf('firebasejs') >= 0) return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
    return route.fulfill({ status: 404, body: '' });
  });
  await page.goto('https://hktymc18.github.io/groove-map/');
  await page.waitForFunction(() => window.state && typeof currentUser !== 'undefined' && currentUser, null, { timeout: 60000 });
  const R = [];
  for (const f of ['tile-map', 'tile-plan', 'tile-cal', 'tile-stats', 'tile-todo']) {
    const r = await page.evaluate((src) => new Promise((res) => {
      const im = new Image();
      im.onload = function() {
        _cropImg = im; _cropZ = 1; _cropS0 = CROP_V / Math.min(im.width, im.height);
        _cropOx = (CROP_V - im.width * _cropS0) / 2; _cropOy = (CROP_V - im.height * _cropS0) / 2;
        const url = _cropOut();
        // 前の設定（128px・62%）で同じ写真を切り抜いた時の容量
        const c0 = document.createElement('canvas'); c0.width = c0.height = 128; const s = _cropS0 * _cropZ;
        c0.getContext('2d').drawImage(im, (-_cropOx) / s, (-_cropOy) / s, CROP_V / s, CROP_V / s, 0, 0, 128, 128);
        const old = c0.toDataURL('image/jpeg', 0.62);
        const t = new Image(); t.onload = function() { res({ w: t.width, h: t.height, kb: Math.round(url.length * 0.75 / 102.4) / 10, len: url.length, oldKb: Math.round(old.length * 0.75 / 102.4) / 10, jpg: url.indexOf('data:image/jpeg') === 0, url }); }; t.src = url;
      };
      im.src = src;
    }), 'img/' + f + '.webp');
    R.push(Object.assign({ f }, r));
  }
  console.log('  ' + R.map(r => r.f + ': ' + r.oldKb + 'KB → ' + r.kb + 'KB').join(' / '));
  c('切り抜いた写真は 192×192 の JPEG', R.every(r => r.w === 192 && r.h === 192 && r.jpg));
  c('1枚 約19KB まで（8つの文書に約350人分入る）', R.every(r => r.len <= 26000), JSON.stringify(R.map(r => r.len)));
  c('前（128px・62%）より、きめが細かい分だけ容量が増えている', R.every(r => r.kb > r.oldKb));
  // 写真の見比べ（上が前・下が今。どちらも 64 ポイントの大きさ × 3倍で表示）
  await page.setViewportSize({ width: 420, height: 230 });
  await page.evaluate((L) => {
    document.body.innerHTML = '<div id="cmp" style="background:#fff;padding:10px;display:flex;flex-direction:column;gap:8px"></div>';
    const box = document.getElementById('cmp');
    const row = (urls) => { const d = document.createElement('div'); d.style.cssText = 'display:flex;gap:8px'; urls.forEach(u => { const i = new Image(); i.src = u; i.style.cssText = 'width:192px;height:192px;border-radius:50%;object-fit:cover'; d.appendChild(i); }); box.appendChild(d); };
    row(L);
  }, R.slice(0, 2).map(r => r.url));
  await page.waitForTimeout(300);
  await page.screenshot({ path: OUT + '/av883_new.png' });
  // 保存場所がいっぱいの時の知らせ
  const msg = await page.evaluate(() => [_avSaveErr({ code: 'invalid-argument' }), _avSaveErr({ code: 'unavailable' })]);
  c('保存場所がいっぱいの時は、そう知らせる', /いっぱい/.test(msg[0]) && /通信/.test(msg[1]), JSON.stringify(msg));
  c('ページのエラーなし', !errs.length, errs.join(' / '));
  c('APP_JS_VERSION v883 以上', +(/APP_JS_VERSION = 'v(\d+)'/.exec(fs.readFileSync(DIR + '/app.js', 'utf8')) || [0, 0])[1] >= 883);
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
