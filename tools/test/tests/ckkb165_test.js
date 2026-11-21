// 受付 v165：特別カードを外しても本人の会員証から外れない（元に戻る）不具合。
//   本人には特別カード（skin）が付いているのに、工房のカードの「付ける人」が空（食い違い）の時、
//   「工房で開く」が新しいカードを開いていた → 本人に付いているカードを「この人に付いている」として開く。会員証の画面に「外す」も（架空データ）
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const base = (cardNo) => ({
  'checkinUnions/REVE': { name: 'REVE' },
  'checkinMembers/ZZ0198': { no: 'ZZ0198', name: '見本 北斗', union: 'REVE', cardTitle: 'DIAMOND', skin: 'x_k', skinName: 'キムラヒサキ', cardToken: 'tokH' },
  'cards/tokH': { no: 'ZZ0198', name: '見本 北斗', union: 'REVE', cardTitle: 'DIAMOND', skin: 'x_k', skinName: 'キムラヒサキ' },
  'cardSkins/x_k': { label: 'キムラ', colors: {}, v: { frame: 1, art: 1 }, text: { skinName: 'キムラヒサキ' }, no: cardNo, memberName: cardNo === 'ZZ0198' ? '見本 北斗' : (cardNo ? '別の人' : ''), union: cardNo ? 'REVE' : '', createdAt: 1 },
  'cardSkins/reaperTcg': { label: 'シニガミ', v: {}, text: {}, no: '' },
  'cardArt/x_k__frame': { d: PNG, v: 1 }, 'cardArt/x_k__art': { d: PNG, v: 1 },
});
const MEM = `JSON.parse(JSON.stringify(Object.assign({}, window.__FBDATA['checkinMembers/ZZ0198'])))`;
const skinOf = ev => ev(`(function(){ var m = window.__FBDATA['checkinMembers/ZZ0198'], k = window.__FBDATA['cards/tokH']; return [m.skin || '', m.skinName || '', k.skin || '', k.skinName || '', (window.__FBDATA['cardSkins/x_k'] || {}).no]; })()`);
const modalText = ev => ev(`(document.querySelector('.modal') || {}).innerText || ''`);
(async () => {
  const b = await P.browser();
  // ① 食い違い（工房のカードの「付ける人」が空）→ 工房で開く → 外す → 保存
  {
    const { ev, wt, errs, ctx } = await P.open(b, { data: base(''), evalHook: true, wait: 2000 });
    await ev(`__ckEval("cardModal(" + ${JSON.stringify(MEM)} + ")")`); await wt(500);
    c('会員証の画面：設定あり（キムラヒサキ）・外すボタン', /設定あり（キムラヒサキ）/.test(await modalText(ev)) && !!(await ev(`!!document.getElementById('cmSkinOff')`)));
    await ev(`document.getElementById('cmKobo').click()`); await wt(1200);
    const t = await modalText(ev);
    c('工房で開くと、本人に付いているカード（キムラヒサキ）が「この人に付いている」で開く', /見本 北斗に付けています/.test(t) && /キムラヒサキ/.test(t), t.slice(0, 200));
    await ev(`document.getElementById('kbWhoOff').click()`); await wt(300);
    c('外すと「削除」が出る＝新しいカードではなく、工房にあるカード', !!(await ev(`!!document.getElementById('kbDel')`)));
    await ev(`document.getElementById('kbSave').click()`); await wt(2000);
    const s = await skinOf(ev);
    c('外して保存すると、本人と会員証から外れる（元に戻らない）', s[0] === '' && s[1] === '' && s[2] === '' && s[3] === '' && s[4] === '', JSON.stringify(s));
    c('エラーなし①', !errs.length, errs.join('/'));
    await ctx.close();
  }
  // ② 会員証の画面の「外す」で直接外す
  {
    const { ev, wt, errs, ctx } = await P.open(b, { data: base('ZZ0198'), evalHook: true, wait: 2000 });
    await ev(`window.confirm = function(){ return true; }; __ckEval("cardModal(" + ${JSON.stringify(MEM)} + ")")`); await wt(500);
    await ev(`document.getElementById('cmSkinOff').click()`); await wt(800);
    const s = await skinOf(ev);
    c('「外す」で本人・会員証・工房のカードの「付ける人」から外れる', s[0] === '' && s[2] === '' && s[3] === '' && s[4] === '', JSON.stringify(s));
    c('画面も「なし」・ボタンは「作る」に', /✨ 特別カード[\s\S]*なし/.test(await modalText(ev)) && /作る/.test(await ev(`document.getElementById('cmKobo').textContent`)) && !(await ev(`!!document.getElementById('cmSkinOff')`)));
    c('エラーなし②', !errs.length, errs.join('/'));
    await ctx.close();
  }
  // ③ 今までどおり（工房のカードに「付ける人」が入っている）→ 工房で開く → 外す → 保存
  {
    const { ev, wt, ctx } = await P.open(b, { data: base('ZZ0198'), evalHook: true, wait: 2000 });
    await ev(`__ckEval("cardModal(" + ${JSON.stringify(MEM)} + ")")`); await wt(500);
    await ev(`document.getElementById('cmKobo').click()`); await wt(1200);
    await ev(`document.getElementById('kbWhoOff').click()`); await wt(300);
    await ev(`document.getElementById('kbSave').click()`); await wt(2000);
    const s = await skinOf(ev);
    c('今までどおりのカードも外して保存で外れる', s[0] === '' && s[2] === '' && s[4] === '', JSON.stringify(s));
    await ctx.close();
  }
  // ④ 本人のカードが別の人に付いている → 工房では開かず案内（「外す」で外せる）
  {
    const { ev, wt, ctx } = await P.open(b, { data: base('ZZ9999'), evalHook: true, wait: 2000 });
    await ev(`__ckEval("cardModal(" + ${JSON.stringify(MEM)} + ")")`); await wt(500);
    await ev(`document.getElementById('cmKobo').click()`); await wt(800);
    c('別の人に付いているカードは開かずに案内', /別の人 さんに付いています/.test(await ev(`document.getElementById('toast').textContent`)), await ev(`document.getElementById('toast').textContent`));
    await ctx.close();
  }
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
