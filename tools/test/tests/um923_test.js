// v923：ユーザー台帳に「DAYスタッフに相談した（最後の日）」。分野・中身・相手は出さない。架空データ
const T = require('../lib/head.js')();
const { w, c } = T;
T.run(async () => {
  T.login();
  c('相談していない人は何も出さない', w._umCsLine({}) === '' && w._umCsLine({ uCs: null }) === '');
  const at = new w.Date(2026, 10, 26, 10, 0).getTime();
  const h = w._umCsLine({ uCs: { at } });
  c('相談した人は「💬 DAYスタッフに相談した（最後 11/26）」', /DAYスタッフに相談した（最後 11\/26）/.test(h), h);
  c('分野・相手は出さない', !/スキンケア|バストアップ|さん/.test(h));
  c('メンバー画面の保存で落とさない（UM_KEYS に uCs）', w.UM_KEYS.indexOf('uCs') >= 0);
  c('APP_JS_VERSION v923 以上', +(/APP_JS_VERSION = 'v(\d+)'/.exec(require('fs').readFileSync(require('path').join(__dirname, '../../../app.js'), 'utf8')) || [0, 0])[1] >= 923);
});
