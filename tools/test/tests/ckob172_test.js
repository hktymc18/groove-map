// 受付 v172：NAVIGATOR Beauty 第1弾（架空データ）
//   はじめの準備（はじめての来場の日に1回）→ 約束 → その場で1つ目のチェック・真ん中の「今日」タブ（時間帯ごと・次のDAYと目標まで）・
//   はじめの7日・バディ3日／ラウンジ7日で開く・受付QRは右上・続いているかの数字（ckRetention）・キャラは CK_PAL だけで差し替えられる
const path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const pad = n => (n < 10 ? '0' : '') + n, ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };
const TA = '0123456789abcdef0123456789abcdef', UA = 'u17620000000001', T = day(0);
const card = (x) => Object.assign({ kind: 'user', no: UA, name: '見本 はなこ', union: 'ANTARES', active: true, visits: 1 }, x || {});
const base = (x) => Object.assign({ ['cards/' + TA]: card(), ['cardClaims/' + UA]: { t: TA },
  'checkinEvents/e2': { date: day(12), name: '12月のDAY', unions: ['ANTARES'], uDay: true } }, x || {});
const on = (o) => o.ev(`document.querySelector('#uaApp .ua-pg.on').getAttribute('data-p')`);
(async () => {
  const b = await P.browser();
  // ① はじめての来場の日：準備が自動で開く → なりたい私・いつまで → コース → 難しさ・時間帯 → 約束 → 1つ目のチェック
  for (const dark of [false, true]) {
    const sx = dark ? '_d' : '';
    const o = await P.open(b, { dark, hash: '#c=' + TA, data: base({ ['cards/' + TA]: card({ lastVisit: { d: T, ev: '今日のDAY' } }) }), wait: 2800 });
    await o.page.addStyleTag({ content: '#toast{display:none!important}' });
    c('はじめての来場の日は、準備が自動で開く（キャラのあいさつ）' + (dark ? '（ダーク）' : ''), (await o.ev(`!!document.querySelector('.ob-wrap')`)) && /ジェッ子ちゃん/.test(await o.ev(`document.querySelector('.ob-wrap').innerText`)));
    await o.page.screenshot({ path: OUT + '/ckob172_start' + sx + '.png' });
    if (dark) { await o.ctx.close(); continue; }
    c('「いつまでに？」に次のDAY（後から読み込んでも足される）', /次のDAY（\d+\/\d+）/.test(await o.ev(`document.getElementById('obBy').innerText`)));
    await o.ev(`document.getElementById('obNext').click()`); await o.wt(150);
    c('なりたい私を選ばないと次へ進まない', /なりたい私を選ぶか/.test(await o.ev(`document.getElementById('toast').textContent`)) && (await o.ev(`!!document.getElementById('obWhy')`)));
    await o.ev(`document.querySelector('#obWhy [data-v]').click()`);
    await o.ev(`[].filter.call(document.querySelectorAll('#obBy [data-v]'), function(b){ return /1か月後/.test(b.textContent); })[0].click()`);
    await o.ev(`document.getElementById('obNext').click()`); await o.wt(150);
    await o.ev(`document.querySelector('.ob-wrap [data-co="yuragi"]').click()`); await o.wt(150);
    c('コースを選ぶと、難しさ（ふつう＝3つ）とクエスト・時間帯', (await o.ev(`document.querySelectorAll('#obQs input:checked').length`)) === 3 && (await o.ev(`document.querySelector('#obLvl .on').getAttribute('data-v')`)) === 'std');
    await o.ev(`document.querySelector('#obLvl [data-v="easy"]').click()`); await o.wt(100);
    c('「ゆるく」で1つだけ', (await o.ev(`document.querySelectorAll('#obQs input:checked').length`)) === 1);
    await o.ev(`document.querySelector('#obLvl [data-v="std"]').click()`); await o.wt(100);
    await o.ev(`document.querySelector('#obQs [data-q="am"][data-s="noon"]').click()`); await o.wt(50);
    await o.page.screenshot({ path: OUT + '/ckob172_quests.png' });
    await o.ev(`document.getElementById('obNext').click()`); await o.wt(150);
    c('約束の画面（キャラと約束する）', /ジェッ子ちゃんと約束する/.test(await o.ev(`document.getElementById('obNext').textContent`)) && /いつまでに/.test(await o.ev(`document.querySelector('.ob-wrap').innerText`)));
    await o.ev(`document.getElementById('obNext').click()`); await o.wt(600);
    const pl = JSON.parse(await o.ev(`JSON.stringify(window.__FBDATA['cards/${TA}/plan/me'])`));
    c('約束でマイプランに保存（なりたい私・いつまで・時間帯・難しさ・準備の印・始めた日）', pl && pl.course === 'yuragi' && pl.why === '夏までにきれいになりたい' && pl.goal === pl.why && pl.by === day(30)
      && pl.when.am === 'noon' && pl.when.pm === 'bed' && pl.lvl === 'std' && pl.ob > 0 && pl.start === T && pl.qs.join() === 'am,pm,moist', JSON.stringify(pl));
    c('約束のあと「最初の1つ、今ここでやってみよう」', /最初の1つ/.test(await o.ev(`document.querySelector('.ob-wrap').innerText`)));
    await o.ev(`document.querySelector('[data-ob1="pm"]').click()`); await o.wt(600);
    c('その場で1つ目のチェック → 1日目クリア・ホーム画面に追加・通知の案内', (JSON.parse(await o.ev(`JSON.stringify(window.__FBDATA['cards/${TA}/plan/me'])`)).days[T] || []).indexOf('pm') >= 0
      && /1日目クリア/.test(await o.ev(`document.querySelector('.ob-wrap').innerText`)) && (await o.ev(`!!document.getElementById('obA2')`)));
    await o.page.screenshot({ path: OUT + '/ckob172_first.png' });
    await o.ev(`document.getElementById('obEnd').click()`); await o.wt(400);
    c('「はじめる！」で「今日」へ', (await on(o)) === 'today' && /1\/3/.test(await o.ev(`document.getElementById('uaToday').innerText`)));
    await o.page.reload(); await o.wt(2600);
    c('準備は1回だけ（開き直しても出ない）', !(await o.ev(`!!document.querySelector('.ob-wrap')`)));
    c('エラーなし（準備）', !o.errs.length, o.errs.join(' / '));
    await o.ctx.close();
  }
  // ② 2回目の来場の人・はじめての日ではない人には自動で出ない（「今日」の「はじめる」から）
  {
    const o = await P.open(b, { hash: '#c=' + TA, data: base({ ['cards/' + TA]: card({ visits: 2, lastVisit: { d: T, ev: 'DAY' } }) }), wait: 2600 });
    c('2回目の来場の人には自動で出ない・「今日」に「はじめる（2分）」', !(await o.ev(`!!document.querySelector('.ob-wrap')`)) && /はじめる（2分）/.test(await o.ev(`document.getElementById('uaToday').innerText`)));
    await o.ev(`document.getElementById('tdStart').click()`); await o.wt(200);
    c('「はじめる」で準備が開く', await o.ev(`!!document.querySelector('.ob-wrap')`));
    await o.ctx.close();
  }
  // ③ 続けている人：真ん中の「今日」・時間帯・はじめの7日（6日目）・次のDAYまで・目標まで・ロック
  const days = {}; for (let i = 1; i <= 2; i++) days[day(-i)] = ['am'];
  const plan = { course: 'yuragi', goal: '夏までにきれいになりたい', why: '夏までにきれいになりたい', by: day(40), qs: ['am', 'pm', 'moist'], when: { am: 'am', pm: 'bed', moist: 'bed' }, lvl: 'std', ob: 1, start: day(-5), days, atMs: 1 };
  for (const dark of [false, true]) {
    const sx = dark ? '_d' : '';
    const o = await P.open(b, { dark, hash: '#c=' + TA, data: base({ ['cards/' + TA + '/plan/me']: plan, ['cards/' + TA]: card({ visits: 2 }) }), wait: 2800 });
    await o.page.addStyleTag({ content: '#toast{display:none!important}' });
    const tx = await o.ev(`document.getElementById('uaToday').innerText`);
    c('開くと「今日」・真ん中のタブ' + (dark ? '（ダーク）' : ''), (await on(o)) === 'today' && (await o.ev(`document.querySelectorAll('#uaTabs [data-tab]')[2].getAttribute('data-tab')`)) === 'today');
    c('はじめの7日（6日目）・次のDAYまで あと12日・目標まで あと40日', /はじめの7日[\s\S]*6日目/.test(tx) && /次のDAYまで\s*あと12日/.test(tx) && /あと40日/.test(tx), tx);
    c('時間帯ごと（朝・寝る前）に分かれる', (await o.ev(`[].map.call(document.querySelectorAll('#uaToday .td-slot'), function(x){ return x.querySelectorAll('[data-uq]').length; }).sort().join()`)) === '1,2');
    if (!dark) {
      await o.page.screenshot({ path: OUT + '/ckob172_today.png', fullPage: true });
      await o.ev(`document.querySelector('#uaToday [data-uq="am"]').click()`); await o.wt(500);
      c('「今日」でその場でチェック・キャラのことばが変わる', /1\/3/.test(await o.ev(`document.getElementById('uaToday').innerText`)) && /あと2こ|のこり2こ/.test(await o.ev(`document.querySelector('#uaToday .td-bub').textContent`)));
      await o.page.click('#uaTabs [data-tab="friends"]'); await o.wt(300);
      c('なかま：ラウンジはまだ（チェックした日3日・7日まで あと4日）・🔒', /ラウンジは、あと4日で開くよ/.test(await o.ev(`document.getElementById('uaLock').innerText`)) && !(await o.ev(`document.getElementById('uaLock').hidden`)));
      await o.page.screenshot({ path: OUT + '/ckob172_lock.png' });
      await o.ev(`document.querySelector('#uaApp .ua-seg [data-seg="buddy"]').click()`); await o.wt(200);
      c('バディは3日で開いている（ロックなし）', await o.ev(`document.getElementById('uaLock').hidden`));
      await o.ev(`document.querySelector('#uaApp .ua-seg [data-seg="invite"]').click()`); await o.wt(200);
      c('友だちの招待はいつでも使える', await o.ev(`document.getElementById('uaLock').hidden`));
      await o.page.click('#uaQrTop'); await o.wt(300);
      c('受付QRは右上から', (await on(o)) === 'qr');
    }
    c('エラーなし（今日）' + (dark ? '（ダーク）' : ''), !o.errs.length, o.errs.join(' / '));
    await o.ctx.close();
  }
  // ④ 前からの人（準備をしていない＝ob なし）はロックしない
  {
    const o = await P.open(b, { hash: '#c=' + TA, data: base({ ['cards/' + TA + '/plan/me']: { course: 'diet', qs: ['water'], start: day(-1), days: {}, atMs: 1 }, ['cards/' + TA]: card({ visits: 3 }) }), wait: 2600 });
    await o.page.click('#uaTabs [data-tab="friends"]'); await o.wt(300);
    c('準備をしていない前からの人は、なかまのロックなし', await o.ev(`document.getElementById('uaLock').hidden`));
    await o.ctx.close();
  }
  // ⑤ DAY の当日は、今までどおり開くと受付QR
  {
    const o = await P.open(b, { hash: '#c=' + TA, data: base({ 'checkinEvents/e3': { date: T, name: '今日のDAY', unions: ['ANTARES'], uDay: true }, ['cards/' + TA]: card({ visits: 3 }) }), wait: 2600 });
    c('DAY の当日は、開くと受付QR', (await on(o)) === 'qr');
    await o.ctx.close();
  }
  // ⑤' スタッフ：「💜 Beauty」タブの「📈 続いているか」（押した時だけ数える）
  {
    const user = (name) => ({ name, union: 'ANTARES', unionSelectedV2: true, status: 'active', email: name.length + '@example.com', privacy: { ver: '2026-10', at: '2026-10-01T00:00:00Z' } });
    const w4 = {}; for (let i = 0; i < 4; i++) w4[day(-i)] = ['am'];
    const data = { 'checkinUnions/ANTARES': { name: 'ANTARES', unionAdmins: ['ua1'], dayStaff: ['day1'] }, 'checkinConfig/beauty': { testers: ['day1'] }, 'users/day1': user('見本 でい'),
      'checkinUsers/u1': { uid: 'u1', name: '見本 はなこ', union: 'ANTARES', cardToken: TA, active: true, visits: 2 },
      'checkinUsers/u2': { uid: 'u2', name: '見本 さくら', union: 'ANTARES', cardToken: 'b'.repeat(32), active: true, visits: 1 },
      ['cards/' + TA + '/plan/me']: { course: 'yuragi', qs: ['am'], start: day(-10), days: w4, atMs: 1 } };
    const o = await P.open(b, { uid: 'day1', data, wait: 2600 });
    await o.page.addStyleTag({ content: '#toast,#rnPopOv,#gxHint{display:none!important}' });
    await o.page.click('nav button[data-pane="pBeauty"]'); await o.wt(600);
    c('「📈 続いているか」は押すまで数えない', /数える/.test(await o.ev(`document.getElementById('btMt').innerText`)) && !/人\s*この7日/.test(await o.ev(`document.getElementById('btMt').innerText`)));
    await o.ev(`document.getElementById('btMtGo').click()`); await o.wt(800);
    const t = await o.ev(`document.getElementById('btMt').innerText`);
    c('押すと数える：この7日で4日以上 1人（始めた1人のうち）・7日後 100%・2回以上来場 50%', /1\s*人\s*この7日で4日以上チェックした人（マイプランを始めた 1人のうち）/.test(t) && /7日後も続いている\s*100%/.test(t) && /2回以上来場した\s*50%/.test(t), t);
    await o.ev(`document.getElementById('btMt').scrollIntoView()`); await o.wt(100);
    await o.page.screenshot({ path: OUT + '/ckob172_staff.png' });
    c('エラーなし（スタッフ）', !o.errs.length, o.errs.join(' / '));
    await o.ctx.close();
  }
  // ⑥ 続いているかの数字（しくみだけ・jsdom）・キャラの差し替え
  {
    const fs = require('fs'), H = fs.readFileSync(P.R + '/checkin/index.html', 'utf8');
    const { JSDOM } = require(path.join(__dirname, '../node_modules/jsdom'));
    const pick = re => { const m = H.match(re); if (!m) throw new Error('not found ' + re); return m[0]; };
    const W = new JSDOM('<div></div>', { runScripts: 'outside-only' }).window;
    W.eval([pick(/function esc\(s\)\{[\s\S]*?\n\}/), 'function pad(n){ return (n < 10 ? "0" : "") + n; }', 'function todayStr(){ return "' + T + '"; }', 'var GX_NAME = "ジェッ子ちゃん", JETKO_SVG = "<svg></svg>";',
      pick(/function mpYmd\(d\)\{[^\n]*\}/), pick(/function mpAddDays\(ymd, n\)\{[^\n]*\}/),
      pick(/function ckRetention\(rows, today\)\{[\s\S]*?\n\}/), pick(/var CK_PAL = \{[\s\S]*?\n\};/), pick(/function ckPalImg\(cls, rb\)\{[\s\S]*?\n\}/), pick(/function ckPalSay\(key, v\)\{[\s\S]*?\n\}/)].join('\n'));
    const d = n => W.mpAddDays(T, n), mk = (st, ks) => { const o = {}; ks.forEach(k => { o[d(k)] = ['x']; }); return { course: 'diet', start: d(st), days: o }; };
    const r = W.ckRetention([
      { visits: 1, plan: mk(-3, [0, -1, -2, -3]) },   // 7日で4日・始めて3日（7日後はまだ数えない）
      { visits: 2, plan: mk(-10, [-1]) },             // 7日目以降にもチェック → 7日後も続いている
      { visits: 1, plan: mk(-40, [-39, -38]) },       // 30日より前で止まった
      { visits: 3, plan: null }                       // マイプランなし
    ], T);
    c('続いているか：この7日で4日以上・7日後・30日後・2回以上来場・始めた人', r.n === 4 && r.started === 3 && r.wk4 === 1 && r.d7[0] === 1 && r.d7[1] === 2 && r.d30[0] === 0 && r.d30[1] === 1 && r.rev === 2, JSON.stringify(r));
    W.CK_PAL.name = 'テストちゃん'; W.CK_PAL.img = 'x.png';
    c('キャラの名前・絵・ことばは CK_PAL だけで決まる', /テストちゃん/.test(W.ckPalSay('hello')) && /src="x.png"/.test(W.ckPalImg()) && /あと2こ|のこり2こ/.test(W.ckPalSay('part', { n: 1, r: 2 })));
    c('APP_VER v172 以上', (+(H.match(/var APP_VER = 'v(\d+)';/) || [0, 0])[1]) >= 172);
  }
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
