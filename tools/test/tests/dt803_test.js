// v803：分析 › 研修の月の並びを古い月→新しい月に／くわしく（コミッション・S稼働・BR・動かす数字）のグラフの月を押すとその月の人・数字
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login();
  const cur = w.state.currentMonth || w.currentMonthStr(), lm = w.addMonths(cur, -1);
  const R = { id: 'r', lastName: '山内', firstName: '北斗', title: 'ゴールド', parentId: '', mapType: 'both', ptCurrent: 5000 };
  w.state.members = [R,
    { id: 'a', lastName: '佐藤', firstName: '花', title: 'BR', parentId: 'r', mapType: 'both', activity: 'S', actRate: 120, ptCurrent: 1500 },
    { id: 'b', lastName: '田中', firstName: '健', title: 'B3', parentId: 'r', mapType: 'both', activity: 'A', ptCurrent: 800, startMonth: cur }];
  // 先月のMAP（佐藤さんはまだS・田中さんはいない／先月スタートの森さん）
  const last = [Object.assign({}, R), { id: 'a', lastName: '佐藤', firstName: '花', title: 'B5', parentId: 'r', mapType: 'both', activity: 'B', actRate: 80, ptCurrent: 900 },
    { id: 'z', lastName: '森', firstName: '一', title: 'LOI', parentId: 'r', mapType: 'both', activity: 'S', ptCurrent: 1600, startMonth: lm }];
  const key = (w.currentUser.uid) + '|' + cur;
  w._dtHist = { key, done: true, mon: { [lm]: { auto: null, man: {}, ez: w._dtEzCalc(last, lm) } } };
  w._dtHistLoad = () => {};
  setWH(390, 844); w._uxSync && w._uxSync(); w.switchView('stats'); await sleep(30);
  // ① 研修の月の並び
  w.dtTab('train'); await sleep(40);
  const chips = $$('#dtTrain .dt-trm span');
  // 右→左に並べる（direction:rtl）ので、見た目の左から右＝DOMの後ろから前
  c('研修の月は古い月→新しい月（いちばん右が今月・開いた時は右端から）', chips.length === 12 && $('#dtTrain .dt-trm').style.direction === 'rtl' && /今月/.test(chips[0].textContent) && chips[0].classList.contains('on') && !/今月/.test(chips[11].textContent) && chips.every(x => x.style.direction === 'ltr'));
  // ② S稼働：今月 → 先月を押す
  w.dtGo('s'); await sleep(30);
  const pg = () => $('#dtEz') || w.document.body;
  const bars = () => $$('#dtEz svg.ux-bars rect[onclick]');
  c('グラフの月を押せる（12ヶ月）', bars().length === 12 && /dtPgMon\(10\)/.test(bars()[10].getAttribute('onclick')));
  c('今月：S稼働の人に佐藤さん・あと一歩に田中さん', /S稼働 1人/.test(pg().textContent) && /佐藤/.test(pg().textContent) && /田中/.test(pg().textContent));
  w.dtPgMon(10); await sleep(30);
  const t = pg().textContent;
  c('先月を押すと先月の人（Sは森さん・あと一歩に佐藤さん）', w._dtPgMon === 10 && /先月|[0-9]+月のS稼働 1人/.test(t) && /森/.test(t) && /あと一歩でSの人/.test(t) && /佐藤/.test(t) && !/田中/.test(t));
  c('「今月に戻す」', /今月に戻す/.test(t));
  const row = $$('#dtEz .ux-pr').find(x => /森/.test(x.textContent));
  c('過去の月の人は今の画面（今のMAPにいなければ知らせる）', row && /dtPastMem\('z'\)/.test(row.getAttribute('onclick')));
  w.dtPgMon(10); await sleep(20);
  c('同じ月をもう一度押すと今月に戻る', w._dtPgMon === null && /今月|グラフの月を押すと/.test(pg().textContent));
  // ③ BR
  w.dtPgMon(10); w.dtGo('exam'); await sleep(30);
  c('ページを変えると今月に戻る', w._dtPgMon === null && /BR以上 1人/.test(pg().textContent));
  w.dtPgMon(10); await sleep(20);
  c('BR：先月はBR以上 0人', /BR以上 0人/.test(pg().textContent));
  // ④ 動かす数字
  w.dtGo('move'); await sleep(20); w.dtPgMon(10); await sleep(20);
  c('動かす数字：先月スタートした人に森さん', /スタートした人/.test(pg().textContent) && /森/.test(pg().textContent) && !/田中/.test(pg().textContent));
  // ⑤ コミッション（既定は先月）
  w.dtGo('comm'); await sleep(20);
  c('コミッション：既定は確定した先月・その月のB1の人', w._dtPgMon === null && /森/.test(pg().textContent));
  // データの無い月
  w.dtPgMon(3); await sleep(20);
  c('データの無い月は「MAPのデータがありません」', /MAPのデータがありません/.test(pg().textContent));
});
