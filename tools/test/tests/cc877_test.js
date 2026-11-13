// v877：カードコレクションの入口をいつも出す（紐付いていない人には案内）・オーナーも自分のアカウントを受付の名簿と紐付けられる（架空データ）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, OWNER } = T;
T.run(async () => {
  T.login();
  setWH(390, 844);
  w.currentUser.union = 'UA';
  w.currentUser.ckNo = '';
  w._evLoadedUid = w.currentUser.uid;
  // ① 紐付いていない時: メニューに出る → 押すと案内（埋め込みは開かない）
  w.switchView('menu'); await sleep(100);
  c('紐付いていなくてもHOMEに「カードコレクション」', /cardColOpen\(\)/.test(($('#view-menu') || {}).innerHTML || ''));
  w.cardColOpen();
  let ov = w.document.getElementById('cardColOv');
  c('紐付いていない時は案内（受付のページは開かない）', ov && !ov.querySelector('iframe') && /受付の名簿と紐付いていません/.test(ov.textContent));
  c('オーナーには「アカウント管理」から紐付ける案内とボタン', /自分の行/.test(ov.textContent) && /openAdminPanel\(\)/.test(ov.innerHTML));
  w.cardColClose();
  // オーナーでない人: 管理者にお願いする案内・ボタンなし
  w.currentUser.uid = 'someone';
  w.cardColOpen();
  ov = w.document.getElementById('cardColOv');
  c('オーナーでない人には「ユニオンの管理者にお願い」・ボタンなし', /ユニオンの管理者に/.test(ov.textContent) && !/openAdminPanel\(\)/.test(ov.innerHTML));
  w.cardColClose();
  // ② アカウント管理: オーナーの行の紐付け
  const owner = { id: OWNER, name: '見本 オーナー', union: 'UA' }, other = { id: 'u2', name: '見本 はなこ', union: 'UA' };
  w._adminUsers = [owner, other];
  c('オーナーでない人には、オーナーの行の紐付けを出さない', w._admCkLine(owner) === '' && /受付の名簿と紐付ける/.test(w._admCkLine(other)));
  w.currentUser.uid = OWNER;
  c('オーナーが見ると、オーナーの行にも「🎫 受付の名簿と紐付ける」', /admCkOpen\('j2DPD/.test(w._admCkLine(owner)) && /受付の名簿と紐付ける/.test(w._admCkLine(owner)));
  // 紐付けの画面（名簿は架空）
  const writes = [], subs = [];
  const qs = L => ({ forEach: f => L.forEach(r => f({ id: r.id, data: () => Object.assign({}, r) })) });
  const col0 = w.db.collection, set0 = w.fsSet;
  w.db.collection = p => ({
    get: () => Promise.resolve(qs(p === 'checkinUnions' ? [{ id: 'UA' }] : [])),
    where: () => ({ get: () => Promise.resolve(qs(p === 'checkinMembers' ? [{ id: 'A001', name: '見本 オーナー', union: 'UA', active: false }] : [])),
      onSnapshot: () => { subs.push(p); return () => {}; } })
  });
  w.fsSet = (path, d) => { writes.push([path, d]); return Promise.resolve(); };
  w.admCkOpen(OWNER); await sleep(80);
  const box = w.document.getElementById('admCkOv');
  c('オーナーの紐付け画面が開く・「オーナーは無効でも止まらない」の説明', box && /オーナーは、受付で/.test(box.textContent) && /A001/.test(box.textContent), box && box.textContent.slice(0, 200));
  const cf0 = w.confirm, msgs = []; w.confirm = m => { msgs.push(m); return true; };
  w.admCkPick('A001'); await sleep(50);
  c('オーナーには「NAVIGATORを使えなくなります」と出さない', msgs.length === 1 && !/使えなくなります/.test(msgs[0]), msgs[0]);
  c('自分のアカウントに番号を保存', writes.length === 1 && writes[0][0] === 'users/' + OWNER && writes[0][1].ckNo === 'A001');
  c('その場で自分のカードの購読が始まる（開き直さなくてよい）', w.currentUser.ckNo === 'A001' && subs.indexOf('olCheckouts') >= 0);
  w.cardColOpen();
  ov = w.document.getElementById('cardColOv');
  c('紐付けた後は受付の #col を埋め込んで開く', ov && ov.querySelector('iframe') && /checkin\/index\.html#col$/.test(ov.querySelector('iframe').getAttribute('src')));
  w.cardColClose();
  w.confirm = cf0; w.fsSet = set0; w.db.collection = col0;
  c('APP_JS_VERSION v877 以上', +(/APP_JS_VERSION = 'v(\d+)'/.exec(require('fs').readFileSync(require('path').join(__dirname, '../../../app.js'), 'utf8')) || [0, 0])[1] >= 877);
});
