// v880：所属ユニオンは、オーナーが決めた一覧の名前だけ（表記ゆれを作らない・直す）（架空データ）
const T = require('../lib/head.js')();
const { w, c, sleep, $ } = T;
T.run(async () => {
  T.login();
  w._unionCfg = [{ name: 'LIEN', upbd: '見本 一郎' }, { name: 'REVE', upbd: '' }, { name: 'ANTARES', upbd: '' }];
  c('一覧の名前か（まったく同じ時だけ）', w._unionInList('LIEN') && !w._unionInList('lien') && !w._unionInList('LIEN ') && !w._unionInList(''));
  // 選択欄: 一覧に無い名前は選択肢に足さない（選んでいない＝選び直し）
  const sel = w.document.createElement('select'); sel.innerHTML = w.unionOptionsHtml('選択');
  w._unionSelSet(sel, 'LIEN');
  c('一覧の名前はそのまま選ばれる', sel.value === 'LIEN');
  w._unionSelSet(sel, 'lien東京');
  c('一覧に無い名前は選択肢に足さず、未選択になる', sel.value === '' && ![].some.call(sel.options, o => o.value === 'lien東京'));
  // ログイン時の必須チェック
  const P = (x) => Object.assign({ uid: 'm1', union: 'LIEN', area: '福岡', upRuby: 'x', upBd: 'x', unionSelectedV2: true }, x || {});
  c('一覧の名前なら、選び直しはいらない', w.profileComplete(P()));
  c('一覧に無い名前（表記ゆれ）なら、選び直してもらう', !w.profileComplete(P({ union: 'Lien' })));
  c('管理者・オーナーは対象外（所属ユニオンを自分で変えられないため）', w.profileComplete(P({ union: 'Lien', role: 'admin' })) && w.profileComplete(P({ union: 'Lien', uid: T.OWNER })));
  const cfg = w._unionCfg; w._unionCfg = null;
  c('一覧をまだサーバーから読めていない時は、選び直しを求めない', w.profileComplete(P({ union: 'NEWUNION' })));
  w._unionCfg = cfg;
  // オーナーのアカウント管理: 一覧に無い人の絞り込み・直す
  w._adminUsers = [{ id: 'u1', name: '見本 はなこ', union: 'lien', area: '福岡', status: 'active' }, { id: 'u2', name: '見本 太郎', union: 'REVE', area: '東京', status: 'active' }];
  const writes = []; const fs0 = w.fsSet; w.fsSet = (p, d) => { writes.push([p, d]); return Promise.resolve(); };
  w.document.body.insertAdjacentHTML('beforeend', '<div id="adminBody"></div><div id="adminCount"></div>');
  w._admTab = 'acc'; w._admPg = ''; w._admF = 'all';
  w.renderAdminList();
  let html = $('#adminBody').innerHTML;
  c('オーナーには「ユニオン名が一覧に無い 1」の絞り込みと、その人の行に「直す」', /ユニオン名が一覧に無い<b>1<\/b>/.test(html) && /admUnFix\('u1'\)/.test(html) && !/admUnFix\('u2'\)/.test(html), html.slice(0, 300));
  w.admF('unx');
  html = $('#adminBody').innerHTML;
  c('絞り込むと、一覧に無い人だけ', /見本 はなこ/.test(html) && !/見本 太郎/.test(html));
  w.admUnFix('u1');
  const dsel = w.document.getElementById('admUnSel');
  c('直す画面で、近い名前（LIEN）を選んでおく', dsel && dsel.value === 'LIEN');
  w.admUnFixSave('u1'); await sleep(20);
  c('直すと、一覧の名前で保存する（前の名前も残す）', writes.length === 1 && writes[0][0] === 'users/u1' && writes[0][1].union === 'LIEN' && writes[0][1].unionFixedFrom === 'lien');
  c('全角や空白の違いも近い名前を探す', w._unGuess('ＲＥＶＥ') === 'REVE' && w._unGuess('LIEN 東京') === 'LIEN' && w._unGuess('ぜんぜん違う') === '');
  // オーナーでない人には出さない
  w.currentUser.uid = 'someone'; w.currentUser.role = 'admin'; w.currentUser.union = 'LIEN';
  c('オーナーでない人には「直す」を出さない', w._admUnxLine({ id: 'u9', union: 'lien' }) === '');
  w.fsSet = fs0;
  c('APP_JS_VERSION v880 以上', +(/APP_JS_VERSION = 'v(\d+)'/.exec(require('fs').readFileSync(require('path').join(__dirname, '../../../app.js'), 'utf8')) || [0, 0])[1] >= 880);
});
