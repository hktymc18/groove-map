// 受付 v150：特別カード工房 — イラストの大きさ（拡大・縮小）と位置（左右・上下）を変えられる（架空データ）
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
    await page.fill('#kbName', '見本ズーム'); await wt(400);
    const slide = (id, v) => ev(`(function(){ var el = document.getElementById('${id}'); el.value = ${v}; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    const pv = () => ev(`(function(){ var m = document.querySelector('#kbPrev .membercard'); var cs = getComputedStyle(m, null); var pb = getComputedStyle(m.querySelector('.mc-pop'), '::before'); return { zoom: m.style.getPropertyValue('--sk-zoom'), ox: m.style.getPropertyValue('--sk-ox'), oy: m.style.getPropertyValue('--sk-oy'), size: pb.backgroundSize, pos: pb.backgroundPosition, flat: m.classList.contains('skin-flat'), artSize: getComputedStyle(m.querySelector('.mc-art')).backgroundSize }; })()`);
    const p0 = await pv();
    c('はじめは今までどおり（大きさ・位置の指定なし）', p0.zoom === '' && p0.ox === '' && p0.oy === '' && /100%$/.test(p0.size) && /50% 100%/.test(p0.pos), JSON.stringify(p0));
    await page.locator('#kbPrev').screenshot({ path: path.join(OUT, 'ckkb150_before.png') });
    await slide('kbZoom', 1.6); await slide('kbOx', 30); await wt(500);
    const p1 = await pv();
    c('大きさ 160%・左右 30% → プレビューのイラストが大きく・左へ', p1.zoom === '1.6' && p1.ox === '30%' && p1.oy === '' && /auto 160%/.test(p1.size) && /^30% 100%/.test(p1.pos), JSON.stringify(p1));
    c('大きさの数字（160%）が出る', await ev(`document.getElementById('kbZoomV').textContent`) === '160%');
    await page.locator('#kbPrev').screenshot({ path: path.join(OUT, 'ckkb150_zoom.png') });
    // 絵の中にしても大きさは効く・上下は動かしていないので絵の中の既定（42%）
    await page.click('input[name="kbPop"][value="0"]'); await wt(500);
    const p2 = await pv();
    c('「絵の中」でも大きさが効く（112% × 1.6）', p2.flat && /179\.2%/.test(p2.artSize) && await ev(`document.getElementById('kbOy').value`) === '42', JSON.stringify(p2));
    await slide('kbOy', 20); await wt(400);
    // 元に戻す
    await page.click('#kbZoomReset'); await wt(500);
    const p3 = await pv();
    c('「元の大きさ・位置に戻す」で指定がなくなる', p3.zoom === '' && p3.ox === '' && p3.oy === '' && await ev(`document.getElementById('kbZoom').value`) === '1', JSON.stringify(p3));
    // もう一度動かして保存 → カードセットに残る → 会員証にも出る
    await page.click('input[name="kbPop"][value="1"]'); await slide('kbZoom', 0.8); await slide('kbOy', 90); await wt(400);
    await page.click('#kbSave'); await page.waitForSelector('#kbNew', { timeout: 10000 });
    const saved = await ev(`(function(){ var d = window.__FBDATA, k = Object.keys(d).filter(function(x){ return /^cardSkins\\/x_/.test(x); })[0]; return { k: k, def: d[k], art: k && d['cardArt/' + k.split('/')[1] + '__art'], frame: k && d['cardArt/' + k.split('/')[1] + '__frame'] }; })()`);
    c('保存すると大きさ・動かした位置だけが残る（左右は動かしていないので残さない）', saved.def && saved.def.zoom === 0.8 && saved.def.oy === 90 && !('ox' in saved.def) && saved.def.pop !== false, JSON.stringify(saved.def || {}).slice(0, 300));
    // 開き直すと同じ値でスライダーが出る
    await ev(`[].filter.call(document.querySelectorAll('.kb-c'), function(x){ return /見本ズーム/.test(x.textContent); })[0].click()`); await page.waitForSelector('#kbZoom');
    c('開き直すと同じ大きさ・位置', await ev(`document.getElementById('kbZoom').value === '0.8' && document.getElementById('kbOy').value === '90' && document.getElementById('kbOx').value === '50'`));
    const id = saved.k.split('/')[1], TK = 'f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2f2';
    const data = { ['cards/' + TK]: { no: 'A0002', name: '見本 ズーム', union: 'ANTARES', active: true, cardTitle: 'TEAM ELITE', skin: id, skinName: '見本ズーム' },
      ['cardSkins/' + id]: saved.def, ['cardArt/' + id + '__art']: saved.art, ['cardArt/' + id + '__frame']: saved.frame };
    const real = await P.open(b, { hash: '#c=' + TK, data, wait: 2600 });
    const r = await real.ev(`(function(){ var m = document.getElementById('memberCard'); var pb = getComputedStyle(m.querySelector('.mc-pop'), '::before'); return { zoom: m.style.getPropertyValue('--sk-zoom'), oy: m.style.getPropertyValue('--sk-oy'), size: pb.backgroundSize, pos: pb.backgroundPosition }; })()`);
    c('会員証にも同じ大きさ・位置で出る', r.zoom === '0.8' && r.oy === '90%' && /auto 80%/.test(r.size) && /50% 90%/.test(r.pos), JSON.stringify(r));
    c('ページのエラーなし', errs.length === 0 && real.errs.length === 0, JSON.stringify(errs.concat(real.errs)));
    const H = fs.readFileSync(path.join(__dirname, '../../../checkin/index.html'), 'utf8');
    c('APP_VER v150 以上', +(/var APP_VER = 'v(\d+)'/.exec(H) || [0, 0])[1] >= 150);
  } finally { await b.close(); }
  console.log(fails ? 'FAILED ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})();
