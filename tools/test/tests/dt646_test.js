// v646：横向きで「推移」「地域」を画面いっぱいに（理想との差は削除）
// v647：分析＝入口なし・開いたらすぐ推移（上にグラフ・下に今月の数字のタイル。押すとグラフがその項目に・くわしく›で1ページ）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login();
  const R = ['福岡', '東京', '大阪'], A = ['S', 'A', 'B', 'C'], ms = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'ゴールド', parentId: '', mapType: 'both', activity: 'S', actRate: 120, ptCurrent: 3000, region: '福岡' }];
  for (let i = 0; i < 12; i++) ms.push({ id: 'm' + i, lastName: '佐藤' + i, firstName: '', title: i < 4 ? 'BR' : 'PG', parentId: 'r', mapType: 'both', activity: A[i % 4], actRate: [120, 90, 60, 30][i % 4], ptCurrent: 500, region: R[i % 3], trainee: i >= 4 });
  w.state.members = ms;
  setWH(390, 844); w._uxSync && w._uxSync(); w.switchView('menu'); w.switchView('stats'); await sleep(40);
  c('分析を開くとすぐ推移（入口のタイル画面なし）', w._dtMode === 'full' && w._dtTab === 'trend' && !!$('#dtTrend .dt-chart') && !$('#dtEz .ux-hub') && $('#dtModeBar').textContent.indexOf('分析') >= 0);
  c('タブは 推移・研修・パワーライン・地域（サマリーは推移に統合）', $$('#dtTabs .dt-tab').map(x => x.textContent).join() === '推移,研修,パワーライン,地域');
  c('理想との差はなし', typeof w._dtEzGap === 'undefined' && !w.DT_PG.some(p => p.k === 'gap'));
  const big = $$('#dtTrend .an-t.big');
  c('今月の数字：コミッション・S稼働・BR・B1数・平均稼働人数・総人数＋小さいタイル', big.length === 6 && big[0].textContent.indexOf('コミッション') >= 0 && big[1].textContent.indexOf('S稼働') >= 0 && $$('#dtTrend .an-g.sm .an-t').length === 8);
  w.anTile('S'); await sleep(10);
  c('タイルを押すとグラフがその項目に', w._dtSel.join() === 'S' && $('#dtTrend .an-t.big.on').textContent.indexOf('S稼働') >= 0);
  w.dtPickMonth(9); await sleep(10);
  c('グラフの月を選ぶとタイルもその月', $('#dtTrend .an-sec').textContent.indexOf('今月に戻す') >= 0);
  w.dtPickMonth(11);
  const dl = $$('#dtTrend .an-t.big')[1].querySelector('.dl'); dl.onclick ? dl.onclick({ stopPropagation() {} }) : dl.click(); await sleep(30);
  c('くわしく›でS稼働のページ（あと一歩の人など）', w._dtMode === 'ez' && w._dtPg === 's' && $('#dtEz').textContent.indexOf('あと一歩') >= 0 && $('.ux-crumb').textContent.indexOf('分析') >= 0);
  w.dtGo(''); await sleep(20);
  c('戻ると推移', w._dtMode === 'full' && w._dtTab === 'trend' && !$('#view-stats .ux-hub') && $('#dtEz').style.display === 'none' && !w.document.body.classList.contains('ux-pg'));
  console.log('=== 横向き ===');
  setWH(844, 390); w._uxSync && w._uxSync(); w.dispatchEvent(new w.Event('resize')); w.dtTab('trend'); await sleep(40);
  c('横の推移は画面いっぱい（小さな帯・タイルは隠す）', w.document.body.classList.contains('dt-lf') && !!$('#dtLfBar') && $('#dtLfBar').textContent.indexOf('地域') >= 0);
  w._dtLfSize = { W: 760, H: 280 }; w.renderDtTrend();
  c('グラフは実寸で描く', $('#dtTrend .dt-chart').getAttribute('viewBox') === '0 0 760 280');
  w.dtTab('reg'); await sleep(20);
  c('横の地域も画面いっぱい', w.document.body.classList.contains('dt-lf') && $('#dtLfBar span.on').textContent === '地域');
  w.dtTab('train'); await sleep(10);
  c('ほかのタブは今まで通り', !w.document.body.classList.contains('dt-lf') && !$('#dtLfBar'));
  w.dtTab('trend'); await sleep(10); w.switchView('plan'); await sleep(10);
  c('ほかの画面へ行くと戻る', !w.document.body.classList.contains('dt-lf'));
});
