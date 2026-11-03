// 受付（checkin/index.html）を Chromium で開く（Firebase はスタブ・架空データだけ）。
//   const P = require('../lib/ckpage.js'); const b = await P.browser(); const { page, errs } = await P.open(b, { hash: '', data: {…}, dark: false });
//   uid: 'xxx' でオーナー以外としてログイン（既定はオーナー）
//   expose: true で window.__ck に practiceStart・scan・rec()（受付中のデータ）・db()（今のデータベース）を出す
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '../../..'), ST = R + '/tools/test/shot';
const PW = '/opt/node22/lib/node_modules/playwright';
const QR = 'window.QRCode=function(el,o){el.setAttribute("data-qr",o.text);el.innerHTML="<div style=\\"width:"+o.width+"px;height:"+o.height+"px;background:repeating-conic-gradient(#000 0 25%,#fff 0 50%) 0 0/12px 12px\\"></div>";};window.QRCode.CorrectLevel={L:1,M:0,Q:3,H:2};';
const EXPOSE = '\nwindow.__ck = { practiceStart: practiceStart, scan: scan, rec: function(){ return gRec; }, db: function(){ return db; } };\n})();\n</script></body>';
async function browser() {
  const { chromium } = require(fs.existsSync(PW) ? PW : 'playwright');
  return chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
}
async function open(b, o) {
  o = o || {};
  const ctx = await b.newContext({ serviceWorkers: 'block', colorScheme: o.dark ? 'dark' : 'light', viewport: { width: o.vw || 390, height: o.vh || 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage(), errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('dialog', d => d.accept());
  await page.addInitScript(d => { window.__FBDATA = d.data; if (d.uid) window.__FBUID = d.uid; }, { data: o.data || {}, uid: o.uid || '' });   // uid: 別の人としてログイン
  await page.route('**/*', async (route) => {
    const u = route.request().url();
    if (u.indexOf('firebase-app-compat.js') >= 0) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(ST + '/fbstub.js', 'utf8') });
    if (u.indexOf('firebasejs') >= 0) return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
    if (u.indexOf('qrcode.min.js') >= 0) return route.fulfill({ status: 200, contentType: 'application/javascript', body: QR });
    const m = u.match(/\/groove-map\/checkin\/([\w./-]*)/);
    if (m) {
      const f = R + '/checkin/' + (m[1].split('?')[0] || 'index.html');
      if (fs.existsSync(f) && fs.statSync(f).isFile()) {
        const html = /index\.html$/.test(f);
        return route.fulfill({ status: 200, body: html && o.expose ? fs.readFileSync(f, 'utf8').replace(/\n\}\)\(\);\n<\/script>\s*<\/body>/, EXPOSE) : fs.readFileSync(f), contentType: html ? 'text/html; charset=utf-8' : 'application/octet-stream' });
      }
    }
    return route.fulfill({ status: 404, body: '' });
  });
  await page.goto('https://hktymc18.github.io/groove-map/checkin/index.html' + (o.hash || ''));
  await page.waitForTimeout(o.wait || 1600);
  const ev = s => page.evaluate(s), wt = n => page.waitForTimeout(n || 350);
  return { ctx, page, errs, ev, wt };
}
module.exports = { browser, open, R };
