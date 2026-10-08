// v741：パワーラインを月ごとに（今月まだ5,000P未満でも、先月までのパワーラインが見える）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login();
  const mk = (pt1, pt2) => [
    { id: 'r', lastName: '山内', firstName: '北斗', title: 'G', parentId: '', mapType: 'both' },
    { id: 'a', lastName: '佐藤', firstName: '花', title: 'BR', parentId: 'r', mapType: 'both', ptCurrent: pt1 },
    { id: 'a2', lastName: '森', firstName: '一', title: 'BR', parentId: 'a', mapType: 'both', ptCurrent: 3000 },
    { id: 'b', lastName: '田中', firstName: '健', title: 'BR', parentId: 'r', mapType: 'both', ptCurrent: pt2 }];
  w.state.members = mk(300, 100); // 月はじめ：今月はまだ少ない
  const cur = w.state.currentMonth || w.currentMonthStr(), m1 = w.addMonths(cur, -1), m2 = w.addMonths(cur, -2);
  const fg = w.fsGet;
  w.fsGet = p => {
    if (p.indexOf('/months/' + m1 + '_current') >= 0) return Promise.resolve({ members: mk(4000, 6000) });
    if (p.indexOf('/months/' + m2 + '_current') >= 0) return Promise.resolve({ members: mk(1000, 5200) });
    return Promise.resolve(null);
  };
  w._dtHist = null;
  setWH(390, 844); w._uxSync && w._uxSync(); w.switchView('stats'); await sleep(20); w.dtTab('pl'); await sleep(80);
  const tx = () => $('#dtPl').textContent;;
  c('過去の月を読み込む', w._dtHist && w._dtHist.done && !!w._dtHist.mon[m1].plMs);
  c('今月が0本なら、いちばん新しい月（先月）を出す', /佐藤花/.test(tx()) && /田中健/.test(tx()) && /2本/.test($('#dtPl .dt-ch').textContent) && /今月はまだ/.test(tx()));
  c('月の切りかえ（今月・先月・先々月と本数）', $$('.dt-plm span').length === 3 && /0本/.test($$('.dt-plm span')[0].textContent) && /2本/.test($$('.dt-plm span')[1].textContent) && /1本/.test($$('.dt-plm span')[2].textContent));
  c('前の月との差（佐藤さん 4,000→7,000 で ▲3,000）', /▲3,000/.test(tx()));
  w.dtPlMon(m2); await sleep(10);
  c('先々月を選ぶと1本（田中さん）', $$('#dtPl .dt-pr').length === 1 && /田中健/.test(tx()));
  w.dtPlMon(cur); await sleep(10);
  c('今月を選ぶと「まだありません」', $$('#dtPl .dt-pr').length === 0 && /まだありません/.test(tx()));
  c('表（月ごとのLTSV）にも過去の月の数字', /田中健/.test($('#plBody').textContent) && /6,000/.test($('#plBody').textContent) && /5,200/.test($('#plBody').textContent));
  w.state.members = mk(5500, 100); w._dtPlMon = ''; w.renderDtPl(); await sleep(10);
  c('今月5,000Pを超えたら今月を出す', /佐藤花/.test(tx()) && !/今月はまだ/.test(tx()) && $$('#dtPl .dt-pr').length === 1);
  w.fsGet = fg;
});
