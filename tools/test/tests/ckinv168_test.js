// 受付 v168：棚卸しの回答ページ（#inv）と、名簿の棚卸しの「自動のお知らせ」の記録（架空データ・Firebase はスタブ）
const path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const OWNER = 'j2DPDAccCygHmR9i5K3bTvHnH0V2';
const data = () => ({
  'checkinUnions/GRANT': { name: 'GRANT', unionAdmins: [OWNER] },
  'users/up1': { name: '見本 UP', union: 'GRANT', status: 'active', unionSelectedV2: true },
  'users/mem': { name: '見本 メンバー', union: 'GRANT', status: 'active', unionSelectedV2: true },
  'checkinMembers/GR0001': { no: 'GR0001', name: '見本 一郎', union: 'GRANT', group: '見本 UP' },
  'checkinInventory/GRANT': {
    union: 'GRANT', day: '2026-11-23',
    list: [
      { no: 'GR0001', name: '見本 一郎', group: '見本 UP', trainee: false, stage: 2, last: null },
      { no: 'GR0002', name: '見本 二郎', group: '見本 UP', trainee: true, stage: 1, last: { d: '2026-11-03', why: 'PG 受講' } },
      { no: 'GR0003', name: '見本 三郎', group: '見本 別', trainee: false, stage: 1, last: { d: '2026-11-05', why: '出席（PG）' } }
    ],
    who: { GR0001: ['up1'], GR0002: ['up1'], GR0003: ['someone'] },
    log: [{ no: 'GR0009', name: '見本 九郎', a: 'quit', by: 'up1', byName: '見本 UP', day: '2026-11-16' }]
  },
});
(async () => {
  const b = await P.browser();
  // ① UPルビー（お知らせを受けた人）
  {
    const { page, ev, wt, errs, ctx } = await P.open(b, { data: data(), uid: 'up1', hash: '#inv', vw: 390, vh: 844, wait: 2000 });
    const t = await ev(`document.getElementById('vInv').innerText`);
    c('#inv で回答ページが開く（受付の画面は出ない）', !(await ev(`document.getElementById('vInv').classList.contains('hide')`)) && (await ev(`document.getElementById('vApp').classList.contains('hide')`)));
    c('自分あての2人だけ（ほかの人の分は出ない）', /見本 一郎/.test(t) && /見本 二郎/.test(t) && !/見本 三郎/.test(t), t);
    c('最後の動きと段階', /1か月以上なし（28日以上）/.test(t) && /11\/03 PG 受講（14日以上）/.test(t));
    await page.screenshot({ path: OUT + '/ckinv168_inv.png' });
    await ev(`document.querySelector('.inv-r[data-no="GR0002"] button[data-ia="ok"]').click()`); await wt(400);
    const a = await ev(`window.__FBDATA['checkinInventory/GRANT/ans/GR0002']`);
    c('続けている → 回答を書く（by は自分）', a && a.a === 'ok' && a.by === 'up1', JSON.stringify(a));
    c('回答した行は「受け付けました」', /受け付けました/.test(await ev(`document.querySelector('.inv-r[data-no="GR0002"]').innerText`)));
    await ev(`window.confirm = function(){ return true; }; document.querySelector('.inv-r[data-no="GR0001"] button[data-ia="quit"]').click()`); await wt(400);
    c('やめた → 確認のあと回答を書く', (await ev(`(window.__FBDATA['checkinInventory/GRANT/ans/GR0001']||{}).a`)) === 'quit');
    c('エラーなし①', !errs.length, errs.join('/'));
    await ctx.close();
  }
  // ② 相手でない人
  {
    const { ev, ctx } = await P.open(b, { data: data(), uid: 'mem', hash: '#inv', vw: 390, vh: 844, wait: 2000 });
    c('相手でない人には「ありません」', /お願いしている棚卸しはありません/.test(await ev(`document.getElementById('invBox').innerText`)));
    await ctx.close();
  }
  // ③ 管理者（オーナー）は全員
  {
    const { ev, ctx } = await P.open(b, { data: data(), hash: '#inv', vw: 390, vh: 844, wait: 2000 });
    const t = await ev(`document.getElementById('invBox').innerText`);
    c('管理者には全員が出る', /見本 三郎/.test(t) && /管理者なので全員/.test(t));
    await ctx.close();
  }
  // ④ 名簿の棚卸しに「自動のお知らせ」の記録
  {
    const { page, ev, wt, ctx } = await P.open(b, { data: data(), vw: 390, vh: 844, wait: 2000 });
    await ev(`(function(){ var x=document.getElementById('gxHintOk'); if(x) x.click(); })()`);
    await ev(`document.querySelector('nav button[data-pane="pRoster"]').click()`); await wt(400);
    await ev(`(function(){ var s=document.getElementById('rosterUnionSel'); s.value='GRANT'; s.dispatchEvent(new Event('change')); })()`); await wt(400);
    await ev(`document.getElementById('btnRosterMore').click(); document.getElementById('btnInv').click()`); await wt(1500);
    const t = await ev(`document.getElementById('invLog').innerText`);
    c('名簿の棚卸しに、自動のお知らせの記録（やめた → 無効化・回答した人）', /自動のお知らせ/.test(t) && /お知らせ中 3人/.test(t) && /見本 九郎：やめた → 無効化（見本 UP）/.test(t), t);
    await page.screenshot({ path: OUT + '/ckinv168_log.png', fullPage: true });
    await ctx.close();
  }
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
