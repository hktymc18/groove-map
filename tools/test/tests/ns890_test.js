// v890：Nu Skin のポイント（GSV）を MAP に取り込む（スキル nuskin-points）。
//   ① スキルの read_table.js が、偽の Nu Skin のページ（本物のサイトには行かない）の表を読む：
//      見出しの固定された表／スクロールで行を出し入れする表／重なった画面（プロキシ）
//   ② nsImport(P)：違う月なら MAP を切り替えてから一覧 → 変わる人・同じ人・見つからない人 → 書き込む
//   名前はすべて架空
const PW = '/opt/node22/lib/node_modules/playwright';
const { chromium } = require(require('fs').existsSync(PW) ? PW : 'playwright');
const fs = require('fs'), path = require('path');
const DIR = path.resolve(__dirname, '../../..'), ST = DIR + '/tools/test/shot', OUT = DIR + '/tools/test/out';
const READER = fs.readFileSync(DIR + '/.claude/skills/nuskin-points/read_table.js', 'utf8');
const OWNER = 'j2DPDAccCygHmR9i5K3bTvHnH0V2';
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };

// ── 偽の Nu Skin のページ ──
const NAMES = ['見本 太郎', '架空 一郎', '架空 二郎', '試験 花子', '外部 三郎'];
for (let i = 0; i < 35; i++) NAMES.push('仮名 ' + String.fromCharCode(0x4e00 + i * 7) + '子');
const ROWS = NAMES.map((n, i) => ({ lv: i === 0 ? 0 : (i % 4) + 1, n, t: i % 3 ? 'ブランド メンバー' : 'ショッピング メンバー', psv: i === 1 ? 66.5 : 0, dc: 0, gsv: [1080.97, 500.4, 120.5, 1559.5, 50][i] !== undefined ? [1080.97, 500.4, 120.5, 1559.5, 50][i] : (i * 13.3) }));
const fmt = v => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const CSS = `body{font:14px sans-serif;margin:0}.bar{padding:20px 40px}.mon{display:inline-block;border:1px solid #ccc;padding:6px 12px}
.g{display:grid;grid-template-columns:120px 420px 80px 300px 110px 110px 110px}.g>div{padding:0 10px;height:58px;display:flex;align-items:center;border-right:1px solid #ddd}
.g>.num{justify-content:flex-end}.hd{background:#eee;font-weight:bold}.fl{flex-direction:column;font-size:9px;line-height:11px}`;
const hdr = `<div class="g hd"><div>レベル</div><div>氏名</div><div>フラグ</div><div>タイトル</div><div class="num">PSV</div><div class="num">DC-SV</div><div class="num">GSV</div></div>`;
const rowHtml = (r, st) => `<div class="g row"${st ? ` style="${st}"` : ''}><div>${r.lv}</div><div style="padding-left:${10 + r.lv * 22}px"><span>${r.n}</span></div><div class="fl"><b>A</b><b>D</b><b>P</b></div><div>${r.t}</div><div class="num">${fmt(r.psv)}</div><div class="num">${fmt(r.dc)}</div><div class="num">${fmt(r.gsv)}</div></div>`;
const sum = `<div class="g"><div></div><div>グループ サイズ: ${ROWS.length}</div><div></div><div></div><div></div><div></div><div class="num">9,999.00</div></div>`;
// A：見出しは固定、行は箱の中でスクロール（全部の行が並んでいる）
const PAGE_A = `<!doctype html><meta charset="utf-8"><style>${CSS}</style><div class="bar"><span class="mon">2026年 11月</span></div>
<div style="margin-left:40px">${hdr}<div id="body" style="height:420px;overflow-y:auto">${ROWS.map(r => rowHtml(r)).join('')}${sum}</div></div><div>最終更新日 2026/11/20</div>`;
// B：スクロールで行を出し入れする表（見えている行だけ作る）
const PAGE_B = `<!doctype html><meta charset="utf-8"><style>${CSS}</style><div class="bar"><span class="mon">2026年 10月</span></div>
<div style="margin-left:40px">${hdr}<div id="vp" style="height:350px;overflow-y:auto;position:relative"><div id="sp" style="height:${ROWS.length * 58}px;position:relative"></div></div></div>
<script>var R=${JSON.stringify(ROWS)};var vp=document.getElementById('vp'),sp=document.getElementById('sp');
var f=${fmt.toString()};var rh=${rowHtml.toString().replace(/fmt\(/g, 'f(')};
function draw(){var a=Math.floor(vp.scrollTop/58),b=Math.min(R.length,a+8);var h='';for(var i=a;i<b;i++)h+=rh(R[i],'position:absolute;left:0;top:'+(i*58)+'px');sp.innerHTML=h;}
vp.addEventListener('scroll',function(){setTimeout(draw,50);});draw();</script>`;
// C：チームの表の上に、プロキシの画面が重なっている（上の画面の表と月を読む）
const TEAM = [{ lv: 0, n: '見本 太郎', t: 'ブランド レプリゼンタティブ', psv: 0, dc: 0, gsv: 1080.97 }, { lv: 1, n: '別人 背景', t: 'ラピス', psv: 0, dc: 0, gsv: 7777 }];
const PROXY = [{ lv: 0, n: '試験 花子', t: 'ラピス', psv: 176, dc: 51.15, gsv: 1559.5 }, { lv: 1, n: '架空 四郎', t: 'ブランド メンバー', psv: 160.4, dc: 67.95, gsv: 228.35 }];
const PAGE_C = `<!doctype html><meta charset="utf-8"><style>${CSS}</style><div class="bar"><span class="mon">2026年 11月</span></div>
<div style="margin-left:40px">${hdr}${TEAM.map(r => rowHtml(r)).join('')}</div>
<div style="position:fixed;left:20px;top:10px;right:20px;bottom:10px;background:#fff;border:1px solid #888;box-shadow:0 0 30px #0005">
<div class="bar"><span class="mon">2026年 9月</span></div><div style="margin-left:20px">${hdr}${PROXY.map(r => rowHtml(r)).join('')}</div></div>`;
// D：本物と同じ作り（2026/11 に本物で確かめた）。月とレベルはプルダウン（select）、表は table（見出しは th > span）で箱ごとスクロール、チームの列の並び（BBLK・GSV・LTSV）
const TEAM_D = NAMES.slice(0, 12).map((n, i) => ({ lv: i % 5, n, t: i % 2 ? 'ラピス' : 'ブランド レプリゼンタティブ', bb: i % 4, gsv: 1000.25 + i * 111.1, ltsv: i ? 2000.5 + i : null }));
const PAGE_D = `<!doctype html><meta charset="utf-8"><style>body{font:14px sans-serif;margin:0}th,td{height:42px;padding:0 10px;text-align:left;white-space:nowrap}thead th{position:sticky;top:0;background:#eee}.num{text-align:right}</style>
<div style="padding:20px 40px"><select><option>2026年 11月</option><option selected>2026年 10月</option><option>2026年 9月</option></select> <label>レベル</label> <select><option>1</option><option selected>全部</option></select></div>
<div class="downlineWrapper" style="margin-left:40px;height:260px;overflow-y:auto"><table style="border-collapse:collapse;width:1100px"><thead><tr><th></th><th><span>レベル</span></th><th><span>氏名</span></th><th><span>フラグ</span></th><th><span>タイトル</span></th><th class="num"><span>BBLK</span></th><th class="num"><span>GSV</span></th><th class="num"><span>LTSV</span></th><th><span>フレックス ブロック</span></th></tr></thead>
<tbody>${TEAM_D.map(r => `<tr><td></td><td>${r.lv}</td><td><span style="padding-left:${r.lv * 20}px">${r.n}</span></td><td>ADP</td><td>${r.t}</td><td class="num">${r.bb}</td><td class="num">${fmt(r.gsv)}</td><td class="num">${r.ltsv === null ? '-' : fmt(r.ltsv)}</td><td>9</td></tr>`).join('')}
<tr><td></td><td></td><td>グループ サイズ: ${TEAM_D.length}</td><td></td><td></td><td></td><td class="num">9,999.00</td><td></td><td></td></tr></tbody></table></div>`;
const PAGES = { a: PAGE_A, b: PAGE_B, c: PAGE_C, d: PAGE_D };

async function newCtx(b, data) {
  const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1400, height: 800 } });
  await ctx.addInitScript((d) => { if (location.host !== 'hktymc18.github.io') return; window.__FBDATA = d; }, data || {});
  await ctx.route('**/*', async (route) => {
    const u = route.request().url();
    const m = /^https:\/\/www\.nuskin\.com\/static\/vgclient\/(\w)/.exec(u);
    if (m) return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: PAGES[m[1]] });
    if (/app\.js/.test(u) && u.indexOf('firebase') < 0) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(DIR + '/app.js') });
    if (u.startsWith('https://hktymc18.github.io/groove-map/') && !/\.(png|js|webmanifest)/.test(u)) return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: fs.readFileSync(DIR + '/index.html') });
    if (u.indexOf('firebase-app-compat.js') >= 0) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(ST + '/fbstub.js', 'utf8') });
    if (u.indexOf('firebasejs') >= 0) return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
    return route.fulfill({ status: 404, body: '' });
  });
  return ctx;
}
async function readPage(ctx, k) {
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('https://www.nuskin.com/static/vgclient/' + k);
  if (k === 'a') await p.evaluate(() => { document.getElementById('body').scrollTop = 200; });
  const r = await p.evaluate(src => (0, eval)(src), READER);
  const after = await p.evaluate(() => { const b = document.getElementById('body'); return b ? b.scrollTop : -1; });
  const again = k === 'd' ? await p.evaluate(() => window.__nsRun()) : null; // 2回目は入れ直さずに読み直せる
  await p.close();
  return { r, errs, after, again };
}
const ymAdd = (ym, d) => { const [y, m] = ym.split('.').map(Number); const i = y * 12 + m - 1 + d; return Math.floor(i / 12) + '.' + String(i % 12 + 1).padStart(2, '0'); };

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  // ① 表を読む
  const ctx0 = await newCtx(b);
  const A = await readPage(ctx0, 'a');
  c('A：全行（' + ROWS.length + '人）を読む・合計の行は入らない・エラーなし', A.r.state === 'done' && A.r.rows.length === ROWS.length && !A.r.rows.some(x => /サイズ/.test(x.n)) && !A.errs.length, JSON.stringify(A.r).slice(0, 300));
  c('A：月・名前・レベル・タイトル・PSV・GSV（3桁区切り・小数）', A.r.ym === '2026.11' && JSON.stringify(A.r.rows[0]) === JSON.stringify({ n: '見本 太郎', lv: 0, t: 'ショッピング メンバー', psv: 0, dc: 0, gsv: 1080.97 }) && A.r.rows[1].psv === 66.5 && A.r.rows[3].gsv === 1559.5, JSON.stringify(A.r.rows.slice(0, 2)));
  c('A：フラグ（A・D・P）は名前に混ざらない', A.r.rows.every(x => !/\bA\b|\bP\b/.test(x.n)));
  c('A：読んだ後、スクロールの位置を元に戻す', A.after === 200, A.after);
  const B = await readPage(ctx0, 'b');
  c('B：見えている行だけの表でも、スクロールして全行を読む（重なりなし・順番どおり）', B.r.state === 'done' && B.r.rows.length === ROWS.length && B.r.rows.map(x => x.n).join() === NAMES.join() && B.r.ym === '2026.10', B.r.rows && B.r.rows.length);
  const C = await readPage(ctx0, 'c');
  c('C：重なった画面（プロキシ）の表と月を読み、後ろの表は読まない', C.r.state === 'done' && C.r.rows.map(x => x.n).join() === '試験 花子,架空 四郎' && C.r.ym === '2026.09' && C.r.rows[1].dc === 67.95, JSON.stringify(C.r).slice(0, 300));
  const Dp = await readPage(ctx0, 'd');
  c('D：本物と同じ作り（table・見出しは th > span）の全行を読む・合計の行は入らない', Dp.r.state === 'done' && Dp.r.rows.map(x => x.n).join() === TEAM_D.map(x => x.n).join() && !Dp.errs.length, JSON.stringify(Dp.r).slice(0, 300));
  c('D：月はプルダウン（select）で選ばれている月を読む', Dp.r.ym === '2026.10', Dp.r.ym);
  c('D：チームの列の並び（BBLK・GSV・LTSV）でも数字がずれない・「-」は数字にしない', Dp.r.rows[3].gsv === TEAM_D[3].gsv && Dp.r.rows[3].bb === 3 && Dp.r.rows[3].ltsv === TEAM_D[3].ltsv && Dp.r.rows[0].ltsv === null, JSON.stringify(Dp.r.rows && [Dp.r.rows[0], Dp.r.rows[3]]));
  c('D：2回目は window.__nsRun() だけで読み直せる', !!Dp.again && Dp.again.state === 'done' && Dp.again.rows.length === TEAM_D.length && Dp.again.ym === '2026.10');
  const p0 = await ctx0.newPage(); await p0.setContent('<p>表のないページ</p>');
  const F = await p0.evaluate(src => (0, eval)(src), READER);
  c('表のないページ：fail と作りだけの診断（名前なし）', F.state === 'fail' && F.diag && F.diag.why === 'no-header' && !F.rows);
  await ctx0.close();

  // ② NAVIGATOR に取り込む（架空の MAP：今月と先月）
  const now = new Date(), cur = now.getFullYear() + '.' + String(now.getMonth() + 1).padStart(2, '0'), prev = ymAdd(cur, -1);
  const mem = (id, ln, fn, title, parentId, ptSelf) => ({ id, lastName: ln, firstName: fn, title, parentId, ptSelf, ptCurrent: 0, mapType: 'current' });
  const tree = () => [mem('r', '見本', '太郎', 'BR', '', 100), mem('a', '架空', '一郎', 'LOI', 'r', 10), mem('b', '架空', '二郎', 'B3', 'a', 5), mem('h', '試験', '花子', 'BR', 'r', 900),
    mem('s', '同名', '二人', 'B2', 'r', 0), mem('s2', '同名', '二人', 'B2', 'r', 0), mem('z', '変化', 'なし', 'B2', 'r', 30), mem('k', '旧姓', '三子', 'B2', 'r', 0)];
  const D0 = {};
  D0['appConfig/features'] = { flags: { nsimp: { on: false, testers: [OWNER] } } }; // 先に見られる人（テスト中）
  D0['maps/' + OWNER + '/months/' + cur + '_current'] = { members: tree(), updatedAt: 'T1' };
  D0['maps/' + OWNER + '/months/' + prev + '_current'] = { members: tree(), updatedAt: 'T1' };
  const ctx = await newCtx(b, D0), pg = await ctx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('https://hktymc18.github.io/groove-map/');
  await pg.waitForFunction(() => window.state && typeof currentUser !== 'undefined' && currentUser && state.members.length === 8 && _fsReady, null, { timeout: 60000 });
  await pg.addStyleTag({ content: '#toast,#rnPopOv{display:none!important}' });
  await pg.evaluate(() => { switchView('current'); });
  const P = { v: 1, ym: prev, rows: [{ lv: 0, n: '見本 太郎', t: 'ブランド レプリゼンタティブ', gsv: 1080.97 }, { lv: 1, n: '架空　一郎', gsv: 500.4 }, { lv: 2, n: '架空二郎', gsv: 120.5 }, { lv: 1, n: '試験 花子', gsv: 1559.5 },
    { lv: 1, n: '同名 二人', gsv: 40 }, { lv: 1, n: '変化 なし', gsv: 30 }, { lv: 1, n: '外部 三郎', gsv: 50 }, { lv: 2, n: '新姓 三子', gsv: 77 }, { lv: 3, n: 'ゼロ 一人', gsv: 0 }] };
  const ret = await pg.evaluate(p => nsImport(p), P);
  c('違う月を開いている時：その月の MAP に切り替える', ret === 'switching');
  await pg.waitForFunction(m => state.currentMonth === m && document.getElementById('nsOv'), prev, { timeout: 15000 }).catch(() => {});
  c('切り替えて読み込んだら、確認の一覧が出る', await pg.evaluate(m => state.currentMonth === m && !!document.getElementById('nsOv') && !!_ns, prev));
  const G = await pg.evaluate(() => { const g = _nsGroups(); const f = a => a.map(x => x.n + ':' + (x.mid || '-')).join(','); return { chg: f(g.chg), same: f(g.same), none: f(g.none), txt: document.getElementById('nsOv').textContent }; });
  c('変わる人（全角の空白・空白なしの名前も合う）', G.chg === '見本 太郎:r,架空　一郎:a,架空二郎:b,試験 花子:h', G.chg);
  c('同じ人・見つからない人（同じ名前が2人の時は自動で合わせない）', G.same === '変化 なし:z' && G.none === '同名 二人:-,外部 三郎:-,新姓 三子:-,ゼロ 一人:-', G.same + ' / ' + G.none);
  c('一覧：今 → 新（四捨五入）・人数のボタン', /4人の GSV を書き込む/.test(G.txt) && /1,081/.test(G.txt) && /1,560/.test(G.txt) && /MAP で見つからない人（ポイントあり）/.test(G.txt), G.txt.slice(0, 200));
  await pg.screenshot({ path: OUT + '/ns890_list.png' });
  // 見つからない人を手で選ぶ（旧姓の人）
  const ki = await pg.evaluate(() => _ns.items.filter(x => x.n === '新姓 三子')[0].i);
  await pg.selectOption('#nsOv select >> nth=' + 2, 'k');
  c('MAP の人を選ぶと「変わる人」に入る', await pg.evaluate(i => _ns.items[i].mid === 'k' && _ns.items[i].on && /5人の GSV を書き込む/.test(document.getElementById('nsOv').textContent), ki));
  await pg.evaluate(() => nsSave()); await pg.waitForTimeout(800);
  const R = await pg.evaluate(() => { const o = {}; state.members.forEach(m => { o[m.id] = [m.ptCurrent, m.ptSelf, m.nsName || '']; }); return { o, last: window._nsLast, ov: !!document.getElementById('nsOv') }; });
  c('書き込み：下の段から順に GSV が入り、上の人の GSV も Nu Skin と同じ（BR はブレイクアウェイ）',
    R.o.b[0] === 121 && R.o.a[0] === 500 && R.o.a[1] === 379 && R.o.h[0] === 1560 && R.o.r[0] === 1081 && R.o.k[0] === 77 && R.o.z[0] === 30 && R.o.s[0] === 0, JSON.stringify(R.o));
  c('手で選んだ人は名前を覚える・_nsLast に月と人数・一覧は閉じる', R.o.k[2] === '新姓三子' && R.last && R.last.ym === prev && R.last.n === 5 && R.last.off === 0 && !R.ov, JSON.stringify(R.last));
  await pg.waitForTimeout(2500);
  const saved = await pg.evaluate(p => (window.__FBDATA[p] || {}).members, 'maps/' + OWNER + '/months/' + prev + '_current');
  c('保存のデータにも入る（その月の MAP）', !!saved && saved.filter(m => m.id === 'r')[0].ptCurrent === 1081 && saved.filter(m => m.id === 'k')[0].nsName === '新姓三子');
  c('今月の MAP は変わらない', (await pg.evaluate(p => (window.__FBDATA[p] || {}).members, 'maps/' + OWNER + '/months/' + cur + '_current')).filter(m => m.id === 'r')[0].ptSelf === 100);
  // 2回目：覚えた名前で自動で合う・同じ月なら切り替えずに開く
  const ret2 = await pg.evaluate(p => nsImport(p), { v: 1, ym: prev, rows: [{ n: '新姓 三子', gsv: 80 }] });
  c('同じ月：すぐ開く・覚えた名前で自動で合う', ret2 === 'open' && await pg.evaluate(() => _ns.items[0].mid === 'k' && _ns.items[0].on));
  await pg.evaluate(() => { nsClose(); setTheme('dark'); nsImport({ v: 1, ym: state.currentMonth, rows: [{ n: '架空 一郎', gsv: 650 }, { n: '外部 三郎', gsv: 50 }] }); });
  await pg.waitForTimeout(400); await pg.screenshot({ path: OUT + '/ns890_dark.png' });
  c('先に見られる人でない時は開かない（テスト中）', await pg.evaluate(() => { nsClose(); const o = _featCfg; _featCfg = { nsimp: { on: false, testers: ['someone'] } }; const r = nsImport({ v: 1, ym: state.currentMonth, rows: [{ n: 'x', gsv: 1 }] }); const ov = !!document.getElementById('nsOv'); _featCfg = o; return r === 'not-enabled' && !ov; }));
  c('お知らせに中身を書かない（全員に出るため）', await pg.evaluate(() => RELEASE_NOTES[0].v === 'v890' && !/Nu Skin/.test(JSON.stringify(RELEASE_NOTES[0]))));
  c('共有MAPを見ている時は開かない', await pg.evaluate(() => { nsClose(); viewingOwnerUid = 'other'; const r = nsImport({ v: 1, ym: state.currentMonth, rows: [{ n: 'x', gsv: 1 }] }); viewingOwnerUid = null; return r === 'not-editable' && !document.getElementById('nsOv'); }));
  c('ページのエラーなし', !errs.length, errs.join(' | '));
  await b.close();
  console.log(fails ? 'FAILED ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log('FAIL: 例外 ' + e.stack); process.exit(1); });
