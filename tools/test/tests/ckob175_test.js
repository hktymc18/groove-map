// 受付 v175：NAVIGATOR Beauty 週のまとめ・スタッフが足す「今日の1分」（架空データ）
//   週のまとめ：日曜は今週の、月〜水は先週のまとめを「今日」に出す（開いたら消える）。「今週の目標」からはいつでも開ける。シェア画像（名前なし）
//   今日の1分：スタッフが「💜 Beauty」タブで足す（ckLes/{ユニオン}）→ お客さんのアプリでは足した分が先に出る
const path = require('path'), fs = require('fs');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const TA = '0123456789abcdef0123456789abcdef', UA = 'u17620000000001';
const card = (x) => Object.assign({ kind: 'user', no: UA, name: '見本 はなこ', union: 'ANTARES', active: true, visits: 2 }, x || {});
const plan = (x) => Object.assign({ course: 'yuragi', why: '夏までにきれいになりたい', qs: ['am', 'pm', 'moist'], when: { am: 'am', pm: 'bed', moist: 'bed' }, lvl: 'std', wk: 4, ob: 1, start: '2026-10-25', days: {}, atMs: 1 }, x || {});
const base = (x) => Object.assign({ ['cards/' + TA]: card(), ['cardClaims/' + UA]: { t: TA } }, x || {});
// 先週（11/16〜11/22）に 4日・その前の週に 2日
const DAYS = { '2026-11-16': ['am', 'pm'], '2026-11-17': ['am'], '2026-11-19': ['am', 'pm', 'moist'], '2026-11-21': ['am'], '2026-11-10': ['am'], '2026-11-12': ['am'] };
const setDay = (o, d) => o.ev(`window.__ckEval("todayStr = function(){ return '${d}'; }; ckUaToday();")`);
(async () => {
  const b = await P.browser();
  // ① 月曜：先週のまとめ
  {
    for (const dark of [false, true]) {
      const o = await P.open(b, { dark, hash: '#c=' + TA, data: base({ ['cards/' + TA + '/plan/me']: plan({ days: DAYS }) }), wait: 2800, evalHook: true });
      await o.page.addStyleTag({ content: '#toast{display:none!important}' });
      await setDay(o, '2026-11-23'); await o.wt(200);
      let tx = await o.ev(`document.getElementById('uaToday').innerText`);
      c('月曜：「先週のまとめができたよ」4日できた（目標は週4日）' + (dark ? '（ダーク）' : ''), /先週のまとめができたよ\s*4日できた（目標は週4日）/.test(tx), tx);
      c('「今週の目標」に「先週のまとめ」ボタン', /先週のまとめ/.test(await o.ev(`document.getElementById('tdWs').textContent`)));
      await o.page.screenshot({ path: OUT + '/ckob175_today' + (dark ? '_d' : '') + '.png' });
      await o.ev(`document.getElementById('tdWsC').click()`); await o.wt(300);
      const md = await o.ev(`document.querySelector('.ws-wrap').innerText`);
      c('まとめ：期間・4 / 目標4日・クリア', /先週のまとめ/.test(md) && /11\/16〜11\/22/.test(md) && /4\s*\/ 目標4日\s*🎉 クリア/.test(md), md);
      c('まとめ：チェックした数 7回・その前の週から +2日・いちばんの日 11/19', /チェックした数\s*7回/.test(md) && /その前の週から\s*\+2日/.test(md) && /いちばんの日\s*11\/19/.test(md), md);
      c('曜日の印：月・火・木・土', (await o.ev(`[].map.call(document.querySelectorAll('.ws-dots i'), function(i){ return i.className === 'on' ? 1 : 0; }).join('')`)) === '1101010');
      c('キャラのことば（目標クリア）', /目標クリア！4日もできたね/.test(md));
      await o.page.screenshot({ path: OUT + '/ckob175_week' + (dark ? '_d' : '') + '.png' });
      if (!dark) {
        await o.ev(`document.getElementById('wsShare').click()`); await o.wt(1500);
        c('シェア画像（PNG 1080×1920・招待のリンク）', (await o.ev(`new Promise(function(ok){ var m = document.querySelector('.modal img[alt="シェア画像"]'); if(!m){ ok(''); return; } var i = new Image(); i.onload = function(){ ok(i.width + 'x' + i.height); }; i.src = m.src; })`)) === '1080x1920'
          && (await o.ev(`Object.keys(window.__FBDATA).some(function(k){ return /^ckJoin\\/f_/.test(k); })`)));
        await o.page.screenshot({ path: OUT + '/ckob175_share.png' });
        await o.ev(`document.getElementById('shClose').click()`); await o.wt(200);
        tx = await o.ev(`document.getElementById('uaToday').innerText`);
        c('開いたら「まとめができたよ」は消える（ボタンは残る）', !/まとめができたよ/.test(tx) && !!(await o.ev(`!!document.getElementById('tdWs')`)), tx);
        c('見た週は端末に覚える', (await o.ev(`localStorage.getItem('bci_wsum_${TA}')`)) === '2026-11-16');
        // 日曜：今週のまとめ
        await o.ev(`localStorage.removeItem('bci_wsum_${TA}')`);
        await setDay(o, '2026-11-22'); await o.wt(200);
        c('日曜：「今週のまとめができたよ」', /今週のまとめができたよ\s*4日できた/.test(await o.ev(`document.getElementById('uaToday').innerText`)));
        // 木曜：カードは出ない・ボタンはある
        await setDay(o, '2026-11-26'); await o.wt(200);
        tx = await o.ev(`document.getElementById('uaToday').innerText`);
        c('木曜：カードは出ない・ボタンから先週のまとめ', !/まとめができたよ/.test(tx) && /先週のまとめ/.test(await o.ev(`document.getElementById('tdWs').textContent`)), tx);
        await o.ev(`document.getElementById('tdWs').click()`); await o.wt(200);
        c('ボタンで開ける', /先週のまとめ/.test(await o.ev(`document.querySelector('.ws-wrap').innerText`)));
      }
      c('エラーなし（まとめ）' + (dark ? '（ダーク）' : ''), !o.errs.length, o.errs.join(' / '));
      await o.ctx.close();
    }
  }
  // ② はじめた週より前はまとめが無い・スタッフが足した1分が先に出る
  {
    const data = base({ ['cards/' + TA + '/plan/me']: plan({ start: '2026-11-23', days: { '2026-11-23': ['am'] } }),
      'ckLes/ANTARES': { L: [{ t: '冬は加湿を', b: '寝る前に加湿器のスイッチを入れる、を毎日の流れに入れてみよう。' }], by: 'x', at: 1 } });
    const o = await P.open(b, { hash: '#c=' + TA, data, wait: 2800, evalHook: true });
    await o.page.addStyleTag({ content: '#toast{display:none!important}' });
    await setDay(o, '2026-11-23'); await o.wt(200);
    const tx = await o.ev(`document.getElementById('uaToday').innerText`);
    c('はじめた週より前の「まとめ」は出ない', !/まとめ/.test(tx), tx);
    c('今日の1分：スタッフが足した分が先に出る', /今日の1分[\s\S]*冬は加湿を/.test(tx), tx);
    await o.ev(`document.getElementById('tdLes').click()`); await o.wt(200);
    c('「スタッフから」と本文', /スタッフから\s*冬は加湿を\s*寝る前に加湿器/.test(await o.ev(`document.querySelector('.ob-wrap').innerText`)));
    await o.page.screenshot({ path: OUT + '/ckob175_les.png' });
    await setDay(o, '2026-11-24'); await o.wt(200);
    c('次の日は もともとの1本目', /小さく始める/.test(await o.ev(`document.getElementById('uaToday').innerText`)));
    c('エラーなし（1分）', !o.errs.length, o.errs.join(' / '));
    await o.ctx.close();
  }
  // ③ スタッフ：今日の1分を足す・消す
  {
    const user = (name) => ({ name, union: 'ANTARES', unionSelectedV2: true, status: 'active', email: name.length + '@example.com', privacy: { ver: '2026-10', at: '2026-10-01T00:00:00Z' } });
    const data = { 'checkinUnions/ANTARES': { name: 'ANTARES', unionAdmins: ['ua1'], dayStaff: ['day1'] }, 'checkinConfig/beauty': { testers: ['day1'] }, 'users/day1': user('見本 でい') };
    const o = await P.open(b, { uid: 'day1', data, wait: 2600 });
    await o.page.addStyleTag({ content: '#toast,#rnPopOv,#gxHint{display:none!important}' });
    await o.page.click('nav button[data-pane="pBeauty"]'); await o.wt(700);
    c('「📖 今日の1分」：足した分 0 / 30', /今日の1分/.test(await o.ev(`document.getElementById('btLs').innerText`)) && /0 \/ 30こ/.test(await o.ev(`document.getElementById('btLs').innerText`)));
    await o.page.fill('#btLsT', '保湿のコツ'); await o.page.fill('#btLsB', 'これで肌の悩みが改善します'); await o.ev(`document.getElementById('btLsGo').click()`); await o.wt(300);
    c('効果をうたう言葉は使えない', !(await o.ev(`!!window.__FBDATA['ckLes/ANTARES']`)) && /効果をうたう言葉（改善）/.test(await o.ev(`document.getElementById('toast').textContent`)));
    await o.page.fill('#btLsT', '冬は加湿を'); await o.page.fill('#btLsB', '寝る前に加湿器のスイッチを入れる、を毎日の流れに入れてみよう。'); await o.ev(`document.getElementById('btLsGo').click()`); await o.wt(500);
    await o.page.fill('#btLsT', '手を温める'); await o.page.fill('#btLsB', 'ケアの前に手のひらを温めると、気持ちよく続けられます。'); await o.ev(`document.getElementById('btLsGo').click()`); await o.wt(500);
    const d = JSON.parse(await o.ev(`JSON.stringify(window.__FBDATA['ckLes/ANTARES'] || null)`));
    c('足す：見出し・本文・足した人（2こ）', d && d.L.length === 2 && d.L[0].t === '冬は加湿を' && d.L[1].t === '手を温める' && d.by === 'day1', JSON.stringify(d));
    c('一覧に出る（2 / 30）', /2 \/ 30こ/.test(await o.ev(`document.getElementById('btLs').innerText`)) && (await o.ev(`document.querySelectorAll('#btLs .bt-lsr').length`)) === 2);
    await o.ev(`document.getElementById('btLs').scrollIntoView()`); await o.page.screenshot({ path: OUT + '/ckob175_staff.png' });
    await o.ev(`document.querySelector('#btLs [data-lsdel="0"]').click()`); await o.wt(500);
    const d2 = JSON.parse(await o.ev(`JSON.stringify(window.__FBDATA['ckLes/ANTARES'] || null)`));
    c('消す：1こ残る', d2 && d2.L.length === 1 && d2.L[0].t === '手を温める', JSON.stringify(d2));
    await o.ev(`document.querySelector('#btLs [data-lsdel="0"]').click()`); await o.wt(500);
    c('全部消すと記録ごと消える', !(await o.ev(`!!window.__FBDATA['ckLes/ANTARES']`)));
    c('エラーなし（スタッフ）', !o.errs.length, o.errs.join(' / '));
    await o.ctx.close();
  }
  await b.close();
  const H = fs.readFileSync(P.R + '/checkin/index.html', 'utf8');
  c('APP_VER v175 以上', (+(H.match(/var APP_VER = 'v(\d+)';/) || [0, 0])[1]) >= 175);
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
