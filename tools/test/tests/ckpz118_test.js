// 受付 v118：ユーザーの「測定・体験・購入」。PRYSMiO の数値→色、今日の体験、会場でのお買い上げ→本人のカードに領収書（お品代）。
//   受付は練習モード（架空データ）、本人のカードは架空のカードで確かめる
const fs = require('fs'), path = require('path');
const P = require('../lib/ckpage.js');
const H = fs.readFileSync(P.R + '/checkin/index.html', 'utf8');
const { JSDOM } = require(path.join(__dirname, '../node_modules/jsdom'));
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const pick = re => { const m = H.match(re); if (!m) throw new Error('not found ' + re); return m[0]; };
const slice = (a, b) => { const i = H.indexOf(a), j = H.indexOf(b, i); if (i < 0 || j < 0) throw new Error('slice ' + a); return H.slice(i, j); };
const OUT = path.join(__dirname, '../out');
(async () => {
  // ── しくみ（jsdom）──
  const W = new JSDOM('<div id="x"></div>', { runScripts: 'outside-only' }).window;
  W.eval([pick(/function esc\(s\)\{[\s\S]*?\n\}/), slice('var CK_PRYSM = [', '// 本人のカードの PRYSMiO'), pick(/function ckNum\(s\)\{[^\n]*\}/), pick(/function ckRcptFor\(r\)\{[^\n]*\}/)].join('\n'));
  const band = v => W.ckPrysmBand(v).n;
  c('色の区切り: 〜249 レッド・250 オレンジ', band(0) === 'レッド' && band(249) === 'レッド' && band(250) === 'オレンジ');
  c('色の区切り: 350 イエロー・450 グリーン・549 グリーン', band(350) === 'イエロー' && band(450) === 'グリーン' && band(549) === 'グリーン');
  c('色の区切り（オーナー指定）: 550〜 ブルー・700〜 パープル', band(550) === 'ブルー' && band(699) === 'ブルー' && band(700) === 'パープル' && band(1099) === 'パープル');
  c('1,100以上はプラチナメダリオン', band(1100) === 'プラチナメダリオン' && band(2500) === 'プラチナメダリオン');
  const nx = W.ckPrysmNext(820);
  c('次の色まで: 820 → プラチナまで あと 280', nx && nx.b.n === 'プラチナメダリオン' && nx.need === 280);
  c('プラチナの次は無い', W.ckPrysmNext(1200) === null);
  c('全角の数字・カンマも読める', W.ckNum('８２０') === 820 && W.ckNum('1,050') === 1050 && W.ckNum('') === 0);
  const hist = W.ckPrysmHist({ pz_e2: { v: 820, d: '2026-11-03' }, pz_e1: { v: 760, d: '2026-10-05' }, rcpt_e1: { amt: 1000 }, pz_x: null });
  c('測定の記録は古い順（ほかの項目は入らない）', hist.length === 2 && hist[0].v === 760 && hist[1].v === 820 && hist[1].ev === 'e2');
  c('但し書き: お買い上げは「お品代」・受講料は今まで通り', W.ckRcptFor({ kind: 'buy' }) === 'お品代' && W.ckRcptFor({}) === 'セミナー受講料');
  c('PDFの但し書きも同じ関数', /txt\('但し ' \+ ckRcptFor\(r\) \+ 'として'/.test(H));
  c('取消でユーザーの記録・領収書も取り下げ', /\['rcpt_', 'rcpt_b_', 'pz_', 'ex_'\]\.forEach\(function\(p\)\{ uu\[p \+ evId\] = FV\.delete\(\); \}\);/.test(H));
  c('イベント削除でもユーザーの記録を取り下げ', /\['rcpt_b_', 'pz_', 'ex_'\]\.forEach\(function\(p\)\{ u\[p \+ id\] = FV\.delete\(\); \}\);/.test(H));
  c('APP_VER v118以降・v118のお知らせ', (+(H.match(/var APP_VER = 'v(\d+)';/) || [0, 0])[1]) >= 118 && /\n  \{ v: 'v118', d: '2026\/11\/03', items: \['💜/.test(H));

  // ── 受付（練習モード）──
  const b = await P.browser();
  for (const dark of [false, true]) {
    const sfx = dark ? '_d' : '';
    const { ctx, page, errs, ev, wt } = await P.open(b, { expose: true, dark, data: { 'checkinUnions/ANTARES': { name: 'ANTARES', unionAdmins: ['j2DPDAccCygHmR9i5K3bTvHnH0V2'] } } });
    const shot = async n => { await wt(250); await page.screenshot({ path: OUT + '/ckpz118_' + n + sfx + '.png' }); };
    await ev('window.__ck.practiceStart()'); await wt(1500);
    await ev(`[].forEach.call(document.querySelectorAll('button'),function(b){ if(/^OK/.test(b.textContent.trim()) && b.offsetParent) b.click(); })`);
    await ev(`document.getElementById('btnGuest').click()`); await wt();
    await ev(`(function(){ document.getElementById('gName').value='見本 はなこ'; var c=document.getElementById('gAsUser'); c.checked=true; c.onchange(); document.getElementById('gRef').value='ジェッ子 ちゃん'; document.getElementById('gGo').click(); })()`); await wt(500);
    // v145: 受付の「体験・購入」はなくした（会場での購入はない・体験は「💜 Beauty」タブの「💆 DAYの体感」）
    const st0 = await ev(`document.getElementById('stageBody').innerText`);
    c('v145: 受付の画面に「体験・購入」「測定」のボタンは無い', !(await ev(`!!document.getElementById('stgUserLog')`)) && !/体験・購入|測定/.test(st0), st0);
    const uid = await ev(`(function(){ var r=window.__ck.rec(); return Object.keys(r.att).filter(function(x){ return r.att[x].kind==='user'; })[0]; })()`);
    const tok = await ev(`window.__ck.rec().att[${JSON.stringify(uid)}].cardToken`);
    await ev(`document.getElementById('stage').scrollIntoView({block:'center'})`); await shot('stage');
    await ev(`window.__ck.scan(${JSON.stringify('u:' + uid + ':' + tok.slice(0, 6))}, 'scan')`); await wt(300);
    c('出席済みの画面にも「体験・購入」は無い', /出席済み/.test(await ev(`document.getElementById('stageBody').innerText`)) && !(await ev(`!!document.getElementById('stgUserLog')`)));
    await ev(`window.__ck.db().collection('checkinUsers').doc(${JSON.stringify(uid)}).set({ prysm: 1150, prysmAt: 3 }, { merge: true })`);
    // 名簿（ユーザー）に色
    await ev(`document.querySelector('nav button[data-pane="pRoster"]').click()`); await wt(500);
    await ev(`document.querySelector('#rosterKind button[data-k="user"]').click()`); await wt(500);
    c('名簿のユーザー一覧に最新の色', /プラチナメダリオン 1,150/.test(await ev(`document.getElementById('rosterBody').innerText`)));
    await shot('roster');
    c('ページのエラーなし' + (dark ? '（ダーク）' : ''), !errs.length, errs.join(' / '));
    await ctx.close();
  }
  // ── 本人のカード ──
  const tok = '0123456789abcdef0123456789abcdef', uid = 'u17620000000001234';
  const card = (x) => Object.assign({ kind: 'user', no: uid, name: '見本 はなこ', union: 'ANTARES', referrer: '架空 太郎', active: true }, x);
  const RB = { kind: 'buy', d: '2026-11-03', ev: 'お買い上げ（11月のDAY）', amt: 12000, no: uid, at: 3, pm: 'PayPay', by: '架空 太郎', items: [{ n: '見本の美容液', q: 2, p: 4500 }, { n: '見本のクレンジング', q: 1, p: 3000 }] };
  for (const dark of [false, true]) {
    const sfx = dark ? '_d' : '';
    const { ctx, page, errs, ev, wt } = await P.open(b, { dark, hash: '#c=' + tok, data: { ['cards/' + tok]: card({ pz_e1: { v: 610, d: '2026-09-07', ev: '9月のDAY', at: 1 }, pz_e2: { v: 760, d: '2026-10-05', ev: '10月のDAY', at: 2 }, pz_e3: { v: 820, d: '2026-11-03', ev: '11月のDAY', at: 3 }, rcpt_b_e3: RB }), ['cardClaims/' + uid]: { t: tok } } });
    const cv = JSON.parse(await ev(`JSON.stringify({grade:document.getElementById('mcGrade').innerText, pz:document.getElementById('pzArea').innerText, rc:document.getElementById('rcptArea').innerText, sw:document.documentElement.scrollWidth})`));
    c('カードに今の色と数値' + (dark ? '（ダーク）' : ''), /パープル\s*820/.test(cv.grade), cv.grade);
    c('PRYSMiO の欄: 数値・色・前回から・次の色まで・記録', /820/.test(cv.pz) && /前回 760 から \+60/.test(cv.pz) && /プラチナメダリオンまで あと 280/.test(cv.pz) && /09\/07/.test(cv.pz) && /会場（DAY）/.test(cv.pz), cv.pz);
    c('領収書の欄にお買い上げ', /お買い上げ（11月のDAY）/.test(cv.rc) && /¥12,000/.test(cv.rc));
    c('横にはみ出さない', cv.sw === 390);
    await page.screenshot({ path: OUT + '/ckpz118_card' + sfx + '.png', fullPage: true });
    await ev(`document.getElementById('rc_latest').click()`); await wt();
    const rm = await ev(`document.querySelector('.modal').innerText`);
    c('領収書: 但し お品代・明細・販売者', /但し お品代として（PayPay受領）/.test(rm) && /見本の美容液 × 2/.test(rm) && /¥9,000/.test(rm) && /架空 太郎/.test(rm) && /¥12,000/.test(rm), rm);
    await page.screenshot({ path: OUT + '/ckpz118_rcpt' + sfx + '.png' });
    c('ページのエラーなし（カード' + (dark ? '・ダーク' : '') + '）', !errs.length, errs.join(' / '));
    await ctx.close();
  }
  // まだ測っていない人・プラチナの人
  {
    const { ctx, ev, errs } = await P.open(b, { hash: '#c=' + tok, data: { ['cards/' + tok]: card({}), ['cardClaims/' + uid]: { t: tok } } });
    c('まだ測っていない人には「次のDAYで測ると色が出る」', /まだ測っていません/.test(await ev(`document.getElementById('pzArea').innerText`)) && (await ev(`document.getElementById('mcGrade').innerText`)) === '');
    c('エラーなし（未測定）', !errs.length, errs.join('/'));
    await ctx.close();
  }
  {
    const { ctx, page, ev, errs } = await P.open(b, { hash: '#c=' + tok, data: { ['cards/' + tok]: card({ pz_e1: { v: 1180, d: '2026-11-03', ev: '11月のDAY', at: 1 } }), ['cardClaims/' + uid]: { t: tok } } });
    const t = await ev(`document.getElementById('pzArea').innerText`);
    c('プラチナの人は「最高の色」・はじめての測定', /最高の色、プラチナメダリオン/.test(t) && /はじめての測定/.test(t) && (await ev(`document.querySelector('#pzArea .pzwrap').classList.contains('plat')`)), t);
    await page.screenshot({ path: OUT + '/ckpz118_plat.png', fullPage: true });
    c('エラーなし（プラチナ）', !errs.length, errs.join('/'));
    await ctx.close();
  }
  {
    const { ctx, ev, errs } = await P.open(b, { hash: '#c=tokM', data: { 'cards/tokM': { no: 'ZZ0001', name: '見本 太郎', union: 'ANTARES', active: true, pz_e1: { v: 800 } } } });
    c('ビジネスの会員証には PRYSMiO の欄・色が出ない', (await ev(`document.getElementById('pzArea').innerHTML`)) === '' && !/パープル/.test(await ev(`document.getElementById('mcGrade').innerText`)));
    c('エラーなし（会員証）', !errs.length, errs.join('/'));
    await ctx.close();
  }
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
