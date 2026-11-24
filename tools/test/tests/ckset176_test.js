// 受付 v176：設定タブ（体制チェック・人と役割・その人の設定〔役割・会員証〕・オーナーだけ）。架空データ・Firebase はスタブ
const path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const OWNER = 'j2DPDAccCygHmR9i5K3bTvHnH0V2';
const data = (x) => Object.assign({
  'checkinUnions/GRANT': { name: 'GRANT', unionAdmins: ['ua1'], admins: ['rc1'], leaders: ['ld1'], trainers: [], noPrefix: 'GR', area: '福岡', issuer: 'GRANT', freeRoles: { GR0001: { n: '見本 管理', r: 'unionadmin' } } },
  'users/ua1': { name: '見本 管理', union: 'GRANT', status: 'active', unionSelectedV2: true, ckNo: 'GR0001' },
  'users/rc1': { name: '見本 受付', union: 'GRANT', status: 'active', unionSelectedV2: true },
  'users/ld1': { name: '見本 リーダー', union: 'GRANT', status: 'active', unionSelectedV2: true },
  'users/u4': { name: '見本 四郎', union: 'GRANT', status: 'active', unionSelectedV2: true },
  'checkinMembers/GR0001': { no: 'GR0001', name: '見本 管理', union: 'GRANT', group: '見本', cardToken: 'tok1' },
  'checkinMembers/GR0002': { no: 'GR0002', name: '見本 受付', union: 'GRANT', group: '見本', cardToken: 'tok2', olKey: 'olk2' },
  'checkinMembers/GR0003': { no: 'GR0003', name: '見本 リーダー', union: 'GRANT', group: '見本' },
  'checkinMembers/GR0004': { no: 'GR0004', name: '見本 四郎', union: 'GRANT', group: '見本', cardToken: 'tok4', cardTitle: 'GOLD' },
  'checkinMembers/GR0005': { no: 'GR0005', name: '見本 五郎', union: 'GRANT', group: '見本' },   // アカウントなし
  'cards/tok4': { no: 'GR0004', union: 'GRANT', cardTitle: 'GOLD' },
  'olHosts/olk2': { no: 'GR0002', union: 'GRANT', on: true, count: 12 },
}, x || {});
const st = (ev, p) => ev(`JSON.parse(JSON.stringify(window.__FBDATA[${JSON.stringify(p)}] || null))`);
(async () => {
  const b = await P.browser();
  // ① オーナー
  {
    const { page, ev, wt, errs, ctx } = await P.open(b, { data: data(), vw: 390, vh: 844, wait: 2000 });
    await ev(`(function(){ var x=document.getElementById('gxHintOk'); if(x) x.click(); })()`);
    c('設定タブが出る', await ev(`!document.querySelector('nav button[data-pane="pSet"]').classList.contains('hide')`));
    await ev(`document.querySelector('nav button[data-pane="pSet"]').click()`); await wt(400);
    await ev(`(function(){ var s=document.getElementById('setUnionSel'); s.value='GRANT'; s.dispatchEvent(new Event('change')); })()`); await wt(900);
    const t = await ev(`document.getElementById('setBody').innerText`);
    c('体制チェック：人数と未設定', /ユニオン管理者 1人/.test(t) && /受付管理者 1人/.test(t) && /リーダー 1人/.test(t) && /研修生登録の担当 0人/.test(t) && /PayPay の受け取りリンク 未設定/.test(t) && /地域 福岡・番号 GR0001〜/.test(t), t.slice(0, 400));
    c('アカウントの無い人（紐付いていない人）を数える', /紐付いていない人 1人/.test(t), t);
    c('メニュー：人と役割・ユニオンの基本・受付の金額・連携・イベントの決まり・オーナーだけ', ['人と役割', 'ユニオンの基本', '受付の金額', '連携', 'イベントの決まり', 'オーナーだけ'].every(k => t.indexOf(k) >= 0));
    await page.screenshot({ path: OUT + '/ckset176_top.png', fullPage: true });
    // 人と役割
    await ev(`document.querySelector('#setBody [data-st="people"]').click()`); await wt(300);
    const t2 = await ev(`document.getElementById('stList').innerText`);
    c('人と役割：役割がある人（ユニオン管理者＋徴収なし・受付管理者＋OL 受付中・リーダー）', /見本 管理[\s\S]*ユニオン管理者[\s\S]*徴収なし/.test(t2) && /見本 受付[\s\S]*受付管理者[\s\S]*OL 受付中/.test(t2) && /見本 リーダー[\s\S]*リーダー/.test(t2) && !/見本 四郎/.test(t2), t2);
    await page.screenshot({ path: OUT + '/ckset176_people.png', fullPage: true });
    await ev(`[].filter.call(document.querySelectorAll('#setBody [data-sf]'), function(x){ return x.getAttribute('data-sf')==='na'; })[0].click()`); await wt(200);
    c('「アカウントなし」で絞る', /見本 五郎/.test(await ev(`document.getElementById('stList').innerText`)));
    await ev(`[].filter.call(document.querySelectorAll('#setBody [data-sf]'), function(x){ return x.getAttribute('data-sf')==='all'; })[0].click()`); await wt(200);
    // 見本 四郎（アカウントは名前でつながる）に 研修担当・徴収なし（MC）
    await ev(`[].filter.call(document.querySelectorAll('#setBody .st-pr'), function(r){ return /見本 四郎/.test(r.innerText); })[0].querySelector('[data-sp]').click()`); await wt(300);
    c('その人の設定：役割のスイッチ（オーナーは全部押せる）', (await ev(`document.querySelectorAll('.modal input[data-rk]:not(:disabled)').length`)) === 6);
    await page.screenshot({ path: OUT + '/ckset176_person.png' });
    await ev(`(function(){ var q=function(k){ return document.querySelector('.modal input[data-rk="'+k+'"]'); }; q('tr').click(); q('fr').click(); document.getElementById('stFrSel').value='mc'; })()`);
    await ev(`document.getElementById('stPSave').click()`); await wt(900);
    const u = await st(ev, 'checkinUnions/GRANT');
    c('保存：研修担当に追加（名前でつながったアカウント）・徴収なし（MC）', JSON.stringify(u.trainers) === '["u4"]' && u.freeRoles.GR0004 && u.freeRoles.GR0004.r === 'mc' && u.freeRoles.GR0001.r === 'unionadmin', JSON.stringify(u));
    c('ほかの役割は変わらない', JSON.stringify(u.admins) === '["rc1"]' && JSON.stringify(u.leaders) === '["ld1"]' && JSON.stringify(u.unionAdmins) === '["ua1"]');
    // 会員証タブ
    await ev(`[].filter.call(document.querySelectorAll('#setBody .st-pr'), function(r){ return /見本 四郎/.test(r.innerText); })[0].querySelector('[data-sp]').click()`); await wt(300);
    await ev(`document.querySelector('.modal [data-tb="card"]').click()`); await wt(300);
    await page.screenshot({ path: OUT + '/ckset176_card.png' });
    await ev(`(function(){ document.querySelector('#stG [data-g="BR"]').click(); document.getElementById('stT').value='RUBY'; document.querySelector('#stB [data-b="MC"]').click(); document.querySelector('#stB [data-b="SPEAKER"]').click(); document.getElementById('stCSave').click(); })()`); await wt(900);
    const m4 = await st(ev, 'checkinMembers/GR0004'), c4 = await st(ev, 'cards/tok4');
    c('会員証：グレード・タイトル・バッジを名簿と会員証に保存', m4.grade === 'BR' && m4.cardTitle === 'RUBY' && JSON.stringify(m4.badges) === '["MC","SPEAKER"]' && c4.grade === 'BR' && c4.cardTitle === 'RUBY' && JSON.stringify(c4.badges) === '["MC","SPEAKER"]', JSON.stringify([m4, c4]));
    // OL を止める
    await ev(`[].filter.call(document.querySelectorAll('#setBody .st-pr'), function(r){ return /見本 受付/.test(r.innerText); })[0].querySelector('[data-sp]').click()`); await wt(300);
    c('OL のスイッチに これまでの人数', /これまで 12人/.test(await ev(`document.querySelector('.modal').innerText`)));
    await ev(`document.querySelector('.modal input[data-rk="ol"]').click(); document.getElementById('stPSave').click();`); await wt(900);
    c('OL チェックアウトを止める（olHosts.on=false）', (await st(ev, 'olHosts/olk2')).on === false);
    // オーナーだけ
    await ev(`document.querySelector('#setBody [data-st="top"]').click()`); await wt(300);
    await ev(`document.querySelector('#setBody [data-st="owner"]').click()`); await wt(300);
    c('オーナーだけ：9つ', (await ev(`document.querySelectorAll('.modal .st-menu.own').length`)) === 9);
    c('横にはみ出さない', (await ev(`document.documentElement.scrollWidth`)) === 390);
    c('エラーなし（オーナー）', !errs.length, errs.join('/'));
    await ctx.close();
  }
  // ② 受付管理者（rc1）
  {
    const { ev, wt, errs, ctx } = await P.open(b, { data: data(), uid: 'rc1', vw: 390, vh: 844, wait: 2000 });
    await ev(`document.querySelector('nav button[data-pane="pSet"]').click()`); await wt(1000);
    const t = await ev(`document.getElementById('setBody').innerText`);
    c('受付管理者：オーナーだけ・受付の金額は出ない／ユニオンの基本は出る', !/オーナーだけ/.test(t) && !/受付の金額/.test(t) && /ユニオンの基本/.test(t), t.slice(0, 300));
    await ev(`document.querySelector('#setBody [data-st="people"]').click()`); await wt(300);
    await ev(`[].filter.call(document.querySelectorAll('#setBody [data-sf]'), function(x){ return x.getAttribute('data-sf')==='all'; })[0].click()`); await wt(200);
    await ev(`[].filter.call(document.querySelectorAll('#setBody .st-pr'), function(r){ return /見本 四郎/.test(r.innerText); })[0].querySelector('[data-sp]').click()`); await wt(300);
    const en = await ev(`[].map.call(document.querySelectorAll('.modal input[data-rk]:not(:disabled)'), function(x){ return x.getAttribute('data-rk'); }).join()`);
    c('受付管理者が押せるのは 徴収なし・OL だけ（任命はユニオン管理者・リーダーの指定はオーナー）', en === 'fr,ol', en);
    c('エラーなし（受付管理者）', !errs.length, errs.join('/'));
    await ctx.close();
  }
  // ③ リーダー（ld1）
  {
    const { ev, wt, ctx } = await P.open(b, { data: data(), uid: 'ld1', vw: 390, vh: 844, wait: 2000 });
    await ev(`document.querySelector('nav button[data-pane="pSet"]').click()`); await wt(1000);
    await ev(`document.querySelector('#setBody [data-st="people"]').click()`); await wt(300);
    await ev(`[].filter.call(document.querySelectorAll('#setBody [data-sf]'), function(x){ return x.getAttribute('data-sf')==='all'; })[0].click()`); await wt(200);
    await ev(`[].filter.call(document.querySelectorAll('#setBody .st-pr'), function(r){ return /見本 四郎/.test(r.innerText); })[0].querySelector('[data-sp]').click()`); await wt(300);
    const en = await ev(`[].map.call(document.querySelectorAll('.modal input[data-rk]:not(:disabled)'), function(x){ return x.getAttribute('data-rk'); }).join()`);
    c('リーダーが押せるのは 研修担当だけ', en === 'tr', en);
    await ev(`document.querySelector('.modal [data-tb="card"]').click()`); await wt(300);
    c('リーダーは会員証を変えられない（保存ボタンなし・案内）', !(await ev(`!!document.getElementById('stCSave')`)) && /会員証を変えられるのは/.test(await ev(`document.querySelector('.modal').innerText`)));
    await ctx.close();
  }
  // ④ 一般メンバー
  {
    const { ev, ctx } = await P.open(b, { data: data(), uid: 'u4', vw: 390, vh: 844, wait: 2000 });
    c('一般メンバーには設定タブが出ない', await ev(`document.querySelector('nav button[data-pane="pSet"]').classList.contains('hide')`));
    await ctx.close();
  }
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
