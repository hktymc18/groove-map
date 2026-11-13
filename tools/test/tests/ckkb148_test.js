// 受付 v148：特別カード工房の保存（iPhone で、赤い文字も出ずに保存が終わらないことがあった）
//   画像は1枚ずつ送る・「保存中…（画像 1/2）」を出す・60秒たっても終わらない時は赤い文字で知らせてボタンを戻す・続けて何枚も作れる（架空データ）
const fs = require('fs'), path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
(async () => {
  const b = await P.browser();
  try {
    const { page, errs, ev, wt } = await P.open(b, { hash: '' });
    const mk = async (w, h, alpha) => Buffer.from(await ev(`(function(){var c=document.createElement('canvas');c.width=${w};c.height=${h};var x=c.getContext('2d');${alpha ? '' : `x.fillStyle='#fff';x.fillRect(0,0,${w},${h});`}var s=7;function r(){s=(s*9301+49297)%233280;return s/233280;}for(var i=0;i<500;i++){x.fillStyle='hsl('+(i*37%360)+',80%,50%)';x.beginPath();x.arc(r()*${w},r()*${h},20+r()*60,0,7);x.fill();}return c.toDataURL('image/png').split(',')[1];})()`), 'base64');
    const frame = await mk(1400, 2000, false), art = await mk(1300, 1600, true);
    const pick = async (k, buf) => {
      const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('[data-kpick="' + k + '"]')]);
      await fc.setFiles({ name: k + '.png', mimeType: 'image/png', buffer: buf });
      await page.waitForFunction(k => { var el = document.querySelector('[data-kpick="' + k + '"]'); return el && /url/.test(el.getAttribute('style') || ''); }, k, { timeout: 15000 });
    };
    const newCard = async (name) => {
      await ev('document.getElementById("btnKobo").click()'); await page.waitForSelector('#kbNew');
      await page.click('#kbNew'); await page.waitForSelector('#kbSave');
      await pick('frame', frame); await pick('art', art);
      await page.fill('#kbName', name); await wt(300);
    };
    // ① ふつうに保存（書き込みに少し時間がかかる）: 1枚ずつ・途中の表示
    await ev('window.__FBLOG = []; window.__FBDELAY = 400');
    await newCard('見本カード1');
    const sizes = await ev(`[].map.call(document.querySelectorAll('.kb-slot .sz'), function(x){ return x.textContent; })`);
    await page.click('#kbSave'); await wt(150);
    const mid = await ev(`({ t: document.getElementById('kbSave').textContent, dis: document.getElementById('kbSave').disabled })`);
    c('保存中は「保存中…（画像 1/2）」・ボタンは押せない', /保存中…（画像 1\/2）/.test(mid.t) && mid.dis, JSON.stringify(mid));
    await page.waitForSelector('#kbNew', { timeout: 10000 });
    const log = await ev('window.__FBLOG').then(L => L.filter(x => /^cardArt\/x_/.test(x.p)));
    c('画像は1枚ずつ送る（1枚目が終わってから2枚目）', log.length === 4 && log[0].t === 'start' && log[1].t === 'end' && log[2].t === 'start' && log[1].p === log[0].p, JSON.stringify(log));
    console.log('  sizes', JSON.stringify(sizes));
    c('画像は軽く（1枚 450KB くらいまで）', sizes.filter(Boolean).every(t => +(/(\d+)KB/.exec(t) || [0, 9999])[1] <= 460), JSON.stringify(sizes));
    // ② 続けて2枚目・3枚目
    for (const n of [2, 3]) {
      await newCard('見本カード' + n);
      await page.click('#kbSave');
      await page.waitForSelector('#kbNew', { timeout: 10000 });
    }
    const names = await ev(`[].map.call(document.querySelectorAll('.kb-nm'), function(x){ return x.textContent; })`);
    c('続けて3枚作れる', ['見本カード1', '見本カード2', '見本カード3'].every(n => names.indexOf(n) >= 0), JSON.stringify(names));
    // ③ 通信が止まって終わらない時: 60秒で赤い文字・ボタンが戻る
    await newCard('見本カード4');
    await page.clock.install();
    await ev('window.__FBHOLD = /^cardArt\\//');
    await page.click('#kbSave'); await wt(100);
    await page.clock.runFor(61000); await wt(100);
    const st = await ev(`({ err: document.getElementById('kbErr').textContent, t: document.getElementById('kbSave').textContent, dis: document.getElementById('kbSave').disabled })`);
    c('60秒たっても終わらない時は赤い文字（どこで止まったか）・ボタンが戻る', /保存に時間がかかっています（画像 1\/2の途中）/.test(st.err) && !st.dis && /^保存/.test(st.t) && !/保存中/.test(st.t), JSON.stringify(st));
    c('ページのエラーなし', errs.length === 0, JSON.stringify(errs));
    // ④ iPhone のまね（webp を作れない → png・jpeg）: それでも 1枚 450KB くらいまで
    const ip = await P.open(b, { hash: '', init: 'var _t=HTMLCanvasElement.prototype.toDataURL;HTMLCanvasElement.prototype.toDataURL=function(ty,q){return _t.call(this,ty==="image/webp"?"image/png":ty,q);};' });
    const pick2 = async (k, buf) => {
      const [fc] = await Promise.all([ip.page.waitForEvent('filechooser'), ip.page.click('[data-kpick="' + k + '"]')]);
      await fc.setFiles({ name: k + '.png', mimeType: 'image/png', buffer: buf });
      await ip.page.waitForFunction(k => { var el = document.querySelector('[data-kpick="' + k + '"]'); return el && /url/.test(el.getAttribute('style') || ''); }, k, { timeout: 20000 });
    };
    await ip.ev('document.getElementById("btnKobo").click()'); await ip.page.waitForSelector('#kbNew');
    await ip.page.click('#kbNew'); await ip.page.waitForSelector('#kbSave');
    await pick2('frame', frame); await pick2('art', art);
    const sz2 = await ip.ev(`[].map.call(document.querySelectorAll('.kb-slot .sz'), function(x){ return x.textContent; })`);
    const kinds = await ip.ev(`[].map.call(document.querySelectorAll('[data-kpick]'), function(x){ return ((x.getAttribute('style') || '').split('data:image/')[1] || '').split(';')[0]; })`);
    console.log('  iPhone sizes', JSON.stringify(sz2), JSON.stringify(kinds));
    c('iPhone のまね（png・jpeg）でも 1枚 450KB くらいまで', kinds[0] === 'jpeg' && kinds[1] === 'png' && sz2.filter(Boolean).every(t => +(/(\d+)KB/.exec(t) || [0, 9999])[1] <= 460), JSON.stringify(sz2));
    await ip.page.click('#kbSave');
    await ip.page.waitForSelector('#kbNew', { timeout: 10000 });
    c('iPhone のまねでも保存できる', true);
    const H = fs.readFileSync(path.join(__dirname, '../../../checkin/index.html'), 'utf8');
    c('APP_VER v148 以上', +(/var APP_VER = 'v(\d+)'/.exec(H) || [0, 0])[1] >= 148);
  } finally { await b.close(); }
  console.log(fails ? 'FAILED ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})();
