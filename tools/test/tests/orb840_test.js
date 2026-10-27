// v840 #30：サークルMAP（計画シートの理想MAP・MAPの◎サークル）で、同じ段のあいだを通る別の親のくし（横の線）が、
//   すぐ横に並んで長く走らない（二重線に見えない）。フロントが一部の人に集まる組織・理想MAPで新規を足した組織で確かめる
const T = require('../lib/head.js')({ timeout: 300000 });
const { w, c, setWH } = T;
const pts = d => { const p = []; d.replace(/[ML]\s*([-\d.]+),([-\d.]+)/g, (_, x, y) => p.push([+x, +y])); return p; };
// 別の親のくしの点どうしが 20px 以内にある点の数（＝並んで走る長さ。点は一周の1/96ごと）
function parallel(host, all) {
  const band = {};
  host.querySelectorAll('path.orbit-link:not(.orbit-spine)').forEach(p => {
    const P = pts(p.getAttribute('d')); if (P.length < 4) return;
    const par = (all.find(x => x.id === p.getAttribute('data-c')) || {}).parentId; if (!par) return;
    (band[par] = band[par] || []).push(...P.slice(2, -1));
  });
  const ks = Object.keys(band); let n = 0;
  for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) {
    const B = band[ks[j]]; band[ks[i]].forEach(a => { if (B.some(b => Math.hypot(a[0] - b[0], a[1] - b[1]) < 20)) n++; });
  }
  return n;
}
T.run(async () => {
  T.login(); setWH(390, 844);
  const tot = { current: 0, ideal: 0 }; let bad = 0, N = 0;
  for (let sd = 1; sd <= 40; sd++) {
    let seed = sd * 104729; const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const ms = [{ id: 'r', lastName: 'R', title: 'ゴールド', parentId: '', mapType: 'both' }]; let n = 1;
    const add = (p, d) => { const big = rnd() < 0.18; const k = d === 1 ? 2 + Math.floor(rnd() * 4) : (big ? 4 + Math.floor(rnd() * 5) : Math.floor(rnd() * 2.2)); for (let i = 0; i < k; i++) { const id = 'm' + (n++); ms.push({ id, lastName: 'P' + n, title: 'B1', parentId: p, mapType: 'both' }); if (d < 6) add(id, d + 1); } };
    add('r', 1);
    if (ms.length > 150) continue;
    const im = JSON.parse(JSON.stringify(ms)).map(x => Object.assign(x, { mapType: 'ideal' }));
    for (let k = 0; k < Math.floor(ms.length * 0.5); k++) { const p = ms[Math.floor(rnd() * ms.length)]; im.push({ id: 'n' + k, lastName: '新規', title: 'LOI', parentId: p.id, mapType: 'ideal', idealNew: true }); }
    w.state.members = ms; w.state.idealMembers = im; N++;
    for (const mt of ['current', 'ideal']) {
      const host = w.document.createElement('div'); w.document.body.appendChild(host);
      w.renderPCOrbit(mt, host, false, { screen: true, w: 360, h: 420 });
      const v = parallel(host, w.membersForMap(mt)); tot[mt] += v; if (v > 48) bad++;
      host.remove();
    }
  }
  console.log('組織', N, '並走', JSON.stringify(tot), '半周の1/2以上並ぶMAP', bad);
  c('理想MAP：別の親のくしが並んで走る長さが少ない', tot.ideal <= 40, 'ideal ' + tot.ideal);
  c('現状MAPも同じく少ない', tot.current <= 40, 'current ' + tot.current);
  c('長く並ぶMAPがない', bad === 0, 'bad ' + bad);
});
