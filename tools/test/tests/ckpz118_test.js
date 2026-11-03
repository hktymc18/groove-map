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
    c('受付の画面に「測定・体験・購入」', /測定・体験・購入/.test(await ev(`document.getElementById('stageBody').innerText`)));
    const uid = await ev(`(function(){ var r=window.__ck.rec(); return Object.keys(r.att).filter(function(x){ return r.att[x].kind==='user'; })[0]; })()`);
    const tok = await ev(`window.__ck.rec().att[${JSON.stringify(uid)}].cardToken`);
    // 前回の測定（別のイベント）を入れておく
    await ev(`window.__ck.db().collection('cards').doc(${JSON.stringify(tok)}).set({ pz_old1: { v: 760, d: '2026-10-05', ev: '10月のDAY', at: 1 } }, { merge: true })`);
    await ev(`document.getElementById('stgUserLog').click()`); await wt(400);
    const m0 = JSON.parse(await ev(`JSON.stringify({sub:document.getElementById('ulPzSub').textContent, buy:document.getElementById('ulBuyMore').classList.contains('hide'), seller:document.getElementById('ulSeller').value, exp:document.querySelectorAll('#ulExp button').length})`));
    c('開くと前回の数値・色が出る', /前回 760（パープル）/.test(m0.sub), m0.sub);
    c('金額を入れるまで受け取り方法・販売者はしまう・販売者の初めは紹介者', m0.buy && m0.seller === 'ジェッ子 ちゃん' && m0.exp === 4);
    await ev(`(function(){ var i=document.getElementById('ulPz'); i.value='８２０'; i.oninput(); })()`);
    const m1 = JSON.parse(await ev(`JSON.stringify({chip:document.getElementById('ulPzChip').innerText, sub:document.getElementById('ulPzSub').textContent})`));
    c('入れると色が付き、前回からの差・次の色まで', m1.chip === 'パープル' && /前回 760 → 今回 820（\+60）/.test(m1.sub) && /プラチナメダリオンまで あと 280/.test(m1.sub), JSON.stringify(m1));
    await ev(`document.querySelector('#ulExp button[data-x="フェイシャル体験"]').click()`);
    await ev(`(function(){ var r=document.querySelector('#ulItems .ulg-row'); r.querySelector('.ulN').value='見本の美容液'; r.querySelector('.ulQ').value='2'; r.querySelector('.ulP').value='4,500'; r.querySelector('.ulP').dispatchEvent(new Event('input',{bubbles:true})); })()`);
    await ev(`document.getElementById('ulAdd').click()`);
    await ev(`(function(){ var r=document.querySelectorAll('#ulItems .ulg-row')[1]; r.querySelector('.ulN').value='見本のクレンジング'; r.querySelector('.ulP').value='3000'; r.querySelector('.ulP').dispatchEvent(new Event('input',{bubbles:true})); })()`);
    const m2 = JSON.parse(await ev(`JSON.stringify({tot:document.getElementById('ulTot').textContent, buy:document.getElementById('ulBuyMore').classList.contains('hide'), rows:document.querySelectorAll('#ulItems .ulg-row').length})`));
    c('行を足せて、合計（数×単価）が出る・金額を入れると販売者の欄が出る', m2.tot === '¥12,000' && !m2.buy && m2.rows === 2, JSON.stringify(m2));
    await shot('modal');
    // 単価のない行は保存しない
    await ev(`(function(){ document.getElementById('ulAdd').click(); var r=document.querySelectorAll('#ulItems .ulg-row')[2]; r.querySelector('.ulN').value='値段なし'; })()`);
    await ev(`document.getElementById('ulGo').click()`); await wt(300);
    c('単価が無い製品があると保存しない', !!(await ev(`!!document.getElementById('ulGo')`)) && /単価を入れて/.test(await ev(`document.getElementById('toast').textContent`)));
    await ev(`document.querySelectorAll('#ulItems .ulDel')[2].click()`);
    await ev(`(function(){ document.getElementById('ulPm').value='PayPay'; document.getElementById('ulGo').click(); })()`); await wt(500);
    const d1 = JSON.parse(await ev(`(function(){ var d=window.__ck.db(), ev=window.__ck.rec().ev.id;
      return Promise.all([d.collection('cards').doc(${JSON.stringify(tok)}).get(), d.collection('checkinUsers').doc(${JSON.stringify(uid)}).get(), d.collection('checkinEvents').doc(ev).collection('attendance').doc(${JSON.stringify(uid)}).get()])
      .then(function(s){ var cd=s[0].data(); return JSON.stringify({ev:ev, pz:cd['pz_'+ev], ex:cd['ex_'+ev], rb:cd['rcpt_b_'+ev], u:s[1].data(), a:s[2].data()}); }); })()`));
    c('カードに測定（pz_イベント）', d1.pz && d1.pz.v === 820 && d1.pz.ev === '🧪 練習ハウディ', JSON.stringify(d1.pz));
    c('カードに体験（ex_イベント）', d1.ex && d1.ex.list.join() === 'フェイシャル体験');
    c('カードにお買い上げの領収書（お品代・合計・明細・販売者・PayPay）', d1.rb && d1.rb.kind === 'buy' && d1.rb.amt === 12000 && d1.rb.items.length === 2 && d1.rb.items[0].q === 2 && d1.rb.items[0].p === 4500 && d1.rb.by === 'ジェッ子 ちゃん' && d1.rb.pm === 'PayPay' && d1.rb.no === uid, JSON.stringify(d1.rb));
    c('ユーザーの名簿に最新の数値', d1.u.prysm === 820 && d1.u.prysmAt > 0);
    c('出席の記録にも同じ内容', d1.a.prysm === 820 && d1.a.buyAmt === 12000 && d1.a.exp.join() === 'フェイシャル体験' && d1.a.seller === 'ジェッ子 ちゃん');
    const sbt = await ev(`document.getElementById('stageBody').innerText`);
    c('受付の画面に「記録済み」', /記録済み・パープル 820・お買い上げ ¥12,000/.test(sbt.replace(/\s+/g, '')) || /記録済み/.test(sbt) && /パープル/.test(sbt) && /¥12,000/.test(sbt), sbt);
    await ev(`document.getElementById('stage').scrollIntoView({block:'center'})`); await shot('stage');
    // もう一度開くと、入れた内容が入っている（直せる）
    await ev(`document.getElementById('stgUserLog').click()`); await wt(400);
    const m3 = JSON.parse(await ev(`JSON.stringify({v:document.getElementById('ulPz').value, on:[].map.call(document.querySelectorAll('#ulExp button.on'),function(b){return b.textContent;}), rows:document.querySelectorAll('#ulItems .ulg-row').length, pm:document.getElementById('ulPm').value})`));
    c('もう一度開くと入れた内容のまま（直せる）', m3.v === '820' && m3.on.join() === 'フェイシャル体験' && m3.rows === 2 && m3.pm === 'PayPay', JSON.stringify(m3));
    // 数値を消して、お買い上げも消して保存 → 取り下げ
    await ev(`(function(){ document.getElementById('ulPz').value=''; [].forEach.call(document.querySelectorAll('#ulItems .ulP'),function(x){ x.value=''; }); [].forEach.call(document.querySelectorAll('#ulItems .ulN'),function(x){ x.value=''; }); document.getElementById('ulGo').click(); })()`); await wt(400);
    const d2 = JSON.parse(await ev(`(function(){ var ev=window.__ck.rec().ev.id; return window.__ck.db().collection('cards').doc(${JSON.stringify(tok)}).get().then(function(s){ var cd=s.data(); return JSON.stringify({pz:cd['pz_'+ev]||null, rb:cd['rcpt_b_'+ev]||null, old:cd.pz_old1||null}); }); })()`));
    c('消して保存すると、カードからも取り下げ（前の測定は残る）', !d2.pz && !d2.rb && d2.old && d2.old.v === 760, JSON.stringify(d2));
    // 数字でない・大きすぎる
    await ev(`document.getElementById('stgUserLog').click()`); await wt(400);
    await ev(`(function(){ document.getElementById('ulPz').value='abc'; document.getElementById('ulGo').click(); })()`); await wt(200);
    c('数字でない数値は保存しない', /数字で入れて/.test(await ev(`document.getElementById('toast').textContent`)));
    await ev(`(function(){ document.getElementById('ulPz').value='5000'; document.getElementById('ulGo').click(); })()`); await wt(200);
    c('3,000 より大きい数値は保存しない', /0〜3000/.test(await ev(`document.getElementById('toast').textContent`)));
    await ev(`(function(){ document.getElementById('ulPz').value='1150'; document.getElementById('ulGo').click(); })()`); await wt(400);
    // 同じ人のQRをもう一度（出席済み）でも記録できる
    await ev(`window.__ck.scan(${JSON.stringify('u:' + uid + ':' + tok.slice(0, 6))}, 'scan')`); await wt(300);
    c('出席済みの画面からも「測定・体験・購入」', /出席済み/.test(await ev(`document.getElementById('stageBody').innerText`)) && !!(await ev(`!!document.getElementById('stgUserLog')`)));
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
