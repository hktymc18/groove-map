// v887：利用状況に「その日に開いた人」（サーバーが数えた nav・ck）と「👥 人ごとの利用」（よく使う人・使っていない人・よく使う画面・状態）（架空データ）
const T = require('../lib/head.js')();
const { w, c, sleep, $ } = T;
T.run(async () => {
  T.login();
  const day = (off) => new w.Date(w.Date.now() + 9 * 3600000 - off * 86400000).toISOString().slice(0, 10);
  const ymd = (off) => day(off).replace(/-/g, '');
  const at = (min) => new w.Date(w.Date.now() - min * 60000).toISOString();
  w._adminUsers = [
    { id: 'u1', name: '見本 よく使う', union: 'REVE', status: 'active', early: true, lastSeenAt: at(3) },
    { id: 'u2', name: '見本 ときどき', union: 'REVE', status: 'active', early: true, lastSeenAt: at(60 * 30) },
    { id: 'u3', name: '見本 つかわない', union: 'LIEN', status: 'active', early: true },
    { id: 'u4', name: '見本 まだ', union: 'LIEN', status: 'active' }
  ];
  w._accA = { mode: 'early' };
  const stats = { days: [{ d: day(1), r: 200000, w: 1, x: 1, nav: 120, ck: 40 }, { d: day(0), r: 50000, w: 1, x: 1, nav: 70, ck: 12 }], at: at(1), err: '' };
  const R = {};
  R[ymd(0)] = [{ uid: 'u1', app: 'nav', n: 900, op: { '起動': 3, current: 5, 'events:calendar': 2 } }, { uid: 'u1', app: 'ck', n: 40, op: { vCard: 1 } }, { uid: '', app: 'ck', n: 9 }];
  R[ymd(1)] = [{ uid: 'u1', app: 'nav', n: 500, op: { current: 1 } }, { uid: 'u2', app: 'nav', n: 300, op: { 'events:agenda': 4 } }];
  const reads = [];
  const db0 = w.db;
  w.db = Object.assign({}, db0, {
    doc: (p) => ({ get: () => { reads.push(p); return Promise.resolve({ exists: true, data: () => JSON.parse(JSON.stringify(stats)) }); } }),
    collection: (n) => ({ doc: (d) => ({ collection: (m) => ({ get: () => { reads.push(n + '/' + d + '/' + m); return Promise.resolve({ forEach: (f) => (R[d] || []).forEach((x) => f({ data: () => JSON.parse(JSON.stringify(x)) })) }); } }) }) })
  });
  w.document.body.insertAdjacentHTML('beforeend', '<div id="adminPanel" class="open"></div><div id="adminBody"></div><div id="adminCount"></div>');
  w._admTab = 'set'; w._us = { stats: null, loading: false, rd: {}, rdDay: '' };
  w.admPg('us'); await sleep(60);
  let tx = $('#adminBody').textContent;
  c('その日に開いた人（サーバーが数えた NAVIGATOR の人数）を日ごとに', /その日に開いた人（NAVIGATOR）/.test(tx) && /120人/.test(tx) && /70人/.test(tx), tx.slice(0, 400));
  c('受付・会員証の人数も添える', new RegExp(day(1).slice(8) + '日 40').test(tx));
  c('「👥 人ごとに見る」への入口', /admPg\('usr'\)/.test($('#adminBody').innerHTML));
  w.admPg('usr'); await sleep(20);
  tx = $('#adminBody').textContent;
  c('人ごとの利用は、期間を押すまで読まない', !reads.some((p) => /^readStats/.test(p)) && /期間を押すと読み込みます/.test(tx) && /‹ 利用状況/.test(tx));
  w.usrLoad(7); await sleep(60);
  tx = $('#adminBody').textContent;
  c('直近7日分の readStats を読む（7日分）', reads.filter((p) => /^readStats\/\d{8}\/u$/.test(p)).length === 7);
  c('対象は使える人（解放済み）3人: 開いた人2・開いていない人1（解放前の人は入れない）', /2この期間に開いた人/.test(tx) && /1開いていない人/.test(tx) && /3対象/.test(tx) && !/見本 まだ/.test(tx), tx.slice(0, 300));
  const names = [...w.document.querySelectorAll('#adminBody .usr-h b')].map((x) => x.textContent);
  c('よく使う順（日数→開いた回数）', names[0] === '見本 よく使う' && names[1] === '見本 ときどき', JSON.stringify(names));
  const row1 = w.document.querySelectorAll('#adminBody .usr-row')[0].textContent;
  c('日数・状態（10分以内は「開いている」）・開いた回数・よく使う画面（日本語の名前）', /2日／7日/.test(row1) && /開いている/.test(row1) && /開いた 3回/.test(row1) && /MAP 6/.test(row1) && /カレンダー 2/.test(row1), row1);
  const row2 = w.document.querySelectorAll('#adminBody .usr-row')[1].textContent;
  c('ときどきの人: 1日・ToDo', /1日／7日/.test(row2) && /ToDo 4/.test(row2), row2);
  const last = [...w.document.querySelectorAll('#adminBody .usr-row')].map((x) => x.textContent);
  c('使っていない人は 0日・開いた記録なし', last.some((t) => /見本 つかわない/.test(t) && /0日/.test(t) && /開いた記録なし/.test(t)));
  w.usrSort('idle'); await sleep(10);
  const n2 = [...w.document.querySelectorAll('#adminBody .usr-h b')].map((x) => x.textContent);
  c('使っていない順にすると、0日の人が上', /つかわない/.test(n2[0]) && n2[n2.length - 1] === '見本 よく使う', JSON.stringify(n2));
  w.usrUn('REVE'); await sleep(10);
  c('ユニオンで絞れる', [...w.document.querySelectorAll('#adminBody .usr-h b')].length === 2);
  w.usrUn(''); w.usrSort('use'); w.usrOpen('u1'); await sleep(10);
  const x1 = (w.document.querySelector('#adminBody .usr-x') || {}).textContent || '';
  c('押すと画面ごとの回数（受付・会員証も）と読み取りの回数', /MAP6回/.test(x1) && /受付・会員証：会員証1回/.test(x1) && /読み取り1,440回/.test(x1), x1);
  c('アプリを開いた回数は「よく使う画面」に入れない', !/アプリを開いた/.test(x1));
  w.db = db0;
  c('APP_JS_VERSION v887 以上', +(/APP_JS_VERSION = 'v(\d+)'/.exec(require('fs').readFileSync(require('path').join(__dirname, '../../../app.js'), 'utf8')) || [0, 0])[1] >= 887);
});
