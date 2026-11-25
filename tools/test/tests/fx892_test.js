// v892：#45 削除した人の下にフロント追加しない（選んだままの人を消した後）・#47 ビジネス→ユーザー→ビジネスに戻した人に「元ユーザー」を出さない・#46 研修結果「流れた」で MAP も OUT に。名前はすべて架空
const T = require('../lib/head.js')({ timeout: 120000 });
const { w, c, sleep, setWH, $ } = T;
const M = id => w.state.members.find(m => m.id === id);
T.run(async () => {
  T.login(); setWH(390, 844); try { w._uxSync && w._uxSync(); } catch (e) {}
  w.state.isEditor = true;
  w.state.members = [{ id: 'r', lastName: '架空', firstName: '一郎', title: 'ゴールド', parentId: '', mapType: 'both', ptSelf: 3000, activity: 'S' },
    { id: 'p', lastName: '見本', firstName: '親', title: 'B5', parentId: 'r', mapType: 'both', ptSelf: 800 },
    { id: 'a', lastName: '見本', firstName: 'エー', title: 'B1', parentId: 'p', mapType: 'both', ptSelf: 300 },
    { id: 'z', lastName: '見本', firstName: '迷子', title: 'マケ', parentId: 'a', mapType: 'both', ptSelf: 0, trainee: true }];
  w.state.idealMembers = [];
  w.recalcAllGSV(); w.switchView('current'); await sleep(80);

  // ── #45 ──
  // 前のバグで、削除した人の下に残った人（z）→ 描く時に生きている上の人へ付け替え
  M('a').deleted = true;
  w.renderCurrentView(); await sleep(400);
  c('#45: 削除した人の下に残っていた人は、その上の生きている人の下へ（MAPに出る）', M('z').parentId === 'p', M('z').parentId);
  // 選んだままの人（A）を削除した後に「＋追加」→ 追加先は A ではなく、その上の人
  w._selectedCardId = 'a';
  w.onFabClick(); await sleep(80);
  const pg = () => ($('#naPg') || {}).textContent || '';
  c('#45: 追加先は削除した人ではなく、その上の生きている人', /見本 親さんの下に追加/.test(pg()) && !/見本 エーさん/.test(pg()), pg().slice(0, 80));
  w.naClose();
  // 直接 A の id で開いても同じ
  w.naOpen('a'); await sleep(40);
  c('#45: 削除した人の id で開いても、上の人の下', w._na && w._na.pid === 'p');
  // 開いている間に追加先の人が削除されても、保存は上の人の下
  w._na.pid = 'a'; w.$ && 0;
  w.document.getElementById('naNmA').value = '新人'; w.document.getElementById('naNmB').value = '太郎';
  w.naSave(); await sleep(60);
  const nw = w.state.members.find(m => m.lastName === '新人');
  c('#45: 保存も削除した人の下には入れない', nw && nw.parentId === 'p', nw && nw.parentId);
  // 上がみんな削除されていたら、いちばん上（自分）の下
  M('p').deleted = true;
  w.naOpen('a'); await sleep(40);
  c('#45: 上の人も削除されていたら、自分（いちばん上）の下', w._na && w._na.pid === 'r');
  w.naClose();
  c('#45: 生きている人ならそのまま', w._liveParentId('r') === 'r' && w._liveParentId('') === '' && w._liveParentId('none') === '');

  // ── #47 ──
  const today = w.evTodayYmd();
  w.state.members.push({ id: 'b', lastName: '見本', firstName: 'ビーエム', title: 'BM', parentId: 'r', mapType: 'both', ptSelf: 500 });
  w.confirm = () => true;
  w.ppOpen('b', 'current'); await sleep(40); w.ppGo('title'); await sleep(20);
  w.ppTitle('ユーザー'); await sleep(60);
  c('#47: BM → ユーザー（ユーザーになった日）', M('b').title === 'ユーザー' && M('b').toUser === today);
  w.ppTitle('BM'); await sleep(60);
  c('#47: ユーザー → BM に戻しても「元ユーザー」にしない', M('b').title === 'BM' && !M('b').fromUser && !w._umFromUser(M('b')), JSON.stringify({ f: M('b').fromUser, t: M('b').toUser }));
  // 前の版で付いてしまった印（toUser の後に fromUser）は出さない
  M('b').toUser = '2026-11-01'; M('b').fromUser = '2026-11-05';
  c('#47: 前の版で付いた印も、ビジネスから来た人には出さない', !w._umFromUser(M('b')));
  w.switchView('current'); await sleep(80);
  const row = [...w.document.querySelectorAll('.umfr')].length;
  c('#47: MAPに「元ユーザー」の札が出ない', row === 0, row);
  // もともとユーザーの人は、これまでどおり「元ユーザー」
  w.state.members.push({ id: 'u', lastName: '利用', firstName: '花子', title: 'ユーザー', parentId: 'r', mapType: 'both', ptSelf: 0 });
  w.ppOpen('u', 'current'); await sleep(40); w.ppGo('title'); await sleep(20);
  w.ppTitle('B1'); await sleep(60);
  c('#47: もともとユーザーの人は「元ユーザー」（これまでどおり）', M('u').fromUser === today && w._umFromUser(M('u')));
  // もとはユーザー → 研修生 → ユーザー → 研修生 は「元ユーザー」のまま
  const x = { title: 'マケ', trainee: true, fromUser: '2026-10-01', toUser: '2026-10-10' };
  c('#47: もとはユーザーで行き来した人は「元ユーザー」のまま', w._umFromUser(x));
  // ── #46 ──
  w.state.members.push({ id: 'n', lastName: '見本', firstName: 'エヌエー', title: 'PA', cat: '研修生', parentId: 'r', mapType: 'both', ptSelf: 0, trainee: true, traineeHistory: [] });
  w.ppOpen('n', 'current'); await sleep(40); w.ppGo('tr'); await sleep(30);
  const trTx = ($('#ppPg') || {}).textContent || '';
  c('#46: 研修の画面に「流れた」', /流れた/.test(trTx));
  w.ppTrRes('流れた'); await sleep(80);
  c('#46: 流れたにすると、MAPでもOUT（研修の段階のまま出さない）', M('n').traineeResult === '流れた' && M('n').title === 'OUT' && !M('n').trainee && M('n').ngFrom === 'PA', JSON.stringify({ t: M('n').title, r: M('n').traineeResult, tr: M('n').trainee }));
  w.ppGo('tr'); await sleep(30);
  w.ppTrRes(''); await sleep(80);
  c('#46: 進行中に戻すと、前のタイトル（PA）に戻る', M('n').traineeResult === '' && M('n').title === 'PA' && !M('n').ngFrom, JSON.stringify({ t: M('n').title, r: M('n').traineeResult }));
  w.closePP && w.closePP();
  // 前の版で「流れた」なのに PA のままの人 → 描く時に1回だけ OUT
  w.state.members.push({ id: 'o', lastName: '見本', firstName: 'オー', title: 'PA', parentId: 'r', mapType: 'both', ptSelf: 0, trainee: false, traineeResult: '流れた' });
  w.state.members.push({ id: 'q', lastName: '見本', firstName: 'キュー', title: 'LOI', parentId: 'r', mapType: 'both', ptSelf: 0, traineeResult: '流れた' });
  w.renderCurrentView(); await sleep(400);
  c('#46: 前の版で流れたのに PA のままの人は OUT に', M('o').title === 'OUT' && M('o').ngFrom === 'PA' && !!M('o').ngOut);
  c('#46: LOI 以降の人は変えない（v472 と同じ決まり）', M('q').title === 'LOI');
  M('o').title = 'マケ'; w.renderCurrentView(); await sleep(400);
  c('#46: 1回直した後に自分でタイトルを変えたら、もう触らない', M('o').title === 'マケ');
  c('APP_JS_VERSION v892 以上', +(/APP_JS_VERSION = 'v(\d+)'/.exec(require('fs').readFileSync(require('path').join(__dirname, '../../../app.js'), 'utf8')) || [0, 0])[1] >= 892);
});
