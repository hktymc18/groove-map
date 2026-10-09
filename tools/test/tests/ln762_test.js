// v762：パワーラインのポイントの推移（折れ線・横で画面いっぱい）・地域を比べる折れ線（項目を選ぶ・地域は何個でも）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login();
  const mk = (pt1, pt2, extra) => [
    { id: 'r', lastName: '山内', firstName: '北斗', title: 'G', parentId: '', mapType: 'both', region: '福岡' },
    { id: 'a', lastName: '佐藤', firstName: '花', title: 'BR', parentId: 'r', mapType: 'both', ptCurrent: pt1, region: '福岡' },
    { id: 'b', lastName: '田中', firstName: '健', title: 'BR', parentId: 'r', mapType: 'both', ptCurrent: pt2, region: '東京' },
    { id: 't1', lastName: '森', firstName: '一', title: 'PG', trainee: true, parentId: 'b', mapType: 'both', region: '東京' },
    { id: 't2', lastName: '林', firstName: '二', title: 'PG', trainee: true, parentId: 'a', mapType: 'both', region: '大阪' }].concat(extra || []);
  w.state.members = mk(7000, 5500);
  const cur = w.state.currentMonth || w.currentMonthStr(), m1 = w.addMonths(cur, -1), m2 = w.addMonths(cur, -2);
  const fg = w.fsGet;
  w.fsGet = p => {
    if (p.indexOf('/months/' + m1 + '_current') >= 0) return Promise.resolve({ members: mk(6000, 4000) });
    if (p.indexOf('/months/' + m2 + '_current') >= 0) return Promise.resolve({ members: mk(5200, 2000, [{ id: 't3', lastName: '谷', firstName: '三', title: 'PG', trainee: true, parentId: 'b', mapType: 'both', region: '東京' }]) });
    return Promise.resolve(null);
  };
  w._dtHist = null; w._regTrendCache = {};
  setWH(390, 844); w._uxSync && w._uxSync(); w.switchView('stats'); await sleep(20); w.dtTab('pl'); await sleep(80); w.renderDtPl(); await sleep(10);
  const X = () => $('#dtPlX');
  c('パワーラインの下にポイントの推移（折れ線）', !!X() && X().previousElementSibling && /パワーライン/.test(X().previousElementSibling.textContent) && !!X().querySelector('.dt-chart'));
  const paths = () => [...X().querySelectorAll('.dt-chart path')];
  c('系列ごとに線（佐藤・田中）・5,000Pの点線', paths().length === 2 && $$('#dtPlX .dt-chip.on').length === 2 && /5,000P/.test(X().querySelector('.dt-chart').textContent));
  const sat = paths()[0].getAttribute('d').split(/[ML]/).filter(Boolean);
  c('過去の月もつながる（佐藤さん 3ヶ月ぶんの点）', sat.length === 3, sat.join(' '));
  c('凡例に今の LTSV', /佐藤花\s*7,000/.test(X().querySelector('.dt-lgrow').textContent));
  w.dtPlLn('田中健'); await sleep(10);
  c('名前を押すと線を消す', paths().length === 1 && $$('#dtPlX .dt-chip.on').length === 1);
  w.dtPlLn('田中健'); await sleep(10);
  c('もう一度で出す', paths().length === 2);
  console.log('=== 横向き ===');
  setWH(844, 390); w._uxSync && w._uxSync(); w.dispatchEvent(new w.Event('resize')); w.dtTab('pl'); await sleep(60);
  c('横のパワーラインは画面いっぱい（帯にパワーライン）', w.document.body.classList.contains('dt-lf') && $('#dtLfBar span.on').textContent === 'パワーライン');
  w._plLfSize = { W: 780, H: 260 }; w.renderDtPl();
  c('折れ線は実寸で描く', X().querySelector('.dt-chart').getAttribute('viewBox') === '0 0 780 260');
  setWH(390, 844); w._uxSync && w._uxSync(); w.dispatchEvent(new w.Event('resize')); await sleep(30);
  c('縦に戻すと元の大きさ', !w.document.body.classList.contains('dt-lf') && X().querySelector('.dt-chart').getAttribute('viewBox') !== '0 0 780 260');
  console.log('=== 地域 ===');
  w.dtTab('reg'); await sleep(80);
  const L = () => $('#dtRegLn');
  c('地域を比べる折れ線（人数）', !!L() && /地域を比べる：人数の12ヶ月/.test(L().textContent) && !!L().querySelector('.dt-chart'));
  c('地域ごとに線（福岡・東京・大阪）', L().querySelectorAll('.dt-chart path').length === 3 && $$('#dtRegLn .dt-chip.on').length === 3);
  w.dtRegMetric('tr'); await sleep(60);
  c('項目を選ぶとその項目で比べる（研修生）', /研修生の12ヶ月/.test(L().textContent));
  const tokyo = [...L().querySelectorAll('.dt-lgrow span')].find(x => /東京/.test(x.textContent));
  c('東京の研修生：今月1人', !!tokyo && /1$/.test(tokyo.textContent.trim()));
  const tcol = tokyo.querySelector('i').style.background, tpe = [...L().querySelectorAll('.dt-chart path')].find(p => w.document.createElement('i') && (() => { const d = w.document.createElement('i'); d.style.background = p.getAttribute('stroke'); return d.style.background === tcol; })());
  const tp = tpe.getAttribute('d').split(/[ML]/).filter(Boolean).map(p => +p.split(',')[1]);
  c('先々月は2人（線が高い）', tp.length === 3 && tp[0] < tp[2], tp.join());
  w.dtRegLn('大阪'); await sleep(60);
  c('地域を外す', L().querySelectorAll('.dt-chart path').length === 2 && !/大阪/.test(L().querySelector('.dt-lgrow').textContent));
  setWH(844, 390); w._uxSync && w._uxSync(); w.dispatchEvent(new w.Event('resize')); w.dtTab('reg'); await sleep(60);
  w.dtRegLnZoom(); await sleep(150);
  c('横：地域を比べる線もタップで画面いっぱい', w.document.body.classList.contains('dt-rgc') && /タップで戻す/.test(L().textContent));
  w.dtRegLnZoom(); await sleep(60);
  c('もう一度で戻す', !w.document.body.classList.contains('dt-rgc'));
  w.fsGet = fg;
});
