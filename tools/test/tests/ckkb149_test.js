// 受付 v149：特別カード工房
//   ・プレビューを本物の会員証と同じ形に（前は 250px で組んで縦長に見えていた）。ドラッグで傾く
//   ・「🧍 飛び出す（死神と同じ）」か「🖼 絵の中」を選べる。絵の中は、イラストが枠の内側に入って飛び出さない（架空データ）
const fs = require('fs'), path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
(async () => {
  const b = await P.browser();
  try {
    const { page, errs, ev, wt } = await P.open(b, { hash: '' });
    const mk = async (w, h, alpha) => Buffer.from(await ev(`(function(){var c=document.createElement('canvas');c.width=${w};c.height=${h};var x=c.getContext('2d');${alpha ? '' : `x.fillStyle='#2a1d55';x.fillRect(0,0,${w},${h});x.strokeStyle='#e8c46a';x.lineWidth=40;x.strokeRect(20,20,${w}-40,${h}-40);`}var s=7;function r(){s=(s*9301+49297)%233280;return s/233280;}for(var i=0;i<${alpha ? 300 : 0};i++){x.fillStyle='hsl('+(i*37%360)+',80%,60%)';x.beginPath();x.arc(r()*${w},r()*${h},20+r()*60,0,7);x.fill();}return c.toDataURL('image/png').split(',')[1];})()`), 'base64');
    const frame = await mk(760, 1140, false), art = await mk(900, 1100, true);
    const pick = async (k, buf) => {
      const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click('[data-kpick="' + k + '"]')]);
      await fc.setFiles({ name: k + '.png', mimeType: 'image/png', buffer: buf });
      await page.waitForFunction(k => { var el = document.querySelector('[data-kpick="' + k + '"]'); return el && /url/.test(el.getAttribute('style') || ''); }, k, { timeout: 15000 });
    };
    await ev('document.getElementById("btnKobo").click()'); await page.waitForSelector('#kbNew');
    await page.click('#kbNew'); await page.waitForSelector('#kbSave');
    await pick('frame', frame); await pick('art', art);
    await page.fill('#kbName', '見本ウィッチ'); await page.fill('#kbHp', '170'); await wt(500);
    const pv = () => ev(`(function(){ var s = document.querySelector('#kbPrev .ol-slot'), m = s && s.querySelector('.membercard'); return s && { w: s.offsetWidth, h: s.offsetHeight, mw: m.offsetWidth, mh: m.offsetHeight, cls: m.className, pop: getComputedStyle(m.querySelector('.mc-pop')).display, tilt: !!s.querySelector('.olc-tilt').style.touchAction }; })()`);
    let p1 = await pv();
    c('プレビューは会員証と同じ幅（328px）で組んで縮小', p1 && p1.mw === 328 && Math.abs(p1.w / p1.h - p1.mw / p1.mh) < 0.02, JSON.stringify(p1));
    c('はじめは「飛び出す」（死神と同じ・キャラは飛び出す層）', /skin-x/.test(p1.cls) && !/skin-flat/.test(p1.cls) && p1.pop === 'block' && await ev(`document.querySelector('input[name="kbPop"]:checked').value === '1'`), JSON.stringify(p1));
    c('プレビューもドラッグで傾く', p1.tilt);
    await page.locator('#kbPrev').screenshot({ path: path.join(OUT, 'ckkb149_pop.png') });
    await page.click('input[name="kbPop"][value="0"]'); await wt(500);
    let p2 = await pv();
    c('「絵の中」を選ぶと、イラストは枠の内側（飛び出す層は出さない）', /skin-flat/.test(p2.cls) && p2.pop === 'none' && /url/.test(await ev(`getComputedStyle(document.querySelector('#kbPrev .mc-art')).backgroundImage`)), JSON.stringify(p2));
    await page.locator('#kbPrev').screenshot({ path: path.join(OUT, 'ckkb149_flat.png') });
    await page.click('#kbSave'); await page.waitForSelector('#kbNew', { timeout: 10000 });
    const saved = await ev(`(function(){ var d = window.__FBDATA, k = Object.keys(d).filter(function(x){ return /^cardSkins\\/x_/.test(x); })[0]; return { k: k, def: d[k], art: k && d['cardArt/' + k.split('/')[1] + '__art'], frame: k && d['cardArt/' + k.split('/')[1] + '__frame'] }; })()`);
    c('保存すると「絵の中」（pop: false）がカードセットに残る', saved.k && saved.def.pop === false, JSON.stringify(saved.def || {}).slice(0, 200));
    // 本物の会員証（このカードセットを付けた人）: 同じ形・絵の中
    const id = saved.k.split('/')[1], TK = 'f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1';
    const data = { ['cards/' + TK]: { no: 'A0001', name: '見本 ウィッチ', union: 'ANTARES', active: true, cardTitle: 'TEAM ELITE', skin: id, skinName: '見本ウィッチ', skinHp: '170' },
      ['cardSkins/' + id]: saved.def, ['cardArt/' + id + '__art']: saved.art, ['cardArt/' + id + '__frame']: saved.frame };
    const real = await P.open(b, { hash: '#c=' + TK, data, wait: 2600 });
    const r = await real.ev(`(function(){ var m = document.getElementById('memberCard'); return { w: m.offsetWidth, h: m.offsetHeight, cls: m.className, pop: getComputedStyle(m.querySelector('.mc-pop')).display }; })()`);
    c('会員証も「絵の中」で出る', /skin-x/.test(r.cls) && /skin-flat/.test(r.cls) && r.pop === 'none', JSON.stringify(r));
    c('プレビューと会員証の形（縦横の比）が同じ', Math.abs(p2.w / p2.h - r.w / r.h) < 0.02, JSON.stringify({ prev: p2.w / p2.h, real: r.w / r.h }));
    await real.page.locator('#memberCard').screenshot({ path: path.join(OUT, 'ckkb149_real.png') });
    // 飛び出すに戻すと pop は消える（今までのカードと同じ）
    c('ページのエラーなし', errs.length === 0 && real.errs.length === 0, JSON.stringify(errs.concat(real.errs)));
    const H = fs.readFileSync(path.join(__dirname, '../../../checkin/index.html'), 'utf8');
    c('APP_VER v149 以上', +(/var APP_VER = 'v(\d+)'/.exec(H) || [0, 0])[1] >= 149);
  } finally { await b.close(); }
  console.log(fails ? 'FAILED ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})();
