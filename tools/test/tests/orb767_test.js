// v767 #6：サークルMAP（計画シート・MAPの◎サークル）の線：別の親の線どうしが交差しない・重なる親のくしは高さを変える（1本につながらない）・他の人の丸を突き抜けない
const T = require('../lib/head.js')({ timeout: 120000 });
const { w, c, sleep, setWH } = T;
const segs = d => { const p = []; d.replace(/[ML]\s*([-\d.]+),([-\d.]+)/g, (_, x, y) => p.push([+x, +y])); const s = []; for (let i = 1; i < p.length; i++) s.push([p[i - 1], p[i]]); return s; };
const inter = ([p, p2], [q, q2]) => { const r = [p2[0] - p[0], p2[1] - p[1]], s = [q2[0] - q[0], q2[1] - q[1]], den = r[0] * s[1] - r[1] * s[0]; if (Math.abs(den) < 1e-9) return false; const t = ((q[0] - p[0]) * s[1] - (q[1] - p[1]) * s[0]) / den, u = ((q[0] - p[0]) * r[1] - (q[1] - p[1]) * r[0]) / den; return t > 0.02 && t < 0.98 && u > 0.02 && u < 0.98; };
T.run(async () => {
  T.login(); setWH(390, 844);
  let cross = 0, thru = 0, merged = 0, trees = 0;
  for (let sd = 1; sd <= 8; sd++) {
    let seed = sd * 7919; const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const ms = [{ id: 'r', lastName: 'R', title: 'ゴールド', parentId: '', mapType: 'both' }]; let n = 1;
    const add = (p, d) => { const k = d === 1 ? 3 + Math.floor(rnd() * 5) : Math.floor(rnd() * (d < 4 ? 4 : 3)); for (let i = 0; i < k; i++) { const id = 'm' + (n++); ms.push({ id, lastName: 'P' + n, title: 'B1', parentId: p, mapType: 'both' }); if (d < 5) add(id, d + 1); } };
    add('r', 1); w.state.members = ms; trees++;
    const host = w.document.createElement('div'); w.document.body.appendChild(host);
    w.renderPCOrbit('current', host, false, { screen: true, w: 360, h: 320 });
    const pe = [...host.querySelectorAll('path.orbit-link:not(.orbit-spine)')], L = pe.map(p => segs(p.getAttribute('d')));
    const par = pe.map(p => (ms.find(x => x.id === p.getAttribute('data-c')) || {}).parentId);
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) if (par[i] !== par[j] && L[i].some(a => L[j].some(b => inter(a, b)))) cross++;
    const circ = [...host.querySelectorAll('g[data-mid]')].map(g => { const ci = g.querySelector('circle'); return { id: g.getAttribute('data-mid'), x: +ci.getAttribute('cx'), y: +ci.getAttribute('cy') }; });
    pe.forEach((p, i) => circ.forEach(o => { if (o.id === p.getAttribute('data-c') || o.id === par[i]) return; if (L[i].some(([a, b]) => { const dx = b[0] - a[0], dy = b[1] - a[1], q = dx * dx + dy * dy || 1; let t = ((o.x - a[0]) * dx + (o.y - a[1]) * dy) / q; t = Math.max(0, Math.min(1, t)); return Math.hypot(a[0] + t * dx - o.x, a[1] + t * dy - o.y) < 26; })) thru++; }));
    // 別の親のくし（横棒）が同じ高さで重なる＝1本につながって見える
    const band = {}; pe.forEach((p, i) => { const s = L[i]; if (s.length < 3) return; const mid = s.slice(1, -1); (band[par[i]] = band[par[i]] || []).push(...mid); });
    const ps = Object.keys(band); for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) if (band[ps[i]].some(a => band[ps[j]].some(b => { const ok = [[a[0], b[0]], [a[0], b[1]], [a[1], b[0]], [a[1], b[1]]].some(([x, y]) => Math.hypot(x[0] - y[0], x[1] - y[1]) < 1.5); return ok; }))) merged++;
    host.remove();
  }
  c('別の親の線どうしは交差しない（' + trees + '通りの組織）', cross === 0, 'cross ' + cross);
  c('線は他の人の丸を突き抜けない', thru === 0, 'thru ' + thru);
  c('別の親のくしが1本につながらない', merged === 0, 'merged ' + merged);
});
