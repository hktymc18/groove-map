// 受付 v117：ユーザー（ビジネスではないお客さま）。ゲスト受付から登録 → ユーザーQR → 次からQRで受付・名簿の「ビジネス｜ユーザー」。
//   ユーザーの出席は union を空にして uUnion に入れる＝ユニオンの稼働率・NAVIGATORの稼働に入らない（架空データ・練習モードで操作）
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '../../..');
const H = fs.readFileSync(R + '/checkin/index.html', 'utf8');
const { JSDOM } = require(path.join(__dirname, '../node_modules/jsdom'));
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const pick = re => { const m = H.match(re); if (!m) throw new Error('not found ' + re); return m[0]; };
(async () => {
  // ── しくみ（jsdom）──
  const W = new JSDOM('<div id="x"></div>', { runScripts: 'outside-only' }).window;
  W.eval([pick(/function ckIsUserAtt\(a\)\{[^\n]*\}/), pick(/function ckNewUserId\(\)\{[\s\S]*?\n\}/), pick(/function ckUserQrText\(uid, token\)\{[^\n]*\}/)].join('\n'));
  const id = W.ckNewUserId();
  c('ユーザーのIDは u＋数字だけ（IMEで化けにくい・名簿の番号と重ならない）', /^u\d{17}$/.test(id), id);
  c('IDは毎回ちがう', W.ckNewUserId() !== W.ckNewUserId());
  c('ユーザーQRは u:ID:トークンの先頭6文字（URLのトークンそのものは出さない）', W.ckUserQrText(id, 'abcdef0123456789') === 'u:' + id + ':abcdef');
  c('ユーザーかどうか', W.ckIsUserAtt({ kind: 'user' }) && !W.ckIsUserAtt({ guest: true }) && !W.ckIsUserAtt(null));
  const re = new RegExp(pick(/var um = \/[^\n]*?\/i\.exec/).replace(/^var um = \//, '').replace(/\/i\.exec$/, ''), 'i');
  c('読み取り: u:ID:署名', (re.exec('u:' + id + ':abcdef') || [])[1] === id);
  c('読み取り: 区切りが ; + に化けても読める', (re.exec('u;' + id + '+abcdef') || [])[1] === id);
  c('読み取り: 会員証の m: は読まない', !re.exec('m:ZZ0001:abcdef'));
  c('読み取りは会員証の形より先', H.indexOf('var um = /^u[') > 0 && H.indexOf('var um = /^u[') < H.indexOf('var mm = /^m[:;+]'));
  c('出席の記録: union は空・uUnion にユニオン・kind user（稼働率の検索 where union==… に入らない）',
    /var d = \{ no: uid, name: u\.name \|\| '', group: 'ユーザー', union: '', uUnion: u\.union \|\| '', kind: 'user',/.test(H));
  c('領収書はユーザーのカードへ', /var tok = \(m && m\.cardToken\) \|\| \(ckIsUserAtt\(a\) && a\.cardToken\) \|\| \(a && a\.rcptToken\) \|\| '';/.test(H));
  c('カード: kind user はユーザーのカード', /if\(c\.kind === 'user'\)\{ ckRenderUserCard\(c, card, brand\); return; \}/.test(H));
  c('練習モードの仮のDBも FV.increment に対応', /increment: function\(n\)\{ return \{ __pxInc: n \}; \}/.test(H));
  c('APP_VER v117以降・v117のお知らせ', (+(H.match(/var APP_VER = 'v(\d+)';/) || [0, 0])[1]) >= 117 && /\n  \{ v: 'v117', d: '2026\/11\/03', items: \['💜/.test(H));

  // ── 実際の操作（Chromium・練習モード・Firebaseはスタブ）──
  const PW = '/opt/node22/lib/node_modules/playwright';
  const { chromium } = require(fs.existsSync(PW) ? PW : 'playwright');
  const ST = R + '/tools/test/shot', OUT = path.join(__dirname, '../out'); fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  for (const dark of [false, true]) {
    const ctx = await b.newContext({ serviceWorkers: 'block', colorScheme: dark ? 'dark' : 'light', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage(), errs = [];
    page.on('pageerror', e => errs.push(e.message));
    page.on('dialog', d => d.accept());
    await page.addInitScript(() => { window.__FBDATA = { 'checkinUnions/ANTARES': { name: 'ANTARES', unionAdmins: ['j2DPDAccCygHmR9i5K3bTvHnH0V2'] } }; });
    await page.route('**/*', async (route) => {
      const u = route.request().url();
      if (u.indexOf('firebase-app-compat.js') >= 0) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(ST + '/fbstub.js', 'utf8') });
      if (u.indexOf('firebasejs') >= 0) return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
      if (u.indexOf('qrcode.min.js') >= 0) return route.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.QRCode=function(el,o){el.setAttribute("data-qr",o.text);el.innerHTML="<div style=\\"width:"+o.width+"px;height:"+o.height+"px;background:repeating-conic-gradient(#000 0 25%,#fff 0 50%) 0 0/12px 12px\\"></div>";};window.QRCode.CorrectLevel={L:1,M:0,Q:3,H:2};' });
      const m = u.match(/\/groove-map\/checkin\/([\w./-]*)/);
      if (m) { const f = R + '/checkin/' + (m[1].split('?')[0] || 'index.html'); if (fs.existsSync(f) && fs.statSync(f).isFile()) return route.fulfill({ status: 200, body: /index\.html$/.test(f) ? fs.readFileSync(f, 'utf8').replace(/\n\}\)\(\);\n<\/script>\s*<\/body>/, '\nwindow.__ck = { practiceStart: practiceStart, scan: scan, rec: function(){ return gRec; }, db: function(){ return db; } };\n})();\n</script></body>') : fs.readFileSync(f), contentType: /\.html$/.test(f) ? 'text/html; charset=utf-8' : 'application/octet-stream' }); }
      return route.fulfill({ status: 404, body: '' });
    });
    await page.goto('https://hktymc18.github.io/groove-map/checkin/index.html');
    await page.waitForTimeout(1800);
    const ev = s => page.evaluate(s), wt = n => page.waitForTimeout(n || 350);
    const sfx = dark ? '_d' : '';
    const shot = async n => { await wt(300); await page.screenshot({ path: OUT + '/ckusr117_' + n + sfx + '.png' }); };
    await ev('window.__ck.practiceStart()'); await wt(1500);
    await ev(`[].forEach.call(document.querySelectorAll('button'),function(b){ if(/^OK/.test(b.textContent.trim()) && b.offsetParent) b.click(); })`);
    await ev(`document.getElementById('btnGuest').click()`); await wt();
    const f0 = JSON.parse(await ev(`JSON.stringify({box:document.getElementById('gUserBox').classList.contains('hide'), go:document.getElementById('gGo').textContent})`));
    c('ゲスト受付: ふだんはユーザーの欄は閉じている', f0.box && f0.go === '受付');
    await ev(`(function(){ document.getElementById('gName').value='見本 はなこ'; var c=document.getElementById('gAsUser'); c.checked=true; c.onchange(); })()`);
    const f1 = JSON.parse(await ev(`JSON.stringify({box:document.getElementById('gUserBox').classList.contains('hide'), grp:document.getElementById('gGroupBox').classList.contains('hide'), go:document.getElementById('gGo').textContent, opts:[].map.call(document.querySelectorAll('#gRefList option'),function(o){return o.value;})})`));
    c('チェックすると紹介者の欄（系列の欄はしまう）', !f1.box && f1.grp && f1.go === 'ユーザー登録して受付');
    c('紹介者の候補はそのユニオンの有効なメンバー（無効の人は出ない）', f1.opts.length === 4 && f1.opts.indexOf('お休み 三郎') < 0, JSON.stringify(f1.opts));
    await ev(`document.getElementById('gRef').value=''; document.getElementById('gGo').click()`); await wt(200);
    c('紹介者が空なら登録しない', !!(await ev(`!!document.getElementById('gName')`)));
    await ev(`document.getElementById('gRef').value='ジェッ子 ちゃん'`);
    await shot('guest');
    await ev(`document.getElementById('gGo').click()`); await wt(500);
    const r1 = JSON.parse(await ev(`(function(){ var r=window.__ck.rec(), k=Object.keys(r.att).filter(function(x){ return r.att[x].kind==='user'; })[0], a=r.att[k]||{};
      return JSON.stringify({k:k, a:a, stage:document.getElementById('stageBody').innerText, total:document.getElementById('total').textContent, sub:document.getElementById('totalSub').textContent, recent:document.getElementById('recent').innerText, ut:document.getElementById('unionTally').innerText, gt:document.getElementById('groupTally').innerText}); })()`));
    c('出席に入る（union は空・uUnion・紹介者・カードのトークン）', r1.k && r1.a.union === '' && r1.a.uUnion === 'ANTARES' && r1.a.referrer === 'ジェッ子 ちゃん' && r1.a.referrerNo === undefined && /^[0-9a-f]{32}$/.test(r1.a.cardToken), JSON.stringify(r1.a));
    c('料金はゲストと同じ（この練習イベントは¥1,000）', r1.a.fee === 1000 && r1.a.paid === true);
    c('画面: 出席（ユーザー登録）・紹介者・QRを渡すボタン', /出席（ユーザー登録）/.test(r1.stage) && /紹介: ジェッ子 ちゃん/.test(r1.stage) && /ユーザーQRを渡す/.test(r1.stage), r1.stage);
    c('人数に入り「うちユーザー 1」・履歴は「ユーザー」', r1.total === '1' && /うちユーザー 1/.test(r1.sub) && /ユーザー/.test(r1.recent));
    c('ユニオン別は「ユーザー」・系列別には入らない', /ユーザー/.test(r1.ut) && !/ユーザー/.test(r1.gt), r1.ut + ' / ' + r1.gt);
    const dbs = JSON.parse(await ev(`(function(){ var d=window.__ck.db(), k=${JSON.stringify(r1.k)}, t=${JSON.stringify(r1.a.cardToken)}, o={};
      return Promise.all([d.collection('checkinUsers').doc(k).get(), d.collection('cards').doc(t).get(), d.collection('cardClaims').doc(k).get(), d.collection('checkinMembers').doc(k).get()]).then(function(s){ return JSON.stringify(s.map(function(x){ return x.exists ? x.data() : null; })); }); })()`));
    c('ユーザーの名簿（checkinUsers）に入る', dbs[0] && dbs[0].name === '見本 はなこ' && dbs[0].union === 'ANTARES' && dbs[0].visits === 1 && dbs[0].cardToken === r1.a.cardToken && dbs[0].referrerNo === 'P004', JSON.stringify(dbs[0]));
    c('カード（kind user）と 番号→カード ができる', dbs[1] && dbs[1].kind === 'user' && dbs[1].no === r1.k && dbs[2] && dbs[2].t === r1.a.cardToken);
    c('ビジネスの名簿（checkinMembers）には入らない', dbs[3] === null);
    await shot('stage');
    await ev(`document.getElementById('stgUserQr').click()`); await wt();
    c('ユーザーQR: 本人のスマホで開くカードのURL', (await ev(`document.getElementById('uqQr').getAttribute('data-qr')`)) === 'https://hktymc18.github.io/groove-map/checkin/index.html#c=' + r1.a.cardToken);
    await shot('qr');
    await ev(`document.getElementById('uqClose').click()`);
    // 同じ人のQRをもう一度 → 出席済み
    const qr = 'u:' + r1.k + ':' + r1.a.cardToken.slice(0, 6);
    await ev(`window.__ck.scan(${JSON.stringify(qr)}, 'scan')`); await wt(300);
    c('同じイベントでもう一度読むと出席済み（記録は増えない）', /出席済み/.test(await ev(`document.getElementById('stageBody').innerText`)) && (await ev(`document.getElementById('total').textContent`)) === '1');
    // 次のイベント（別の日）: 出席を消して、QRだけで受付
    await ev(`(function(){ var r=window.__ck.rec(); delete r.att[${JSON.stringify(r1.k)}]; })()`);
    await ev(`window.__ck.scan(${JSON.stringify(qr)}, 'scan')`); await wt(500);
    const r2 = JSON.parse(await ev(`(function(){ var r=window.__ck.rec(), a=r.att[${JSON.stringify(r1.k)}]||{}; return window.__ck.db().collection('checkinUsers').doc(${JSON.stringify(r1.k)}).get().then(function(s){ return JSON.stringify({a:a, u:s.data(), stage:document.getElementById('stageBody').innerText}); }); })()`));
    c('ユーザーQRで受付できる（来場2回目・回数が増える）', r2.a.kind === 'user' && r2.a.method === 'scan' && /来場 2回目/.test(r2.stage) && r2.u.visits === 2, r2.stage);
    await ev(`window.__ck.scan(${JSON.stringify('u:' + r1.k + ':ffffff')}, 'scan')`); await wt(400);
    c('署名がちがうQRは出席済み判定より先に弾かれない（同じ人なら出席済み）', /出席済み/.test(await ev(`document.getElementById('stageBody').innerText`)));
    await ev(`(function(){ var r=window.__ck.rec(); delete r.att[${JSON.stringify(r1.k)}]; })()`);
    await ev(`window.__ck.scan(${JSON.stringify('u:' + r1.k + ':ffffff')}, 'scan')`); await wt(400);
    c('署名がちがう（古い・作り直す前の）QRは受付しない', /読めないユーザーQR/.test(await ev(`document.getElementById('stageBody').innerText`)));
    // 名簿 → ユーザー
    await ev(`document.querySelector('nav button[data-pane="pRoster"]').click()`); await wt(600);
    c('名簿: 管理者には「ビジネス｜ユーザー」が見える', !(await ev(`document.getElementById('rosterKind').classList.contains('hide')`)));
    c('ビジネスの名簿にユーザーは出ない', !/見本 はなこ/.test(await ev(`document.getElementById('rosterBody').innerText`)));
    await ev(`document.querySelector('#rosterKind button[data-k="user"]').click()`); await wt(600);
    const ro = JSON.parse(await ev(`JSON.stringify({rows:document.getElementById('rosterBody').innerText, cnt:document.getElementById('rosterCount').textContent, add:getComputedStyle(document.getElementById('btnAddMember')).display, sw:document.documentElement.scrollWidth})`));
    c('ユーザーの名簿: 氏名・紹介者・来場回数・操作', /見本 はなこ/.test(ro.rows) && /紹介: ジェッ子 ちゃん/.test(ro.rows) && /来場 2回/.test(ro.rows) && /QR/.test(ro.rows) && /削除/.test(ro.rows), ro.rows);
    c('ユーザーの名簿ではビジネスのボタン（メンバー追加など）をしまう・横にはみ出さない', ro.add === 'none' && ro.sw === 390 && /稼働率に入りません/.test(ro.cnt));
    await shot('roster');
    await ev(`document.querySelector('#rosterBody button[data-ua="edit"]').click()`); await wt();
    await ev(`document.getElementById('ueName').value='見本 はな'; document.getElementById('ueGo').click()`); await wt(400);
    const ed = JSON.parse(await ev(`window.__ck.db().collection('cards').doc(${JSON.stringify(r1.a.cardToken)}).get().then(function(s){ return JSON.stringify(s.data()); })`));
    c('編集: カードの名前も直る', ed.name === '見本 はな' && /見本 はな/.test(await ev(`document.getElementById('rosterBody').innerText`)));
    await ev(`document.querySelector('#rosterBody button[data-ua="tog"]').click()`); await wt(400);
    const off = JSON.parse(await ev(`window.__ck.db().collection('cards').doc(${JSON.stringify(r1.a.cardToken)}).get().then(function(s){ return JSON.stringify(s.data()); })`));
    c('無効化: カードも使えなくなる（名簿からは消える＝無効は非表示）', off.active === false && !/見本 はな/.test(await ev(`document.getElementById('rosterBody').innerText`)));
    await ev(`document.querySelector('#rosterKind button[data-k="biz"]').click()`); await wt(400);
    c('ビジネスに戻すとメンバー追加のボタンが戻る', (await ev(`getComputedStyle(document.getElementById('btnAddMember')).display`)) !== 'none');
    c('ページのエラーなし' + (dark ? '（ダーク）' : ''), !errs.length, errs.join(' / '));
    await ctx.close();
  }
  // ── 本人のカードのページ ──
  {
    const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage(), errs = [];
    page.on('pageerror', e => errs.push(e.message));
    const tok = '0123456789abcdef0123456789abcdef', uid = 'u17620000000001234';
    await page.addInitScript(d => { window.__FBDATA = d; }, { ['cards/' + tok]: { kind: 'user', no: uid, name: '見本 はなこ', union: 'ANTARES', referrer: '架空 太郎', active: true, visits: 3 }, ['cardClaims/' + uid]: { t: tok } });
    await page.route('**/*', async (route) => {
      const u = route.request().url();
      if (u.indexOf('firebase-app-compat.js') >= 0) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(ST + '/fbstub.js', 'utf8') });
      if (u.indexOf('firebasejs') >= 0) return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
      if (u.indexOf('qrcode.min.js') >= 0) return route.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.QRCode=function(el,o){el.setAttribute("data-qr",o.text);el.innerHTML="<div style=\\"width:"+o.width+"px;height:"+o.height+"px;background:#000\\"></div>";};window.QRCode.CorrectLevel={L:1,M:0,Q:3,H:2};' });
      const m = u.match(/\/groove-map\/checkin\/([\w./-]*)/);
      if (m) { const f = R + '/checkin/' + (m[1].split('?')[0] || 'index.html'); if (fs.existsSync(f) && fs.statSync(f).isFile()) return route.fulfill({ status: 200, body: fs.readFileSync(f), contentType: /\.html$/.test(f) ? 'text/html; charset=utf-8' : 'application/octet-stream' }); }
      return route.fulfill({ status: 404, body: '' });
    });
    await page.goto('https://hktymc18.github.io/groove-map/checkin/index.html#c=' + tok);
    await page.waitForTimeout(1500);
    const cv = JSON.parse(await page.evaluate(() => JSON.stringify({ cls: document.getElementById('memberCard').className, brand: document.querySelector('#memberCard .mc-brand').textContent, name: document.getElementById('mcName').textContent, grp: document.getElementById('mcGroup').textContent, qr: document.getElementById('mcQr').getAttribute('data-qr'), err: document.getElementById('mcErr').textContent, tr: (document.getElementById('trArea') || { innerHTML: '' }).innerHTML, sw: document.documentElement.scrollWidth })));
    c('カード: ユーザーのデザイン・名前（v137：紹介者の名前はQRの画面に出さない）', /mc-user/.test(cv.cls) && cv.brand === 'NAVIGATOR Beauty' && cv.name === '見本 はなこ' && cv.grp === '', JSON.stringify(cv));
    c('カードのQRは u:ID:先頭6文字', cv.qr === 'u:' + uid + ':012345');
    c('カード: エラーなし・横にはみ出さない', !cv.err && cv.sw === 390 && !errs.length, cv.err + errs.join('/'));
    await page.screenshot({ path: OUT + '/ckusr117_card.png' });
    await ctx.close();
  }
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
