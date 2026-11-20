// Nu Skin の GSV を1か月分まとめて読み、NAVIGATOR に確認の一覧を出す（スキル nuskin-points）。
// コネクタの Playwright の browser_run_code_unsafe で、filename にこのファイルの絶対パスを渡して実行する。
// 先に、同じタブで window.__nsArgs = { ym: '2026.11' } を置いておく（SKILL.md の手順）。
//
// 返すのは人数だけ（名前は返さない）。読めない時は read_table の diag（作りだけ）。
// 読むだけ。押すのは月・レベルのプルダウン、「ポイントあり」、タブ、人の名前、プロキシのタブ、閉じる（×）だけ。
// 人の名前を押すと「詳細」（住所・連絡先）が先に開くが、中身は読まずにすぐ「プロキシ」に切り替える。
// 書き込みはしない（nsSave は呼ばない）。本人が確認の一覧で「書き込む」を押す。
async (page) => {
  // ↓ read_table.js と同じ中身（テスト ns891 が同じか確かめる。read_table.js を直したら、ここにも同じものを入れる）
  const READER = String.raw`// Nu Skin の会員サイト（販売組織 › グループ／チーム／プロキシ）に出ている表を読む。
// Claude in Chrome の JavaScript ツールで、このファイルの中身をそのまま実行する。
//   ・見出し「氏名」と「GSV」が同じ高さにある表を探し、見出しの位置（左右の端）から列を割り出す
//     （クラス名には頼らないので、画面の作りが少し変わっても読める）
//   ・表を下までスクロールしながら読み、重なった行は除く。終わったら元の位置に戻す
//   ・前に重なった画面（プロキシなど）があれば、いちばん上に見えている表を読む
// 結果は window.__nsRead に入る：{ state:'done', ym:'2026.11', rows:[{lv,n,t,psv,dc,gsv,ltsv,bb}], diag:{…} }
//   読めない時は state:'fail' と diag（作りだけ。名前は入れない）。
// 同じタブで2回目からは window.__nsRun() だけで読み直せる（ページを開き直したら、もう一度このファイルを実行する）。
// 読むだけ。ボタンは押さない。詳細（住所・連絡先）は読まない。
(window.__nsRun = function () {
  var D = document, W = window;
  W.__nsRead = { state: 'running' };
  var LB = ['レベル', '氏名', 'タイトル', 'PSV', 'DC-SV', 'GSV', 'LTSV', 'BBLK'];
  var KY = ['lv', 'n', 't', 'psv', 'dc', 'gsv', 'ltsv', 'bb'];
  function tx(el) { return String(el.textContent || '').replace(/\s+/g, ' ').trim(); }
  function rc(el) { return el.getBoundingClientRect(); }
  function seen(r) { return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < W.innerHeight && r.right > 0 && r.left < W.innerWidth; }
  function onTop(el) {
    var r = rc(el), h = D.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!h && (h === el || el.contains(h) || (h.contains(el) && h !== D.body && h !== D.documentElement));
  }
  function leaf(label) {
    var all = D.getElementsByTagName('*'), out = [];
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (tx(el) !== label) continue;
      var deeper = false;
      for (var j = 0; j < el.children.length; j++) { if (tx(el.children[j]) === label) { deeper = true; break; } }
      if (!deeper && seen(rc(el)) && onTop(el)) out.push(el);
    }
    return out;
  }
  function cell(el) {
    var c = el, p = el.parentNode;
    while (p && p.nodeType === 1 && tx(p) === tx(el) && rc(p).height < 120) { c = p; p = p.parentNode; }
    return c;
  }
  function num(s) { s = String(s || '').replace(/[,\s]/g, ''); return /^-?\d+(\.\d+)?$/.test(s) ? parseFloat(s) : null; }
  function cy(r) { return (r.top + r.bottom) / 2; }
  function path(el) {
    var a = [], g = 0;
    while (el && el.nodeType === 1 && g++ < 8) {
      a.unshift(el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : ''));
      el = el.parentNode;
    }
    return a.join('>');
  }
  var diag = { u: location.host + location.pathname + location.hash, w: W.innerWidth, h: W.innerHeight, tables: D.getElementsByTagName('table').length };
  function fail(why) { diag.why = why; W.__nsRead = { state: 'fail', diag: diag }; return W.__nsRead; }

  // 見出し「氏名」と、同じ高さの「GSV」
  var nh = leaf('氏名'), gh = leaf('GSV'), N = null;
  diag.nameHd = nh.map(path); diag.gsvHd = gh.map(path);
  for (var i = 0; i < nh.length && !N; i++) for (var j = 0; j < gh.length; j++) { if (Math.abs(cy(rc(nh[i])) - cy(rc(gh[j]))) < 30) { N = nh[i]; break; } }
  if (!N) return fail('no-header');
  var NR = rc(N), cols = [];
  LB.forEach(function (lb, k) {
    var c = leaf(lb).filter(function (el) { return Math.abs(cy(rc(el)) - cy(NR)) < 30; })[0];
    if (c) { var r = rc(cell(c)); cols.push({ k: KY[k], l: r.left, r: r.right }); }
  });
  diag.cols = cols.map(function (c) { return c.k + ':' + Math.round(c.l) + '-' + Math.round(c.r); });
  var HC = cell(N);

  // スクロールする箱（無ければページ）
  var probe = D.elementFromPoint((NR.left + NR.right) / 2, Math.min(W.innerHeight - 2, rc(HC).bottom + 24));
  var sc = null, el = probe, g = 0;
  while (el && el.nodeType === 1 && el !== D.body && el !== D.documentElement && g++ < 40) {
    if (el.scrollHeight > el.clientHeight + 4 && /(auto|scroll|overlay)/.test(W.getComputedStyle(el).overflowY || '')) { sc = el; break; }
    el = el.parentNode;
  }
  diag.scroller = sc ? path(sc) : 'window';
  var root = sc;
  if (!root) { root = HC; g = 0; while (root.parentNode && root.parentNode.nodeType === 1 && rc(root).height < rc(HC).height * 4 && g++ < 30) root = root.parentNode; }
  var lvCol = cols.some(function (c) { return c.k === 'lv'; });
  function colOf(x) { for (var q = 0; q < cols.length; q++) { if (x >= cols[q].l && x <= cols[q].r) return cols[q].k; } return ''; }

  // いま見えている行を読む
  var rows = [], keys = {};
  function grab() {
    var t0 = Math.max(rc(HC).bottom, sc ? rc(sc).top : 0), t1 = Math.min(W.innerHeight, sc ? rc(sc).bottom : W.innerHeight);
    var wk = D.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false), nd, its = [], rg = D.createRange();
    while ((nd = wk.nextNode())) {
      var s = String(nd.nodeValue || '').replace(/\s+/g, ' ').trim(); if (!s) continue;
      rg.selectNodeContents(nd); var r = rg.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      var y = cy(r); if (y <= t0 + 1 || y >= t1) continue;
      var c = colOf((r.left + r.right) / 2); if (!c) continue;
      its.push({ c: c, s: s, x: r.left, y: y });
    }
    var an = its.filter(function (it) { return lvCol ? it.c === 'lv' && /^\d+$/.test(it.s) : it.c === 'n'; }).sort(function (a, b) { return a.y - b.y; });
    var gaps = []; for (var q = 1; q < an.length; q++) gaps.push(an[q].y - an[q - 1].y);
    gaps.sort(function (a, b) { return a - b; });
    var tol = gaps.length ? Math.max(8, gaps[Math.floor(gaps.length / 2)] * 0.45) : 18;
    an.forEach(function (a) {
      var o = {};
      KY.forEach(function (kk) {
        var L = its.filter(function (it) { return it.c === kk && Math.abs(it.y - a.y) <= tol; });
        if (L.length) o[kk] = L.sort(function (p, q2) { return p.y - q2.y || p.x - q2.x; }).map(function (z) { return z.s; }).join(' ');
      });
      if (!o.n || /[:：]/.test(o.n)) return; // 「グループ サイズ: 7」などの合計の行
      var row = { n: o.n };
      if (o.lv !== undefined) row.lv = parseInt(o.lv, 10);
      if (o.t) row.t = o.t;
      ['psv', 'dc', 'gsv', 'ltsv', 'bb'].forEach(function (kk) { if (o[kk] !== undefined) row[kk] = num(o[kk]); });
      var key = [row.lv, row.n, row.t, row.psv, row.gsv, row.ltsv].join('|');
      if (!keys[key]) { keys[key] = 1; rows.push(row); }
    });
  }

  // 見ている月（見出しより上で、いちばん近い「2026年 11月」）
  var ym = '', best = 1e9, all = D.getElementsByTagName('*');
  for (var a = 0; a < all.length; a++) {
    var isSel = all[a].tagName === 'SELECT', so = isSel && all[a].selectedIndex >= 0 ? all[a].options[all[a].selectedIndex] : null; // 本物の月はプルダウン（select）。選ばれている月を読む
    var mt = /^(\d{4})\s*年\s*(\d{1,2})\s*月$/.exec(isSel ? (so ? tx(so) : '') : tx(all[a]));
    if (!mt || (!isSel && all[a].children.length > 1)) continue;
    var mr = rc(all[a]); if (!seen(mr) || mr.bottom > NR.top + 5) continue;
    var dd = NR.top - mr.bottom + Math.abs(mr.left - NR.left) / 4;
    if (dd < best && onTop(all[a])) { best = dd; ym = mt[1] + '.' + ('0' + parseInt(mt[2], 10)).slice(-2); }
  }

  var getT = function () { return sc ? sc.scrollTop : (W.pageYOffset || D.documentElement.scrollTop || 0); };
  var setT = function (v) { if (sc) sc.scrollTop = v; else W.scrollTo(0, v); };
  var viewH = sc ? sc.clientHeight : W.innerHeight, start = getT(), n = 0;
  return new Promise(function (res) {
    var finish = function () {
      setT(start);
      diag.rows = rows.length;
      W.__nsRead = rows.length ? { state: 'done', ym: ym, rows: rows, diag: diag } : fail('no-rows');
      res(W.__nsRead);
    };
    var step = function () {
      grab(); n++;
      var t = getT(), mx = sc ? sc.scrollHeight - sc.clientHeight : Math.max(D.documentElement.scrollHeight, D.body.scrollHeight) - W.innerHeight;
      if (t >= mx - 2 || n > 400) { finish(); return; }
      setT(t + Math.max(40, viewH * 0.6));
      if (getT() === t) { finish(); return; }
      setTimeout(step, 350);
    };
    setT(0);
    setTimeout(step, 350);
  });
})();`;
  const NS = 'https://www.nuskin.com/static/vgclient/#/salesOrganization/';
  const NAV = 'https://hktymc18.github.io/groove-map/';
  const T0 = Date.now(), sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const ctx = page.context();
  const args = await page.evaluate(() => window.__nsArgs || null).catch(() => null);
  if (!args || !/^\d{4}\.\d{2}$/.test(String(args.ym || ''))) return { need: 'args', hint: "先に window.__nsArgs = { ym: '2026.11' } を置く" };
  const ym = args.ym, mVal = 'string:' + ym.replace('.', '-');
  const out = { ym, group: null, team: null, proxy: [] };
  const stop = (why, extra) => Object.assign(out, { stop: why, sec: Math.round((Date.now() - T0) / 1000) }, extra || {});

  // ── タブ ──
  const find = (re) => ctx.pages().find((p) => re.test(p.url()));
  let nav = find(/^https:\/\/hktymc18\.github\.io\/groove-map\//);
  if (!nav) { nav = await ctx.newPage(); await nav.goto(NAV); }
  let ns = find(/^https:\/\/www\.nuskin\.com\//);
  if (!ns) { ns = await ctx.newPage(); await ns.goto(NS + 'circleGroup'); }

  // ── NAVIGATOR の準備（ログイン・自分の MAP・テストの「先に見られる人」）──
  let nv = null;
  for (let i = 0; i < 40; i++) {
    nv = await nav.evaluate(() => {
      if (typeof state === 'undefined' || typeof nsImport !== 'function') return { ready: false };
      const user = typeof currentUser !== 'undefined' && !!currentUser;
      return { ready: user && state.members && state.members.length > 0, user, own: !viewingOwnerUid, ed: !!state.isEditor, on: _nsOn() };
    }).catch(() => ({ ready: false }));
    if (nv.ready) break;
    if (i > 6 && nv.user === false) break;
    await sleep(500);
  }
  if (!nv.user) return stop('login-navigator');
  if (!nv.on) return stop('not-enabled');
  if (!nv.own || !nv.ed) return stop('not-own-map');
  const mapKeys = await nav.evaluate(() => {
    const o = {}; _nsMs().forEach((m) => { const k = _nsNorm((m.lastName || '') + (m.firstName || '')); if (k) o[k] = 1; if (m.nsName) o[m.nsName] = 1; }); return o;
  });
  const norm = (s) => { s = String(s || ''); try { s = s.normalize('NFKC'); } catch (e) {} return s.replace(/[\s　・･]/g, '').replace(/髙/g, '高').replace(/﨑/g, '崎').toLowerCase(); };

  // ── Nu Skin の道具 ──
  const onLogin = async () => /\/content\/login\//.test(ns.url()) || await ns.evaluate(() => [].some.call(document.querySelectorAll('input[type=password]'), (e) => !!e.offsetParent)).catch(() => false);
  // いちばん上に見えている画面のプルダウン（後ろの画面の分は使わない）
  const setSelects = () => ns.evaluate(({ mVal }) => {
    const vis = [].filter.call(document.querySelectorAll('select'), (s) => s.offsetParent);
    const ms = vis.filter((s) => [].some.call(s.options, (o) => /^string:\d{4}-\d{2}$/.test(o.value)));
    const ls = vis.filter((s) => [].some.call(s.options, (o) => o.value === 'string:ALL'));
    const m = ms[ms.length - 1], l = ls[ls.length - 1], done = [];
    if (!m || !l) return { ok: false, why: 'no-select', n: vis.length };
    if (![].some.call(m.options, (o) => o.value === mVal)) return { ok: false, why: 'no-month' };
    if (m.value !== mVal) { m.value = mVal; m.dispatchEvent(new Event('change', { bubbles: true })); done.push('m'); }
    if (l.value !== 'string:ALL') { l.value = 'string:ALL'; l.dispatchEvent(new Event('change', { bubbles: true })); done.push('l'); }
    return { ok: true, done, n: vis.length };
  }, { mVal });
  // 「ポイントあり」が付いていたら外す（いちばん上の画面の分）
  const pointsOff = async () => {
    const r = await ns.evaluate(() => {
      const cs = [].filter.call(document.querySelectorAll('input[type=checkbox]'), (c) => c.offsetParent);
      const c = cs[cs.length - 1]; if (!c || !c.checked) return null;
      const b = c.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
    });
    if (r) { await ns.mouse.click(r.x, r.y); await sleep(300); }
  };
  const sizes = () => ns.evaluate(() => (document.body.innerText.match(/グループ\s*サイズ\s*[:：]\s*\d+/g) || []).map((s) => +s.replace(/\D+/g, '')));
  // 表が落ち着くまで待つ（人数の表示が3回続けて同じ）
  const settle = async () => {
    let last = '', same = 0;
    for (let i = 0; i < 60 && same < 3; i++) { await sleep(400); const s = JSON.stringify(await sizes()); if (s === last && s !== '[]') same++; else { same = 0; last = s; } }
  };
  const read = async () => {
    const r = await ns.evaluate(READER);
    return r && r.state === 'done' ? r : { state: 'fail', diag: r && r.diag };
  };
  const readHere = async (what) => {
    const sv = await setSelects(); if (!sv.ok) return { fail: sv.why };
    await settle(); await pointsOff(); await settle();
    const r = await read(); if (r.state !== 'done') return { fail: 'read', diag: r.diag };
    const sz = await sizes(), size = sz.length ? sz[sz.length - 1] : null;
    if (r.ym !== ym) return { fail: 'month', got: r.ym };
    return { rows: r.rows, read: r.rows.length, size, ok: size === r.rows.length };
  };
  // 見えている一番上の画面で、文字がちょうど text の所を押す
  const clickText = async (text, opt) => {
    const at = await ns.evaluate(({ text, last, top }) => {
      const tx = (el) => String(el.textContent || '').replace(/\s+/g, ' ').trim();
      const all = document.getElementsByTagName('*'), hit = [];
      for (let i = 0; i < all.length; i++) {
        const el = all[i]; if (tx(el) !== text) continue;
        if ([].some.call(el.children, (c) => tx(c) === text)) continue;
        if (!el.getClientRects().length) continue;
        el.scrollIntoView({ block: 'center' });
        const b = el.getBoundingClientRect(), h = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        if (h && (h === el || el.contains(h) || h.contains(el))) hit.push({ x: b.left + b.width / 2, y: b.top + b.height / 2 });
      }
      if (top) hit.sort((p, q) => p.y - q.y);
      return hit.length ? hit[last ? hit.length - 1 : 0] : null;
    }, { text, last: !!(opt && opt.last), top: !!(opt && opt.top) });
    if (!at) return false;
    await ns.mouse.click(at.x, at.y); return true;
  };
  const visSelects = () => ns.evaluate(() => [].filter.call(document.querySelectorAll('select'), (s) => s.offsetParent).length);
  // 重なった画面の閉じるボタン：本物は文字の無いアイコン（em.ns-icon-close）。いちばん上（y が小さい）の物を押す（検索の × ではない）
  const clickClose = async () => {
    const at = await ns.evaluate(() => {
      const hit = [];
      document.querySelectorAll('*').forEach((el) => {
        const cls = typeof el.className === 'string' ? el.className : '';
        if (!/(^|\s)(ns-icon-close|close-button)(\s|$)/.test(cls) && !(el.children.length === 0 && String(el.textContent).trim() === '×')) return;
        const b = el.getBoundingClientRect(); if (!b.width || !b.height) return;
        const h = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
        if (h && (h === el || el.contains(h) || h.contains(el))) hit.push({ x: b.left + b.width / 2, y: b.top + b.height / 2 });
      });
      hit.sort((p, q) => p.y - q.y); return hit[0] || null;
    });
    if (!at) return false;
    await ns.mouse.click(at.x, at.y); return true;
  };
  const closeOverlay = async (base) => {
    for (let i = 0; i < 3; i++) {
      if (!(await clickClose())) await ns.keyboard.press('Escape');
      for (let j = 0; j < 10; j++) { await sleep(300); if ((await visSelects()) <= base) return true; }
    }
    return false;
  };
  // 開き直す（# だけ変えても、前に開いた重なった画面が残るため）。残っていたら閉じる
  const go = async (route) => {
    await ns.goto(NS + route); await ns.reload(); await ns.waitForLoadState('domcontentloaded').catch(() => {});
    for (let i = 0; i < 40 && !(await visSelects()); i++) await sleep(250);
    if ((await visSelects()) > 2) await closeOverlay(2);
    return (await visSelects()) === 2;
  };

  // ── グループ ──
  await ns.bringToFront().catch(() => {});
  const okG = await go('circleGroup');
  if (await onLogin()) return stop('login-nuskin');
  if (!okG) return stop('group-not-clean');
  const g = await readHere('group'); if (g.fail) return stop('group-' + g.fail, { diag: g.diag, got: g.got });
  out.group = { read: g.read, size: g.size, ok: g.ok };

  // ── チーム ──
  const okT = await go('executiveBreakaway');
  if (await onLogin()) return stop('login-nuskin');
  if (!okT) return stop('team-not-clean');
  const t = await readHere('team'); if (t.fail) return stop('team-' + t.fail, { diag: t.diag, got: t.got });
  out.team = { read: t.read, size: t.size, ok: t.ok };

  // ── プロキシ（チームの表のレベル1以上の人）──
  const base = await visSelects(), px = [];
  // 名前を押す →「詳細」が先に開く。中身は読まずに、すぐ「プロキシ」へ。開けなければ閉じて、もう1回だけやり直す
  const openProxy = async (name) => {
    if (!(await clickText(name))) return 'no-name';
    let opened = false;
    for (let i = 0; i < 20 && !opened; i++) { await sleep(250); opened = await clickText('プロキシ', { last: true }); }
    if (!opened) return 'no-tab';
    for (let i = 0; i < 40; i++) {
      await sleep(250);
      if ((await visSelects()) > base) return '';
      if (i % 8 === 7) await clickText('プロキシ', { last: true }); // 押した時にまだ切り替わる前だった時
    }
    return 'no-proxy';
  };
  for (const r of t.rows.filter((x) => x.lv >= 1)) {
    let why = await openProxy(r.n);
    if (why && why !== 'no-name') { await closeOverlay(base); why = await openProxy(r.n); }
    if (why) { if (why !== 'no-name') await closeOverlay(base); out.proxy.push({ fail: why }); continue; }
    const p = await readHere('proxy');
    if (p.fail) out.proxy.push({ fail: p.fail, diag: p.diag });
    else { out.proxy.push({ read: p.read, size: p.size, ok: p.ok }); px.push(...p.rows.filter((x) => x.lv !== 0)); }
    if (!(await closeOverlay(base))) return stop('cannot-close');
  }

  // ── まとめる（グループ → チーム → プロキシの順に優先。同じ名前と GSV は1人）──
  const rows = [], seen = {}, nameSeen = {};
  const add = (list, isProxy) => list.forEach((r) => {
    if (!r || !r.n || typeof r.gsv !== 'number') return;
    const k = norm(r.n), kg = k + '|' + r.gsv;
    if (seen[kg]) return;
    if (isProxy && nameSeen[k]) return;           // 数字が違えば先の表を優先
    if (isProxy && !(r.gsv > 0 || mapKeys[k])) return; // 0 で MAP にもいない人は渡さない
    seen[kg] = 1; nameSeen[k] = 1; rows.push({ lv: r.lv, n: r.n, gsv: r.gsv });
  });
  add(g.rows, false); add(t.rows, false); add(px, true);
  out.passed = rows.length;

  // ── NAVIGATOR に確認の一覧を出す ──
  await nav.bringToFront().catch(() => {});
  const ret = await nav.evaluate((P) => nsImport(P), { v: 1, ym, rows });
  out.ret = ret;
  if (ret === 'switching' || ret === 'open') {
    for (let i = 0; i < 60; i++) { if (await nav.evaluate(() => !!document.getElementById('nsOv') && !!_ns).catch(() => false)) break; await sleep(500); }
    Object.assign(out, await nav.evaluate(() => {
      if (!_ns) return { open: false };
      const G = _nsGroups(); return { open: true, chg: G.chg.length, same: G.same.length, none: G.none.length, nonePt: G.none.filter((x) => x.g > 0).length };
    }));
  }
  out.sec = Math.round((Date.now() - T0) / 1000);
  return out;
}
