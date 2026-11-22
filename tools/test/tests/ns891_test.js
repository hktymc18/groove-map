// v891：Nu Skin のポイントを、コネクタの Playwright で1か月分まとめて読む（スキル nuskin-points の ns_run.js）。
//   偽の Nu Skin（本物のサイトには行かない）：グループ／チームの表、月とレベルのプルダウン、「ポイントあり」、
//   名前を押すと「詳細」が先に開き「プロキシ」に切り替える重なった画面（閉じるは本物と同じ文字の無いアイコン。検索の × は押さない）。名前はすべて架空。
//   ① 人数・月・プロキシの重なり・0 の人の絞り方 ② 返り値に名前・詳細の中身が入らない ③ NAVIGATOR に確認の一覧
//   ④ ログイン画面・月が無い・引数が無い時は止まる ⑤ ns_run.js に埋め込んだ読み取りが read_table.js と同じ
const PW = '/opt/node22/lib/node_modules/playwright';
const { chromium } = require(require('fs').existsSync(PW) ? PW : 'playwright');
const fs = require('fs'), path = require('path');
const DIR = path.resolve(__dirname, '../../..'), ST = DIR + '/tools/test/shot', SK = DIR + '/.claude/skills/nuskin-points';
const RUN = fs.readFileSync(SK + '/ns_run.js', 'utf8'), READER = fs.readFileSync(SK + '/read_table.js', 'utf8');
const OWNER = 'j2DPDAccCygHmR9i5K3bTvHnH0V2';
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };

const ymAdd = (ym, d) => { const [y, m] = ym.split('.').map(Number); const i = y * 12 + m - 1 + d; return Math.floor(i / 12) + '.' + String(i % 12 + 1).padStart(2, '0'); };
const now = new Date(), CUR = now.getFullYear() + '.' + String(now.getMonth() + 1).padStart(2, '0'), PREV = ymAdd(CUR, -1);
const SECRET = '秘密の住所ABC';

// ── 偽の Nu Skin の中身（月ごと。前の月は GSV が半分）──
const GROUP = [[0, '見本 太郎', 1080.97], [1, '架空 一郎', 500.4], [2, '架空 二郎', 120.5], [1, 'ゼロ 花子', 0], [1, '外部 三郎', 50]];
const TEAM = [[0, '見本 太郎', 1080.97], [1, '上位 番頭', 1559.5], [2, '下位 番頭', 900]];
const PROXY = {
  '上位 番頭': [[0, '上位 番頭', 1559.5], [1, '配下 四郎', 228.35], [1, '配下 ゼロ', 0], [1, '無名 ゼロ', 0], [1, '下位 番頭', 900], [2, '下位配下 五郎', 77]],
  '下位 番頭': [[0, '下位 番頭', 900], [1, '下位配下 五郎', 77], [1, '外部 六子', 33]],
};
const ALLNAMES = [].concat(GROUP, TEAM, PROXY['上位 番頭'], PROXY['下位 番頭']).map((r) => r[1]);
const PAGE = `<!doctype html><meta charset="utf-8"><style>body{font:14px sans-serif;margin:0}th,td{height:40px;padding:0 10px;text-align:left;white-space:nowrap}
thead th{position:sticky;top:0;background:#eee}.num{text-align:right}.bar{padding:16px 40px}.ov{position:fixed;left:30px;right:30px;top:10px;bottom:10px;background:#fff;border:1px solid #888;overflow:hidden}
.tabs span{display:inline-block;padding:8px 14px;cursor:pointer}.x{position:absolute;right:8px;top:2px;cursor:pointer;width:14px;height:17px;background:#333}</style>
<div id="app"></div>
<script>
var D = ${JSON.stringify({ GROUP, TEAM, PROXY, CUR, PREV, SECRET })};
var S = { m: D.CUR, lv: '1', pts: true }, P = null; // P = 重なった画面 { who, tab, m, lv, pts }
function fmt(v){ return v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function rowsOf(list, m, lv, pts){ var k = m === D.CUR ? 1 : 0.5; return list.map(function(r){ return [r[0], r[1], Math.round(r[2]*k*100)/100]; }).filter(function(r){ return (lv === 'ALL' || r[0] <= +lv) && (!pts || r[2] > 0); }); }
function bar(st, id){ var o = [D.CUR, D.PREV, '2025.01'].map(function(m){ var v='string:'+m.replace('.','-'); return '<option value="'+v+'"'+(st.m===m?' selected':'')+'>'+(+m.slice(0,4))+'年 '+(+m.slice(5))+'月</option>'; }).join('');
  var l = ['1','2','3'].map(function(v){ return '<option value="number:'+v+'"'+(st.lv===v?' selected':'')+'>'+v+'</option>'; }).join('') + '<option value="string:ALL"'+(st.lv==='ALL'?' selected':'')+'>全部</option>';
  return '<div class="bar"><select data-k="'+id+'m">'+o+'</select> <label>レベル</label> <select data-k="'+id+'l">'+l+'</select> <label>ポイントあり <input type="checkbox" data-k="'+id+'p"'+(st.pts?' checked':'')+'></label> <input placeholder="検索"><span>×</span></div>'; }
function table(rows, team){ var hd = team ? ['レベル','氏名','フラグ','タイトル','BBLK','GSV','LTSV'] : ['レベル','氏名','フラグ','タイトル','PSV','DC-SV','GSV'];
  var h = '<div class="downlineScroller" style="margin-left:40px;height:230px;overflow-y:auto"><table style="border-collapse:collapse;width:1000px"><thead><tr>' + hd.map(function(x){ return '<th><span>'+x+'</span></th>'; }).join('') + '</tr></thead><tbody>';
  rows.forEach(function(r){ h += '<tr><td>'+r[0]+'</td><td><span class="nm" style="padding-left:'+(r[0]*16)+'px">'+r[1]+'</span></td><td>ADP</td><td>'+(team?'ブランド レプリゼンタティブ':'ブランド メンバー')+'</td>' + (team ? '<td class="num">1</td><td class="num">'+fmt(r[2])+'</td><td class="num">-</td>' : '<td class="num">0.00</td><td class="num">0.00</td><td class="num">'+fmt(r[2])+'</td>') + '</tr>'; });
  return h + '<tr><td></td><td>グループ サイズ: '+rows.length+'</td></tr></tbody></table></div>'; }
function draw(){ var team = /executiveBreakaway/.test(location.hash);
  var h = '<div class="tabs" style="padding:10px 40px"><span>グループ</span><span>チーム</span></div>' + bar(S, 'o') + table(rowsOf(team ? D.TEAM : D.GROUP, S.m, S.lv, S.pts), team);
  if (P) { h += '<div class="ov"><em class="x ns-icon-close size-large"></em><h2 style="margin:8px 20px">'+P.who+'</h2><div class="tabs" style="padding:0 20px"><span data-t="d">詳細</span><span data-t="p">プロキシ</span><span>履歴</span></div>';
    if (P.tab === 'd') h += '<div style="padding:20px"><div>氏名 '+P.who+'</div><div>住所 '+D.SECRET+'</div><div>GSV 0</div></div>';
    else h += bar(P, 'p') + table(rowsOf(D.PROXY[P.who] || [], P.m, P.lv, P.pts), false);
    h += '</div>'; }
  document.getElementById('app').innerHTML = h; }
function later(f){ setTimeout(function(){ f(); draw(); }, 250); }
document.addEventListener('change', function(e){ var k = e.target.getAttribute('data-k'); if (!k) return; var st = k[0] === 'o' ? S : P, v = e.target.value;
  later(function(){ if (k[1] === 'm') st.m = v.replace('string:','').replace('-','.'); if (k[1] === 'l') st.lv = v.replace('number:','').replace('string:',''); if (k[1] === 'p') st.pts = e.target.checked; }); });
document.addEventListener('click', function(e){ var t = e.target;
  if (t.classList.contains('nm') && /executiveBreakaway/.test(location.hash) && !P) { var who = t.textContent; later(function(){ P = { who: who, tab: 'd', m: S.m, lv: '1', pts: true }; }); }
  else if (t.getAttribute('data-t')) { var tb = t.getAttribute('data-t'); later(function(){ P.tab = tb; }); }
  else if (t.classList.contains('x')) { P = null; draw(); } });
window.addEventListener('hashchange', function(){ draw(); }); // 本物と同じく、# が変わっても重なった画面は残る
draw();
</script>`;
const LOGIN = '<!doctype html><meta charset="utf-8"><h1>ログイン</h1><input type="text"><input type="password"><button>サインイン</button>';

async function newCtx(b, data, opt) {
  const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1400, height: 800 } });
  await ctx.addInitScript((d) => { if (location.host !== 'hktymc18.github.io') return; window.__FBDATA = d; }, data || {});
  await ctx.route('**/*', async (route) => {
    const u = route.request().url();
    if (/^https:\/\/www\.nuskin\.com\/static\/vgclient\//.test(u)) {
      if (opt && opt.login) return route.fulfill({ status: 302, headers: { location: 'https://www.nuskin.com/content/login/corporate/ja.html' }, body: '' });
      return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: PAGE });
    }
    if (/^https:\/\/www\.nuskin\.com\/content\/login\//.test(u)) return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: LOGIN });
    if (/app\.js/.test(u) && u.indexOf('firebase') < 0) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(DIR + '/app.js') });
    if (u.startsWith('https://hktymc18.github.io/groove-map/') && !/\.(png|js|webmanifest)/.test(u)) return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: fs.readFileSync(DIR + '/index.html') });
    if (u.indexOf('firebase-app-compat.js') >= 0) return route.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(ST + '/fbstub.js', 'utf8') });
    if (u.indexOf('firebasejs') >= 0) return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
    return route.fulfill({ status: 404, body: '' });
  });
  return ctx;
}
const runFn = (0, eval)('(' + RUN + ')');
// コネクタと同じ：今のタブに引数を置いてから、ファイルの関数に page を渡す
async function run(page, args) { if (args) await page.evaluate((a) => { window.__nsArgs = a; }, args); return runFn(page); }

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
  // ⑤ 埋め込みの読み取りが read_table.js と同じ
  c('ns_run.js に埋め込んだ読み取りが read_table.js と同じ', RUN.indexOf('String.raw`' + READER.replace(/\n$/, '') + '`') >= 0);

  const mem = (id, ln, fn, title, parentId) => ({ id, lastName: ln, firstName: fn, title, parentId, ptSelf: 0, ptCurrent: 0, mapType: 'current' });
  const tree = () => [mem('r', '見本', '太郎', 'BR', ''), mem('a', '架空', '一郎', 'LOI', 'r'), mem('b', '架空', '二郎', 'B3', 'a'), mem('u', '上位', '番頭', 'BR', 'r'),
    mem('d', '下位', '番頭', 'BR', 'u'), mem('s', '配下', '四郎', 'B2', 'u'), mem('z', '配下', 'ゼロ', 'B2', 'u')];
  const D0 = {};
  D0['appConfig/features'] = { flags: { nsimp: { on: false, testers: [OWNER] } } };
  D0['maps/' + OWNER + '/months/' + CUR + '_current'] = { members: tree(), updatedAt: 'T1' };
  D0['maps/' + OWNER + '/months/' + PREV + '_current'] = { members: tree(), updatedAt: 'T1' };
  const ctx = await newCtx(b, D0), errs = [];
  ctx.on('page', (p) => p.on('pageerror', (e) => errs.push(e.message)));
  const nav = await ctx.newPage();
  await nav.goto('https://hktymc18.github.io/groove-map/');
  await nav.waitForFunction(() => window.state && typeof currentUser !== 'undefined' && currentUser && state.members.length === 7 && _fsReady, null, { timeout: 60000 });
  await nav.addStyleTag({ content: '#toast,#rnPopOv{display:none!important}' });
  await nav.evaluate(() => { switchView('current'); });

  // ④ 引数が無い
  const blank = await ctx.newPage();
  const A0 = await runFn(blank);
  c('引数が無い時は止まる（何も開かない）', A0 && A0.need === 'args' && ctx.pages().length === 2, JSON.stringify(A0));

  // ①②③ 本番の流れ（前の月 → NAVIGATOR が月を切り替える）
  const R = await run(blank, { ym: PREV });
  const js = JSON.stringify(R);
  c('グループ：全部・ポイント0の人も読む（人数が「グループ サイズ」と合う）', R.group && R.group.read === GROUP.length && R.group.size === GROUP.length && R.group.ok, js);
  c('チーム：全部を読む', R.team && R.team.read === TEAM.length && R.team.ok, js);
  c('プロキシ：レベル1以上の2人分を読み、人数が合う', R.proxy.length === 2 && R.proxy.every((p) => p.ok) && R.proxy[0].read === 6 && R.proxy[1].read === 3, JSON.stringify(R.proxy));
  c('まとめ：重なりを除き、0 で MAP にいない人は渡さない（11人）', R.passed === 11, R.passed);
  c('NAVIGATOR：その月に切り替えて確認の一覧（変わる6・同じ1・見つからない4・うちポイントあり3）', R.ret === 'switching' && R.open && R.chg === 6 && R.same === 1 && R.none === 4 && R.nonePt === 3, js);
  c('返り値に名前が入らない', !ALLNAMES.some((n) => js.indexOf(n) >= 0), js);
  c('「詳細」の中身は読まない（返り値に無い）', js.indexOf(SECRET) < 0);
  const nv = await nav.evaluate((m) => ({ cur: state.currentMonth, ov: !!document.getElementById('nsOv'), g: _ns && _ns.items.filter((x) => x.n === '上位 番頭')[0].g, saved: window._nsLast || null }), PREV);
  c('NAVIGATOR：月・一覧・数字（前の月は半分）・書き込みはしない', nv.cur === PREV && nv.ov && nv.g === 780 && nv.saved === null, JSON.stringify(nv));
  const ns = ctx.pages().find((p) => /nuskin/.test(p.url()));
  c('Nu Skin の重なった画面は閉じてある', ns && await ns.evaluate(() => !document.querySelector('.ov')));

  // 前の回で重なった画面が残っていても、開き直して正しく読む（2026/11 に本物で起きた）
  await ns.evaluate(() => { location.hash = '#/salesOrganization/executiveBreakaway'; });
  await ns.waitForTimeout(300);
  await ns.mouse.click(...await ns.evaluate(() => { const e = [].find.call(document.querySelectorAll('.nm'), (x) => x.textContent === '上位 番頭'); const b = e.getBoundingClientRect(); return [b.left + 5, b.top + 5]; }));
  await ns.waitForTimeout(500);
  const R2 = await run(blank, { ym: PREV });
  c('前の重なった画面が残っていても、グループ・チームを取り違えない', R2.group && R2.group.read === GROUP.length && R2.team && R2.team.read === TEAM.length && R2.passed === 11, JSON.stringify(R2));

  // ④ 頼んだ月が Nu Skin に無い
  const M = await run(blank, { ym: '2024.03' });
  c('Nu Skin に無い月は止まる', M.stop === 'group-no-month', JSON.stringify(M));
  await ctx.close();

  // ④ Nu Skin がログイン画面
  const ctx2 = await newCtx(b, D0, { login: true });
  const nav2 = await ctx2.newPage();
  await nav2.goto('https://hktymc18.github.io/groove-map/');
  await nav2.waitForFunction(() => window.state && typeof currentUser !== 'undefined' && currentUser && state.members.length === 7 && _fsReady, null, { timeout: 60000 });
  const L = await run(nav2, { ym: CUR });
  c('Nu Skin がログイン画面なら止まる（パスワードは入れない）', L.stop === 'login-nuskin' && await ctx2.pages().find((p) => /nuskin/.test(p.url())).evaluate(() => document.querySelector('input[type=password]').value === ''), JSON.stringify(L));
  await ctx2.close();

  c('ページのエラーなし', !errs.length, errs.join(' | '));
  await b.close();
  console.log(fails ? 'FAILED ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.log('FAIL: 例外 ' + e.stack); process.exit(1); });
