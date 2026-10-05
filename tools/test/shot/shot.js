// 使い方: VIEW=events VW=390 VH=844 PFX=x SHOTS='[["name","js"]]' node shot.js
// 例: VIEW=events VW=390 VH=844 PFX=cal SHOTS='[["month","setEventsMode(\"calendar\")"]]' node tools/test/shot/shot.js  → tools/test/out/cal_month.png
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const DIR = require('path').resolve(__dirname, '../../..');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: +(process.env.VW || 390), height: +(process.env.VH || 844) }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(new Date('2026-10-14T13:00:00+09:00'));
  page.on('pageerror', e => console.log('PAGEERR', e.message));
  await page.route('**/*', async (route) => {
    const u = route.request().url();
    if (/app\.js/.test(u) && u.indexOf('firebase') < 0) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(DIR + '/app.js') });
    if (u.startsWith('https://hktymc18.github.io/groove-map/') && !/\.(png|js|webmanifest)/.test(u)) return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: fs.readFileSync(DIR + '/index.html') });
    if (u.indexOf('firebase-app-compat.js') >= 0) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(__dirname + '/fbstub.js', 'utf8') });
    if (u.indexOf('firebasejs') >= 0) return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
    return route.fulfill({ status: 404, body: '' });
  });
  await page.goto('https://hktymc18.github.io/groove-map/');
  await page.waitForFunction(() => window.state && state.members && document.getElementById('loginScreen') && document.getElementById('loginScreen').style.display === 'none' && typeof currentUser !== 'undefined' && currentUser, null, { timeout: 60000 });
  await page.evaluate((V) => {
    state.isEditor = true;
    state.members = [{id:'r',lastName:'山内',firstName:'北斗',title:'ゴールド',parentId:'',mapType:'both',ptCurrent:3000,activity:'S',actRate:100},
      {id:'a1',lastName:'佐藤',firstName:'花',title:'',parentId:'r',mapType:'both',trainee:true},{id:'a2',lastName:'田中',firstName:'健',title:'',parentId:'r',mapType:'both',trainee:true},
      {id:'s3',lastName:'鈴木',title:'B2',parentId:'r',mapType:'both',activity:'S',actRate:90}];
    state.idealMembers = [];
    var E = function(id, d, tm, t, mids) { return { id: id, date: d, time: tm, title: t, type: 'event', memberIds: mids || [], createdAt: d + 'T00:00:00' }; };
    state.events = [E('e1','2026-10-06','20:00','ST'),E('e2','2026-10-08','20:00','ST'),E('e3','2026-10-13','20:00','ST'),E('e4','2026-10-16','20:00','ST'),
      E('e5','2026-10-07','21:00','CT取り'),E('e6','2026-10-06','15:00','CT 佐藤さん',['a1']),E('e7','2026-10-09','18:00','CT 田中さん',['a2']),
      E('e8','2026-10-13','19:00','CT 鈴木さん',['a1']),E('e9','2026-10-16','19:00','CT 高橋さん',['a2']),E('e10','2026-10-12','14:00','FT 伊藤さん',['a1'])];
    try { var p = state.goals.plan; p.title = 'チームエリート'; p.deadline = '2027-12'; p.income = 3410000; _p2().tutSeen = '2026-10-01'; var m = _p2M('2026-10'); m.front = 2; m.st = 8; m.declared = true; } catch (eG) {}
    if (window.__LIGHT) setTheme('light');
    switchView(V);
  }, process.env.VIEW || 'plan');
  await page.waitForTimeout(1200);
  const OUT = process.env.OUT || (__dirname + '/../out'); require('fs').mkdirSync(OUT, { recursive: true }); const P = OUT + '/' + (process.env.PFX || 'shot');
  const shots = JSON.parse(process.env.SHOTS || '[["hub",""]]');
  for (const [nm, js] of shots) {
    if (js) await page.evaluate(js);
    await page.waitForTimeout(500);
    await page.screenshot({ path: P + '_' + nm + '.png' });
    const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, cls: document.body.className }));
    console.log(nm, JSON.stringify(r));
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
