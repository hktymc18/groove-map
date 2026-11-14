// v878：受付連携のユニオン選び。ユニオン名がまったく同じなら地域が違ってもつなぐ（同じユニオンが各地域に散らばっている時）。
//   地域は、名前で始まるユニオン（REVE東京 など）を選ぶ時の見分けにだけ使う。合わない時はほかのユニオンを代わりに使わない（架空データ）
const T = require('../lib/head.js')();
const { w, c } = T;
T.run(async () => {
  T.login();
  const asMember = (union, area) => { w.currentUser = { uid: 'someone', name: '見本 太郎', union, area }; };
  const pick = (L) => w._ckPickUnion(L, '');
  asMember('LIEN', '東京');
  c('名前が同じなら、受付のユニオンの地域（福岡）と違ってもつなぐ', pick([{ id: 'GRANT', area: '福岡' }, { id: 'LIEN', area: '福岡' }]) === 'LIEN');
  c('地域が空欄のユニオンにもつなぐ', pick([{ id: 'LIEN', area: '' }]) === 'LIEN');
  c('受付に自分のユニオンが無ければ、ほかのユニオンを代わりに使わない', pick([{ id: 'GRANT', area: '東京' }, { id: 'REVE', area: '東京' }]) === '');
  c('名前が似ているだけ（LIENX）の時は、地域が違えばつながない', pick([{ id: 'LIENX', area: '福岡' }]) === '');
  asMember('REVE', '東京');
  c('名前で始まるユニオンは、地域で見分ける（REVE東京）', pick([{ id: 'REVE福岡', area: '福岡' }, { id: 'REVE東京', area: '東京' }]) === 'REVE東京');
  c('名前が同じユニオンがあれば、そちらを先に', pick([{ id: 'REVE東京', area: '東京' }, { id: 'REVE', area: '福岡' }]) === 'REVE');
  asMember('ＬＩＥＮ', '大阪');
  c('全角・空白の違いは同じ名前として扱う', pick([{ id: 'LIEN', area: '福岡' }]) === 'LIEN');
  asMember('', '東京');
  c('ユニオンが未設定なら、どこにもつながない', pick([{ id: 'LIEN', area: '' }]) === '');
  // オーナーがアカウント管理で紐付ける時の、選んでおくユニオン
  T.login();
  c('オーナーの紐付け: 名前が同じなら地域が違っても、そのユニオンを選んでおく', w._admCkUnion([{ id: 'ANTARES', area: '福岡' }, { id: 'LIEN', area: '福岡' }], { union: 'LIEN', area: '東京' }) === 'LIEN');
  c('APP_JS_VERSION v878 以上', +(/APP_JS_VERSION = 'v(\d+)'/.exec(require('fs').readFileSync(require('path').join(__dirname, '../../../app.js'), 'utf8')) || [0, 0])[1] >= 878);
});
