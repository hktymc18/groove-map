// 受付 v130：ユーザーのカードの「バディ」（NAVIGATOR Beauty・準備中）。会場でおたがいのQRを読み合う → バディ。
//   見えるのは名前・連続日数・バッジの数・今日できたかだけ。外せる（架空データ。カメラと読み取りはにせもの）
const path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const pad = n => (n < 10 ? '0' : '') + n, ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const ago = n => { const d = new Date(); d.setDate(d.getDate() - n); return ymd(d); };
// カメラ（色を塗ったキャンバスの映像）と QR の読み取り（決まった文字を返す）を差し替える
const cam = (text) => `(function(){
  window.jsQR = function(){ return { data: ${JSON.stringify(text)} }; };
  var md = navigator.mediaDevices || {};
  md.getUserMedia = function(){ var cv = document.createElement('canvas'); cv.width = 320; cv.height = 240; var x = cv.getContext('2d');
    setInterval(function(){ x.fillStyle = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'); x.fillRect(0, 0, 320, 240); }, 50);
    return Promise.resolve(cv.captureStream(20)); };
  try{ Object.defineProperty(navigator, 'mediaDevices', { value: md }); }catch(e){}
})();`;
(async () => {
  const b = await P.browser();
  const TA = '0123456789abcdef0123456789abcdef', TB = 'abababababababababababababababab', UA = 'u17620000000001', UB = 'u17620000000002';
  const card = (no, name, x) => Object.assign({ kind: 'user', no, name, union: 'ANTARES', referrer: '架空 太郎', active: true, visits: 3 }, x);
  const days = {}; for (let i = 0; i <= 2; i++) days[ago(i)] = ['water'];
  const planA = { course: 'diet', goal: '', qs: ['water', 'walk'], start: ago(5), days, atMs: 1 };
  let kA = '', sumA = null;
  // ① はなこ（A）：まだバディなし → わたしのQRを見せる（キーと見せる分ができる）
  {
    const { ctx, page, ev, wt, errs } = await P.open(b, { hash: '#c=' + TA, data: { ['cards/' + TA]: card(UA, '見本 はなこ'), ['cards/' + TA + '/plan/me']: planA, ['cardClaims/' + UA]: { t: TA } } });
    const t = await ev(`document.getElementById('bdArea').innerText`);
    c('BUDDY：まだいません・「わたしのQRを見せる」「相手のQRを読む」', /BUDDY/.test(t) && /まだバディはいません/.test(t) && /わたしのQRを見せる/.test(t) && /相手のQRを読む/.test(t), t);
    c('MY PLAN の下・友だちを招待の上', (await ev(`(document.getElementById('mpArea').compareDocumentPosition(document.getElementById('bdArea')) & 4) && (document.getElementById('bdArea').compareDocumentPosition(document.getElementById('fiArea')) & 4) ? 1 : 0`)) === 1);
    await ev(`document.getElementById('bdShow').click()`); await wt(800);
    kA = await ev(`(window.__FBDATA['cards/${TA}/buddy/me']||{}).k||''`);
    sumA = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['ckBuddy/' + (window.__FBDATA['cards/${TA}/buddy/me']||{}).k]||null)`));
    c('押すと自分のキー（b_20文字）と、見せる分（名前・連続日数・バッジの数・最後にできた日）ができる', /^b_[a-z0-9]{20}$/.test(kA) && sumA && sumA.uid === UA && sumA.n === '見本 はなこ' && sumA.st === 3 && sumA.bdg >= 4 && sumA.td === ago(0), kA + ' ' + JSON.stringify(sumA));
    c('見せる分に、PRYSMiO・購入・カードのトークンは入らない', Object.keys(sumA).sort().join() === 'at,bdg,n,st,td,uid');
    c('QRは "bd:キー"', (await ev(`document.getElementById('bdQr').getAttribute('data-qr')`)) === 'bd:' + kA);
    await page.screenshot({ path: OUT + '/ckbd130_qr.png' });
    await ev(`document.getElementById('bdQrClose').click()`);
    // マイプランをチェックすると、見せる分が新しくなる
    await ev(`document.querySelector('#mpArea [data-q="walk"]').click()`); await wt(600);
    c('マイプランのチェックで見せる分（バッジの数など）が書き直される', !!(await ev(`!!window.__FBDATA['ckBuddy/${kA}']`)));
    c('エラーなし（A）', !errs.length, errs.join('/'));
    await ctx.close();
  }
  // ② さくら（B）：はなこのQRを読む → バディになる
  let kB = '';
  for (const dark of [false, true]) {
    const data = { ['cards/' + TB]: card(UB, '見本 さくら'), ['cardClaims/' + UB]: { t: TB }, ['ckBuddy/' + kA]: Object.assign({}, sumA) };
    const { ctx, page, ev, wt, errs } = await P.open(b, { dark, hash: '#c=' + TB, data, init: cam('bd:' + kA) });
    await ev(`document.getElementById('bdScan').click()`); await wt(1500);
    const m = await ev(`document.querySelector('.modal') ? document.querySelector('.modal').innerText : ''`);
    c('相手のQRを読むと「見本 はなこ さんとバディになりますか？」' + (dark ? '（ダーク）' : ''), /見本 はなこ さん\s*とバディになりますか/.test(m), m);
    if (!dark) await page.screenshot({ path: OUT + '/ckbd130_ask.png' });
    await ev(`document.getElementById('bdAddGo').click()`); await wt(800);
    const me = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['cards/${TB}/buddy/me']||null)`));
    kB = me ? me.k : '';
    c('さくらのリストに、はなこが入る', me && me.list.length === 1 && me.list[0].k === kA && me.list[0].n === '見本 はなこ', JSON.stringify(me));
    c('はなこに知らせが届く（ckBuddy/はなこ/in/さくら）', JSON.stringify(await ev(`JSON.stringify((window.__FBDATA['ckBuddy/${kA}/in/' + ${JSON.stringify(kB)}]||{}).del)`)) === JSON.stringify('false'));
    const t = await ev(`document.getElementById('bdArea').innerText`);
    c('リストに、はなこ（連続日数・バッジ・今日できた）', /見本 はなこ さん/.test(t) && /🔥 3日連続/.test(t) && /バッジ \d/.test(t) && /今日できた/.test(t) && !/820|PRYSMiO/.test(t), t);
    await ev(`document.getElementById('bdArea').scrollIntoView()`);
    await page.screenshot({ path: OUT + '/ckbd130_list' + (dark ? '_d' : '') + '.png' });
    if (!dark) {
      await ev(`document.getElementById('bdScan').click()`); await wt(1500);
      c('同じ人をもう一度読むと「もうバディです」', /もうバディです/.test(await ev(`document.getElementById('toast').textContent`)));
      c('横にはみ出さない', (await ev(`document.documentElement.scrollWidth`)) === 390);
    }
    c('エラーなし（B）' + (dark ? '（ダーク）' : ''), !errs.length, errs.join('/'));
    await ctx.close();
  }
  // ③ はなこが次にカードを開く → 知らせを読んで、さくらがリストに入る → 外す
  {
    const data = { ['cards/' + TA]: card(UA, '見本 はなこ'), ['cardClaims/' + UA]: { t: TA }, ['cards/' + TA + '/plan/me']: planA,
      ['cards/' + TA + '/buddy/me']: { k: kA, list: [] }, ['ckBuddy/' + kA]: Object.assign({}, sumA),
      ['ckBuddy/' + kB]: { uid: UB, n: '見本 さくら', st: 0, bdg: 2, td: ago(3) }, ['ckBuddy/' + kA + '/in/' + kB]: { del: false } };
    const { ctx, ev, wt, errs } = await P.open(b, { hash: '#c=' + TA, data, wait: 2400 });
    const me = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['cards/${TA}/buddy/me'])`));
    c('開くと知らせを読んで、さくらがリストに入り、知らせは消える', me.list.length === 1 && me.list[0].k === kB && !(await ev(`!!window.__FBDATA['ckBuddy/${kA}/in/${kB}']`)), JSON.stringify(me));
    const t = await ev(`document.getElementById('bdArea').innerText`);
    c('3日前が最後の人は「0日連続」「まだ」', /見本 さくら さん/.test(t) && /🔥 0日連続/.test(t) && /まだ/.test(t), t);
    await ev(`document.querySelector('[data-bdx]').click()`); await wt(300);
    await ev(`document.getElementById('bdRmGo').click()`); await wt(500);
    const me2 = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['cards/${TA}/buddy/me'])`));
    c('外すと、自分のリストから消え、相手に「外した」知らせ', me2.list.length === 0 && (await ev(`(window.__FBDATA['ckBuddy/${kB}/in/${kA}']||{}).del`)) === true, JSON.stringify(me2));
    c('エラーなし（外す）', !errs.length, errs.join('/'));
    await ctx.close();
  }
  // ④ 「外した」知らせを受けた側・自分のQR・ちがうQR・出ないカード
  {
    const data = { ['cards/' + TB]: card(UB, '見本 さくら'), ['cardClaims/' + UB]: { t: TB }, ['cards/' + TB + '/buddy/me']: { k: kB, list: [{ k: kA, n: '見本 はなこ' }] },
      ['ckBuddy/' + kB]: { uid: UB, n: '見本 さくら', st: 0, bdg: 2, td: '' }, ['ckBuddy/' + kA]: Object.assign({}, sumA), ['ckBuddy/' + kB + '/in/' + kA]: { del: true } };
    const o = await P.open(b, { hash: '#c=' + TB, data, wait: 2400, init: cam('bd:' + kB) });
    c('「外した」知らせを読むと、相手のリストからも消える', (await o.ev(`window.__FBDATA['cards/${TB}/buddy/me'].list.length`)) === 0 && /まだバディはいません/.test(await o.ev(`document.getElementById('bdArea').innerText`)));
    await o.ev(`document.getElementById('bdScan').click()`); await o.wt(1500);
    c('自分のQRを読むと「これは、あなたのQRです」', /あなたのQRです/.test(await o.ev(`document.getElementById('toast').textContent`)));
    await o.ctx.close();
    const o2 = await P.open(b, { hash: '#c=' + TB, data: { ['cards/' + TB]: card(UB, '見本 さくら') }, init: cam('https://example.com/') });
    await o2.ev(`document.getElementById('bdScan').click()`); await o2.wt(1500);
    c('ちがうQRは「バディのQRではありません」', /バディのQRではありません/.test(await o2.ev(`(document.getElementById('ckCamMsg')||{}).textContent||''`)));
    await o2.ev(`document.getElementById('ckCamClose').click()`);
    await o2.ctx.close();
    const o3 = await P.open(b, { hash: '#c=tokM', data: { 'cards/tokM': { no: 'ZZ0001', name: '架空 太郎', union: 'ANTARES', active: true } } });
    c('ビジネスの会員証には出ない', (await o3.ev(`document.getElementById('bdArea').innerHTML`)) === '' && !o3.errs.length);
    await o3.ctx.close();
    const o4 = await P.open(b, { hash: '#c=' + TA, data: { ['cards/' + TA]: card(UA, '見本 はなこ', { toMember: 'P0006', toCard: 'feed' }) } });
    c('研修生になったユーザーのカードには出ない', (await o4.ev(`document.getElementById('bdArea').innerHTML`)) === '');
    await o4.ctx.close();
  }
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
