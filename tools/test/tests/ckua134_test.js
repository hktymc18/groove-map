// 受付 v134：受付票（ユーザーの申し込み）のアドレス「…#ua=キー」を、手入力の欄に貼っても読める（スキャナがない時）。架空データ・練習モード
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OWNER = 'j2DPDAccCygHmR9i5K3bTvHnH0V2';
(async () => {
  const b = await P.browser();
  const id = 'abcdefghij0123456789klmn';
  const { ctx, ev, wt, errs } = await P.open(b, { expose: true, data: { 'checkinUnions/GRANT': { name: 'GRANT', unionAdmins: [OWNER] } } });
  await ev('window.__ck.practiceStart()'); await wt(1500);
  await ev(`[].forEach.call(document.querySelectorAll('button'),function(b){ if(/^OK/.test(b.textContent.trim()) && b.offsetParent) b.click(); })`);
  const un = await ev(`window.__ck.rec().ev.unions[0]`);
  await ev(`window.__ck.db().collection('ckApply').doc('${id}').set(${JSON.stringify({ name: 'テスト 太郎', refName: '練習 太郎', refNo: 'P001', join: 'r_aaaaaaaaaaaaaaaaaaaa', evId: '', ok: true, st: 'wait' })})`);
  await ev(`window.__ck.db().collection('ckApply').doc('${id}').update({ union: '${un}', at: Date.now() })`);
  const manual = async (v) => { await ev(`(function(){ document.getElementById('numIn').value=${JSON.stringify(v)}; document.getElementById('btnManual').click(); })()`); await wt(600);
    const m = await ev(`document.querySelector('.modal') ? document.querySelector('.modal').innerText : ''`); await ev(`(function(){ var x=document.getElementById('apCancel'); if(x) x.click(); })()`); await wt(200); return m; };
  c('受付票のアドレスをそのまま貼ると、申し込みの確認が出る', /NAVIGATOR Beauty 新規登録/.test(await manual('https://hktymc18.github.io/groove-map/checkin/index.html#ua=' + id)));
  c('アドレスの前後に空白・改行があっても読める', /NAVIGATOR Beauty 新規登録/.test(await manual('  https://hktymc18.github.io/groove-map/checkin/index.html#ua=' + id + '\n')));
  c('今までどおり「ua:キー」でも読める', /NAVIGATOR Beauty 新規登録/.test(await manual('ua:' + id)));
  c('キーが24文字でないアドレスは読まない', !/NAVIGATOR Beauty 新規登録/.test(await manual('https://hktymc18.github.io/groove-map/checkin/index.html#ua=' + id + 'x')));
  c('ページのエラーなし', !errs.length, errs.join(' / '));
  await ctx.close(); await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
