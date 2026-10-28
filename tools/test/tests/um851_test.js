// v851：#39 タイトルに「ユーザー」（間違えて変えても戻せる・BAなどからユーザーにする）。名前はすべて架空
const T = require('../lib/head.js')({ timeout: 120000 });
const { w, c, sleep, setWH, $, $$ } = T;
const M = id => w.state.members.find(m => m.id === id);
T.run(async () => {
  T.login(); setWH(390, 844); try { w._uxSync && w._uxSync(); } catch (e) {}
  w.state.isEditor = true;
  w.state.members = [{ id: 'r', lastName: '架空', firstName: '一郎', title: 'ゴールド', parentId: '', mapType: 'both', ptSelf: 3000, activity: 'S' },
    { id: 'a', lastName: '見本', firstName: '一', title: 'B2', parentId: 'r', mapType: 'both', ptSelf: 1200, startMonth: '2026.03' },
    { id: 'c', lastName: '見本', firstName: '子', title: 'B1', parentId: 'a', mapType: 'both', ptSelf: 300 },
    { id: 'b', lastName: '試験', firstName: '光', title: 'マケ', parentId: 'r', mapType: 'both', ptSelf: 0, trainee: true },
    { id: 'u', lastName: '利用', firstName: '花子', title: 'ユーザー', parentId: 'r', mapType: 'both', ptSelf: 1800, ptCurrent: 1800 }];
  w.state.idealMembers = [];
  w.recalcAllGSV(); w.switchView('current'); await sleep(80);
  const today = w.evTodayYmd();
  let asked = 0, ans = true; w.confirm = () => { asked++; return ans; };

  // ① ユーザーのタイトル画面に「ユーザー」がある
  w.umOpen('u'); await sleep(40); w.ppGo('title'); await sleep(20);
  const tx = () => ($('#ppPg') || {}).textContent || '';
  c('タイトルの「そのほか」に ユーザー・OUT', /そのほか/.test(tx()) && /ユーザー・OUT/.test(tx()));
  c('ユーザーの人は「ユーザー」が選ばれている', $$('#ppPg .ttc .cur').some(x => x.textContent === 'ユーザー'));
  // ② 間違えて変えても戻せる
  w.ppTitle('B1'); await sleep(40);
  c('間違えてB1にすると「元ユーザー」', M('u').title === 'B1' && M('u').fromUser === today);
  asked = 0; w.ppTitle('ユーザー'); await sleep(40);
  c('ユーザーを選び直すと戻る', M('u').title === 'ユーザー' && w.isUserM(M('u')));
  c('その日のうちに戻したら「元ユーザー」の印は消える', !M('u').fromUser && !M('u').toUser);
  c('ユーザー画面に戻る', /ADP・購入/.test(($('#ppPg') || {}).textContent || '') || (w.ppGo(''), /ADP・購入/.test(tx())));
  w.closePP && w.closePP();

  // ③ BA からユーザーにする（確かめる）
  w.ppOpen('a', 'current'); await sleep(40); w.ppGo('title'); await sleep(20);
  ans = false; asked = 0; w.ppTitle('ユーザー'); await sleep(40);
  c('BAからユーザーは確かめる（やめたら変えない）', asked === 1 && M('a').title === 'B2');
  ans = true; asked = 0; w.ppTitle('ユーザー'); await sleep(60);
  c('ユーザーにすると、タイトル・ユーザーになった日', M('a').title === 'ユーザー' && M('a').toUser === today && M('a').startMonth === '2026.03' && M('a').trainee === false);
  c('ユーザーの一覧に入る', w._umList().some(m => m.id === 'a'));
  c('下に人がいる時はビジネスのMAPに残る（線が切れない）', w._umHide(w.state.members).some(m => m.id === 'a'));
  c('ポイントは紹介者のGSVに入ったまま', M('r').ptCurrent >= 3000 + 1200 + 1800);
  // ④ 研修生からユーザー（下に人がいない → ビジネスのMAPから外れる）
  w.ppOpen('b', 'current'); await sleep(40); w.ppGo('title'); await sleep(20);
  w.ppTitle('ユーザー'); await sleep(60);
  c('研修生からユーザー：研修生の印は外れる', M('b').title === 'ユーザー' && M('b').trainee === false);
  c('下に人がいないユーザーはビジネスのMAPから外れる', !w._umHide(w.state.members).some(m => m.id === 'b'));
  // ⑤ 保存し直しても「ユーザーになった日」は消えない
  w.ppGo('prof'); await sleep(10); w.ppSetF('fRegion', '福岡', ''); await sleep(30);
  c('メンバー画面で保存し直しても toUser は残る', M('b').toUser === today && M('b').region === '福岡');
  // ⑥ 理想MAPは今まで通り
  c('理想MAPのタイトルにもユーザー（前から）', /'ユーザー'\]\]/.test(require('fs').readFileSync(require('path').join(__dirname, '../../../app.js'), 'utf8').match(/if \(ideal\) groups = .*/)[0]));
});
