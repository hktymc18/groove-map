// 受付 v173：NAVIGATOR Beauty 第2弾（架空データ）
//   おやすみ券（1日だけ空いた日は、その週に1回まで連続をつなぐ）・今週の目標（週に何日）・おかえり（3日以上あいたら今日は1つ）・
//   なかよし度とリボン（PRYSMiO の色）・バディの今日・あなたの投稿への 👏・準備とプランの変更で週の目標
const path = require('path'), fs = require('fs');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const pad = n => (n < 10 ? '0' : '') + n, ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };
const TA = '0123456789abcdef0123456789abcdef', UA = 'u17620000000001', T = day(0);
const card = (x) => Object.assign({ kind: 'user', no: UA, name: '見本 はなこ', union: 'ANTARES', active: true, visits: 2 }, x || {});
const plan = (x) => Object.assign({ course: 'yuragi', why: '夏までにきれいになりたい', qs: ['am', 'pm', 'moist'], when: { am: 'am', pm: 'bed', moist: 'bed' }, lvl: 'std', wk: 4, ob: 1, start: day(-20), days: {}, atMs: 1 }, x || {});
const base = (x) => Object.assign({ ['cards/' + TA]: card(), ['cardClaims/' + UA]: { t: TA } }, x || {});
(async () => {
  // ① おやすみ券の数え方（しくみ・jsdom・日付は固定：2026-11-26 は木曜。その週の月曜は 11-23）
  {
    const H = fs.readFileSync(P.R + '/checkin/index.html', 'utf8');
    const { JSDOM } = require(path.join(__dirname, '../node_modules/jsdom'));
    const pick = re => { const m = H.match(re); if (!m) throw new Error('not found ' + re); return m[0]; };
    const W = new JSDOM('<div></div>', { runScripts: 'outside-only' }).window;
    W.eval(['function pad(n){ return (n < 10 ? "0" : "") + n; }', pick(/function mpYmd\(d\)\{[^\n]*\}/), pick(/function mpAddDays\(ymd, n\)\{[^\n]*\}/),
      pick(/function mpWeekKey\(d\)\{[^\n]*\}/), pick(/function mpStats\(plan, today\)\{[\s\S]*?\n\}/)].join('\n'));
    const S = (ds, t) => { const days = {}; ds.forEach(d => { days['2026-11-' + pad(d)] = ['x']; }); return W.mpStats({ days }, t || '2026-11-26'); };
    let r = S([26, 25, 23, 22]);
    c('火曜（24日）だけ空いた → おやすみ券でつながる（4日・おやすみ 24日）', r.streak === 4 && r.rest.join() === '2026-11-24' && r.restWeek === true, JSON.stringify(r));
    r = S([26, 24, 22]);
    c('同じ週に2回空いた → 2回目でとぎれる（2日）', r.streak === 2, JSON.stringify(r));
    r = S([26, 25, 24, 23, 21, 20]);
    c('前の週の日曜（22日）が空いた → 前の週の券でつながる（6日）・今週の券は残っている', r.streak === 6 && r.rest.join() === '2026-11-22' && r.restWeek === false, JSON.stringify(r));
    r = S([26, 23]);
    c('2日続けて空いた → つながらない（1日）', r.streak === 1, JSON.stringify(r));
    r = S([24, 23]);
    c('今日まだ・昨日が空いた → 昨日をおやすみにして、今日やればつながる（2日）', r.streak === 2 && r.rest.join() === '2026-11-25', JSON.stringify(r));
    r = S([26, 25, 23, 22, 20, 19, 18]);
    c('いちばん長い連続も同じ数え方（21日は前の週の券）', r.best === 7, JSON.stringify(r));
    c('今週（月曜から）チェックした日の数', S([26, 25, 23, 22]).wk === 3);
  }
  const b = await P.browser();
  // ② 「今日」：おやすみ券を使った翌日・今週の目標・なかよし度とリボン・バディ・👏
  {
    const ds = {}; [-2, -3, -4].forEach(n => { ds[day(n)] = ['am', 'pm']; });
    const data = base({ ['cards/' + TA]: card({ pz_e1: { v: 820, d: day(-30), ev: 'DAY', at: 1 } }), ['cards/' + TA + '/plan/me']: plan({ days: ds }),
      ['cards/' + TA + '/buddy/me']: { k: 'b_aaaaaaaaaaaaaaaaaaaa', list: [{ k: 'b_bbbbbbbbbbbbbbbbbbbb', n: '見本 さくら' }, { k: 'b_cccccccccccccccccccc', n: '見本 ゆり' }], at: 1 },
      'ckBuddy/b_aaaaaaaaaaaaaaaaaaaa': { uid: UA, n: '見本 はなこ', st: 3, bdg: 3, td: day(-2), at: 1 },
      'ckBuddy/b_bbbbbbbbbbbbbbbbbbbb': { uid: 'u2', n: '見本 さくら', st: 9, bdg: 5, td: T, at: 1 },
      'ckBuddy/b_cccccccccccccccccccc': { uid: 'u3', n: '見本 ゆり', st: 1, bdg: 2, td: day(-1), at: 1 },
      'ckLounge/p1': { union: 'ANTARES', uid: UA, n: '見本 はなこ', t: '夜のスキンケアつづいてます', st: 'ok', okAt: 3000 },
      'ckLounge/p1/clap/u2': { at: 1 }, 'ckLounge/p1/clap/u3': { at: 2 }, ['cards/' + TA + '/lounge/p1']: { at: 1 } });
    for (const dark of [false, true]) {
      const o = await P.open(b, { dark, hash: '#c=' + TA, data, wait: 3000 });
      await o.page.addStyleTag({ content: '#toast{display:none!important}' });
      const tx = await o.ev(`document.getElementById('uaToday').innerText`);
      c('昨日が空いた → キャラ「昨日はおやすみ券を使ったよ」・連続はつながる（3日）' + (dark ? '（ダーク）' : ''), /おやすみ券」を使ったよ/.test(tx) && /つづいている日\s*3日/.test(tx), tx);
      c('今週の目標の曜日は横に7つ並ぶ', (await o.ev(`(function(){ var d=document.querySelectorAll('#uaToday .td-wk .td-dots i'); return d.length === 7 && d[0].getBoundingClientRect().top === d[6].getBoundingClientRect().top; })()`)));
      c('今週の目標（○ / 4日）とおやすみ券の行', /今週の目標\s*\d \/ 4日/.test(tx) && /おやすみ券：/.test(tx), tx);
      c('なかよし度（6チェック → Lv.1「はじめまして」・次まで 9）', /なかよし度 Lv\.1「はじめまして」・次まで 9チェック/.test(tx), tx);
      c('リボンの色は PRYSMiO の最新（820 → パープル）', /--rb:#/.test(await o.ev(`document.querySelector('#uaToday .pal-rb').getAttribute('style')`)));
      c('バディの今日：今日できた人だけ（さくらさん）', /バディのさくらさんが今日できたよ/.test(tx) && !/ゆりさん/.test(tx), tx);
      c('あなたの投稿への 👏（2こ）', /あなたの投稿に 2こ届いているよ/.test(tx), tx);
      await o.page.screenshot({ path: OUT + '/ckob173_today' + (dark ? '_d' : '') + '.png', fullPage: true });
      c('エラーなし（今日）' + (dark ? '（ダーク）' : ''), !o.errs.length, o.errs.join(' / '));
      await o.ctx.close();
    }
  }
  // ③ おかえり：5日あいた → 今日は1つだけ（いちばん上に「まずはこれ」）
  {
    const o = await P.open(b, { hash: '#c=' + TA, data: base({ ['cards/' + TA + '/plan/me']: plan({ days: { [day(-6)]: ['am'] } }) }), wait: 2800 });
    const tx = await o.ev(`document.getElementById('uaToday').innerText`);
    c('おかえり：カードと、クエストのいちばん上に「まずはこれ」（1つだけ）', /おかえり！/.test(tx) && (await o.ev(`document.querySelectorAll('#uaToday .td-qb.pick').length`)) === 1 && /まずはこれ/.test(tx), tx);
    await o.page.screenshot({ path: OUT + '/ckob173_back.png' });
    await o.ev(`document.querySelector('#uaToday .td-qb.pick').click()`); await o.wt(500);
    c('1つチェックすると、おかえりのカードは消える', !/おかえり！/.test(await o.ev(`document.getElementById('uaToday').innerText`)));
    await o.ctx.close();
  }
  // ④ 週の目標：準備で決める・プランを変えるで直す（ほかの準備の内容は消えない）
  {
    const o = await P.open(b, { hash: '#c=' + TA, data: base({ ['cards/' + TA]: card({ visits: 1, lastVisit: { d: T, ev: 'DAY' } }) }), wait: 2800 });
    await o.ev(`document.querySelector('#obWhy [data-v]').click()`); await o.ev(`document.getElementById('obNext').click()`); await o.wt(150);
    await o.ev(`document.querySelector('.ob-wrap [data-co="diet"]').click()`); await o.wt(150);
    c('準備：週に何日（はじめは4日・おすすめ）', (await o.ev(`document.querySelector('#obWk .on').getAttribute('data-v')`)) === '4');
    await o.ev(`document.querySelector('#obWk [data-v="5"]').click()`);
    await o.ev(`document.getElementById('obNext').click()`); await o.wt(150);
    c('約束の画面に「今週の目標 週5日」', /今週の目標\s*週5日/.test(await o.ev(`document.querySelector('.ob-wrap').innerText`)));
    await o.ev(`document.getElementById('obNext').click()`); await o.wt(600);
    let pl = JSON.parse(await o.ev(`JSON.stringify(window.__FBDATA['cards/${TA}/plan/me'])`));
    c('準備で wk=5 を保存', pl.wk === 5, JSON.stringify(pl));
    await o.ev(`document.getElementById('obEnd').click()`); await o.wt(300);
    await o.page.click('#uaTabs [data-tab="plan"]'); await o.wt(300);
    await o.ev(`document.getElementById('mypEdit').click()`); await o.wt(200);
    c('プランを変える：今の週の目標（5日）が選ばれている', (await o.ev(`document.querySelector('#mypWk .on').getAttribute('data-w')`)) === '5');
    await o.ev(`document.querySelector('#mypWk [data-w="3"]').click()`); await o.ev(`document.getElementById('mypGo').click()`); await o.wt(600);
    pl = JSON.parse(await o.ev(`JSON.stringify(window.__FBDATA['cards/${TA}/plan/me'])`));
    c('プランを変えると wk=3・なりたい私や準備の印は残る', pl.wk === 3 && pl.why && pl.ob > 0, JSON.stringify(pl));
    c('エラーなし（週の目標）', !o.errs.length, o.errs.join(' / '));
    await o.ctx.close();
  }
  await b.close();
  const H = fs.readFileSync(P.R + '/checkin/index.html', 'utf8');
  c('APP_VER v173 以上', (+(H.match(/var APP_VER = 'v(\d+)';/) || [0, 0])[1]) >= 173);
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
