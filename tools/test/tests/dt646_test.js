// v646：データの入口に「推移」「研修」・「理想との差」は削除／横向きで「推移」「地域」を画面いっぱいに
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login();
  const R = ['福岡', '東京', '大阪'], A = ['S', 'A', 'B', 'C'], ms = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'ゴールド', parentId: '', mapType: 'both', activity: 'S', actRate: 120, ptCurrent: 3000, region: '福岡' }];
  for (let i = 0; i < 12; i++) ms.push({ id: 'm' + i, lastName: '佐藤' + i, firstName: '', title: i < 4 ? 'BR' : 'PG', parentId: 'r', mapType: 'both', activity: A[i % 4], actRate: [120, 90, 60, 30][i % 4], ptCurrent: 500, region: R[i % 3], trainee: i >= 4 });
  w.state.members = ms;
  setWH(390, 844); w._uxSync && w._uxSync(); w.switchView('stats'); w.dtMode('ez'); w.dtGo(''); await sleep(30);
  const tx = $('#dtEz').textContent;
  c('入口に「推移」「研修」のタイル・「理想との差」はなし', tx.indexOf('推移') >= 0 && tx.indexOf('研修生') >= 0 && tx.indexOf('理想との差') < 0 && !w.DT_PG.some(p => p.k === 'gap') && typeof w._dtEzGap === 'undefined');
  c('下のボタンは 稼働・人数／パワーライン／地域', $('#dtEz .ux-sm').textContent.indexOf('パワーライン') >= 0 && $('#dtEz .ux-sm').textContent.indexOf('地域') >= 0 && $('#dtEz .ux-sm').textContent.indexOf('推移') < 0);
  const tile = $$('#dtEz .ux-t').find(t => t.textContent.indexOf('推移') >= 0);
  tile.onclick ? tile.onclick() : tile.click(); await sleep(30);
  c('推移のタイル→くわしくの推移', w._dtMode === 'full' && w._dtTab === 'trend' && !!$('#dtTrend .dt-chart'));
  c('縦は今まで通り（全画面にしない）', !w.document.body.classList.contains('dt-lf') && !$('#dtLfBar'));
  console.log('=== 横向き ===');
  setWH(844, 390); w._uxSync && w._uxSync(); w.dispatchEvent(new w.Event('resize')); w.dtTab('trend'); await sleep(40);
  c('横の推移は画面いっぱい（上の帯・タブを隠して小さな帯）', w.document.body.classList.contains('dt-lf') && !!$('#dtLfBar') && $('#dtLfBar').textContent.indexOf('入口') >= 0 && $('#dtLfBar').textContent.indexOf('地域') >= 0);
  w._dtLfSize = { W: 760, H: 280 }; w.renderDtTrend();
  c('グラフは実寸で描く', $('#dtTrend .dt-chart').getAttribute('viewBox') === '0 0 760 280');
  w.dtTab('reg'); await sleep(20);
  c('横の地域も画面いっぱい（左に比較・右に推移）', w.document.body.classList.contains('dt-lf') && $('#dtLfBar span.on').textContent === '地域');
  w.dtTab('sum'); await sleep(10);
  c('ほかのタブは今まで通り', !w.document.body.classList.contains('dt-lf') && !$('#dtLfBar'));
  w.dtTab('trend'); await sleep(10); w.switchView('plan'); await sleep(10);
  c('ほかの画面へ行くと戻る', !w.document.body.classList.contains('dt-lf'));
});
