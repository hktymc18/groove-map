// v828：計画シートの印刷で、行動の表の高さを行の数に合わせる（前は同じ高さで、行の多い表が次の見出しに重なった）
const T = require('../lib/head.js')();
const { w, c } = T;
T.run(async () => {
  T.login(); T.setWH(390, 844);
  w.state.members = [{ id: 'r', lastName: '架空', firstName: '太郎', title: 'G', parentId: '', mapType: 'both' }];
  w.switchView('plan'); w.p2Go('sheet'); await T.sleep(40);
  const ym = w._p2ShYmN();
  const add = (k, n, t) => { for (let i = 0; i < n; i++) w.state.events.push({ id: k + i, title: (t || '行動') + i, type: 'task', planCat: k, planYm: ym, createdAt: '2026-10-01' }); };
  w.state.events = [];
  add('front', 10); add('dist', 6); add('dist', 2, '自分のビフォアフを作る：毎日写真撮る、体組成計図る'); add('dline', 7); add('self', 3);
  const html = w._p2ShPrintHtml(ym, {});
  const g = [...html.matchAll(/class="al" style="flex-grow:(\d+)"/g)].map(m => +m[1]);
  c('表ごとに行の数に合わせた高さ（4つ）', g.length === 4, g.join());
  c('行の多い表ほど高い（折り返す行も数える）', g[0] > g[2] && g[1] === 6 + 2 * 2 + 1 && g[2] > g[3], g.join());
  c('ふつうの量は文字の大きさそのまま', /\.al th,\.al td\{[^}]*font-size:9\.5pt/.test(html), (html.match(/\.al th,\.al td\{[^}]*/)||[])[0]);
  c('表は中身より小さくならない（はみ出して重ならない）', /\.al\{flex:1 1 auto;/.test(html) && !/\.al\{[^}]*min-height:0/.test(html));
  w.state.events = [];
  add('front', 20); add('dist', 18); add('dline', 15); add('self', 8);
  const h2 = w._p2ShPrintHtml(ym, {});
  const fs = +(h2.match(/\.al th,\.al td\{[^}]*font-size:([\d.]+)pt/) || [])[1];
  c('とても多い時は文字を小さくして詰める', fs < 9.5 && fs >= 5.5 && /line-height:1\.2/.test(h2), fs);
});
