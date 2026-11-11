// 受付 v139：「💜 Beauty」タブ（ユーザーへのお知らせ・ラウンジの確認。クエストの編集は次の段）。架空データ
//   使えるのはオーナー・ユニオン管理者・DAYスタッフ（checkinUnions/{un}.dayStaff）。準備中のあいだは確認メンバーだけ
//   受付管理者だけの人・リーダーには出ない。DAYスタッフはオーナーとユニオン管理者が決める
const path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const user = (name) => ({ name, union: 'ANTARES', unionSelectedV2: true, status: 'active', email: name.length + '@example.com', privacy: { ver: '2026-10', at: '2026-10-01T00:00:00Z' } });
const base = (x) => Object.assign({
  'checkinUnions/ANTARES': { name: 'ANTARES', unionAdmins: ['ua1'], admins: ['adm1'], leaders: ['ld1'], dayStaff: ['day1', 'day2'] },
  'checkinConfig/beauty': { testers: ['day1', 'adm1', 'ua1', 'ld1'] },
  'users/day1': user('見本 でい'), 'users/day2': user('見本 じゅんび'), 'users/adm1': user('見本 うけつけ'), 'users/ua1': user('見本 かんり'), 'users/ld1': user('見本 りいだ'),
  'users/m1': user('見本 めんば'),
  'ckNotice/ANTARES': { items: [{ t: '12月のDAYは、14時からの開始です。', d: '2026-11-09' }] },
  'ckLounge/w1': { union: 'ANTARES', uid: 'u1', n: '見本 はなこ', co: 'ダイエット編', t: '今週は毎日歩けました', st: 'wait', at: 1 },
  'ckLounge/w2': { union: 'ANTARES', uid: 'u2', n: '見本 さくら', t: 'これでアトピーが治った！', st: 'wait', at: 2 },
  'ckLounge/o1': { union: 'ANTARES', uid: 'u3', n: '見本 ゆり', t: '夜のスキンケア、3日続きました', st: 'ok', okAt: 5 },
  'ckLounge/n1': { union: 'ANTARES', uid: 'u4', n: '見本 まり', t: 'やせた！', st: 'ng', at: 3 } }, x || {});
const tabOn = `!document.querySelector('nav button[data-pane="pBeauty"]').classList.contains('hide')`;
const dotOn = `!document.querySelector('nav button[data-pane="pBeauty"] .nav-dot').hidden`;
(async () => {
  const b = await P.browser();
  // ① DAYスタッフ（管理者ではない）：Beauty タブだけ。赤丸・いま対応すること・出す・出さなかった
  for (const dark of [false, true]) {
    const { ctx, page, ev, wt, errs } = await P.open(b, { dark, uid: 'day1', data: base(), wait: 2600 });
    await page.addStyleTag({ content: '#toast,#rnPopOv,#gxHint{display:none!important}' });
    c('DAYスタッフ：「💜 Beauty」タブが出る' + (dark ? '（ダーク）' : ''), await ev(tabOn));
    c('DAYスタッフ：名簿・集計・会計のタブは出ない', await ev(`['pRoster','pStats','pFin'].every(function(p){ return document.querySelector('nav button[data-pane="'+p+'"]').classList.contains('hide'); })`));
    c('確認待ちがあるとタブに赤丸', await ev(dotOn));
    await page.click('nav button[data-pane="pBeauty"]'); await wt(600);
    const t = await ev(`document.getElementById('btBody').innerText`);
    c('いま対応すること：確認待ち2件・お知らせ1件', /いま対応すること — ANTARES/.test(t) && /2件\s*ラウンジの確認待ち/.test(t) && /1件\s*出ているお知らせ/.test(t), t);
    c('お知らせ・ラウンジ・クエスト（準備中）の3つ', /ユーザーへのお知らせ/.test(t) && /14時からの開始/.test(t) && /ラウンジの確認/.test(t) && /クエストの編集/.test(t) && /準備中/.test(t));
    c('DAYスタッフ：「🌸 DAYスタッフ」を決めるボタンは出ない', await ev(`document.getElementById('btnDayStaff').classList.contains('hide')`));
    c('横にはみ出さない', (await ev('document.documentElement.scrollWidth')) === 390);
    await page.screenshot({ path: OUT + '/ckbt139_day' + (dark ? '_d' : '') + '.png', fullPage: true });
    if (!dark) {
      await ev(`document.querySelector('#btLgList [data-lgok="w1"]').click()`); await wt(500);
      const w1 = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['ckLounge/w1'])`));
      c('DAYスタッフが「出す」→ ok・出した人', w1.st === 'ok' && w1.by === 'day1', JSON.stringify(w1));
      c('一覧と件数がその場で変わる（確認待ち1）', /確認待ち（1）/.test(await ev(`document.getElementById('btLgSeg').innerText`)) && /1件\s*ラウンジの確認待ち/.test(await ev(`document.getElementById('btBody').innerText`)));
      await ev(`document.querySelector('#btLgList [data-lgng="w2"]').click()`); await wt(500);
      c('「出さない」→ 確認待ちが0で赤丸が消える', (await ev(`window.__FBDATA['ckLounge/w2'].st`)) === 'ng' && !(await ev(dotOn)) && /確認待ちの投稿はありません/.test(await ev(`document.getElementById('btLgList').innerText`)));
      await ev(`document.querySelector('#btLgSeg [data-seg="ng"]').click()`); await wt(500);
      const ng = await ev(`document.getElementById('btLgList').innerText`);
      c('「出さなかった」に前の分といま出さなかった分', /やせた！/.test(ng) && /アトピー/.test(ng), ng);
      await page.screenshot({ path: OUT + '/ckbt139_ng.png', fullPage: true });
      await ev(`document.querySelector('#btLgList [data-lgok="n1"]').click()`); await wt(500);
      c('「やっぱり出す」→ ok', (await ev(`window.__FBDATA['ckLounge/n1'].st`)) === 'ok');
      await ev(`document.querySelector('#btLgSeg [data-seg="ok"]').click()`); await wt(500);
      const okt = await ev(`document.getElementById('btLgList').innerText`);
      c('「出ている」に出した投稿', /今週は毎日歩けました/.test(okt) && /やせた！/.test(okt) && /夜のスキンケア/.test(okt), okt);
      await ev(`(function(){ document.getElementById('btNtText').value='持ち物：タオル'; document.getElementById('btNtGo').click(); })()`); await wt(400);
      const n = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['ckNotice/ANTARES'])`));
      c('DAYスタッフがお知らせを送れる（新しい順・送った人）', n.items.length === 2 && n.items[0].t === '持ち物：タオル' && n.by === 'day1', JSON.stringify(n));
      c('送ったあと入力欄は空・ラウンジの画面はそのまま', (await ev(`document.getElementById('btNtText').value`)) === '' && /出ている（/.test(await ev(`document.querySelector('#btLgSeg .on').textContent`)));
    }
    c('エラーなし' + (dark ? '（ダーク）' : ''), !errs.length, errs.join(' / '));
    await ctx.close();
  }
  // ② 出ない人：受付管理者だけ・リーダー・ふつうのメンバー・準備中で確認メンバーでない DAYスタッフ
  for (const [uid, who] of [['adm1', '受付管理者だけの人'], ['ld1', 'リーダー'], ['m1', 'ふつうのメンバー'], ['day2', '確認メンバーでない DAYスタッフ（準備中）']]) {
    const o = await P.open(b, { uid, data: base(), wait: 2400 });
    c(who + '：「💜 Beauty」タブは出ない', !(await o.ev(tabOn)));
    c(who + '：エラーなし', !o.errs.length, o.errs.join(' / '));
    await o.ctx.close();
  }
  // ③ ユニオン管理者：DAYスタッフを決める
  {
    const { ctx, page, ev, wt, errs } = await P.open(b, { uid: 'ua1', data: base({ 'checkinUnions/ANTARES': { name: 'ANTARES', unionAdmins: ['ua1'], dayStaff: ['day1'] } }), wait: 2600 });
    await page.addStyleTag({ content: '#toast,#rnPopOv,#gxHint{display:none!important}' });
    c('ユニオン管理者：「💜 Beauty」タブが出る', await ev(tabOn));
    await page.click('nav button[data-pane="pBeauty"]'); await wt(600);
    c('ユニオン管理者：「🌸 DAYスタッフ」ボタンが出る', !(await ev(`document.getElementById('btnDayStaff').classList.contains('hide')`)));
    await page.click('#btnDayStaff'); await wt(600);
    c('今の DAYスタッフにチェック', /DAYスタッフ — ANTARES/.test(await ev(`document.querySelector('.modal h2').textContent`)) && /見本 でい/.test(await ev(`document.getElementById('caList').innerText`)));
    await ev(`document.getElementById('caLoad').click()`); await wt(600);
    await ev(`(function(){ var l=[].filter.call(document.querySelectorAll('#caList label'), function(x){ return x.textContent==='見本 めんば'; })[0]; var cb=document.getElementById(l.getAttribute('for')); cb.checked=true; cb.onchange(); })()`);
    await page.screenshot({ path: OUT + '/ckbt139_assign.png' });
    await ev(`document.getElementById('caSave').click()`); await wt(600);
    const u = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['checkinUnions/ANTARES'])`));
    c('保存すると dayStaff に入る（ユニオン管理者などは変わらない）', JSON.stringify(u.dayStaff.slice().sort()) === '["day1","m1"]' && JSON.stringify(u.unionAdmins) === '["ua1"]', JSON.stringify(u));
    c('ページのエラーなし（ユニオン管理者）', !errs.length, errs.join(' / '));
    await ctx.close();
  }
  // ④ オーナー：管理者一覧に DAYスタッフ・名簿に古いボタンは無い
  {
    const { ctx, ev, wt, errs } = await P.open(b, { data: base(), wait: 2600 });
    c('オーナー：「💜 Beauty」タブ・DAYスタッフのボタン', (await ev(tabOn)) && !(await ev(`document.getElementById('btnDayStaff').classList.contains('hide')`)));
    c('名簿の「お知らせ」「ラウンジの確認」ボタンは無くなった', !(await ev(`!!document.getElementById('btnUserNotice') || !!document.getElementById('btnUserLounge')`)));
    await ev(`document.querySelector('nav button[data-pane="pRoster"]').click()`); await wt(600);
    await ev(`document.getElementById('btnAdminsView').click()`); await wt(800);
    const m = await ev(`document.querySelector('.modal').innerText`);
    c('管理者一覧に DAYスタッフ', /DAYスタッフ/.test(m) && /見本 でい/.test(m) && /見本 じゅんび/.test(m), m);
    c('ページのエラーなし（オーナー）', !errs.length, errs.join(' / '));
    await ctx.close();
  }
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
