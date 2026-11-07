// 受付 v127：ユーザーのカードの「友だちを招待」（NAVIGATOR Beauty・準備中）。招待リンク → 友だちが申し込み（紹介者・招待した人つき）→
//   受付で登録 → 招待した人のカードに「来てくれた」（架空データ・練習モード）
const path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
(async () => {
  const b = await P.browser();
  const tok = '0123456789abcdef0123456789abcdef', uid = 'u17620000000001';
  const card = (x) => Object.assign({ kind: 'user', no: uid, name: '見本 はなこ', union: 'ANTARES', referrer: 'ジェッ子 ちゃん', referrerNo: 'P004', active: true, visits: 2 }, x);
  let k = '', j = null;
  // ① ユーザーのカード：まだ誰も来ていない
  for (const dark of [false, true]) {
    const { ctx, page, ev, wt, errs } = await P.open(b, { dark, hash: '#c=' + tok, data: { ['cards/' + tok]: card() } });
    const t = await ev(`document.getElementById('fiArea').innerText`);
    c('カードに「友だちを招待」（招待リンクを送る・その場でQR・まだいません）' + (dark ? '（ダーク）' : ''), /INVITE/.test(t) && /招待リンクを送る/.test(t) && /その場でQRを見せる/.test(t) && /まだいません/.test(t), t);
    if (!dark) {
      await ev(`document.getElementById('fiQr').click()`); await wt(500);
      k = await ev(`(window.__FBDATA['cards/${tok}/join/me']||{}).k||''`);
      j = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['ckJoin/' + (window.__FBDATA['cards/${tok}/join/me']||{}).k]||null)`));
      c('押すと友だちの招待リンクができる（紹介者＝自分の紹介者・招待した人＝自分）', /^f_[a-z0-9]{20}$/.test(k) && j && j.kind === 'friend' && j.refNo === 'P004' && j.refName === 'ジェッ子 ちゃん' && j.invUid === uid && j.invName === '見本 はなこ' && j.union === 'ANTARES', k + ' ' + JSON.stringify(j));
      c('QRは申し込みページのURL', (await ev(`document.getElementById('fiQrBox').getAttribute('data-qr')`)) === 'https://hktymc18.github.io/groove-map/checkin/index.html#uj=' + k);
      await page.screenshot({ path: OUT + '/ckfi127_qr.png' });
      await ev(`document.getElementById('fiClose').click()`);
      await ev(`document.getElementById('fiSend').click()`); await wt(400);
      c('「招待リンクを送る」も同じリンク（作り直さない）', (await ev(`Object.keys(window.__FBDATA).filter(function(x){ return x.indexOf('ckJoin/f_')===0; }).length`)) === 1);
      c('横にはみ出さない', (await ev(`document.documentElement.scrollWidth`)) === 390);
    }
    await ev(`document.getElementById('fiArea').scrollIntoView()`);
    await page.screenshot({ path: OUT + '/ckfi127_card' + (dark ? '_d' : '') + '.png' });
    c('エラーなし（カード）' + (dark ? '（ダーク）' : ''), !errs.length, errs.join('/'));
    await ctx.close();
  }
  // ② 友だちが招待リンクを開いて申し込む
  let app = null, appId = '';
  {
    const { ctx, page, ev, wt, errs } = await P.open(b, { hash: '#uj=' + k, data: { ['ckJoin/' + k]: j } });
    const t = await ev(`document.getElementById('joinBox').innerText`);
    c('招待リンクの申し込みページ：「見本 はなこ さんからの招待」・紹介者が出て、紹介者の欄はない', /見本 はなこ さんからの招待/.test(t) && /紹介：ジェッ子 ちゃん さん/.test(t) && !(await ev(`!!document.getElementById('jnRef')`)), t);
    await page.screenshot({ path: OUT + '/ckfi127_form.png', fullPage: true });
    await ev(`(function(){ document.getElementById('jnName').value='見本 さくら'; document.getElementById('jnOk').checked=true; document.getElementById('jnGo').click(); })()`); await wt(500);
    appId = await ev(`(location.hash.match(/ua=([a-z0-9]{24})/)||[])[1]||''`);
    app = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['ckApply/${appId}']||null)`));
    c('申し込みに紹介者と招待した人が入る', app && app.refNo === 'P004' && app.refName === 'ジェッ子 ちゃん' && app.invUid === uid && app.invName === '見本 はなこ' && app.join === k, JSON.stringify(app));
    c('受付票に「見本 はなこ さんからの招待」', /見本 はなこ さんからの招待/.test(await ev(`document.getElementById('joinBox').innerText`)));
    c('エラーなし（申し込み）', !errs.length, errs.join('/'));
    await ctx.close();
  }
  // ③ 受付で読んで登録 → 招待した人のカードに「来てくれた」
  {
    const { ctx, page, ev, wt, errs } = await P.open(b, { expose: true, data: { 'checkinUnions/GRANT': { name: 'GRANT', unionAdmins: ['j2DPDAccCygHmR9i5K3bTvHnH0V2'] } } });
    await ev('window.__ck.practiceStart()'); await wt(1500);
    await ev(`[].forEach.call(document.querySelectorAll('button'),function(b){ if(/^OK/.test(b.textContent.trim()) && b.offsetParent) b.click(); })`);
    const un = await ev(`window.__ck.rec().ev.unions[0]`);
    await ev(`(function(){ var d=window.__ck.db(); return Promise.all([
      d.collection('ckApply').doc('${appId}').set(${JSON.stringify(Object.assign({}, app))}),
      d.collection('cards').doc('${tok}').set(${JSON.stringify(card())}),
      d.collection('cardClaims').doc('${uid}').set({ t: '${tok}' }) ]); })()`);
    await ev(`window.__ck.db().collection('ckApply').doc('${appId}').set({ union: '${un}', at: Date.now() }, { merge: true })`);
    await ev(`window.__ck.scan('ua:${appId}', 'scan')`); await wt(500);
    const m = await ev(`document.querySelector('.modal') ? document.querySelector('.modal').innerText : ''`);
    c('受付の確かめる画面に「招待した人」と、招待リンクからの申し込み', /招待した人\s*見本 はなこ/.test(m) && /友だちの招待リンクから申し込みました（P004）/.test(m) && (await ev(`document.getElementById('apRef').readOnly`)) === true, m);
    await page.screenshot({ path: OUT + '/ckfi127_desk.png' });
    await ev(`document.getElementById('apGo').click()`); await wt(900);
    const r = JSON.parse(await ev(`(function(){ var d=window.__ck.db(); return d.collection('ckApply').doc('${appId}').get().then(function(s){ var a=s.data(); return Promise.all([d.collection('checkinUsers').doc(a.uid).get(), d.collection('cards').doc('${tok}').get()]).then(function(x){ return JSON.stringify({ a: a, u: x[0].data(), c: x[1].data() }); }); }); })()`));
    c('ユーザーの名簿に招待した人', r.u && r.u.invUid === uid && r.u.invName === '見本 はなこ' && r.u.referrerNo === 'P004', JSON.stringify(r.u));
    const inv = r.c['inv_' + r.a.uid];
    c('招待した人のカードに「来てくれた」（名前・日・イベント）', inv && inv.n === '見本 さくら' && /^\d{4}-\d{2}-\d{2}$/.test(inv.d) && !!inv.ev, JSON.stringify(r.c));
    c('ページのエラーなし（受付）', !errs.length, errs.join(' / '));
    await ctx.close();
  }
  // ④ 招待した人のカード：来てくれた友だちが出る／研修生になったユーザーには出ない
  {
    const o = await P.open(b, { hash: '#c=' + tok, data: { ['cards/' + tok]: card({ inv_u17620000000009: { n: '見本 さくら', d: '2026-12-07', ev: '12月のDAY' }, inv_u17620000000010: { n: '見本 ゆり', d: '2026-11-03', ev: '11月のDAY' } }) } });
    const t = await o.ev(`document.getElementById('fiArea').innerText`);
    c('来てくれた友だちが新しい順に出る（2人）', /2人/.test(t) && /見本 さくら さん[\s\S]*12\/7 来てくれた[\s\S]*見本 ゆり さん[\s\S]*11\/3 来てくれた/.test(t), t);
    await o.ev(`document.getElementById('fiArea').scrollIntoView()`);
    await o.page.screenshot({ path: OUT + '/ckfi127_came.png' });
    c('エラーなし（来てくれた）', !o.errs.length, o.errs.join('/'));
    await o.ctx.close();
    const o2 = await P.open(b, { hash: '#c=' + tok, data: { ['cards/' + tok]: card({ toMember: 'P0006', toCard: 'feed' }) } });
    c('研修生になったユーザーのカードには出ない', (await o2.ev(`document.getElementById('fiArea').innerHTML`)) === '');
    await o2.ctx.close();
    const o3 = await P.open(b, { hash: '#c=tokM', data: { 'cards/tokM': { no: 'ZZ0001', name: '架空 太郎', union: 'ANTARES', active: true } } });
    c('ビジネスの会員証には出ない', (await o3.ev(`document.getElementById('fiArea').innerHTML`)) === '' && !o3.errs.length);
    await o3.ctx.close();
  }
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
