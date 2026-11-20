// v888：👥 人ごとの利用に、最後に開いた順・開いた回数順・使った時間順と、時間帯のグラフ（みんな・その人）（架空データ）
const T = require('../lib/head.js')();
const { w, c, sleep, $ } = T;
T.run(async () => {
  T.login();
  const ymd = (off) => new w.Date(w.Date.now() + 9 * 3600000 - off * 86400000).toISOString().slice(0, 10).replace(/-/g, '');
  const at = (min) => new w.Date(w.Date.now() - min * 60000).toISOString();
  w._adminUsers = [
    { id: 'a', name: '見本 毎日', union: 'REVE', status: 'active', early: true, lastSeenAt: at(300) },
    { id: 'b', name: '見本 長時間', union: 'REVE', status: 'active', early: true, lastSeenAt: at(120) },
    { id: 'c', name: '見本 さっき', union: 'REVE', status: 'active', early: true, lastSeenAt: at(1) },
    { id: 'd', name: '見本 なし', union: 'REVE', status: 'active', early: true }
  ];
  w._accA = { mode: 'early' };
  const L = [];
  [0, 1, 2].forEach((o) => L.push({ uid: 'a', app: 'nav', n: 100, _d: ymd(o), op: { '起動': 1, current: 1 }, sec: 300, hr: { '21': 300 } }));
  L.push({ uid: 'b', app: 'nav', n: 50, _d: ymd(0), op: { '起動': 2, plan: 1 }, sec: 5400, hr: { '09': 3600, '10': 1800 } });
  L.push({ uid: 'c', app: 'nav', n: 10, _d: ymd(0), op: { '起動': 9 }, sec: 60, hr: { '21': 60 } });
  w.document.body.insertAdjacentHTML('beforeend', '<div id="adminPanel" class="open"></div><div id="adminBody"></div><div id="adminCount"></div>');
  w._admTab = 'set'; w._admPg = 'usr';
  w._usr = { per: 7, sort: 'use', un: '', open: '', data: {} }; w._usr.data['7:' + w._usDay(0)] = L;
  w.renderAdminList();
  const names = () => [...w.document.querySelectorAll('#adminBody .usr-h b')].map((x) => x.textContent);
  const tx = () => $('#adminBody').textContent;
  c('並べ方の選び方が6つ（よく使う・最後に開いた・開いた回数・使った時間・使っていない・名前）', /よく使う順最後に開いた順開いた回数順使った時間順使っていない順名前順/.test(tx()));
  c('よく使う順＝日数が多い人が上（3日の「毎日」）', names()[0] === '見本 毎日', JSON.stringify(names()));
  w.usrSort('last');
  c('最後に開いた順＝さっき開いた人が上・開いていない人は下', names()[0] === '見本 さっき' && names()[3] === '見本 なし', JSON.stringify(names()));
  w.usrSort('open');
  c('開いた回数順＝アプリを開いた回数（9回）が上', names()[0] === '見本 さっき', JSON.stringify(names()));
  w.usrSort('time');
  c('使った時間順＝1時間30分の人が上', names()[0] === '見本 長時間', JSON.stringify(names()));
  const r0 = w.document.querySelectorAll('#adminBody .usr-row')[0].textContent;
  c('行に使った時間（1時間30分）', /使った時間 1時間30分/.test(r0), r0);
  c('みんなの時間帯のグラフ（24本）と多い時間帯（9時台 1時間・1人）', w.document.querySelectorAll('#adminBody .usr-hr')[0].children.length === 24 && /多い時間帯：9時台（1時間・1人）/.test(tx()) && /21時台（16分・2人）/.test(tx()), tx().slice(0, 600));
  w.usrOpen('b');
  const x = (w.document.querySelector('#adminBody .usr-x') || {}).innerHTML || '';
  c('人を押すと、その人の使った時間帯のグラフ', /使った時間帯/.test(x) && /usr-hr/.test(x));
  c('説明に「よく使う順」の決め方', /よく使う順＝使った日数 → 画面を開いた回数 → 使った時間/.test(tx()));
  c('使った時間の書き方', w._usrDur(30) === '1分未満' && w._usrDur(60) === '1分' && w._usrDur(3600) === '1時間' && w._usrDur(4380) === '1時間13分');
  c('APP_JS_VERSION v888 以上', +(/APP_JS_VERSION = 'v(\d+)'/.exec(require('fs').readFileSync(require('path').join(__dirname, '../../../app.js'), 'utf8')) || [0, 0])[1] >= 888);
});
