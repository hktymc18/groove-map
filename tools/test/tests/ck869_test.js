// v869：ホームの「気になる人」（OL未着手など）に、ユーザー（お客さん）を出さない。OL・フレッシュはビジネスのメンバーだけ（架空データ）
const T = require('../lib/head.js')();
const { w, c, setWH } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  const ym = String(w.state.currentMonth || w.currentMonthStr());
  const M = (id, ln, fn, t, o) => Object.assign({ id, lastName: ln, firstName: fn, title: t, parentId: 'r', mapType: 'both', traineeHistory: [], startMonth: ym, month: ym }, o || {});
  w.state.members = [M('r', '架空', '一郎', 'ゴールド', { parentId: '', startMonth: '2020.01' }), M('n1', '見本', 'しんじん', 'LOI'),
    M('u1', '見本', 'はなこ', 'ユーザー'), M('u2', '見本', 'さくら', 'U')];
  c('ユーザーはフレッシュ（新しいメンバー）にならない', !w.ckIsFreshByStart(w.state.members[2]) && !w.ckIsFreshByStart(w.state.members[3]));
  c('同じ月に登録したビジネスのメンバーはフレッシュのまま', w.ckIsFreshByStart(w.state.members[1]) === true);
  const g = w.ckCollect(), ids = [].concat(g.trainee, g.fresh, g.exam).map(x => x.m.id);
  c('気になる人に、ユーザーは出ない（OL未着手にならない）', ids.indexOf('u1') < 0 && ids.indexOf('u2') < 0, JSON.stringify(ids));
  c('ビジネスの新しいメンバーは今までどおり出る', ids.indexOf('n1') >= 0, JSON.stringify(ids));
  c('バージョン v869 以降', +(w.APP_JS_VERSION || 'v0').slice(1) >= 869);
});
