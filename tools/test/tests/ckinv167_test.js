// 受付 v167：名簿の「🧹 棚卸し」。最後の動き（直近1ヶ月の出席・研修の受講・面談シート・登録日・前の「続けている」）から
//   14日以上＝1回目・28日以上＝2回目を一覧に。続けている／様子見（2週間）／無効化。名簿に「最後の動き」の列（架空データ）
const path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const OWNER = 'j2DPDAccCygHmR9i5K3bTvHnH0V2';
const pad = n => (n < 10 ? '0' : '') + n, ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const ago = n => ymd(new Date(Date.now() - n * 86400000));
const M = (no, name, x) => Object.assign({ no, name, union: 'GRANT', group: '見本 系列' }, x || {});
const data = () => {
  const D = {
    'checkinUnions/GRANT': { name: 'GRANT', unionAdmins: [OWNER] },
    'checkinMembers/GR0001': M('GR0001', '見本 出席', {}),                                           // 3日前に出席 → 出ない
    'checkinMembers/GR0002': M('GR0002', '見本 研修生', { trainee: true, trainings: { PG: { at: ago(20) } } }),   // 20日前に受講 → 1回目
    'checkinMembers/GR0003': M('GR0003', '見本 なし', {}),                                            // 何もない → 2回目
    'checkinMembers/GR0004': M('GR0004', '見本 様子見', { invSnooze: ago(-5) }),                       // 様子見中 → 出ない
    'checkinMembers/GR0005': M('GR0005', '見本 続けている', { invAt: ago(2) }),                        // 2日前に続けている → 出ない
    'checkinMembers/GR0006': M('GR0006', '見本 面談', { trainee: true, coSheet: { atMs: Date.now() - 30 * 86400000 } }),   // 30日前の面談シート → 2回目
    'checkinMembers/GR0007': M('GR0007', '見本 無効', { active: false }),                             // 無効 → 出ない
    'checkinEvents/ev1': { date: ago(3), month: ago(3).slice(0, 7), name: 'PG', hostUnion: 'GRANT', unions: ['GRANT'] },
    'checkinEvents/ev1/attendance/GR0001': { no: 'GR0001', name: '見本 出席', union: 'GRANT' },
  };
  return D;
};
(async () => {
  const b = await P.browser();
  const { page, ev, wt, errs, ctx } = await P.open(b, { data: data(), vw: 390, vh: 844, wait: 2000 });
  await ev(`(function(){ var x=document.getElementById('gxHintOk'); if(x) x.click(); })()`);
  await ev(`document.querySelector('nav button[data-pane="pRoster"]').click()`); await wt(500);
  await ev(`(function(){ var s=document.getElementById('rosterUnionSel'); s.value='GRANT'; s.dispatchEvent(new Event('change')); })()`); await wt(500);
  c('棚卸しを開く前は「最後の動き」の列がない', !/最後の動き/.test(await ev(`document.getElementById('rosterHead').innerText`)));
  await ev(`document.getElementById('btnRosterMore').click()`);
  await ev(`document.getElementById('btnInv').click()`); await wt(1200);
  const t = await ev(`document.querySelector('.modal').innerText`);
  const nos = await ev(`[].map.call(document.querySelectorAll('.inv-r'), function(r){ return r.getAttribute('data-no'); })`);
  c('候補：何もない人・30日前の面談シート（2回目）・20日前の受講（1回目）', nos.slice().sort().join(',') === 'GR0002,GR0003,GR0006', nos.join(','));
  c('2回目（28日以上）が先、1回目（14日以上）が後', /28日以上 動きなし（2人）[\s\S]*14日以上 動きなし（1人）/.test(t), t.slice(0, 300));
  c('最後の動きの中身（PG 受講・面談シート・1か月以上なし）', /PG 受講/.test(t) && /面談シート/.test(t) && /1か月以上なし/.test(t));
  c('3日前に出席・様子見中・続けている・無効の人は出ない', !/見本 出席|見本 様子見|見本 続けている|見本 無効/.test(t));
  await page.screenshot({ path: OUT + '/ckinv167_list.png' });
  // 続けている
  await ev(`document.querySelector('.inv-r[data-no="GR0003"] button[data-inv="ok"]').click()`); await wt(400);
  c('続けている → 今日の日付を記録・その場で表示が変わる', (await ev(`window.__FBDATA['checkinMembers/GR0003'].invAt`)) === ago(0) && /続けている（今日から数え直し）/.test(await ev(`document.querySelector('.inv-r[data-no="GR0003"]').innerText`)));
  // 様子見
  await ev(`document.querySelector('.inv-r[data-no="GR0002"] button[data-inv="wait"]').click()`); await wt(400);
  c('様子見 → 14日後まで出さない', (await ev(`window.__FBDATA['checkinMembers/GR0002'].invSnooze`)) === ago(-14));
  // 名簿の列
  await ev(`document.getElementById('invClose').click()`); await wt(300);
  c('棚卸しの後は名簿に「最後の動き」の列', /最後の動き/.test(await ev(`document.getElementById('rosterHead').innerText`)) && /出席（PG）/.test(await ev(`document.getElementById('rosterBody').innerText`)));
  await page.screenshot({ path: OUT + '/ckinv167_roster.png', fullPage: true });
  // 無効化（名簿の無効化と同じ確認画面）
  await ev(`document.getElementById('btnInv').click()`); await wt(1000);
  await ev(`document.querySelector('.inv-r[data-no="GR0006"] button[data-inv="off"]').click()`); await wt(800);
  await ev(`document.getElementById('offGo').click()`); await wt(2000);
  c('無効化 → 名簿でも無効（active=false）', (await ev(`window.__FBDATA['checkinMembers/GR0006'].active`)) === false);
  const nos2 = await ev(`[].map.call(document.querySelectorAll('.inv-r'), function(r){ return r.getAttribute('data-no'); })`);
  c('無効化の後、棚卸しを開き直すと出ない', nos2.indexOf('GR0006') < 0, nos2.join(','));
  c('エラーなし', !errs.length, errs.join('/'));
  await ctx.close();
  // リーダー（見るだけ）
  {
    const d = data(); d['checkinUnions/GRANT'] = { name: 'GRANT', leaders: ['ld1'] }; d['users/ld1'] = { name: '見本 リーダー', union: 'GRANT', status: 'active', unionSelectedV2: true };
    const o = await P.open(b, { data: d, uid: 'ld1', vw: 390, vh: 844, wait: 2000 });
    await o.ev(`document.querySelector('nav button[data-pane="pRoster"]').click()`); await o.wt(500);
    await o.ev(`document.getElementById('btnRosterMore').click(); document.getElementById('btnInv').click()`); await o.wt(1200);
    const t2 = await o.ev(`document.querySelector('.modal').innerText`);
    c('リーダーは見るだけ（ボタンなし・案内あり）', !(await o.ev(`!!document.querySelector('.inv-r button')`)) && /選べるのは、ユニオン管理者・受付管理者/.test(t2) && /見本 なし/.test(t2));
    await o.ctx.close();
  }
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
