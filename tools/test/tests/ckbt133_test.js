// 受付 v133：オーナーが「会員証に『ユーザーを招待』を出す会員番号」を保存したら、同じ端末の会員証にはすぐ出る
//   （会員証はこの設定を端末に6時間覚えている。保存した時に、その覚えを保存した内容に置きかえる）。架空データ
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OWNER = 'j2DPDAccCygHmR9i5K3bTvHnH0V2';
(async () => {
  const b = await P.browser();
  const tm = '0123456789abcdef0123456789abcdef';
  const data = { 'checkinUnions/ANTARES': { name: 'ANTARES', unionAdmins: [OWNER] }, 'checkinConfig/beauty': { testers: [], cardNos: [] },
    ['cards/' + tm]: { no: 'ZZ0001', name: '架空 太郎', union: 'ANTARES', active: true } };
  // 前に会員証を開いて「番号の指定なし」を覚えている端末
  const init = `try{ if(!sessionStorage.getItem('seeded')){ localStorage.setItem('bci_bty_nos', JSON.stringify({ nos: [], at: Date.now() })); sessionStorage.setItem('seeded','1'); } }catch(e){}`;
  const { ctx, page, ev, wt, errs } = await P.open(b, { data, init });
  await ev(`(function(){ var x=document.getElementById('gxHintOk'); if(x) x.click(); })()`);
  await ev(`document.querySelector('nav button[data-pane="pRoster"]').click()`); await wt(600);
  await ev(`document.getElementById('btnBeautyTesters').click()`); await wt(500);   // スマホでは「⚙ 管理メニュー」の中
  c('会員番号の説明に「この端末ではすぐ」', /この端末で開く会員証にはすぐ/.test(await ev(`document.querySelector('label[for=caNos]').innerHTML`)));
  await ev(`(function(){ document.getElementById('caNos').value='zz0001'; document.getElementById('caSave').click(); })()`); await wt(500);
  const cache = JSON.parse(await ev(`localStorage.getItem('bci_bty_nos')`));
  c('保存すると、この端末の覚え（会員番号）も新しくなる', cache && JSON.stringify(cache.nos) === '["ZZ0001"]' && Date.now() - cache.at < 60000, JSON.stringify(cache));
  c('保存のメッセージに「この端末ではすぐ出ます」', /この端末ではすぐ出ます/.test(await ev(`document.getElementById('toast').textContent`)));
  // 同じ端末で会員証を開く（覚えている間はサーバーを読まない）
  await page.goto('https://hktymc18.github.io/groove-map/checkin/index.html#c=' + tm); await page.reload(); await wt(2200);
  c('同じ端末の会員証に、すぐ「INVITATION」が出る（6時間待たない）', /INVITATION/.test(await ev(`document.getElementById('uiArea').innerText`)));
  c('ページのエラーなし', !errs.length, errs.join(' / '));
  await ctx.close();
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
