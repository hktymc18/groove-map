// 受付 v121：ユーザーのカードの「マイプラン」（段階5）。コースを選ぶ → 毎日のクエストにチェック → 連続日数・レベル・バッジ。
//   本人＝カードのリンクを持っている人だけ（ログインなし）。架空データ
const path = require('path');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const pad = n => (n < 10 ? '0' : '') + n, ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const ago = n => { const d = new Date(); d.setDate(d.getDate() - n); return ymd(d); };
(async () => {
  const b = await P.browser();
  const tok = '0123456789abcdef0123456789abcdef', uid = 'u17620000000001234';
  const card = (x) => Object.assign({ kind: 'user', no: uid, name: '見本 はなこ', union: 'ANTARES', referrer: '架空 太郎', active: true, visits: 3 }, x);
  // はじめて（プランなし）
  {
    const { ctx, page, ev, wt, errs } = await P.open(b, { hash: '#c=' + tok, data: { ['cards/' + tok]: card({ pz_e1: { v: 610, d: ago(30), at: 1 }, pz_e2: { v: 760, d: ago(1), at: 2 } }) } });
    const t0 = await ev(`document.getElementById('mpArea').innerText`);
    c('プランがない人には3つのコース', /MY PLAN/.test(t0) && /ダイエット編/.test(t0) && /ゆらぎ肌ケア編/.test(t0) && /体内（インナービューティ）編/.test(t0), t0);
    c('バッジ: 来場・測定・色が上がった（受付の記録から）', /3回来場/.test(t0) && (await ev(`[].filter.call(document.querySelectorAll('#mpArea .mp-bd span.on'),function(x){return 1;}).length`)) === 4, t0);
    await page.screenshot({ path: OUT + '/ckmp121_start.png', fullPage: true });
    await ev(`document.querySelector('#mpArea [data-co="yuragi"]').click()`); await wt();
    const q0 = await ev(`[].map.call(document.querySelectorAll('#mypQs input'),function(x){return x.checked?1:0;}).join('')`);
    c('コースを押すと設定の画面（はじめは3つのクエストにチェック）', q0 === '11100', q0);
    c('目標の候補に「次の測定で（次の色）にする」', /次の測定でプラチナメダリオンにする/.test(await ev(`document.getElementById('mypGoalSug').innerText`)));
    await ev(`(function(){ [].forEach.call(document.querySelectorAll('#mypQs input'),function(x){ x.checked=false; }); document.getElementById('mypGo').click(); })()`); await wt(200);
    c('クエストが0こなら始めない', /1つ以上/.test(await ev(`document.getElementById('toast').textContent`)));
    await ev(`(function(){ var q=document.querySelectorAll('#mypQs input'); q[0].checked=true; q[1].checked=true; q[3].checked=true; document.querySelector('#mypGoalSug button').click(); document.getElementById('mypGo').click(); })()`); await wt(400);
    const pl = JSON.parse(await ev(`window.__FBDATA ? JSON.stringify(window.__FBDATA['cards/${tok}/plan/me']) : 'null'`));
    c('保存: コース・選んだクエスト・目標・始めた日', pl && pl.course === 'yuragi' && pl.qs.join() === 'am,pm,sleep' && pl.goal === '30日つづける' && pl.start === ymd(new Date()), JSON.stringify(pl));
    const t1 = await ev(`document.getElementById('mpArea').innerText`);
    c('今日のクエストが出る（0/3）・目標', /今日のクエスト\s*0\/3/.test(t1) && /朝のスキンケア/.test(t1) && /7時間眠った/.test(t1) && /目標：30日つづける/.test(t1), t1);
    await ev(`document.querySelector('#mpArea [data-q="am"]').click()`); await wt(300);
    const p2 = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['cards/${tok}/plan/me'])`));
    c('チェックすると今日の記録に入る・1日連続', p2.days[ymd(new Date())].join() === 'am' && /1\s*日連続/.test(await ev(`document.getElementById('mpArea').innerText`)));
    await ev(`document.querySelector('#mpArea [data-q="am"]').click()`); await wt(300);
    const p3 = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['cards/${tok}/plan/me'])`));
    c('もう一度押すと外れる（その日の記録も消える）', !p3.days[ymd(new Date())]);
    c('エラーなし（はじめて）', !errs.length, errs.join('/'));
    await ctx.close();
  }
  // 続けている人（昨日まで6日連続 → 今日で7日）
  for (const dark of [false, true]) {
    const days = {}; for (let i = 1; i <= 6; i++) days[ago(i)] = ['water', 'walk'];
    days[ago(10)] = ['water'];
    const plan = { course: 'diet', goal: '30日つづける', qs: ['water', 'walk', 'dinner'], start: ago(12), days, atMs: 1 };
    const { ctx, page, ev, wt, errs } = await P.open(b, { dark, hash: '#c=' + tok, data: { ['cards/' + tok]: card({ pz_e1: { v: 820, d: ago(2), at: 1 } }), ['cards/' + tok + '/plan/me']: plan } });
    const t = await ev(`document.getElementById('mpArea').innerText`);
    c('今日まだでも、昨日までの連続（6日）を出す' + (dark ? '（ダーク）' : ''), /6\s*日連続/.test(t) && /13\s*日できた|7\s*日できた/.test(t), t);
    c('レベル（チェック13回 → Lv.1・次まで2）', /Lv\.1/.test(t) && /次まで 2/.test(t), t);
    c('3日連続のバッジは取れている・7日はまだ', (await ev(`(function(){ var s=[].filter.call(document.querySelectorAll('#mpArea .mp-bd span'),function(x){return /3日連続/.test(x.textContent);})[0], t=[].filter.call(document.querySelectorAll('#mpArea .mp-bd span'),function(x){return /7日連続/.test(x.textContent);})[0]; return s.classList.contains('on') && !t.classList.contains('on'); })()`)));
    await ev(`document.querySelector('#mpArea [data-q="water"]').click()`); await wt(400);
    const t2 = await ev(`document.getElementById('mpArea').innerText`);
    c('今日チェックすると7日連続・7日連続のバッジ', /7\s*日連続/.test(t2) && (await ev(`[].filter.call(document.querySelectorAll('#mpArea .mp-bd span.on'),function(x){return /7日連続/.test(x.textContent);}).length`)) === 1 && /7日連続！/.test(await ev(`document.getElementById('toast').textContent`)), t2);
    await ev(`document.querySelector('#mpArea [data-q="walk"]').click()`); await ev(`document.querySelector('#mpArea [data-q="dinner"]').click()`); await wt(400);
    c('全部できたら「今日のクエストは全部できました」', /全部できました/.test(await ev(`document.getElementById('mpArea').innerText`)));
    c('横にはみ出さない', (await ev(`document.documentElement.scrollWidth`)) === 390);
    await ev(`document.getElementById('mpArea').scrollIntoView()`);
    await page.screenshot({ path: OUT + '/ckmp121_plan' + (dark ? '_d' : '') + '.png', fullPage: true });
    // プランを変える（記録は残る）
    await ev(`document.getElementById('mypEdit').click()`); await wt();
    await ev(`(function(){ document.querySelector('#mypCo [data-k="inner"]').click(); })()`); await wt(200);
    await ev(`document.getElementById('mypGo').click()`); await wt(400);
    const p4 = JSON.parse(await ev(`JSON.stringify(window.__FBDATA['cards/${tok}/plan/me'])`));
    c('コースを変えても、今までの記録（日ごとのチェック）は残る', p4.course === 'inner' && Object.keys(p4.days).length === 8 && p4.start === ago(12), JSON.stringify(p4).slice(0, 200));
    c('エラーなし' + (dark ? '（ダーク）' : ''), !errs.length, errs.join('/'));
    await ctx.close();
  }
  // 研修生になった人・ビジネスの会員証には出ない
  {
    const o = await P.open(b, { hash: '#c=' + tok, data: { ['cards/' + tok]: card({ toMember: 'P0006', toCard: 'feed' }) } });
    c('研修生になった人のユーザーカードには出ない', (await o.ev(`document.getElementById('mpArea').innerHTML`)) === '');
    await o.ctx.close();
    const m = await P.open(b, { hash: '#c=tokM', data: { 'cards/tokM': { no: 'ZZ0001', name: '見本 太郎', union: 'ANTARES', active: true } } });
    c('ビジネスの会員証には出ない', (await m.ev(`document.getElementById('mpArea').innerHTML`)) === '' && !m.errs.length);
    await m.ctx.close();
  }
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
