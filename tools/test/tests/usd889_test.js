// v889：利用状況を全画面に作り直し（上に固定のタブ「概要・画面・人・費用」・期間・ユニオン）。並べ替え・絞り込みは一覧だけ差し替え、人の詳しい中身は重ねて出す（架空データ）
const T = require('../lib/head.js')();
const { w, c, sleep, $, setWH } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  const day = (off) => new w.Date(w.Date.now() + 9 * 3600000 - off * 86400000).toISOString().slice(0, 10);
  const ymd = (off) => day(off).replace(/-/g, '');
  const at = (min) => new w.Date(w.Date.now() - min * 60000).toISOString();
  w._adminUsers = [
    { id: 'a', name: '見本 毎日', union: 'REVE', status: 'active', early: true, lastSeenAt: at(3) },
    { id: 'b', name: '見本 ときどき', union: 'REVE', status: 'active', early: true, lastSeenAt: at(60 * 30) },
    { id: 'c', name: '見本 つかわない', union: 'LIEN', status: 'active', early: true, lastSeenAt: at(60 * 24 * 10) },
    { id: 'd', name: '見本 まだ', union: 'LIEN', status: 'active' }
  ];
  w._accA = { mode: 'early' };
  const stats = { days: [{ d: day(1), r: 200000, w: 1, x: 1, nav: 100, ck: 20 }, { d: day(0), r: 40000, w: 1, x: 1, nav: 50, ck: 5 }], at: at(1), err: '' };
  const R = {};
  [0, 1, 2, 3, 4].forEach((o) => { R[ymd(o)] = [{ uid: 'a', app: 'nav', n: 1000, op: { '起動': 2, current: 3, 'events:calendar': 1 }, ts: { current: 600, 'events:calendar': 120 }, sec: 720, hr: { '21': 720 }, by: { 'current|maps/months': 800, 'events:calendar|maps/events': 200 } }]; });
  R[ymd(1)].push({ uid: 'b', app: 'nav', n: 300, op: { '起動': 1, plan: 2 }, ts: { plan: 300 }, sec: 300, hr: { '09': 300 }, by: { 'plan|maps/meta': 300 } });
  R[ymd(0)].push({ uid: '', app: 'ck', n: 50, op: { '起動': 1, vCard: 1 }, by: { 'vCard|cards': 50 } });
  const reads = [];
  const db0 = w.db;
  w.db = Object.assign({}, db0, {
    doc: (p) => ({ get: () => { reads.push(p); return Promise.resolve({ exists: true, data: () => JSON.parse(JSON.stringify(stats)) }); } }),
    collection: (n) => ({ doc: (d) => ({ collection: (m) => ({ get: () => { reads.push(n + '/' + d + '/' + m); return Promise.resolve({ forEach: (f) => (R[d] || []).forEach((x) => f({ data: () => JSON.parse(JSON.stringify(x)) })) }); } }) }) })
  });
  const rs = () => reads.filter((p) => /^readStats/.test(p)).length;
  const bt = () => ($('#usBody') || {}).textContent || '';
  // 設定から開く
  w.document.body.insertAdjacentHTML('beforeend', '<div id="adminPanel" class="open"></div><div id="adminBody"></div><div id="adminCount"></div>');
  w._admTab = 'set'; w._admPg = ''; w.renderAdminList();
  c('設定の「📊 利用状況」は全画面を開く', /usOpen\(\)/.test($('#adminBody').innerHTML));
  w.usOpen(); await sleep(50);
  c('全画面・上に固定の帯（タブ4つ）', !!$('#usOv') && !!$('#usHd') && !!$('#usBody') && [...w.document.querySelectorAll('#usHd .usd-tabs span')].map((x) => x.textContent).join() === '概要,画面,人,費用');
  c('概要: 今日1・直近7日2・解放済み3人のうち7日で使った 67%・1人あたり（昨日 200,000÷100）2,000', /1今日 開いた人/.test(bt()) && /2直近7日に開いた人/.test(bt()) && /67%解放済み 3人のうち/.test(bt()) && /2,0001人あたりの読み取り/.test(bt()), bt().slice(0, 300));
  c('概要: 7日開いていない人（読み取りなしで分かる）への入口', /7日開いていない人 1人/.test(bt()));
  c('概要: その日に開いた人と読み取りのグラフ（無料枠の線）', /その日に開いた人（NAVIGATOR）/.test(bt()) && /100人/.test(bt()) && /200,000/.test(bt()) && /線＝無料枠/.test(bt()));
  c('概要では readStats を読まない', rs() === 0);
  // 画面
  w.usTab('scr'); await sleep(50);
  c('画面タブで、7日分を1回だけ読む', rs() === 7);
  c('画面ごとに 開いた回数・使った人・1人あたり・時間・読み取り（スマホはカード）', /MAP15/.test(bt()) && /開いた 15回・1人・1人 15回・50分・読み取り 4,000/.test(bt()) && /PLAN/.test(bt()), bt().slice(0, 500));
  const names = () => [...w.document.querySelectorAll('#usBody .usd-sc .h b')].map((x) => x.textContent);
  c('開いた回数の多い順（MAP→カレンダー→PLAN）', names().join() === 'MAP,カレンダー,PLAN', names().join());
  w.usSSort('ts'); await sleep(5); w.usSSort('ts'); await sleep(5);
  c('使った時間で並べ替え・もう一度押すと逆（短い順: PLAN→カレンダー→MAP）', names().join() === 'PLAN,カレンダー,MAP', names().join());
  w.usSSort('op'); await sleep(5);
  w.usApp('ck'); await sleep(5);
  c('受付・会員証に切り替え（読み直さない）', /会員証/.test(bt()) && rs() === 7);
  w.usApp('nav');
  // PC は表
  setWH(1280, 800); w.usRender(); await sleep(5);
  c('PC は表（見出しを押すと並べ替え）', !!w.document.querySelector('#usBody table.usd-t th') && /見出しを押すと/.test(bt()));
  setWH(390, 844); w.usRender(); await sleep(5);
  // 画面を押すと、その画面をよく使う人
  w.usScreen('nav|plan'); await sleep(10);
  c('画面を押すと「人」タブで、その画面をよく使う人の順', /画面「PLAN」をよく使う人の順/.test(bt()) && [...w.document.querySelectorAll('#usBody .usr-h b')][0].textContent === '見本 ときどき');
  w._ud.screen = ''; w._ud.sort = 'days'; w.usRender();
  // 人
  c('人: よく使う1（7日の半分以上）・ときどき1・使っていない1（解放前の人は入れない）', /1よく使う/.test(($('#usSegs') || {}).textContent) && /1ときどき/.test($('#usSegs').textContent) && /1使っていない/.test($('#usSegs').textContent) && !/見本 まだ/.test(bt()), ($('#usSegs') || {}).textContent);
  const marker = w.document.createElement('i'); marker.id = 'mk'; $('#usBody').appendChild(marker);
  w.usSort('time'); await sleep(5);
  c('並べ替えは一覧だけ差し替え（画面の残りはそのまま＝スクロールが動かない）', !!$('#mk') && [...w.document.querySelectorAll('#usBody .usr-h b')][0].textContent === '見本 毎日');
  w.usSeg('idle'); await sleep(5);
  c('「使っていない」で絞る', [...w.document.querySelectorAll('#usBody .usr-h b')].map((x) => x.textContent).join() === '見本 つかわない' && !!$('#mk'));
  w.usSeg('all'); w.usQ('ときどき'); await sleep(5);
  c('名前で探す', [...w.document.querySelectorAll('#usBody .usr-h b')].map((x) => x.textContent).join() === '見本 ときどき');
  w.usQ('');
  // 人の詳しい中身
  w.usWho('a'); await sleep(5);
  const dr = ($('#usDr') || {}).textContent || '';
  c('人を押すと重ねて詳しく（日数5／7・開いた10回・時間・画面ごと）', /5／7日使った日数/.test(dr) && /10開いた回数/.test(dr) && /1時間使った時間/.test(dr) && /MAP15回50分4,000/.test(dr) && !!$('#mk'), dr.slice(0, 300));
  $('#usDr').remove();
  // 30日は読み直す
  w.usPer(30); await sleep(50);
  c('期間を30日にすると、30日分を読む（7日分とは別）', rs() === 37);
  w.usPer(7); await sleep(10);
  c('7日に戻すと、もう読まない', rs() === 37);
  // 費用
  w.usTab('cost'); await sleep(10);
  c('費用: 1日の平均・超えた分・1か月の目安', /200,0001日の読み取り/.test(bt()) && /150,000無料枠を超えた分/.test(bt()) && /約405円/.test(bt()), bt().slice(0, 300));
  c('費用: アプリ別と、読み取りの多い画面', /NAVIGATOR5,300回/.test(bt()) && /読み取りの多い画面/.test(bt()) && /MAP/.test(bt()));
  // ユニオンで絞る
  w.usTab('ppl'); w.usUn('LIEN'); await sleep(5);
  c('ユニオンで絞る（LIEN だけ）', [...w.document.querySelectorAll('#usBody .usr-h b')].map((x) => x.textContent).join() === '見本 つかわない');
  w.usClose();
  c('閉じると消える', !$('#usOv'));
  w.db = db0;
  c('APP_JS_VERSION v889 以上', +(/APP_JS_VERSION = 'v(\d+)'/.exec(require('fs').readFileSync(require('path').join(__dirname, '../../../app.js'), 'utf8')) || [0, 0])[1] >= 889);
});
