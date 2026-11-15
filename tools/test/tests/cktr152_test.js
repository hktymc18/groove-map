// 受付 v152：研修生登録ページ。研修生のページの「🔗 次の担当に送る」→ 届いたリンク（#trainer&open=番号）で開く／
//   「📷 QR」で本人の会員証のQRを読んで開く／番号・リンク・QRで開いた研修生は自分の一覧にも残る（架空データ）
const path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const NDA = 'trainerNda/tr1__2026-10-19';
const data = () => ({
  'users/tr1': { name: '見本 担当', union: 'GRANT', area: '福岡', status: 'active', unionSelectedV2: true },
  'checkinUnions/GRANT': { trainers: ['tr1'], noPrefix: 'ZZ' },
  [NDA]: { uid: 'tr1' },
  'checkinMembers/ZZ0007': { no: 'ZZ0007', name: '見本 たろう', union: 'GRANT', trainee: true, regBy: 'someoneElse', trainings: {} },
  'checkinMembers/ZZ0008': { no: 'ZZ0008', name: '見本 はなこ', union: 'GRANT', trainee: true, regBy: 'someoneElse', trainings: {} },
  'checkinMembers/ZZ0009': { no: 'ZZ0009', name: '見本 じろう', union: 'GRANT', trainee: true, regBy: 'tr1', trainings: {} },
  'cards/tokZZ8': { no: 'ZZ0008', union: 'GRANT', name: '見本 はなこ' },
});
(async () => {
  const b = await P.browser();
  // ① 届いたリンクで開く（担当・自分のユニオンだが自分が登録していない研修生）
  {
    const { page, ev, wt, errs, ctx } = await P.open(b, { evalHook: true, uid: 'tr1', hash: '#trainer&open=zz0007', data: data(), wait: 2200 });
    const t = await ev(`(document.querySelector('.modal')||document.body).innerText`);
    c('リンクで開くと、その研修生のページが開く', /見本 たろう/.test(t) && /ZZ0007/.test(t) && /受講済みにする/.test(t), t.slice(0, 200));
    c('開いたらURLは #trainer に戻る（再読み込みで何度も開かない）', (await ev('location.hash')) === '#trainer', await ev('location.hash'));
    c('「🔗 次の担当に送る」がある', !!(await ev(`!!document.getElementById('tcShare')`)));
    await page.screenshot({ path: OUT + '/cktr152_open.png', fullPage: false });
    // 送る（共有シートを横取り）
    await ev(`window.__shared = null; navigator.share = function(o){ window.__shared = o; return Promise.resolve(); }; document.getElementById('tcShare').click();`); await wt(200);
    const sh = await ev(`window.__shared`);
    c('共有の中身：リンクは #trainer&open=番号・文に名前と番号', sh && /\/checkin\/index\.html#trainer&open=ZZ0007$/.test(sh.url) && /見本 たろう さん（ZZ0007）/.test(sh.text), JSON.stringify(sh));
    c('リンクにトークンや名前は入らない', sh && !/c=|tok|%E8%A6%8B/.test(sh.url));
    // 共有が無い端末はコピー
    await ev(`navigator.share = undefined; window.__copied = null; navigator.clipboard.writeText = function(t){ window.__copied = t; return Promise.resolve(); }; document.getElementById('tcShare').click();`).catch(() => {}); await wt(200);
    const cp = await ev(`window.__copied`);
    c('共有が無い端末は文とリンクをコピー', cp && /ZZ0007/.test(cp) && /#trainer&open=ZZ0007/.test(cp), String(cp));
    await ev(`document.getElementById('tcClose').click()`); await wt(300);
    const list = await ev(`document.getElementById('tsResults').innerText`);
    c('リンクで開いた研修生は自分の一覧にも残る', /見本 たろう/.test(list) && /見本 じろう/.test(list) && !/見本 はなこ/.test(list), list);
    c('開いただけでは削除ボタンは出ない（今までどおり登録した人・管理者だけ）', await ev(`__ckEval("trChecklist(gTrMembers.filter(function(m){return m.no==='ZZ0007';})[0])"), !document.getElementById('tcDel')`));
    await ev(`document.getElementById('tcClose').click()`); await wt(200);
    // ② QRを読んで開く（読み取り部分の解釈と、読めた後の動き）
    c('QRの読み方：会員証のQR m:番号:xxxxxx', JSON.stringify(await ev(`__ckEval("trQrNo('m:ZZ0008:abc123')")`)) === '{"no":"ZZ0008"}');
    c('QRの読み方：紙カードの生番号・送られたリンク・会員証のURL', JSON.stringify(await ev(`__ckEval("[trQrNo('zz0008'), trQrNo('https://x/checkin/index.html#trainer&open=ZZ0008'), trQrNo('https://x/checkin/index.html#c=tokZZ8')]")`)) === '[{"no":"ZZ0008"},{"no":"ZZ0008"},{"tok":"tokZZ8"}]');
    c('QRの読み方：ほかのQRは読まない', JSON.stringify(await ev(`__ckEval("[trQrNo('bd:b_aaaaaaaaaaaaaaaaaaaa'), trQrNo('ua:abc'), trQrNo('https://example.com/')]")`)) === '[null,null,null]');
    c('「📷 QR」ボタンがある', !!(await ev(`!!document.getElementById('trOpenQr')`)));
    await ev(`__ckEval("ckCamScan = function(t, h, parse, w, onHit){ onHit(parse('https://x/checkin/index.html#c=tokZZ8')); }"); document.getElementById('trOpenQr').click();`); await wt(400);
    c('会員証のURLのQRでも、会員証から番号を調べて開く', /見本 はなこ/.test(await ev(`(document.querySelector('.modal')||document.body).innerText`)));
    await ev(`document.getElementById('tcClose').click()`); await wt(200);
    c('QRで開いた研修生も一覧に残る', /見本 はなこ/.test(await ev(`document.getElementById('tsResults').innerText`)));
    await ev(`[].forEach.call(document.querySelectorAll('button'), function(b){ if(/^OK/.test(b.textContent.trim()) && b.offsetParent) b.click(); }); __ckEval('trTab(false)')`); await wt(300);
    c('一覧のタブ：番号の欄の横に「📷 QR」', /研修をした方の番号/.test(await ev(`document.getElementById('trPaneList').innerText`)) && (await ev(`document.getElementById('trOpenQr').offsetWidth > 0`)));
    await page.screenshot({ path: OUT + '/cktr152_list.png', fullPage: true });
    // ③ 番号を入れて「開く」も今までどおり
    await ev(`document.getElementById('trOpenNo').value='ｚｚ０００９'; document.getElementById('trOpenGo').click();`); await wt(400);
    c('番号を入れて「開く」も今までどおり（全角も可）', /見本 じろう/.test(await ev(`(document.querySelector('.modal')||document.body).innerText`)));
    c('横にはみ出さない', (await ev(`document.documentElement.scrollWidth`)) === 390);
    c('エラーなし', !errs.length, errs.join('/'));
    await ctx.close();
  }
  // ④ 誓約がまだの担当がリンクを開いた時は、誓約の後に開く（先に研修生は出さない）
  {
    const d = data(); delete d[NDA];
    const { ev, ctx } = await P.open(b, { evalHook: true, uid: 'tr1', hash: '#trainer&open=ZZ0007', data: d, wait: 2000 });
    c('誓約前は研修生のページを開かない（誓約の画面が出る）', !(await ev(`!!document.getElementById('tcShare')`)) && !(await ev(`document.getElementById('trNda').classList.contains('hide')`)));
    c('誓約前はリンクの番号を覚えている', (await ev(`__ckEval('gTrOpenLink')`)) === 'ZZ0007');
    await ctx.close();
  }
  // ⑤ 任命されていない人はリンクでも開けない
  {
    const d = data(); d['checkinUnions/GRANT'] = { trainers: [], noPrefix: 'ZZ' };
    const { ev, ctx } = await P.open(b, { evalHook: true, uid: 'tr1', hash: '#trainer&open=ZZ0007', data: d, wait: 2000 });
    c('任命されていない人はリンクでも開けない', !(await ev(`!!document.getElementById('tcShare')`)) && /任命されていません/.test(await ev(`document.getElementById('trDeny').textContent`)));
    await ctx.close();
  }
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
