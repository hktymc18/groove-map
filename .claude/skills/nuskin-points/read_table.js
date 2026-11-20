// Nu Skin の会員サイト（販売組織 › グループ／チーム／プロキシ）に出ている表を読む。
// Claude in Chrome の JavaScript ツールで、このファイルの中身をそのまま実行する。
//   ・見出し「氏名」と「GSV」が同じ高さにある表を探し、見出しの位置（左右の端）から列を割り出す
//     （クラス名には頼らないので、画面の作りが少し変わっても読める）
//   ・表を下までスクロールしながら読み、重なった行は除く。終わったら元の位置に戻す
//   ・前に重なった画面（プロキシなど）があれば、いちばん上に見えている表を読む
// 結果は window.__nsRead に入る：{ state:'done', ym:'2026.11', rows:[{lv,n,t,psv,dc,gsv,ltsv,bb}], diag:{…} }
//   読めない時は state:'fail' と diag（作りだけ。名前は入れない）。
// 読むだけ。ボタンは押さない。詳細（住所・連絡先）は読まない。
(function () {
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
    var mt = /^(\d{4})\s*年\s*(\d{1,2})\s*月$/.exec(tx(all[a]));
    if (!mt || all[a].children.length > 1) continue;
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
})();
