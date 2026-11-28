// v928：利用状況をシステムごとに（NAVIGATOR｜ATTACK LIST｜受付・会員証）。上の切りかえで全部のタブがそのシステムだけの数になる（架空データ）
const T = require('../lib/head.js')();
const { w, c, sleep, $, setWH } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  const day = (off) => new w.Date(w.Date.now() + 9 * 3600000 - off * 86400000).toISOString().slice(0, 10);
  const ymd = (off) => day(off).replace(/-/g, '');
  const at = (min) => new w.Date(w.Date.now() - min * 60000).toISOString();
  w._adminUsers = [
    { id: 'a', name: '見本 両方', union: 'REVE', status: 'active', early: true, lastSeenAt: at(3), alSeenAt: at(5) },
    { id: 'b', name: '見本 ナビだけ', union: 'REVE', status: 'active', early: true, lastSeenAt: at(60) },
    { id: 'c', name: '見本 ALやめた', union: 'LIEN', status: 'active', early: true, alSeenAt: at(60 * 24 * 10) }
  ];
  w._accA = { mode: 'early' };
  const stats = { days: [{ d: day(2), r: 100000, nav: 2, ck: 30 }, { d: day(1), r: 200000, w: 1, x: 1, nav: 2, ck: 40 }, { d: day(0), r: 40000, w: 1, x: 1, nav: 1, ck: 7 }], at: at(1), err: '' };
  const R = {};
  [0, 1, 2].forEach((o) => { R[ymd(o)] = [{ uid: 'a', app: 'nav', n: 1000, op: { '起動': 1, current: 2 }, ts: { current: 300 }, sec: 300, by: { 'current|maps/months': 1000 }, at: at(o * 1440) },
    { uid: 'a', app: 'al', n: 200, op: { '起動': 1, list: 3 }, ts: { list: 600 }, sec: 600, by: { 'list|users/people': 200 }, at: at(o * 1440 + 5) }]; });
  R[ymd(1)].push({ uid: 'b', app: 'nav', n: 300, op: { '起動': 1, plan: 1 }, ts: { plan: 60 }, sec: 60, by: { 'plan|maps/meta': 300 }, at: at(1440) });
  R[ymd(1)].push({ uid: '', app: 'ck', n: 40, op: { '起動': 1, vCard: 1 }, by: { 'vCard|cards': 40 }, at: at(1440) });
  const reads = [];
  w.db = Object.assign({}, w.db, {
    doc: (p) => ({ get: () => { reads.push(p); return Promise.resolve({ exists: true, data: () => JSON.parse(JSON.stringify(stats)) }); } }),
    collection: (n) => ({ doc: (d) => ({ collection: (m) => { const q = (app) => ({ where: (k, op, v) => q(v), get: () => { reads.push(n + '/' + d + '/' + m + (app ? '?' + app : '')); return Promise.resolve({ forEach: (f) => (R[d] || []).filter((x) => !app || x.app === app).forEach((x) => f({ data: () => JSON.parse(JSON.stringify(x)) })) }); } }); return q(''); } }) })
  });
  const bt = () => ($('#usBody') || {}).textContent || '';
  w.usOpen(); await sleep(60);
  const sys = [...w.document.querySelectorAll('#usHd .usd-sys span')].map((x) => x.textContent).join();
  c('上に システムの切りかえ（NAVIGATOR・ATTACK LIST・受付・会員証）', sys === 'NAVIGATOR,ATTACK LIST,受付・会員証', sys);
  c('NAVIGATOR の概要は今まで通り（1人あたりは NAVIGATOR だけ (1,000+300)÷2＝650）', /6501人あたりの読み取り（NAVIGATOR・昨日）/.test(bt()), bt().slice(0, 200));
  // ATTACK LIST
  w.usApp('al'); await sleep(80);
  c('ATTACK LIST の概要：今日1人・7日1人・一度でも開いた2人・1人あたり 200', /1今日 開いた人/.test(bt()) && /1直近7日に開いた人/.test(bt()) && /2一度でも開いた人/.test(bt()) && /2001人あたりの読み取り（ATTACK LIST・昨日）/.test(bt()), bt().slice(0, 300));
  c('ATTACK LIST の「7日開いていない人」は alSeenAt で数える（1人）', /7日開いていない人 1人/.test(bt()));
  c('ATTACK LIST はその日の人数のグラフも出る・全部のアプリの読み取りも下に出る', /その日に開いた人（ATTACK LIST）/.test(bt()) && /全部のアプリの合計/.test(bt()));
  c('ATTACK LIST の読み取りは app==al だけを読む', reads.some((p) => /\?al$/.test(p)) && !reads.some((p) => /readStats.*\?ck$/.test(p)));
  w.usTab('scr'); await sleep(80);
  c('画面タブ：ATTACK LIST の画面（自分のリスト）だけ', /自分のリスト/.test(bt()) && !/MAP/.test(bt()), bt().slice(0, 200));
  w.usTab('ppl'); await sleep(80);
  const names = () => [...w.document.querySelectorAll('#usList .usr-row b, #usList td b')].map((x) => x.textContent);
  c('人タブ：ATTACK LIST を一度でも開いた人だけ（ナビだけの人は出ない）', names().includes('見本 両方') && names().includes('見本 ALやめた') && !names().includes('見本 ナビだけ'), names().join());
  w.usSeg('idle7'); await sleep(30);
  c('人タブ：7日開いていない（ATTACK LIST）は ALやめた人だけ', names().join() === '見本 ALやめた', names().join());
  w.usSeg('all');
  w.usTab('cost'); await sleep(80);
  c('費用タブ：アプリ別に ATTACK LIST の行がある・下の一覧は ATTACK LIST だけ', /ATTACK LIST/.test(bt()) && /読み取りの多い画面（ATTACK LIST）/.test(bt()) && /自分のリスト/.test(bt()), bt().slice(0, 300));
  // NAVIGATOR に戻すと人タブは NAVIGATOR の人
  w.usApp('nav'); w.usTab('ppl'); await sleep(80);
  c('NAVIGATOR の人タブは使える人（ALだけの人も解放済みなら出る）・ATTACK LIST の数は入らない', names().includes('見本 ナビだけ'), names().join());
  // 受付
  w.usApp('ck'); w.usTab('sum'); await sleep(80);
  c('受付の概要は端末で数える（今日 7台）', /7今日 開いた端末/.test(bt()) && /端末/.test(bt()), bt().slice(0, 200));
  w.usClose();
});
