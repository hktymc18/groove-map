// 受付 v174：NAVIGATOR Beauty 第3弾（架空データ）
//   今日の美容ポイント・昨日の結果発表・1日1分・今月のチャレンジ（スタッフが決める）・（自分だけの写真は v183 で終わり）・
//   あなたのタイプ（PRYSMiO の色）・シェア画像・アンバサダーのバッジ
const path = require('path'), fs = require('fs');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const pad = n => (n < 10 ? '0' : '') + n, ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };
const TA = '0123456789abcdef0123456789abcdef', UA = 'u17620000000001', T = day(0), MO = T.slice(0, 7);
const card = (x) => Object.assign({ kind: 'user', no: UA, name: '見本 はなこ', union: 'ANTARES', active: true, visits: 2 }, x || {});
const plan = (x) => Object.assign({ course: 'yuragi', why: '夏までにきれいになりたい', qs: ['am', 'pm', 'moist'], when: { am: 'am', pm: 'bed', moist: 'bed' }, lvl: 'std', wk: 4, ob: 1, start: day(-20), days: {}, atMs: 1 }, x || {});
const base = (x) => Object.assign({ ['cards/' + TA]: card(), ['cardClaims/' + UA]: { t: TA } }, x || {});
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAIAAAA2iEnWAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAAZ+wH9z9cS9gAAAABJRU5ErkJggg==', 'base64');
(async () => {
  const b = await P.browser();
  // ① 今日の美容ポイント・1日1分・今月のチャレンジ
  {
    const days = { [T]: ['am', 'pm'], [day(-1)]: ['am'], [day(-2)]: ['am'] };
    const data = base({ ['cards/' + TA + '/plan/me']: plan({ days }), 'ckChal/ANTARES': { m: MO, t: '保湿月間', g: 20, by: 'x', at: 1 } });
    for (const dark of [false, true]) {
      const o = await P.open(b, { dark, hash: '#c=' + TA, data, wait: 3000 });
      await o.page.addStyleTag({ content: '#toast{display:none!important}' });
      let tx = await o.ev(`document.getElementById('uaToday').innerText`);
      c('今日の美容ポイント：2/3 → 47・3日連続 → +3 ＝ 50 / 100・7日の棒' + (dark ? '（ダーク）' : ''), /今日の美容ポイント\s*50\s*\/ 100/.test(tx) && (await o.ev(`document.querySelectorAll('#uaToday .td-bars i').length`)) === 7, tx);
      const cn = Object.keys(days).filter(k => k.slice(0, 7) === MO).length;
      c('今月のチャレンジ：テーマと「チェックした日 ○ / 20日」', /今月のチャレンジ\s*\d+ \/ 20日/.test(tx) && tx.indexOf(cn + ' / 20日') >= 0 && /保湿月間/.test(tx), tx);
      c('今日の1分（タイトル・+10ポイント）', /今日の1分\s*\+10ポイント/.test(tx));
      if (!dark) {
        await o.ev(`document.getElementById('tdLes').click()`); await o.wt(200);
        c('1分を開くと、キャラが内容を話す', /今日の1分/.test(await o.ev(`document.querySelector('.ob-wrap').innerText`)));
        await o.ev(`document.getElementById('lesOk').click()`); await o.wt(300);
        tx = await o.ev(`document.getElementById('uaToday').innerText`);
        c('「読んだ」で +10（60）・「読んだ ✓」', /今日の美容ポイント\s*60\s*\/ 100/.test(tx) && /読んだ ✓/.test(tx), tx);
        c('読んだ日は端末に覚える（カードごと）', /"\d{4}-\d{2}-\d{2}":1/.test(await o.ev(`localStorage.getItem('bci_les_${TA}')`)));
      }
      await o.page.screenshot({ path: OUT + '/ckob174_today' + (dark ? '_d' : '') + '.png', fullPage: true });
      c('エラーなし（今日）' + (dark ? '（ダーク）' : ''), !o.errs.length, o.errs.join(' / '));
      await o.ctx.close();
    }
  }
  // ② 昨日の結果発表（今日まだの時）・先月のチャレンジは出ない
  {
    const o = await P.open(b, { hash: '#c=' + TA, data: base({ ['cards/' + TA + '/plan/me']: plan({ days: { [day(-1)]: ['am', 'pm', 'moist'] } }), 'ckChal/ANTARES': { m: '2000-01', t: '昔のテーマ', g: 10 } }), wait: 2800 });
    const tx = await o.ev(`document.getElementById('uaToday').innerText`);
    c('今日まだ → 昨日の結果発表（全部できた・1日連続 ＝ 81点）', /昨日の結果発表\s*81\s*点/.test(tx), tx);
    c('先月のチャレンジは出ない', !/昔のテーマ/.test(tx));
    await o.ctx.close();
  }
  // ③ v183：自分だけの写真は終わり。案内も欄も出さず、スマホの中に残っている写真（IndexedDB nb_photo）を1回だけ消す
  {
    const o = await P.open(b, { hash: '#c=' + TA, data: base({ ['cards/' + TA + '/plan/me']: plan({ days: { [T]: ['am'] } }) }), wait: 2800 });
    c('「今日」に写真の案内は出ない', !/今週の1枚/.test(await o.ev(`document.getElementById('uaToday').innerText`)));
    await o.page.click('#uaTabs [data-tab="me"]'); await o.wt(300);
    c('マイページに写真の欄は無い', !(await o.ev(`!!document.getElementById('phArea')`)) && !/MY PHOTO/.test(await o.ev(`document.body.innerText`)));
    // 前のバージョンで撮った写真が残っている端末 → 開き直すと消える
    await o.ev(`new Promise(function(ok){ var r = indexedDB.open('nb_photo', 1); r.onupgradeneeded = function(){ r.result.createObjectStore('p', { keyPath: 'id' }); };
      r.onsuccess = function(){ var t = r.result.transaction('p', 'readwrite'); t.objectStore('p').put({ id: '${TA}|${day(-21)}', tk: '${TA}', d: '${day(-21)}', u: 'data:image/png;base64,${PNG.toString('base64')}' }); t.oncomplete = function(){ r.result.close(); ok(); }; }; })`);
    c('（準備）写真の入れ物がある', (await o.ev(`indexedDB.databases().then(function(a){ return a.some(function(x){ return x.name === 'nb_photo'; }); })`)) === true);
    await o.ev(`localStorage.removeItem('bci_ph_gone')`);
    await o.page.reload(); await o.wt(2800);
    c('開き直すと、スマホの中の写真の入れ物を消す', (await o.ev(`indexedDB.databases().then(function(a){ return a.some(function(x){ return x.name === 'nb_photo'; }); })`)) === false);
    c('エラーなし（写真の終わり）', !o.errs.length, o.errs.join(' / '));
    await o.ctx.close();
  }
  // ④ あなたのタイプ・シェア画像・アンバサダー
  {
    const days = {}; for (let i = 0; i < 31; i++) days[day(-i)] = ['am'];
    const data = base({ ['cards/' + TA]: card({ visits: 3, pz_e1: { v: 820, d: day(-5), ev: 'DAY', at: 1 }, inv_u9: { n: '見本 さくら', d: day(-5), ev: 'DAY' } }),
      ['cards/' + TA + '/plan/me']: plan({ days, start: day(-40) }) });
    const o = await P.open(b, { hash: '#c=' + TA, data, wait: 3000 });
    await o.page.addStyleTag({ content: '#toast{display:none!important}' });
    await o.page.click('#uaTabs [data-tab="me"]'); await o.wt(300);
    const pz = await o.ev(`document.getElementById('pzArea').innerText`);
    c('あなたのタイプ：パープルタイプ「気品のラベンダー」', /あなたは\s*パープルタイプ「気品のラベンダー」/.test(pz), pz);
    await o.page.screenshot({ path: OUT + '/ckob174_type.png' });
    await o.ev(`document.getElementById('pzShare').click()`); await o.wt(1500);
    c('シェア画像を作る（名前は入れない・招待のリンクを作る）', !!(await o.ev(`!!document.querySelector('.modal img[alt="シェア画像"]')`)) && !!(await o.ev(`Object.keys(window.__FBDATA).some(function(k){ return /^ckJoin\\/f_/.test(k); })`)));
    const png = await o.ev(`document.querySelector('.modal img[alt="シェア画像"]').src.slice(0, 22)`);
    c('画像は PNG（1080×1920）', png === 'data:image/png;base64,' && (await o.ev(`new Promise(function(ok){ var i = new Image(); i.onload = function(){ ok(i.width + 'x' + i.height); }; i.src = document.querySelector('.modal img[alt="シェア画像"]').src; })`)) === '1080x1920');
    await o.page.screenshot({ path: OUT + '/ckob174_share.png' });
    await o.ev(`document.getElementById('shClose').click()`);
    await o.page.click('#uaTabs [data-tab="plan"]'); await o.wt(300);
    c('アンバサダーのバッジ（30日続いた・3回来場・友だちが来てくれた）', await o.ev(`[].some.call(document.querySelectorAll('#mpArea .mp-bd span.on'), function(s){ return /アンバサダー/.test(s.textContent); })`));
    c('エラーなし（タイプ）', !o.errs.length, o.errs.join(' / '));
    await o.ctx.close();
  }
  // ⑤ スタッフ：今月のチャレンジを出す・直す・やめる
  {
    const user = (name) => ({ name, union: 'ANTARES', unionSelectedV2: true, status: 'active', email: name.length + '@example.com', privacy: { ver: '2026-10', at: '2026-10-01T00:00:00Z' } });
    const data = { 'checkinUnions/ANTARES': { name: 'ANTARES', unionAdmins: ['ua1'], dayStaff: ['day1'] }, 'checkinConfig/beauty': { testers: ['day1'] }, 'users/day1': user('見本 でい') };
    const o = await P.open(b, { uid: 'day1', data, wait: 2600 });
    await o.page.addStyleTag({ content: '#toast,#rnPopOv,#gxHint{display:none!important}' });
    await o.page.click('nav button[data-pane="pBeauty"]'); await o.wt(700);
    c('「🗓 今月のチャレンジ」はまだ', /今月のチャレンジ/.test(await o.ev(`document.getElementById('btCh').innerText`)) && /まだありません/.test(await o.ev(`document.getElementById('btCh').innerText`)));
    await o.page.fill('#btChT', 'これで肌が改善'); await o.ev(`document.getElementById('btChGo').click()`); await o.wt(300);
    c('効果をうたう言葉は使えない', !(await o.ev(`!!window.__FBDATA['ckChal/ANTARES']`)) && /効果をうたう言葉（改善）/.test(await o.ev(`document.getElementById('toast').textContent`)));
    await o.page.fill('#btChT', '12月は保湿月間'); await o.page.fill('#btChG', '18'); await o.ev(`document.getElementById('btChGo').click()`); await o.wt(500);
    const ch = JSON.parse(await o.ev(`JSON.stringify(window.__FBDATA['ckChal/ANTARES'] || null)`));
    c('出す：今月・テーマ・日数・出した人', ch && ch.m === MO && ch.t === '12月は保湿月間' && ch.g === 18 && ch.by === 'day1', JSON.stringify(ch));
    c('今出ているチャレンジが表示される', /今出ている：12月は保湿月間（18日）/.test(await o.ev(`document.getElementById('btCh').innerText`)));
    await o.ev(`document.getElementById('btCh').scrollIntoView()`); await o.page.screenshot({ path: OUT + '/ckob174_staff.png' });
    await o.ev(`document.getElementById('btChDel').click()`); await o.wt(500);
    c('やめる：消える', !(await o.ev(`!!window.__FBDATA['ckChal/ANTARES']`)));
    c('エラーなし（スタッフ）', !o.errs.length, o.errs.join(' / '));
    await o.ctx.close();
  }
  await b.close();
  const H = fs.readFileSync(P.R + '/checkin/index.html', 'utf8');
  c('1日1分は効果をうたわない（効果をうたう言葉が入っていない）', !/治る|治った|効く|効果|やせ|痩せ|改善|病気|薬|アトピー/.test((H.match(/var CK_LESSONS = \[[\s\S]*?\n\];/) || [''])[0]));
  c('あなたのタイプも効果をうたわない', !/治る|効く|効果|やせ|痩せ|改善|病気|薬/.test((H.match(/var CK_TYPES = \{[\s\S]*?\};/) || [''])[0]));
  c('APP_VER v174 以上', (+(H.match(/var APP_VER = 'v(\d+)';/) || [0, 0])[1]) >= 174);
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
