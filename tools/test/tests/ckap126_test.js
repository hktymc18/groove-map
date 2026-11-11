// 受付 v126：ユーザーの申し込み（NAVIGATOR Beauty・準備中）。会場のQR／紹介者のQR → 本人が申し込み → 受付票 →
//   受付で受付票を1回読む → 登録して受付 → 本人の画面がカードに変わる（架空データ・練習モード）
const path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const pad = n => (n < 10 ? '0' : '') + n, ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const TODAY = ymd(new Date());
(async () => {
  const b = await P.browser();
  const venue = { 'ckJoin/v_evA': { kind: 'venue', union: 'ANTARES', evId: 'evA' }, 'checkinEvents/evA': { date: TODAY, name: '12月のDAY', hostUnion: 'ANTARES', unions: ['ANTARES'] } };
  let app = null, appId = '';
  // ① 会場のQRから本人が申し込む
  for (const dark of [false, true]) {
    const { ctx, page, ev, wt, errs } = await P.open(b, { dark, hash: '#uj=v_evA', data: Object.assign({}, venue) });
    const t0 = await ev(`document.getElementById('joinBox').innerText`);
    c('申し込みページ：ユニオンとイベントが出る' + (dark ? '（ダーク）' : ''), /はじめての方の申し込み/.test(t0) && /ANTARES/.test(t0) && /12月のDAY/.test(t0) && !!(await ev(`!!document.getElementById('jnRef')`)), t0);
    c('ログイン画面や受付の画面は出ない', (await ev(`document.getElementById('vLogin').classList.contains('hide') && document.getElementById('vApp').classList.contains('hide')`)) === true);
    await page.screenshot({ path: OUT + '/ckap126_form' + (dark ? '_d' : '') + '.png', fullPage: true });
    if (!dark) {
      await ev(`document.getElementById('jnGo').click()`); await wt(200);
      c('名前がないと申し込めない', /お名前を入れて/.test(await ev(`document.getElementById('jnErr').textContent`)));
      await ev(`(function(){ document.getElementById('jnName').value='見本  みどり'; document.getElementById('jnGo').click(); })()`); await wt(200);
      c('同意がないと申し込めない', /同意/.test(await ev(`document.getElementById('jnErr').textContent`)));
      await ev(`(function(){ document.getElementById('jnKana').value='みほん みどり'; document.getElementById('jnRef').value='ジェッ子 ちゃん'; document.getElementById('jnOk').checked=true; document.getElementById('jnGo').click(); })()`); await wt(500);
      appId = await ev(`(location.hash.match(/ua=([a-z0-9]{24})/)||[])[1]||''`);
      app = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['ckApply/${appId}']||null)`) || 'null');
      c('申し込むと受付票のページになる（キー24文字）', /^[a-z0-9]{24}$/.test(appId), await ev('location.hash'));
      c('申し込みの中身（名前・ふりがな・紹介者・入口・イベント・同意・待ち）', app && app.name === '見本 みどり' && app.kana === 'みほん みどり' && app.refName === 'ジェッ子 ちゃん' && app.refNo === '' && app.join === 'v_evA' && app.evId === 'evA' && app.union === 'ANTARES' && app.ok === true && app.st === 'wait', JSON.stringify(app));
      const t1 = await ev(`document.getElementById('joinBox').innerText`);
      c('受付票：名前・受付で見せる案内・カードに変わる案内', /見本 みどり さん/.test(t1) && /受付でこの画面を見せて/.test(t1) && /カードに変わります/.test(t1), t1);
      c('受付票に紹介者の名前は出さない（v137）', !/紹介/.test(t1) && !/ジェッ子/.test(t1), t1);
      c('受付票のQRは "ua:キー"', (await ev(`document.getElementById('jnQr').getAttribute('data-qr')`)) === 'ua:' + appId);
      c('横にはみ出さない', (await ev(`document.documentElement.scrollWidth`)) === 390);
      await page.screenshot({ path: OUT + '/ckap126_ticket.png', fullPage: true });
      // 同じスマホで入口を開き直すと、同じ受付票が出る（二重に申し込まない）
      // 読み込み直すとスタブのデータが初めに戻るので、申し込みを足しておく（本物ではサーバーに残っている）
      await page.addInitScript(d => { window.__FBDATA = Object.assign(window.__FBDATA || {}, d); }, { ['ckApply/' + appId]: app });
      await page.goto('https://hktymc18.github.io/groove-map/checkin/index.html#uj=v_evA'); await page.reload(); await wt(1500);
      c('入口を開き直すと同じ受付票', (await ev(`document.getElementById('jnQr') && document.getElementById('jnQr').getAttribute('data-qr')`)) === 'ua:' + appId);
      await ev(`document.getElementById('jnOther').click()`); await wt(500);
      c('「別の人が、このスマホで申し込む」で申し込みページに戻る', !!(await ev(`!!document.getElementById('jnName')`)) && /uj=v_evA/.test(await ev('location.hash')));
    } else {
      await ev(`(function(){ document.getElementById('jnName').value='見本 みどり'; document.getElementById('jnOk').checked=true; document.getElementById('jnGo').click(); })()`); await wt(500);
      await page.screenshot({ path: OUT + '/ckap126_ticket_d.png', fullPage: true });
    }
    c('エラーなし（申し込み）' + (dark ? '（ダーク）' : ''), !errs.length, errs.join('/'));
    await ctx.close();
  }
  // 終わったイベント・ない入口
  {
    const o = await P.open(b, { hash: '#uj=v_evOld', data: { 'ckJoin/v_evOld': { kind: 'venue', union: 'ANTARES', evId: 'evOld' }, 'checkinEvents/evOld': { date: '2026-01-01', name: '古い', unions: ['ANTARES'] } } });
    c('終わったイベントの会場QRは使えない', /申し込みは終わりました/.test(await o.ev(`document.getElementById('joinBox').innerText`)));
    await o.ctx.close();
    const o2 = await P.open(b, { hash: '#uj=v_nope', data: {} });
    c('ない入口は「このQRは使えません」', /このQRは使えません/.test(await o2.ev(`document.getElementById('joinBox').innerText`)));
    await o2.ctx.close();
  }
  // ② 受付で受付票を読む（練習モード）
  let tok = '', uid = '';
  {
    const { ctx, page, errs, ev, wt } = await P.open(b, { expose: true, data: { 'checkinUnions/GRANT': { name: 'GRANT', unionAdmins: ['j2DPDAccCygHmR9i5K3bTvHnH0V2'] } } });
    await ev('window.__ck.practiceStart()'); await wt(1500);
    await ev(`[].forEach.call(document.querySelectorAll('button'),function(b){ if(/^OK/.test(b.textContent.trim()) && b.offsetParent) b.click(); })`);
    const un = await ev(`window.__ck.rec().ev.unions[0]`);
    const seed = (id, x) => ev(`window.__ck.db().collection('ckApply').doc('${id}').set(${JSON.stringify(Object.assign({}, app, { union: un }, x || {}))})`);
    await seed(appId, { at: Date.now() });
    await ev(`window.__ck.scan('ua:${appId}', 'scan')`); await wt(500);
    const m = await ev(`document.querySelector('.modal') ? document.querySelector('.modal').innerText : ''`);
    c('受付票を読むと、確かめる画面（名前・紹介者が名簿にいる・ユニオン・参加費）', /NAVIGATOR Beauty 新規登録/.test(m) && !/ユーザー|ビジネスメンバー/.test(m) && (await ev(`document.getElementById('apName').value`)) === '見本 みどり' && /名簿にいます（P004）/.test(m) && /参加費/.test(m), m);
    await page.screenshot({ path: OUT + '/ckap126_desk.png' });
    await ev(`document.getElementById('apGo').click()`); await wt(800);
    const st = JSON.parse(await ev(`(function(){ var r=window.__ck.rec(); var ids=Object.keys(r.att).filter(function(x){ return r.att[x].kind==='user'; }); return window.__ck.db().collection('ckApply').doc('${appId}').get().then(function(s){ var a=s.data(); return window.__ck.db().collection('checkinUsers').doc(a.uid||'x').get().then(function(u){ return JSON.stringify({ ids: ids, att: r.att[ids[0]]||null, a: a, u: u.exists ? u.data() : null, stage: document.getElementById('stageBody').innerText }); }); }); })()`));
    tok = st.a.tok; uid = st.a.uid;
    c('登録して受付：ユーザーが1人・出席（申し込み）', st.ids.length === 1 && st.att && st.att.method === 'apply' && st.att.name === '見本 みどり', JSON.stringify(st.att));
    c('ユーザーの名簿に入る（紹介者の番号つき）', st.u && st.u.name === '見本 みどり' && st.u.referrer === 'ジェッ子 ちゃん' && st.u.referrerNo === 'P004' && st.u.union === un, JSON.stringify(st.u));
    c('申し込みが done になり、本人のカードが入る', st.a.st === 'done' && /^[0-9a-f]{32}$/.test(tok || '') && st.a.uid === st.ids[0] && st.a.refNo === 'P004', JSON.stringify(st.a));
    c('受付の画面：本人の受付票がカードに変わる案内', /受付票が、そのままカードに変わります/.test(st.stage), st.stage);
    await page.screenshot({ path: OUT + '/ckap126_done.png' });
    await ev(`window.__ck.scan('ua:${appId}', 'scan')`); await wt(500);
    const n2 = await ev(`Object.keys(window.__ck.rec().att).filter(function(x){ return window.__ck.rec().att[x].kind==='user'; }).length`);
    c('同じ受付票をもう一度読んでも二重にならない（出席済み）', n2 === 1 && /出席済み/.test(await ev(`document.getElementById('stageBody').innerText`)));
    const ago15 = Date.now() - 15 * 864e5;
    await seed('oldoldoldoldoldoldoldold', { at: ago15 });
    await ev(`window.__ck.scan('ua:oldoldoldoldoldoldoldold', 'scan')`); await wt(400);
    c('14日を過ぎた受付票は使えない', /使えなくなった受付票/.test(await ev(`document.getElementById('stageBody').innerText`)));
    await ev(`window.__ck.scan('ua:zzzzzzzzzzzzzzzzzzzzzzzz', 'scan')`); await wt(400);
    c('ない受付票は「見つからない受付票」', /見つからない受付票/.test(await ev(`document.getElementById('stageBody').innerText`)));
    await ev(`window.__ck.scan('https://hktymc18.github.io/groove-map/checkin/index.html#uj=v_evA', 'scan')`); await wt(300);
    c('申し込み用のQRを受付で読むと案内が出る', /申し込み用のQRです/.test(await ev(`document.getElementById('stageBody').innerText`)));
    // 会場のQRから来て紹介者が空 → 受付で入れる
    await seed('blankblankblankblankblan', { at: Date.now(), refName: '' });
    await ev(`window.__ck.scan('ua:blankblankblankblankblan', 'scan')`); await wt(400);
    await ev(`document.getElementById('apGo').click()`); await wt(200);
    c('紹介者が空のままでは登録しない', /紹介者を入れて/.test(await ev(`document.getElementById('toast').textContent`)) && !!(await ev(`!!document.getElementById('apGo')`)));
    await ev(`document.getElementById('apCancel').click()`);
    c('ページのエラーなし（受付）', !errs.length, errs.join(' / '));
    await ctx.close();
  }
  // ③ 本人の受付票：受付で登録されたら、カードに変わる
  {
    const done = Object.assign({}, app, { st: 'done', tok: tok, uid: uid });
    const data = { ['ckApply/' + appId]: done, ['cards/' + tok]: { kind: 'user', no: uid, name: '見本 みどり', union: 'ANTARES', referrer: 'ジェッ子 ちゃん', active: true, visits: 1 } };
    const { ctx, page, ev, wt, errs } = await P.open(b, { hash: '#ua=' + appId, data, wait: 2600 });
    c('受付が終わった受付票を開くと、本人のカードになる', (await ev(`location.hash`)) === '#c=' + tok && !(await ev(`document.getElementById('vCard').classList.contains('hide')`)) && /見本 みどり/.test(await ev(`document.getElementById('mcName').textContent`)), await ev('location.hash'));
    await page.screenshot({ path: OUT + '/ckap126_card.png', fullPage: true });
    c('エラーなし（カードに変わる）', !errs.length, errs.join('/'));
    await ctx.close();
  }
  // ④ 紹介者のQR（ビジネスメンバーの会員証から）
  {
    const tm = '0123456789abcdef0123456789abcdef';
    const mem = { ['cards/' + tm]: { no: 'ZZ0001', name: '架空 太郎', union: 'ANTARES', active: true } };
    const o0 = await P.open(b, { hash: '#c=' + tm, data: Object.assign({}, mem) });
    c('指定していない会員証には「INVITATION」が出ない', (await o0.ev(`document.getElementById('uiArea').innerHTML`)) === '');
    await o0.ctx.close();
    const { ctx, page, ev, wt, errs } = await P.open(b, { hash: '#c=' + tm, data: Object.assign({ 'checkinConfig/beauty': { testers: [], cardNos: ['zz0001'] } }, mem) });
    c('指定した会員番号の会員証に「INVITATION」（v137：「ユーザーを招待」から）', /INVITATION/.test(await ev(`document.getElementById('uiArea').innerText`)) && !/ユーザー/.test(await ev(`document.getElementById('uiArea').innerText`)));
    await ev(`document.getElementById('uiOpen').click()`); await wt(500);
    const k = await ev(`(window.__FBDATA['cards/${tm}/join/me']||{}).k||''`);
    const j = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['ckJoin/' + (window.__FBDATA['cards/${tm}/join/me']||{}).k]||null)`));
    c('押すと紹介者のQRができる（会員証にキー・入口に紹介者）', /^r_[a-z0-9]{20}$/.test(k) && j && j.kind === 'ref' && j.refNo === 'ZZ0001' && j.refName === '架空 太郎' && j.union === 'ANTARES', k + ' ' + JSON.stringify(j));
    c('QRは申し込みページのURL', (await ev(`document.getElementById('uiQr').getAttribute('data-qr')`)) === 'https://hktymc18.github.io/groove-map/checkin/index.html#uj=' + k);
    const pm = await ev(`document.querySelector('.modal').innerText`);
    c('INVITATION のQRの画面：「○○ さんの紹介」は出さない（v137）', /INVITATION/.test(pm) && /はじめての方はこちら/.test(await ev(`document.querySelector('.modal .jv-poster').innerText`)) && !/さんの紹介/.test(pm) && !/架空 太郎/.test(await ev(`document.querySelector('.modal .jv-poster').innerText`)), pm);
    await page.screenshot({ path: OUT + '/ckap126_invite.png', fullPage: true });
    await ev(`document.getElementById('uiClose').click()`);
    await ev(`document.getElementById('uiOpen').click()`); await wt(400);
    c('2回目も同じキー（作り直さない）', (await ev(`(window.__FBDATA['cards/${tm}/join/me']||{}).k`)) === k && (await ev(`Object.keys(window.__FBDATA).filter(function(x){ return x.indexOf('ckJoin/r_')===0; }).length`)) === 1);
    c('エラーなし（会員証）', !errs.length, errs.join('/'));
    await ctx.close();
    // 紹介者のQRから申し込む
    const o = await P.open(b, { hash: '#uj=' + k, data: { ['ckJoin/' + k]: j } });
    const t = await o.ev(`document.getElementById('joinBox').innerText`);
    c('紹介者のQRの申し込みページ：紹介者が出て、紹介者の欄はない', /紹介：架空 太郎 さん/.test(t) && !(await o.ev(`!!document.getElementById('jnRef')`)), t);
    await o.ev(`(function(){ document.getElementById('jnName').value='見本 さくら'; document.getElementById('jnOk').checked=true; document.getElementById('jnGo').click(); })()`); await o.wt(500);
    const id2 = await o.ev(`(location.hash.match(/ua=([a-z0-9]{24})/)||[])[1]||''`);
    const a2 = JSON.parse(await o.ev(`JSON.stringify(window.__FBDATA['ckApply/${id2}']||null)`));
    c('紹介者のQRからの申し込み：紹介者の番号と名前が入る・イベントなし', a2 && a2.refNo === 'ZZ0001' && a2.refName === '架空 太郎' && a2.evId === '' && a2.join === k, JSON.stringify(a2));
    c('エラーなし（紹介者のQRから申し込み）', !o.errs.length, o.errs.join('/'));
    await o.ctx.close();
    // ユーザーのカードには出ない
    const ou = await P.open(b, { hash: '#c=' + tok, data: { 'checkinConfig/beauty': { cardNos: [uid] }, ['cards/' + tok]: { kind: 'user', no: uid, name: '見本 みどり', union: 'ANTARES', active: true } } });
    c('ユーザーのカードには「INVITATION」が出ない', (await ou.ev(`document.getElementById('uiArea').innerHTML`)) === '');
    await ou.ctx.close();
  }
  // ⑤ イベントの一覧の「💜 申し込みQR」・確認メンバーの画面の会員番号
  {
    const OWNER = 'j2DPDAccCygHmR9i5K3bTvHnH0V2';
    const data = { 'checkinUnions/GRANT': { name: 'GRANT', unionAdmins: [OWNER] }, 'checkinEvents/evG': { date: TODAY, month: TODAY.slice(0, 7), name: '12月のDAY', hostUnion: 'GRANT', unions: ['GRANT'] }, 'checkinConfig/beauty': { testers: [], cardNos: ['ZZ0001'] } };
    const { ctx, page, ev, wt, errs } = await P.open(b, { expose: true, data });
    await ev(`(function(){ var x=document.getElementById('gxHintOk'); if(x) x.click(); })()`);
    await ev(`document.querySelector('nav button[data-pane="pEvents"]').click()`); await wt(800);
    const has = await ev(`!!document.querySelector('#evList button[data-a="ujqr"]')`);
    c('イベントの一覧に「💜 申し込みQR」（オーナー・今日以降）', has);
    if (has) {
      await ev(`document.querySelector('#evList button[data-a="ujqr"]').click()`); await wt(500);
      const j = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['ckJoin/v_evG']||null)`));
      c('押すと会場のQRの入口ができる', j && j.kind === 'venue' && j.union === 'GRANT' && j.evId === 'evG' && j.by === OWNER, JSON.stringify(j));
      c('会場のQRは申し込みページのURL', (await ev(`document.getElementById('jvQr').getAttribute('data-qr')`)) === 'https://hktymc18.github.io/groove-map/checkin/index.html#uj=v_evG');
      await page.screenshot({ path: OUT + '/ckap126_venue.png' });
      await ev(`document.getElementById('jvClose').click()`);
    }
    await ev(`document.querySelector('nav button[data-pane="pRoster"]').click()`); await wt(600);
    await ev(`document.getElementById('btnBeautyTesters').click()`); await wt(500);
    c('確認メンバーの画面に、今の会員番号', /ZZ0001/.test(await ev(`document.getElementById('caNos').value`)));
    await ev(`(function(){ document.getElementById('caNos').value='zz0001, ANT0012\\nANT0012'; document.getElementById('caSave').click(); })()`); await wt(400);
    const cfg = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['checkinConfig/beauty'])`));
    c('保存すると会員番号（大文字・重なりなし）も入る', JSON.stringify(cfg.cardNos) === '["ZZ0001","ANT0012"]' && Array.isArray(cfg.testers), JSON.stringify(cfg));
    c('ページのエラーなし（イベント・確認メンバー）', !errs.length, errs.join(' / '));
    await ctx.close();
  }
  // ⑥ 確認メンバーでない人（ユニオン管理者）には出ない・受付票も使えない
  {
    const d = { 'checkinUnions/ANTARES': { name: 'ANTARES', unionAdmins: ['adm1'] },
      'users/adm1': { name: '見本 管理', union: 'ANTARES', unionSelectedV2: true, status: 'active', email: 'adm1@example.com', privacy: { ver: '2026-10', at: '2026-10-01T00:00:00Z' } },
      'checkinEvents/evN': { date: TODAY, month: TODAY.slice(0, 7), name: '12月のDAY', hostUnion: 'ANTARES', unions: ['ANTARES'] } };
    const { ctx, ev, wt, errs } = await P.open(b, { uid: 'adm1', expose: true, data: d });
    await ev(`document.querySelector('nav button[data-pane="pEvents"]').click()`); await wt(800);
    c('確認メンバーでない人：イベントの一覧に「申し込みQR」が出ない', (await ev(`document.querySelectorAll('#evList .evrow').length`)) > 0 && !(await ev(`!!document.querySelector('#evList button[data-a="ujqr"]')`)));
    await ev('window.__ck.practiceStart()'); await wt(1500);
    await ev(`[].forEach.call(document.querySelectorAll('button'),function(b){ if(/^OK/.test(b.textContent.trim()) && b.offsetParent) b.click(); })`);
    await ev(`window.__ck.scan('ua:${appId}', 'scan')`); await wt(400);
    c('確認メンバーでない人：受付票を読んでも「まだ使えない受付票です」', /まだ使えない受付票/.test(await ev(`document.getElementById('stageBody').innerText`)) && !(await ev(`!!document.getElementById('apGo')`)));
    c('ページのエラーなし（確認メンバーでない人）', !errs.length, errs.join(' / '));
    await ctx.close();
  }
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
