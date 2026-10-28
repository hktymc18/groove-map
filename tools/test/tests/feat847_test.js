// v847：新機能のテスト（機能のスイッチ）。appConfig/features の flags で、先に見られる人だけ／全員に公開。名前はすべて架空
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  const docs = {}, sets = [], subs = [];
  const d0 = w.db.doc.bind(w.db);
  w.db = Object.assign({}, w.db, {
    doc(p) {
      const r = d0(p);
      r.get = () => Promise.resolve({ exists: !!docs[p], data: () => JSON.parse(JSON.stringify(docs[p] || {})) });
      r.set = (d) => { sets.push([p, d]); docs[p] = d; return Promise.resolve(); };
      r.onSnapshot = (fn, er) => { const s = { p, fn, er, off: false }; subs.push(s); fn({ exists: !!docs[p], data: () => JSON.parse(JSON.stringify(docs[p] || {})) }); return () => { s.off = true; }; };
      return r;
    }
  });
  const push = () => subs.filter(s => !s.off && s.p === 'appConfig/features').forEach(s => s.fn({ exists: true, data: () => JSON.parse(JSON.stringify(docs['appConfig/features'])) }));
  w.localStorage.removeItem('gm_feat'); w._featCfg = null;

  // ① 設定がない時はだれにも出ない（今までと同じ画面）
  w.currentUser = { uid: 'u1', name: '架空 一郎', union: 'GRANT' };
  w._featLoad(); await sleep(10);
  c('設定がない時は出ない', w.featOn('sheet2') === false && w._featBadge('sheet2') === '');
  c('登録していない機能も出ない', w.featOn('nothing') === false);

  // ② テスト中：先に見られる人だけ
  docs['appConfig/features'] = { flags: { sheet2: { on: false, testers: ['u1', 'u2'] } }, at: 'x', by: T.OWNER };
  let rc = 0; const rcv = w.renderCurrentView; w.renderCurrentView = function() { rc++; return rcv.apply(this, arguments); };
  push(); await sleep(10);
  c('先に見られる人には出る', w.featOn('sheet2') === true);
  c('変わった時は画面を描き直す（アプリの更新なしで出る）', rc >= 1);
  c('先に見ている人には「テスト中」の印', /テスト中（開発メンバーだけ）/.test(w._featBadge('sheet2')));
  w.currentUser = { uid: 'u9', name: '架空 九郎', union: 'GRANT' };
  c('ほかの人には出ない', w.featOn('sheet2') === false && w._featBadge('sheet2') === '');
  w.currentUser = null;
  c('ログインしていない時は出ない', w.featOn('sheet2') === false);

  // ③ 前回の設定を覚えていて、読み込み前でもすぐ使える
  w._featCfg = null; w.currentUser = { uid: 'u2', name: '架空 二郎', union: 'GRANT' };
  c('前回わかった設定（端末に保存）で判断する', w.featOn('sheet2') === true);

  // ④ 全員に公開
  docs['appConfig/features'] = { flags: { sheet2: { on: true, testers: ['u1'] } }, at: 'x', by: T.OWNER };
  w.currentUser = { uid: 'u9', name: '架空 九郎', union: 'GRANT' };
  rc = 0; push(); await sleep(10);
  c('全員に公開すると、だれにでも出る', w.featOn('sheet2') === true && rc >= 1);
  c('全員に公開したら「テスト中」の印は出ない', w._featBadge('sheet2') === '');
  rc = 0; push(); await sleep(10);
  c('変わっていない時は描き直さない', rc === 0);

  // ⑤ 変な中身は捨てる
  docs['appConfig/features'] = { flags: { sheet2: { on: 'yes', testers: 'u9' } }, at: 'x', by: 'x' };
  push(); await sleep(10);
  c('on が true でない・testers が配列でない時は出さない', w.featOn('sheet2') === false);

  // ⑥ ログインした時に読み込む（前の購読は止める）
  const n0 = subs.length, last = subs[subs.length - 1];
  w.loginSuccess({ uid: 'u3', name: '架空 三郎', union: 'GRANT', status: 'active', privacy: { ver: w.PRIVACY_VER, at: 'x' } }); await sleep(30);
  c('ログインした時に読み込む', subs.length > n0 && subs[subs.length - 1].p === 'appConfig/features');
  c('前の購読は止める', last.off === true);
  w.closeApprovalGate && w.closeApprovalGate();

  // ⑦ アカウント管理：オーナー以外には出ない
  docs['appConfig/features'] = { flags: { sheet2: { on: false, testers: ['t1'] } }, at: 'x', by: T.OWNER }; push();
  w._adminUsers = [{ id: T.OWNER, name: '架空 オーナー', union: 'GRANT' }, { id: 't1', name: '試験 一子', union: 'GRANT', status: 'active' },
    { id: 't2', name: '試験 二太', union: 'LIEN', status: 'active' }, { id: 't3', name: '見本 三平', union: 'GRANT', status: 'active' }, { id: 'p1', name: '待ち 四郎', union: 'GRANT', status: 'pending' }];
  w.currentUser = { uid: 'adm', name: '架空 管理', union: 'GRANT', role: 'admin', area: '福岡' };
  c('オーナー以外には「新機能のテスト」は出ない', w._featAdmHtml() === '');
  w.currentUser = { uid: T.OWNER, name: '架空 オーナー', union: 'GRANT', area: '福岡' };
  w.document.getElementById('adminPanel').classList.add('open');
  w.renderAdminList(); await sleep(20);
  const box = $('#featAdmBox');
  c('オーナーのアカウント管理に「新機能のテスト」', !!box && /新機能のテスト/.test(box.textContent) && /計画シートにまとめる/.test(box.textContent));
  c('状態と人数が見える', /テスト中・先に見られる人 1人/.test(box.textContent));

  // ⑧ 先に見られる人を選ぶ
  w.featAdmOpen('sheet2'); await sleep(10);
  const dlg = () => $('.acc-dlg');
  c('設定を開ける（テスト中／全員に公開・先に見られる人）', !!dlg() && /テスト中/.test(dlg().textContent) && /全員に公開/.test(dlg().textContent) && /試験 一子/.test(dlg().textContent));
  w.featAdmPick(); await sleep(40);
  const pk = () => $$('#featPk > div').map(x => x.textContent);
  c('アカウントの一覧から選べる（もう選んだ人・承認待ちは出ない）', pk().some(t => /試験 二太/.test(t)) && !pk().some(t => /試験 一子|待ち 四郎/.test(t)));
  w.featAdmQ('見本'); await sleep(5);
  c('名前で探せる', pk().length === 1 && /見本 三平/.test(pk()[0]));
  w.featAdmQ('LIEN'); await sleep(5);
  c('ユニオンでも探せる', pk().length === 1 && /試験 二太/.test(pk()[0]));
  w.featAdmAdd('t2'); await sleep(5);
  c('足すと先に見られる人に入る', /試験 二太/.test($('.feat-ch').textContent));
  w.featAdmDel(0); await sleep(5);
  c('✕で外せる', !/試験 一子/.test($('.feat-ch').textContent));
  sets.length = 0; w.featAdmSave(); await sleep(20);
  const s1 = sets.find(x => x[0] === 'appConfig/features');
  c('保存すると appConfig/features に flags・at・by', !!s1 && Object.keys(s1[1]).sort().join() === 'at,by,flags' && s1[1].by === T.OWNER && JSON.stringify(s1[1].flags.sheet2) === '{"on":false,"testers":["t2"]}');
  c('閉じて、一覧も新しい人数に', !dlg() && /テスト中・先に見られる人 1人/.test($('#featAdmBox').textContent));

  // ⑨ 全員に公開は確かめてから
  let asked = 0; w.confirm = () => { asked++; return false; };
  w.featAdmOpen('sheet2'); w.featAdmOn(1); sets.length = 0; w.featAdmSave(); await sleep(10);
  c('全員に公開は確かめる（やめたら保存しない）', asked === 1 && !sets.length);
  w.confirm = () => { asked++; return true; };
  w.featAdmSave(); await sleep(20);
  const s2 = sets.find(x => x[0] === 'appConfig/features');
  c('全員に公開を保存', !!s2 && s2[1].flags.sheet2.on === true && /全員に公開/.test($('#featAdmBox').textContent));
  w.currentUser = { uid: 'zz', name: '架空 だれか', union: 'GRANT' };
  c('保存したらすぐ、だれにでも出る', w.featOn('sheet2') === true);
  w.currentUser = { uid: T.OWNER, name: '架空 オーナー', union: 'GRANT', area: '福岡' };
  asked = 0; w.featAdmOpen('sheet2'); w.featAdmOn(0); w.featAdmSave(); await sleep(20);
  c('テスト中に戻す時も確かめる', asked === 1 && w._featFlags().sheet2.on === false);

  // ⑩ 保存できない時（ルール未反映など）
  w.db = Object.assign({}, w.db, { doc(p) { return { set() { return Promise.reject(new Error('denied')); }, get() { return Promise.resolve({ exists: false }); }, onSnapshot() { return () => {}; } }; } });
  w.featAdmOpen('sheet2'); w.featAdmSave(); await sleep(20);
  c('保存できない時はトーストで知らせる', /保存できませんでした/.test(($('#toast') || {}).textContent || w.document.body.textContent));
});
