// 受付 v128：ユーザーのカードの「お知らせ」（NAVIGATOR Beauty・準備中）。ホーム画面に追加の案内・次のDAY（カレンダーに追加）・
//   来場のお礼・スタッフからのお知らせ（名簿 → ユーザー → 📣 ユーザーにお知らせ）。イベントの「次のDAYとして出す」（架空データ）
const fs = require('fs'), path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const pad = n => (n < 10 ? '0' : '') + n, ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };
const OWNER = 'j2DPDAccCygHmR9i5K3bTvHnH0V2';
(async () => {
  const b = await P.browser();
  const tok = '0123456789abcdef0123456789abcdef', uid = 'u17620000000001';
  const card = (x) => Object.assign({ kind: 'user', no: uid, name: '見本 はなこ', union: 'ANTARES', referrer: '架空 太郎', active: true, visits: 3 }, x);
  const evs = {
    'checkinEvents/e1': { date: day(5), name: '研修（ビジネスだけ）', unions: ['ANTARES'] },
    'checkinEvents/e2': { date: day(12), name: '12月のDAY', unions: ['ANTARES'], uDay: true, uInfo: '13:00〜 見本ホール' },
    'checkinEvents/e3': { date: day(40), name: '1月のDAY', unions: ['ANTARES'], uDay: true },
    'checkinEvents/e4': { date: day(3), name: 'ほかのユニオンのDAY', unions: ['REVE'], uDay: true } };
  // ① お知らせが全部ある時
  for (const dark of [false, true]) {
    const data = Object.assign({ ['cards/' + tok]: card({ lastVisit: { d: day(-1), ev: '11月のDAY' }, pz_x: { v: 820, d: day(-1), at: 1 } }),
      'ckNotice/ANTARES': { items: [{ t: '12月のDAYは、14時からの開始です。', d: day(-2) }] } }, evs);
    const { ctx, page, ev, wt, errs } = await P.open(b, { dark, hash: '#c=' + tok, data });
    const t = await ev(`document.getElementById('nwArea').innerText`);
    c('ホーム画面に追加の案内' + (dark ? '（ダーク）' : ''), /ホーム画面に追加すると/.test(t) && /やり方を見る/.test(t), t);
    c('次のDAY：「次のDAYとして出す」の、いちばん近いイベント（ビジネスだけのイベント・ほかのユニオンは出さない）', /次のDAY/.test(t) && /12月のDAY/.test(t) && /13:00〜 見本ホール/.test(t) && !/研修/.test(t) && !/ほかのユニオン/.test(t) && !/1月のDAY/.test(t), t);
    c('来場のお礼（その日に測ったので、測定の結果の案内つき）', /ご来場ありがとうございました。測定の結果が、このカードに届いています/.test(t), t);
    c('スタッフからのお知らせ', /お知らせ/.test(t) && /14時からの開始/.test(t), t);
    c('お知らせは PRYSMiO より上（カードのすぐ下）', (await ev(`document.getElementById('nwArea').compareDocumentPosition(document.getElementById('pzArea')) & 4`)) === 4);
    await ev(`document.getElementById('memberCard').scrollIntoView()`);
    await page.screenshot({ path: OUT + '/ckns128_card' + (dark ? '_d' : '') + '.png', fullPage: true });
    if (!dark) {
      const href = await ev(`document.getElementById('nwGcal').getAttribute('href')`);
      c('Googleカレンダーのリンク（日付・名前）', href.indexOf('https://calendar.google.com/calendar/render?action=TEMPLATE') === 0 && href.indexOf('dates=' + day(12).replace(/-/g, '') + '/' + day(13).replace(/-/g, '')) > 0 && /12%E6%9C%88/.test(href), href);
      const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }).catch(() => null), ev(`document.getElementById('nwCal').click()`)]);
      let ics = '';
      if (dl) { const p = await dl.path(); ics = p ? fs.readFileSync(p, 'utf8') : ''; }
      c('「カレンダーに追加」で .ics（終日・日付・名前・時間と場所）', dl && /\.ics$/.test(dl.suggestedFilename()) && /BEGIN:VEVENT/.test(ics) && ics.indexOf('DTSTART;VALUE=DATE:' + day(12).replace(/-/g, '')) >= 0 && /SUMMARY:12月のDAY/.test(ics) && /13:00〜 見本ホール/.test(ics), (dl && dl.suggestedFilename()) + ' ' + ics.slice(0, 300));
      await ev(`document.getElementById('nwA2hsHow').click()`); await wt(300);
      const m = await ev(`document.querySelector('.modal').innerText`);
      c('やり方：iPhone と Android の手順', /共有ボタン/.test(m) && /ホーム画面に追加/.test(m) && /Android/.test(m) && /︙/.test(m), m);
      await page.screenshot({ path: OUT + '/ckns128_how.png' });
      await ev(`document.getElementById('nwHowOk').click()`);
      await ev(`document.getElementById('nwA2hsX').click()`); await wt(200);
      c('✕ で案内を閉じる', !(await ev(`!!document.getElementById('nwA2hs')`)) && (await ev(`localStorage.getItem('bci_a2hs_off')`)) === '1');
      c('横にはみ出さない', (await ev(`document.documentElement.scrollWidth`)) === 390);
    }
    c('エラーなし（カード）' + (dark ? '（ダーク）' : ''), !errs.length, errs.join('/'));
    await ctx.close();
  }
  // ② 古い来場・お知らせなし・次のDAYなし／研修生になった人・ビジネスの会員証
  {
    const o = await P.open(b, { hash: '#c=' + tok, data: { ['cards/' + tok]: card({ lastVisit: { d: day(-10), ev: '10月のDAY' } }) } });
    const t = await o.ev(`document.getElementById('nwArea').innerText`);
    c('8日以上前の来場のお礼は出さない・次のDAYもお知らせもない時は、案内（と v129 の通知の設定）だけ', !/ご来場/.test(t) && !/次のDAY/.test(t) && !/・ お知らせ/.test(t) && /ホーム画面に追加/.test(t), t);
    await o.ctx.close();
    const o2 = await P.open(b, { hash: '#c=' + tok, data: Object.assign({ ['cards/' + tok]: card({ toMember: 'P0006', toCard: 'feed' }) }, evs) });
    c('研修生になったユーザーのカードには出ない', (await o2.ev(`document.getElementById('nwArea').innerHTML`)) === '');
    await o2.ctx.close();
    const o3 = await P.open(b, { hash: '#c=tokM', data: Object.assign({ 'cards/tokM': { no: 'ZZ0001', name: '架空 太郎', union: 'ANTARES', active: true } }, evs) });
    c('ビジネスの会員証には出ない', (await o3.ev(`document.getElementById('nwArea').innerHTML`)) === '' && !o3.errs.length);
    await o3.ctx.close();
  }
  // ③ スタッフ：お知らせを送る・イベントの「次のDAYとして出す」・受付で来場のお礼
  {
    const T = day(0);
    const data = { 'checkinUnions/GRANT': { name: 'GRANT', unionAdmins: [OWNER] }, 'checkinEvents/evG': { date: T, month: T.slice(0, 7), name: '12月のDAY', hostUnion: 'GRANT', unions: ['GRANT'] },
      'checkinUsers/u1': { uid: 'u1', name: '見本 はなこ', union: 'GRANT', referrer: '架空 太郎', active: true, visits: 1, lastAt: 1, cardToken: tok } };
    const { ctx, page, ev, wt, errs } = await P.open(b, { expose: true, data });
    await ev(`(function(){ var x=document.getElementById('gxHintOk'); if(x) x.click(); })()`);
    await ev(`document.querySelector('nav button[data-pane="pRoster"]').click()`); await wt(600);
    c('ビジネスの名簿では「ユーザーにお知らせ」は出ない', (await ev(`document.getElementById('btnUserNotice').classList.contains('hide')`)) === true);
    await ev(`document.querySelector('#rosterKind button[data-k="user"]').click()`); await wt(500);
    c('ユーザーの名簿に「📣 ユーザーにお知らせ」', (await ev(`document.getElementById('btnUserNotice').classList.contains('hide')`)) === false);
    await ev(`document.getElementById('btnUserNotice').click()`); await wt(400);
    await ev(`(function(){ document.getElementById('unText').value='12月のDAYは、14時からの開始です。'; document.getElementById('unGo').click(); })()`); await wt(300);
    await ev(`(function(){ document.getElementById('unText').value='2つ目のお知らせ'; document.getElementById('unGo').click(); })()`); await wt(300);
    let n = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['ckNotice/GRANT']||null)`));
    c('送ると、そのユニオンのお知らせに入る（新しい順・日付・送った人）', n && n.items.length === 2 && n.items[0].t === '2つ目のお知らせ' && n.items[0].d === T && n.by === OWNER, JSON.stringify(n));
    await page.screenshot({ path: OUT + '/ckns128_notice.png' });
    await ev(`document.querySelector('#unList button[data-del="0"]').click()`); await wt(300);
    n = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['ckNotice/GRANT'])`));
    c('「消す」で消える', n.items.length === 1 && /14時/.test(n.items[0].t), JSON.stringify(n));
    await ev(`document.getElementById('unCancel').click()`);
    // イベントの編集
    await ev(`document.querySelector('nav button[data-pane="pEvents"]').click()`); await wt(800);
    await ev(`document.querySelector('#evList button[data-a="editev"]').click()`); await wt(500);
    c('イベントの編集に「💜 ユーザーのカードに次のDAYとして出す」', !!(await ev(`!!document.getElementById('evUDay')`)) && (await ev(`document.getElementById('rowUDay').classList.contains('hide')`)) === true);
    await ev(`(function(){ var x=document.getElementById('evUDay'); x.checked=true; x.onchange(); document.getElementById('evUInfo').value='13:00〜 見本ホール'; document.getElementById('evSave').click(); })()`); await wt(600);
    const e = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['checkinEvents/evG'])`));
    c('保存すると uDay・uInfo が入る', e.uDay === true && e.uInfo === '13:00〜 見本ホール', JSON.stringify(e));
    c('ページのエラーなし（スタッフ）', !errs.length, errs.join(' / '));
    await ctx.close();
  }
  // ④ 受付でユーザーを登録・受付すると、カードに来場の日（lastVisit）が入る（練習モード）
  {
    const { ctx, ev, wt, errs } = await P.open(b, { expose: true, data: { 'checkinUnions/GRANT': { name: 'GRANT', unionAdmins: [OWNER] } } });
    await ev('window.__ck.practiceStart()'); await wt(1500);
    await ev(`[].forEach.call(document.querySelectorAll('button'),function(b){ if(/^OK/.test(b.textContent.trim()) && b.offsetParent) b.click(); })`);
    await ev(`document.getElementById('btnGuest').click()`); await wt();
    await ev(`(function(){ document.getElementById('gName').value='見本 みどり'; var c=document.getElementById('gAsUser'); c.checked=true; c.onchange(); document.getElementById('gRef').value='ジェッ子 ちゃん'; document.getElementById('gGo').click(); })()`); await wt(600);
    const r = JSON.parse(await ev(`(function(){ var r=window.__ck.rec(); var id=Object.keys(r.att).filter(function(x){ return r.att[x].kind==='user'; })[0]; return window.__ck.db().collection('cards').doc(r.att[id].cardToken).get().then(function(s){ return JSON.stringify({ c: s.data(), d: r.ev.date }); }); })()`));
    c('ユーザー登録した時、カードに来場の日', r.c.lastVisit && r.c.lastVisit.d === r.d, JSON.stringify(r.c));
    c('ページのエラーなし（受付）', !errs.length, errs.join(' / '));
    await ctx.close();
  }
  // ⑤ 確認メンバーでない人には、お知らせのボタンもイベントの項目も出ない
  {
    const d = { 'checkinUnions/ANTARES': { name: 'ANTARES', unionAdmins: ['adm1'] },
      'users/adm1': { name: '見本 管理', union: 'ANTARES', unionSelectedV2: true, status: 'active', email: 'adm1@example.com', privacy: { ver: '2026-10', at: '2026-10-01T00:00:00Z' } },
      'checkinEvents/evN': { date: day(0), month: day(0).slice(0, 7), name: '12月のDAY', hostUnion: 'ANTARES', unions: ['ANTARES'] } };
    const { ctx, ev, wt, errs } = await P.open(b, { uid: 'adm1', data: d });
    await ev(`document.querySelector('nav button[data-pane="pRoster"]').click()`); await wt(600);
    c('確認メンバーでない人：「ユーザーにお知らせ」は出ない', (await ev(`document.getElementById('btnUserNotice').classList.contains('hide')`)) === true);
    await ev(`document.querySelector('nav button[data-pane="pEvents"]').click()`); await wt(800);
    await ev(`document.querySelector('#evList button[data-a="editev"]').click()`); await wt(500);
    c('確認メンバーでない人：イベントの編集に「次のDAYとして出す」は出ない', !!(await ev(`!!document.getElementById('evNoStat')`)) && !(await ev(`!!document.getElementById('evUDay')`)));
    c('ページのエラーなし（確認メンバーでない人）', !errs.length, errs.join(' / '));
    await ctx.close();
  }
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
