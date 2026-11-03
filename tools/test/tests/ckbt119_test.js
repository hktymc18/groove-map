// 受付 v119：準備中のユーザー機能（ユーザー登録・ユーザーの名簿・測定・体験・購入）は、オーナーと確認メンバー（checkinConfig/beauty.testers）だけに出す。
//   ユニオン管理者でも、確認メンバーでなければ出ない（架空データ・練習モード）
const fs = require('fs'), path = require('path');
const P = require('../lib/ckpage.js');
const H = fs.readFileSync(P.R + '/checkin/index.html', 'utf8');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OWNER = 'j2DPDAccCygHmR9i5K3bTvHnH0V2';
(async () => {
  c('APP_VER v119以降・v119のお知らせ', (+(H.match(/var APP_VER = 'v(\d+)';/) || [0, 0])[1]) >= 119 && /\n  \{ v: 'v119', d: '2026\/11\/03', items: \['💜/.test(H));
  c('ゲスト受付の「ユーザーとして登録する」は ckBeautyOn のときだけ（保存の時も確かめる）', /id="gAsUserRow" class="' \+ \(ckBeautyOn\(\) \? '' : 'hide'\) \+ '"/.test(H) && /if\(\$\('gAsUser'\)\.checked && ckBeautyOn\(\)\)\{/.test(H));
  const b = await P.browser();
  const base = (uid, testers) => {
    const d = { 'checkinUnions/ANTARES': { name: 'ANTARES', unionAdmins: [OWNER, 'adm1', 'tst1'] } };
    if (uid !== OWNER) d['users/' + uid] = { name: '見本 ' + uid, union: 'ANTARES', unionSelectedV2: true, status: 'active', email: uid + '@example.com', privacy: { ver: '2026-10', at: '2026-10-01T00:00:00Z' } };
    if (testers) d['checkinConfig/beauty'] = { testers };
    return d;
  };
  const look = async (uid, testers) => {
    const { ctx, ev, wt, errs } = await P.open(b, { uid, expose: true, data: base(uid, testers) });
    await ev('window.__ck.practiceStart()'); await wt(1500);
    await ev(`[].forEach.call(document.querySelectorAll('button'),function(b){ if(/^OK/.test(b.textContent.trim()) && b.offsetParent) b.click(); })`);
    await ev(`document.getElementById('btnGuest').click()`); await wt();
    const guest = await ev(`(function(){ var r=document.getElementById('gAsUserRow'); return !!r && !r.classList.contains('hide') && r.offsetParent !== null; })()`);
    await ev(`(function(){ var x=document.getElementById('gCancel'); if(x) x.click(); })()`);
    await ev(`document.querySelector('nav button[data-pane="pRoster"]').click()`); await wt(600);
    const r = JSON.parse(await ev(`JSON.stringify({kind:!document.getElementById('rosterKind').classList.contains('hide'), btn:!document.getElementById('btnBeautyTesters').classList.contains('hide')})`));
    await ctx.close();
    return { guest, kind: r.kind, btn: r.btn, errs };
  };
  const ad = await look('adm1', null);
  c('ユニオン管理者（確認メンバーでない）: ゲスト受付に「ユーザーとして登録する」が出ない', !ad.guest);
  c('ユニオン管理者（確認メンバーでない）: 名簿に「ビジネス｜ユーザー」が出ない', !ad.kind);
  c('ユニオン管理者: 確認メンバーを決めるボタンは出ない', !ad.btn);
  const ad2 = await look('adm1', ['someone']);
  c('ほかの人だけが確認メンバーの時も出ない', !ad2.guest && !ad2.kind);
  const ts = await look('tst1', ['tst1']);
  c('確認メンバー: 「ユーザーとして登録する」が出る', ts.guest);
  c('確認メンバー: 名簿に「ビジネス｜ユーザー」が出る', ts.kind);
  c('確認メンバー: 確認メンバーを決めるボタンは出ない（オーナーだけ）', !ts.btn);
  const ow = await look(OWNER, null);
  c('オーナー: 指定しなくても全部出る・確認メンバーを決めるボタンも出る', ow.guest && ow.kind && ow.btn);
  c('ページのエラーなし', ![].concat(ad.errs, ad2.errs, ts.errs, ow.errs).length, [].concat(ad.errs, ts.errs, ow.errs).join(' / '));
  // オーナーが確認メンバーを保存
  {
    const { ctx, page, ev, wt, errs } = await P.open(b, { expose: true, data: Object.assign(base(OWNER, ['tst1']), { 'users/tst1': { name: '見本 確認', union: 'ANTARES', status: 'active' }, 'users/adm1': { name: '見本 管理', union: 'ANTARES', status: 'active' } }) });
    await ev(`document.querySelector('nav button[data-pane="pRoster"]').click()`); await wt(600);
    await ev(`document.getElementById('btnBeautyTesters').click()`); await wt(500);
    const m = JSON.parse(await ev(`JSON.stringify({h:document.querySelector('.modal h2').textContent, list:document.getElementById('caList').innerText})`));
    c('確認メンバーの画面: 今のメンバーにチェック', /ユーザー機能の確認メンバー/.test(m.h) && /見本 確認/.test(m.list), JSON.stringify(m));
    await page.screenshot({ path: path.join(__dirname, '../out/ckbt119_testers.png') });
    await ev(`document.getElementById('caSave').click()`); await wt(400);
    const saved = await ev(`window.__FBDATA ? JSON.stringify(window.__FBDATA['checkinConfig/beauty']) : ''`);
    c('保存すると checkinConfig/beauty に testers・by', /"testers":\["tst1"\]/.test(saved) && new RegExp('"by":"' + OWNER + '"').test(saved), saved);
    c('ページのエラーなし（保存）', !errs.length, errs.join(' / '));
    await ctx.close();
  }
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
