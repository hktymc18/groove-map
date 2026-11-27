// 受付 v183：相談で写真を送る（架空データ）
//   お客さん・スタッフとも「📷 写真」で送れる。長い辺 1080・JPEG に小さくして、メッセージ（ckDm/{相談}/m/{メッセージ}.img）に入れる
//   写真だけでも送れる（最後のひとことは「📷 写真」）。押すと大きく見られる。オーナーが読む画面にも出る。数のまとめに写真の枚数・大きさ
const path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const TA = '0123456789abcdef0123456789abcdef', UA = 'u17620000000001', OWN = 'j2DPDAccCygHmR9i5K3bTvHnH0V2';
const card = { kind: 'user', no: UA, name: '見本 はなこ', union: 'REVE', active: true, visits: 2 };
const staff = { 'ckCs/REVE/s/st1': { name: '見本 りな', tags: ['skin'], bio: '', off: false, ord: 1 } };
const user = (name) => ({ name, union: 'REVE', unionSelectedV2: true, status: 'active', email: name.length + '@example.com', privacy: { ver: '2026-10', at: '2026-10-01T00:00:00Z' } });
const now = Date.now(), tid = 'ckDm/t9';
const TH = { tk: TA, un: 'REVE', cno: UA, cname: '見本 はなこ', sUid: 'st1', sName: '見本 りな', topic: 'skin', st: 'open', last: { by: 's', t: 'どうですか', at: now }, uRead: now, sRead: now, byStaff: false, at: 1, upAt: now };
// 大きな写真（3000×4000・色がたくさん＝小さくなりにくい）をページの中で作る
const BIG = `(function(){ var c = document.createElement('canvas'); c.width = 3000; c.height = 4000; var g = c.getContext('2d');
  for(var i = 0; i < 6000; i++){ g.fillStyle = 'hsl(' + (i * 37 % 360) + ',70%,' + (25 + i % 55) + '%)'; g.fillRect((i * 131) % 3000, (i * 197) % 4000, 90 + i % 200, 90 + i % 170); }
  return c.toDataURL('image/png').split(',')[1]; })()`;
const imgSize = (o, u) => o.ev(`new Promise(function(ok){ var im = new Image(); im.onload = function(){ ok([im.width, im.height]); }; im.src = ${JSON.stringify(u)}; })`);
(async () => {
  const b = await P.browser();
  let big;
  // ① お客さん：写真だけを送る・写真と文を送る
  {
    const data = Object.assign({ ['cards/' + TA]: card, ['cardClaims/' + UA]: { t: TA }, ['ckBind/' + TA]: { uids: ['dev-1'], by: 'self', at: 1 }, 'checkinConfig/beauty': { csNos: [UA] },
      [tid]: TH, [tid + '/m/a']: { by: 's', uid: 'st1', t: 'どうですか', at: '2026-11-26T10:00:00Z' } }, staff);
    const o = await P.open(b, { hash: '#c=' + TA, data, wait: 2800, init: 'window.__FBANON = "dev-1";' });
    await o.page.addStyleTag({ content: '#toast,#gxHint{display:none!important}' });
    big = Buffer.from(await o.ev(BIG), 'base64');
    await o.page.click('#uaTabs [data-tab="friends"]'); await o.wt(200);
    await o.page.click('#uaSegCs'); await o.wt(500);
    await o.ev(`document.querySelector('#csArea [data-th]').click()`); await o.wt(600);
    c('やりとりの画面に「📷 写真」', /📷 写真/.test(await o.ev(`document.querySelector('.modal').innerText`)));
    await o.page.setInputFiles('#csPhIn', { name: 'skin.png', mimeType: 'image/png', buffer: big }); await o.wt(1500);
    c('えらぶと、送る前に小さく見える（やめられる）', await o.ev(`!!document.querySelector('#csPhPv img') && !!document.getElementById('csPhX')`));
    await o.page.screenshot({ path: OUT + '/ckdm183_pick.png' });
    await o.ev(`document.getElementById('csSend').click()`); await o.wt(700);
    const ks = await o.ev(`Object.keys(window.__FBDATA).filter(function(k){ return k.indexOf('${tid}/m/') === 0 && window.__FBDATA[k].img; })`);
    const m = JSON.parse(await o.ev(`JSON.stringify(window.__FBDATA['${ks[0]}'] || null)`));
    c('写真だけで送れる（文は空・JPEG）', ks.length === 1 && m.t === '' && m.by === 'u' && /^data:image\/jpeg;base64,/.test(m.img), JSON.stringify(m && { t: m.t, len: m.img && m.img.length }));
    const wh = await imgSize(o, m.img);
    c('小さくする：長い辺 1080 以下・38万文字（約280KB）以下', Math.max(wh[0], wh[1]) <= 1080 && m.img.length <= 380000, JSON.stringify([wh, m.img.length]));
    console.log('  （写真の大きさ: ' + wh.join('×') + ' ・ ' + Math.round(m.img.length * 3 / 4 / 1024) + 'KB）');
    c('最後のひとことは「📷 写真」', (await o.ev(`window.__FBDATA['${tid}'].last.t`)) === '📷 写真');
    c('送ったら、えらんだ写真は消える', !(await o.ev(`!!document.querySelector('#csPhPv img')`)));
    // （テストのにせデータベースは、開いている画面に新しいメッセージを送り直さないので、開き直す）
    await o.ev(`document.getElementById('csCl').click()`); await o.wt(300); await o.ev(`document.querySelector('#csArea [data-th]').click()`); await o.wt(600);
    c('やりとりに写真が出る', (await o.ev(`document.querySelectorAll('#csChat img.cs-img').length`)) === 1);
    await o.page.screenshot({ path: OUT + '/ckdm183_chat.png' });
    await o.ev(`document.querySelector('#csChat img.cs-img').click()`); await o.wt(200);
    c('押すと大きく見られる・もう一度押すと閉じる', (await o.ev(`!!document.querySelector('.cs-zoom img')`)) && (await o.ev(`document.querySelector('.cs-zoom').click(), !document.querySelector('.cs-zoom')`)));
    await o.page.setInputFiles('#csPhIn', { name: 'skin2.png', mimeType: 'image/png', buffer: big }); await o.wt(1500);
    await o.page.fill('#csRe', '右のほほです'); await o.ev(`document.getElementById('csSend').click()`); await o.wt(700);
    c('写真と文をいっしょに送れる', (await o.ev(`Object.keys(window.__FBDATA).filter(function(k){ var x = window.__FBDATA[k]; return k.indexOf('${tid}/m/') === 0 && x.img && x.t === '右のほほです'; }).length`)) === 1);
    c('エラーなし（お客さん）', !o.errs.length, o.errs.join(' / '));
    await o.ctx.close();
  }
  // ② スタッフ：写真を見る・写真を送る ／ ③ オーナー：読む画面に写真・数のまとめ
  {
    const IMG = 'data:image/jpeg;base64,' + Buffer.from('fake').toString('base64');
    const data = Object.assign({ 'checkinUnions/REVE': { name: 'REVE', dayStaff: ['host1'] }, 'checkinConfig/beauty': { testers: [OWN] }, 'users/st1': user('見本 りな'), ['users/' + OWN]: user('見本 おーなー'),
      'ckDmStat/REVE': { n30: 1, topics: { skin: 1 }, open: 1, done: 0, imgN: 12, imgKB: 2150, at: now },
      [tid]: Object.assign({}, TH, { last: { by: 'u', t: '📷 写真', at: now }, sRead: 0 }) }, staff);
    const o = await P.open(b, { uid: 'st1', data, wait: 2600 });
    await o.page.addStyleTag({ content: '#toast,#rnPopOv,#gxHint{display:none!important}' });
    // お客さんの写真（①で作ったもの）を置く
    const small = (await o.ev(`(function(){ var c = document.createElement('canvas'); c.width = 600; c.height = 800; var g = c.getContext('2d'); g.fillStyle = '#e8c4b0'; g.fillRect(0, 0, 600, 800); g.fillStyle = '#c98f7a'; g.beginPath(); g.arc(300, 400, 160, 0, 7); g.fill(); return c.toDataURL('image/jpeg', .7); })()`));
    await o.ev(`window.__FBDATA['${tid}/m/a'] = { by: 'u', uid: 'dev-1', t: '', img: ${JSON.stringify(small)}, at: '2026-11-26T10:00:00Z' }`);
    await o.ev(`window.__FBDATA['${tid}/m/b'] = { by: 'u', uid: 'dev-1', t: '<img src=x onerror=alert(1)>', img: 'javascript:alert(1)', at: '2026-11-26T10:01:00Z' }`);
    await o.page.click('nav button[data-pane="pBeauty"]'); await o.wt(800);
    c('受信箱の最後のひとことは「📷 写真」', /📷 写真/.test(await o.ev(`document.getElementById('btDm').innerText`)));
    await o.ev(`document.querySelector('#btDm [data-dm]').click()`); await o.wt(500);
    c('スタッフに写真が見える', (await o.ev(`document.querySelectorAll('#dmChat img.cs-img').length`)) === 1);
    c('JPEG の写真でないものは出さない・文はそのまま文字で出す', (await o.ev(`document.querySelectorAll('#dmChat img').length`)) === 1 && /<img src=x/.test(await o.ev(`document.getElementById('dmChat').innerText`)));
    await o.page.screenshot({ path: OUT + '/ckdm183_staff.png' });
    await o.page.setInputFiles('#dmPhIn', { name: 'cream.png', mimeType: 'image/png', buffer: big }); await o.wt(1500);
    await o.ev(`document.getElementById('dmSend').click()`); await o.wt(600);
    c('スタッフも写真を送れる（写真だけなら効果の言葉の確認は出ない）', (await o.ev(`Object.keys(window.__FBDATA).filter(function(k){ var x = window.__FBDATA[k]; return k.indexOf('${tid}/m/') === 0 && x.by === 's' && /^data:image\\/jpeg/.test(x.img || ''); }).length`)) === 1);
    c('エラーなし（スタッフ）', !o.errs.length, o.errs.join(' / '));
    await o.ctx.close();
    const o2 = await P.open(b, { data: Object.assign({}, data, { [tid + '/m/a']: { by: 'u', uid: 'dev-1', t: '', img: small, at: '2026-11-26T10:00:00Z' } }), wait: 2600 });
    await o2.page.addStyleTag({ content: '#toast,#rnPopOv,#gxHint{display:none!important}' });
    await o2.page.click('nav button[data-pane="pBeauty"]'); await o2.wt(900);
    c('相談の数に、写真の枚数と大きさ', /相談の写真（これまで）：12枚 ・ 約2.1MB/.test(await o2.ev(`document.getElementById('btDs').innerText`)), await o2.ev(`document.getElementById('btDs').innerText`));
    await o2.ev(`document.querySelector('#btDr [data-dr]').click()`); await o2.wt(500);
    c('オーナーが読む画面にも写真', (await o2.ev(`document.querySelectorAll('.modal .cs-chat img.cs-img').length`)) === 1);
    c('エラーなし（オーナー）', !o2.errs.length, o2.errs.join(' / '));
    await o2.ctx.close();
  }
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
