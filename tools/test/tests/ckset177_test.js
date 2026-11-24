// 受付 v177：名簿の「⚙ 管理メニュー」から任命・オーナー用のボタンを外し、「⚙ 設定」タブから呼ぶ。架空データ・Firebase はスタブ
const path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const data = () => ({
  'checkinUnions/GRANT': { name: 'GRANT', unionAdmins: ['ua1'], admins: ['rc1'], leaders: ['ld1'], trainers: [], noPrefix: 'GR', area: '福岡', issuer: 'GRANT' },
  'users/ua1': { name: '見本 管理', union: 'GRANT', status: 'active', unionSelectedV2: true },
  'users/rc1': { name: '見本 受付', union: 'GRANT', status: 'active', unionSelectedV2: true },
  'users/ld1': { name: '見本 リーダー', union: 'GRANT', status: 'active', unionSelectedV2: true },
  'checkinMembers/GR0001': { no: 'GR0001', name: '見本 管理', union: 'GRANT', group: '見本' },
  'checkinMembers/GR0002': { no: 'GR0002', name: '見本 受付', union: 'GRANT', group: '見本' },
});
const OLD = ['btnCkAdmins', 'btnFreeMembers', 'btnTrainers', 'btnUnionAdmins', 'btnBeautyTesters', 'btnLeaders', 'btnAdminsView', 'btnAddUnion', 'btnKobo', 'btnBacks', 'btnRenUnion', 'btnLaunch', 'btnHideMoney', 'btnDelUnion'];
const visible = (ev, ids) => ev(`${JSON.stringify(ids)}.filter(function(i){ var e=document.getElementById(i); return e && e.offsetParent !== null; })`);
const toPeople = async (ev, wt) => {
  await ev(`document.querySelector('nav button[data-pane="pSet"]').click()`); await wt(400);
  await ev(`(function(){ var s=document.getElementById('setUnionSel'); s.value='GRANT'; s.dispatchEvent(new Event('change')); })()`); await wt(900);
  await ev(`document.querySelector('#setBody [data-st="people"]').click()`); await wt(300);
};
(async () => {
  const b = await P.browser();
  for (const vw of [390, 1280]) {
    const { page, ev, wt, errs, ctx } = await P.open(b, { data: data(), vw, vh: 844, wait: 2000 });
    await ev(`(function(){ var x=document.getElementById('gxHintOk'); if(x) x.click(); })()`);
    await ev(`document.querySelector('nav button[data-pane="pRoster"]').click()`); await wt(400);
    await ev(`(function(){ var s=document.getElementById('rosterUnionSel'); s.value='GRANT'; s.dispatchEvent(new Event('change')); })()`); await wt(700);
    if (vw < 500) await ev(`document.getElementById('btnRosterMore').click()`); await wt(200);
    c(vw + 'px オーナー：名簿に古いボタンが出ない', (await visible(ev, OLD)).length === 0, JSON.stringify(await visible(ev, OLD)));
    const keep = await visible(ev, ['btnCsvIn', 'btnCsvOut', 'btnNameCopy', 'btnGroupRen', 'btnInv', 'btnGoSet']);
    c(vw + 'px 名簿の作業ボタンは残る（CSV・名前コピー・系列名変更・棚卸し・設定へ）', keep.length === 6, JSON.stringify(keep));
    c(vw + 'px 古いボタンの処理は残る（設定から呼ぶ）', await ev(`${JSON.stringify(OLD)}.every(function(i){ return typeof document.getElementById(i).onclick === 'function'; })`));
    if (vw < 500) await page.screenshot({ path: OUT + '/ckset177_roster.png', fullPage: false });
    await ev(`document.getElementById('btnGoSet').click()`); await wt(600);
    c(vw + 'px 「⚙ 任命・設定へ」で設定タブが開く', await ev(`document.getElementById('pSet').classList.contains('on') || getComputedStyle(document.getElementById('pSet')).display !== 'none'`));
    if (vw < 500) {
      await toPeople(ev, wt);
      const t = await ev(`document.getElementById('setBody').innerText`);
      c('人と役割の下に一覧の入口（受付管理者・研修担当・徴収なし・管理者一覧）', ['受付管理者の一覧', '研修担当の一覧', '徴収なしメンバーの一覧', '管理者一覧'].every(k => t.indexOf(k) >= 0), t.slice(-300));
      await page.screenshot({ path: OUT + '/ckset177_people.png', fullPage: true });
      await ev(`document.querySelector('#setBody [data-st="l-ad"]').click()`); await wt(700);
      c('👑 受付管理者の一覧が開く（他ユニオンから追加あり）', /他ユニオンから追加/.test(await ev(`(document.querySelector('.modal')||{}).innerText||''`)));
      await ev(`document.getElementById('modalHost').innerHTML=''`); await wt(200);
      await ev(`document.querySelector('#setBody [data-st="l-av"]').click()`); await wt(900);
      const av = await ev(`document.getElementById('modalHost').innerHTML`);
      c('👥 管理者一覧が開く・案内は設定タブ', /管理者一覧/.test(av) && /「⚙ 設定」タブの「👥 人と役割」/.test(av), av.slice(0, 200));
      await ev(`document.getElementById('modalHost').innerHTML=''`); await wt(200);
      await ev(`document.querySelector('#setBody [data-st="top"]').click()`); await wt(200);
      await ev(`document.querySelector('#setBody [data-st="owner"]').click()`); await wt(300);
      await ev(`document.getElementById('stKb').click()`);
      c('オーナーだけ → 🃏 特別カード工房が開く', !!(await page.waitForSelector('#kbNew', { timeout: 4000 }).catch(() => null)));
    }
    c(vw + 'px エラーなし', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }
  // v178: PC（1600px）では体制チェックとメニューが横並び・人の一覧が3列
  {
    const { ev, wt, errs, ctx } = await P.open(b, { data: data(), vw: 1600, vh: 900, wait: 2000 });
    await ev(`(function(){ var x=document.getElementById('gxHintOk'); if(x) x.click(); })()`);
    await ev(`document.querySelector('nav button[data-pane="pSet"]').click()`); await wt(400);
    await ev(`(function(){ var s=document.getElementById('setUnionSel'); s.value='GRANT'; s.dispatchEvent(new Event('change')); })()`); await wt(900);
    const r = JSON.parse(await ev(`(function(){ var a=document.querySelector('.st-top > .st-card').getBoundingClientRect(), m=document.querySelector('.st-menus').getBoundingClientRect(); return JSON.stringify({a:[a.left,a.top,a.right], m:[m.left,m.top]}); })()`));
    c('PC：体制チェックとメニューが横に並ぶ', r.m[0] > r.a[2] && Math.abs(r.m[1] - r.a[1]) < 4, JSON.stringify(r));
    await ev(`document.querySelector('#setBody [data-st="people"]').click()`); await wt(300);
    const cols = await ev(`getComputedStyle(document.getElementById('stList')).gridTemplateColumns.split(' ').length`);
    c('PC：人の一覧が3列', cols === 3, cols);
    c('PC：横にはみ出さない', await ev(`document.documentElement.scrollWidth <= window.innerWidth`));
    c('PC：エラーなし', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }
  // 390px では今まで通り1列
  {
    const { ev, wt, ctx } = await P.open(b, { data: data(), vw: 390, vh: 844, wait: 2000 });
    await ev(`(function(){ var x=document.getElementById('gxHintOk'); if(x) x.click(); })()`);
    await toPeople(ev, wt);
    c('スマホ：人の一覧は1列のまま', await ev(`getComputedStyle(document.getElementById('stList')).display !== 'grid'`));
    await ctx.close();
  }
  // リーダー：研修担当の一覧と管理者一覧だけ
  {
    const { ev, wt, errs, ctx } = await P.open(b, { data: data(), uid: 'ld1', vw: 390, vh: 844, wait: 2000 });
    await ev(`(function(){ var x=document.getElementById('gxHintOk'); if(x) x.click(); })()`);
    await toPeople(ev, wt);
    const ks = await ev(`[].map.call(document.querySelectorAll('#setBody [data-st^="l-"]'), function(x){ return x.getAttribute('data-st'); }).join(',')`);
    c('リーダー：一覧の入口は研修担当・管理者一覧だけ', ks === 'l-tr,l-av', ks);
    c('リーダー：エラーなし', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }
  await b.close();
  console.log(fails ? 'FAILED ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
