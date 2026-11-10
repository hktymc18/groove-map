// v874：ハウディの日程表からカレンダーにまとめて入れる（AIは使わない）。
//   ① ブックマーク「NAVIGATORに送る」を日程表のページ（架空のページ・本物のサイトには行かない）で押す → コピー → 貼り付け → 確認 → 入れる
//   ② パソコンで表をなぞってコピー → 貼り付け　③「このブラウザで開く」（#hw=…）　名前はすべて架空
const PW = '/opt/node22/lib/node_modules/playwright';
const { chromium } = require(require('fs').existsSync(PW) ? PW : 'playwright');
const fs = require('fs'), path = require('path');
const DIR = path.resolve(__dirname, '../../..'), ST = DIR + '/tools/test/shot', OUT = DIR + '/tools/test/out';
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const SCHED = 'https://www.improveonline.jp/mypage/union/schedule_detail.php?date=2026-11&group=99&mc=1';
const row = (d, c2, t, sp, mc, pl, on, bg) => `<tr style="background:${bg || '#fff'}"><td>${d}</td><td>${c2}</td><td>${t}</td><td>${sp}</td><td>${mc}</td><td>${pl}</td><td>${on ? '<a href="#">利用する</a>' : ''}</td></tr>`;
const FIX = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>2026年11月日程表</title>
<style>body{font:13px sans-serif;margin:8px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:6px;vertical-align:top}</style></head><body>
<div>2026年11月日程表</div><table id="sch"><tr><th></th><th>内容</th><th>時間</th><th>SP</th><th>MC/AC</th><th>会場</th><th>オンライン</th></tr>
${row('11.1', '【EARLY LANDING】<br>NSE-T①<br>NSE-T②', '18:00-<br>※時間注意', '架空 一郎氏', '見本', 'PROGRESS SPACE', 1, '#dff7df')}
${row('11.2', '【EARLY LANDING】<br>ABC-T<br>S-SET', '20:00-', '見本 花子氏', '架空', 'PROGRESS SPACE', 1, '#dff7df')}
${row('11.3', '', '', '', '', '', 0)}
${row('11.5', '(BR-T)', '', '', '', '', 0)}
${row('11.8', 'SEED-T', '15:00-', '架空 次郎BD', '見本', '見本パレス', 1, '#e6e6fb')}
${row('11.11', '【EARLY LANDING】<br>FT<br>BT', '20:00-', '見本 三郎TE', '架空', 'PROGRESS SPACE', 1, '#dff7df')}
${row('11.14', '【TIARA】', '16:00-', '', '', 'PROGRESS SPACE', 0, '#f7f7dc')}
${row('11.26', '【EARLY LANDING】<br>日程の使い方①<br>日程の使い方②<br>-----------------<br>フレッシュEXP<br>※要予約', '20:00-', '見本 四郎BD', '', 'PROGRESS SPACE', 1, '#dff7df')}
${row('11.29', '【GROWTH LANDING】<br>UNIVERSE RIDE', '13:00-', '', '', '見本ふれあいセンター', 0, '#e6e6fb')}
${row('11.30', '', '', '', '', '', 0)}
</table></body></html>`;
async function navPage(b, o) {
  const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: o.w || 390, height: 844 }, deviceScaleFactor: o.dsf || 1, colorScheme: o.dark ? 'dark' : 'light', permissions: ['clipboard-read', 'clipboard-write'] });
  await ctx.addInitScript(() => { if (location.host === 'hktymc18.github.io') window.__FBDATA = window.__FBDATA || {}; });
  const page = await ctx.newPage(), errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await ctx.route('**/*', async (route) => {
    const u = route.request().url();
    if (u.startsWith('https://www.improveonline.jp/')) return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: FIX });
    if (/app\.js/.test(u) && u.indexOf('firebase') < 0) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(DIR + '/app.js') });
    if (u.startsWith('https://hktymc18.github.io/groove-map/') && !/\.(png|js|webmanifest)/.test(u)) return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: fs.readFileSync(DIR + '/index.html') });
    if (u.indexOf('firebase-app-compat.js') >= 0) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(ST + '/fbstub.js', 'utf8') });
    if (u.indexOf('firebasejs') >= 0) return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
    return route.fulfill({ status: 404, body: '' });
  });
  return { ctx, page, errs };
}
async function navGo(page, url) {
  await page.goto(url || 'https://hktymc18.github.io/groove-map/');
  await page.waitForFunction(() => window.state && document.getElementById('loginScreen') && document.getElementById('loginScreen').style.display === 'none' && typeof currentUser !== 'undefined' && currentUser && window._evLoadedUid, null, { timeout: 60000 });
  await page.addStyleTag({ content: '#toast,#rnPopOv{display:none!important}' });
}
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  // ① ブックマーク
  const A = await navPage(b, { dsf: 2 }), pg = A.page;
  await navGo(pg);
  const code = await pg.evaluate(() => _hwBmCode());
  c('ブックマークの文字：javascript: で始まり、「%」と日本語をそのまま含まない（どのブラウザでも崩れない）', /^javascript:void\(\(function _hwBm/.test(code) && code.indexOf('%') < 0 && !/[^\x00-\x7f]/.test(code) && code.indexOf('\n') < 0, code.slice(0, 80));
  await pg.evaluate(() => { switchView('events'); });
  await pg.evaluate(() => openCalSettings()); await pg.waitForTimeout(300);
  c('カレンダーの ⚙ に「日程表から追加」', /ハウディの日程表からまとめて入れる/.test(await pg.evaluate(() => document.getElementById('calSetOv').textContent)));
  await pg.evaluate(() => { closeCalSettings(); hwOpen(); }); await pg.waitForTimeout(300);
  await pg.evaluate(() => { _hw.help = true; _hwRender(); }); await pg.waitForTimeout(200);
  c('入口：手順・貼り付ける欄・ブックマークの登録の手順', await pg.evaluate(() => { var t = document.getElementById('hwOv').textContent; return /NAVIGATORに送る/.test(t) && !!document.getElementById('hwIn') && /iPhone（Safari）/.test(t) && /パソコン/.test(t); }));
  await pg.screenshot({ path: OUT + '/hw874_in.png' });
  await pg.evaluate(() => hwBmCopy()); await pg.waitForTimeout(200);
  c('「ブックマーク用の文字をコピー」でコピーされる', (await pg.evaluate(() => navigator.clipboard.readText())) === code);
  // 日程表のページでブックマークを押す（javascript: の中身を、そのページで動かす）
  const sp = await A.ctx.newPage(); sp.on('pageerror', e => A.errs.push('sched: ' + e.message));
  await sp.goto(SCHED);
  await sp.evaluate((s) => { (0, eval)(decodeURIComponent(s.slice('javascript:'.length))); }, code);
  await sp.waitForTimeout(200);
  c('日程表のページに「◯件を読み取りました」（空いた日は数えない）と「コピーする」', /8件の日程を読み取りました/.test(await sp.evaluate(() => document.getElementById('nvHwBox').textContent)));
  await sp.screenshot({ path: OUT + '/hw874_bm.png' });
  await sp.click('#nvHwCp'); await sp.waitForTimeout(200);
  const clip = await sp.evaluate(() => navigator.clipboard.readText());
  c('「コピーする」で NAVIGATOR日程: ＋ 日程が入る・コピーしましたと出る', clip.indexOf('NAVIGATOR日程:') === 0 && /"ym":"2026-11"/.test(clip) && /コピーしました/.test(await sp.evaluate(() => document.getElementById('nvHwMsg').textContent)), clip.slice(0, 80));
  const href = await sp.evaluate(() => document.querySelector('#nvHwBox a').href);
  // NAVIGATOR に貼り付け
  await pg.bringToFront();
  await pg.evaluate((t) => { document.getElementById('hwIn').value = t; hwRead(); }, clip); await pg.waitForTimeout(200);
  const items = await pg.evaluate(() => _hw.items.map(x => ({ d: x.date, t: x.time, e: x.end, ti: x.title, pl: x.place, m: x.memo, on: x.on, tent: x.tent })));
  c('空いた日は出さない（8件）', items.length === 8, items.length);
  const it1 = items[0];
  c('11/1：名前・時間（終わりは2時間後）・場所・メモ（SP・MC・オンライン・※時間注意）', it1.d === '2026-11-01' && it1.ti === '【EARLY LANDING】NSE-T①・NSE-T②' && it1.t === '18:00' && it1.e === '20:00' && it1.pl === 'PROGRESS SPACE' && /SP：架空 一郎氏/.test(it1.m) && /MC\/AC：見本/.test(it1.m) && /オンライン：あり/.test(it1.m) && /※時間注意/.test(it1.m), JSON.stringify(it1));
  const it5 = items.find(x => x.d === '2026-11-05');
  c('(BR-T)：時間なし・（仮）で最初はチェックなし', it5 && !it5.t && it5.tent && !it5.on, JSON.stringify(it5));
  const it26 = items.find(x => x.d === '2026-11-26');
  c('点線は「／」で区切る', it26 && it26.ti === '【EARLY LANDING】日程の使い方①・日程の使い方②／フレッシュEXP・※要予約', it26 && it26.ti);
  c('自分の予定｜ユニオン予定（管理者）', await pg.evaluate(() => /ユニオン予定（全メンバー）/.test(document.getElementById('hwOv').textContent)));
  await pg.evaluate(() => hwEd(1)); await pg.waitForTimeout(150);
  await pg.evaluate(() => { var i = document.querySelector('.hw-ed input[type=time]'); i.value = '19:30'; i.dispatchEvent(new Event('change')); }); await pg.waitForTimeout(150);
  const e1 = await pg.evaluate(() => JSON.stringify({ t: _hw.items[1].time, e: _hw.items[1].end, n: document.querySelectorAll('.hw-ed input').length }));
  c('押すと直せる（始まりを 19:30 → 終わりは 21:30）', e1 === JSON.stringify({ t: '19:30', e: '21:30', n: 5 }), e1);
  await pg.evaluate(() => hwEd(1)); await pg.waitForTimeout(100);
  await pg.screenshot({ path: OUT + '/hw874_list.png' });
  c('横にはみ出さない', (await pg.evaluate(() => document.documentElement.scrollWidth)) === 390);
  const n0 = await pg.evaluate(() => state.events.length);
  await pg.evaluate(() => hwSave()); await pg.waitForTimeout(300);
  const ev = await pg.evaluate(() => state.events.filter(e => e.hwKey));
  c('入れる：7件（(BR-T) はのぞく）が自分の予定に', ev.length === 7 && (await pg.evaluate(() => state.events.length)) === n0 + 7, ev.length);
  const e11 = ev.find(e => e.date === '2026-11-11');
  c('予定の中身（種類はその他＝FT の予定として数えない・場所・メモ）', e11 && e11.type === 'event' && e11.kind === 'その他' && e11.title === '【EARLY LANDING】FT・BT' && e11.time === '20:00' && e11.endTime === '22:00' && e11.place === 'PROGRESS SPACE' && /SP：見本 三郎TE/.test(e11.memo), JSON.stringify(e11));
  c('保存された（データに入った）', await pg.evaluate((id) => Object.keys(window.__FBDATA || {}).some(k => k.indexOf(id) >= 0), e11.id));
  // もう一度読み込むと「入れ済み」
  await pg.evaluate((t) => { hwOpen(_hwParse(t, '')); }, clip); await pg.waitForTimeout(200);
  c('もう一度入れようとすると「入れ済み」でチェックなし', await pg.evaluate(() => _hw.items.filter(x => x.dup && !x.on).length === 7 && /入れ済み/.test(document.getElementById('hwOv').textContent)));
  // ユニオン予定に入れる
  await pg.evaluate(() => { hwTo('union'); _hw.items.forEach(x => { x.on = x.date === '2026-11-08'; }); window.confirm = () => true; hwSave(); }); await pg.waitForTimeout(300);
  const ue = await pg.evaluate(() => Object.keys(window.__FBDATA).filter(k => /^unions\/[^/]+\/events\/ue_/.test(k)).map(k => window.__FBDATA[k]));
  c('ユニオン予定にも入れられる（管理者）', ue.length === 1 && ue[0].title === 'SEED-T' && ue[0].date === '2026-11-08' && ue[0].time === '15:00' && ue[0].place === '見本パレス', JSON.stringify(ue));
  // ② パソコン：表をなぞってコピー → 貼り付け
  await sp.bringToFront();
  await sp.evaluate(() => { var bx = document.getElementById('nvHwBox'); if (bx) bx.remove(); var r = document.createRange(); r.selectNode(document.getElementById('sch')); var s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('copy'); });
  const cp = await sp.evaluate(async () => { const it = (await navigator.clipboard.read())[0]; const g = async (t) => it.types.indexOf(t) >= 0 ? await (await it.getType(t)).text() : ''; return { html: await g('text/html'), text: await g('text/plain') }; });
  await pg.bringToFront();
  const viaHtml = await pg.evaluate((x) => { var P = _hwParse(x.text, x.html); return P ? _hwItems(P).map(i => i.title + '@' + i.date + ' ' + i.time) : null; }, cp);
  c('パソコン：表をコピーして貼り付け（HTML）でも同じに読める', viaHtml && viaHtml.length === 8 && viaHtml[0] === '【EARLY LANDING】NSE-T①・NSE-T②@2026-11-01 18:00', JSON.stringify(viaHtml));
  const viaTxt = await pg.evaluate((x) => { var P = _hwParse(x.text, ''); return P ? P.rows.filter(r => r.c).map(r => r.d + ':' + _hwTitle(r.c) + ':' + (r.t || '').split('\n')[0] + ':' + (r.pl || '')) : null; }, cp);
  c('文字だけ（タブ区切り）でも、日付・内容・時間・会場が分かれる', viaTxt && viaTxt.length === 8 && viaTxt[0] === '11.1:【EARLY LANDING】NSE-T①・NSE-T②:18:00-:PROGRESS SPACE', JSON.stringify(viaTxt && viaTxt.slice(0, 2)));
  const lt = await pg.evaluate(() => { var P = _hwParse('2026年11月日程表\n11.8\nSEED-T\n15:00-\n見本パレス\n11.9\n【EARLY LANDING】\nT&T①\n20:00-', ''); return P ? _hwItems(P).map(i => i.date + ' ' + i.time + ' ' + i.title.slice(0, 6)) : null; });
  c('区切りのない文字（写真の文字認識など）でも、日付と時間は分かる', lt && lt.length === 2 && lt[0].indexOf('2026-11-08 15:00 SEED-T') === 0 && lt[1].indexOf('2026-11-09 20:00') === 0, JSON.stringify(lt));
  c('貼り付けた時（paste）にそのまま読み取る', await pg.evaluate((x) => { hwOpen(); var dt = new DataTransfer(); dt.setData('text/plain', x.text); dt.setData('text/html', x.html); var ev = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }); document.getElementById('hwIn').dispatchEvent(ev); return !!(_hw && _hw.items && _hw.items.length === 8); }, cp));
  await pg.evaluate(() => hwClose());
  c('ページのエラーなし（NAVIGATOR・日程表のページ）', !A.errs.length, A.errs.join(' / '));
  // ③ このブラウザで開く（#hw=…）
  const B = await navPage(b, { dark: true, dsf: 2 });
  await navGo(B.page, href); await B.page.waitForTimeout(1500);
  c('「このブラウザで NAVIGATOR を開く」：ログインのあと確認の一覧が出る・アドレスの #hw は消える', await B.page.evaluate(() => !!(_hw && _hw.items && _hw.items.length === 8) && location.hash === ''));
  await B.page.screenshot({ path: OUT + '/hw874_list_d.png' });
  c('ページのエラーなし（#hw）', !B.errs.length, B.errs.join(' / '));
  await A.ctx.close(); await B.ctx.close();
  await b.close();
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
