// v913：MAP のカードに研修生の最後の研修（項目・日付・結果・A さん）を出す。OL記録は直近1か月だけ。名前はすべて架空
const T = require('../lib/head.js')({ now: '2026-11-22T03:00:00Z' });
const { w, c, sleep } = T;
T.run(async () => {
  T.login();
  const tr = { id: 't1', lastName: '見本', firstName: '花', title: 'マケ', parentId: 'r', mapType: 'both', trainee: true,
    traineeHistory: [{ status: 'PG', date: '2026-11-10', result: 'next', aSan: '架空A' }, { status: 'マケ', date: '2026-11-18', result: 'next', aSan: '架空B' }, { status: 'DLR', date: '2026-11-25', result: 'planned', aSan: '架空C' }] };
  const nt = { id: 'b1', lastName: '見本', firstName: '一', title: 'B3', parentId: 'r', mapType: 'both', traineeHistory: [{ status: 'FT', date: '2026-11-01', result: 'next' }] };
  w.state.members = [{ id: 'r', lastName: '架空', firstName: '親', title: 'BR', parentId: '', mapType: 'both' }, tr, nt];
  w.state.freshData = { b1: { olLog: [
    { date: '2026-09-17', what: '基準値', note: '古い' }, { date: '2026-11-20', what: '新しい' }, { date: '2026-10-30', what: '1か月以内' }, { what: '日付なし' }, { date: '2026-12-02', what: 'これから', st: 'planned' }] } };
  const L = w.memberLastTrainLine(tr);
  c('研修生：最後に結果を入れた研修（予定は入れない）', /マケ（11\/18）/.test(L) && /✓/.test(L) && /A:架空B/.test(L) && !/DLR/.test(L), L);
  c('「最後の研修」とは書かない・何日前も出さない', !/最後/.test(L) && !/日前/.test(L));
  c('研修生でない人には出さない', w.memberLastTrainLine(nt) === '');
  c('流れた研修は ✗', /✗/.test(w.memberLastTrainLine(Object.assign({}, tr, { traineeHistory: [{ status: 'FT', date: '2026-11-19', result: 'left' }] }))));
  const ol = w.memberOlRecent(nt).map(e => e.what);
  c('OL記録は直近1か月（30日前より後）・日付の新しい順・日付なしは出さない', ol.join() === 'これから,新しい,1か月以内', ol.join());
  const h = w.memberInfoHtml(tr);
  c('スマホの情報に最後の研修の行と研修予定の行が両方出る', /マケ（11\/18）/.test(h) && /研修予定：DLR/.test(h));
  const h2 = w.memberInfoHtml(nt);
  c('スマホの情報の OL記録に古い記録（9/17）が出ない', /新しい/.test(h2) && !/基準値/.test(h2));
});
