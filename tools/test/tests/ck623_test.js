// v623：受付の研修記録をMAPの研修ステップに取り込む（受付→MAPの一方通行）＋名簿から追加でも進み具合が入る
const T = require('../lib/head.js')();
const { w, c, sleep } = T;
T.run(async () => {
  T.login();
  const M = (id, ln, fn, t, o) => Object.assign({ id, lastName: ln, firstName: fn, title: t, parentId: 'r', mapType: 'both', traineeHistory: [] }, o || {});
  w.state.members = [M('r', '山内', '北斗', 'ゴールド', { parentId: '' }),
    M('a', '佐藤', '花', 'PG', { trainee: true, checkinNo: '101', traineeHistory: [{ status: 'マケ', date: '2026-09-01', result: 'next' }, { status: 'PG', date: '2026-09-05', result: 'next', aSan: '山内' }, { status: 'DLR', date: '2026-10-20', result: 'planned' }] }),
    M('b', '田中', '健', 'マケ', { trainee: true }),
    M('c', '鈴木', '一郎', 'B3', { checkinNo: '103' }),
    M('d', '高橋', '翔', 'PA', { trainee: true, checkinNo: '104', traineeHistory: [{ status: 'PA', date: '2026-09-10', result: 'next' }] })];
  const roster = [
    { no: '101', name: '佐藤 花', trainee: true, trainings: { PG: { at: '2026-09-06' }, DLR: { at: '2026-10-02' }, PA: { at: '2026-10-08' } } },
    { no: '102', name: '田中健', trainee: true, trainings: { PG: { at: '2026-10-01' } }, coSheet: { date: '2026-10-05' } },
    { no: '103', name: '鈴木一郎', trainee: false, trainings: { PG: { at: '2026-01-01' } } },
    { no: '104', name: '高橋 翔', trainee: false, trainings: { PA: { at: '2026-09-11' }, 'BPC済み': { at: '2026-10-03' }, CO: { at: '2026-10-04' } } },
  ];
  const o = w._ckTrSyncAll(roster);
  const A = w.state.members[1], B = w.state.members[2], C = w.state.members[3], D = w.state.members[4];
  console.log('=== ① つながっている研修生 ===');
  c('MAPで入れたPGはそのまま（Aさんも残る）', A.traineeHistory.filter(h => h.status === 'PG').length === 1 && A.traineeHistory.find(h => h.status === 'PG').aSan === '山内');
  const dl = A.traineeHistory.find(h => h.status === 'DLR');
  c('予定だったDLR→受付の日付で「進んだ」', dl.result === 'next' && dl.date === '2026-10-02' && dl.ck === 1);
  const pa = A.traineeHistory.find(h => h.status === 'PA');
  c('PAを足す（受付から）', pa && pa.result === 'next' && pa.date === '2026-10-08' && pa.ck === 1);
  c('日付の順に並ぶ', A.traineeHistory.map(h => h.status).join(',') === 'マケ,PG,DLR,PA');
  c('タイトルも最新のステップへ', A.title === 'PA' && A.traineeStatus === 'PA');
  console.log('=== ② まだつながっていない研修生 ===');
  c('名前が1人だけ一致→つなぐ', B.checkinNo === '102');
  c('面談シート提出→面談', B.traineeHistory.some(h => h.status === '面談' && h.date === '2026-10-05') && B.title === '面談');
  console.log('=== ③ 研修生でない人・昇格 ===');
  c('研修生でない人（B3）は記録も足さない', C.title === 'B3' && C.traineeHistory.length === 0);
  c('BPC済み→BPC（BCに）・CO', D.traineeHistory.some(h => h.status === 'BPC' && h.ck) && D.traineeResult === 'BC' && D.title === 'CO');
  c('受付で昇格した人を知らせる（1回だけ）', o.promo.length === 1 && o.promo[0].indexOf('高橋') >= 0 && w._ckTrSyncAll(roster).promo.length === 0);
  c('件数', o.ppl === 3 && o.n === 6, JSON.stringify(o));
  c('2回目は何も足さない', w._ckTrSyncAll(roster).n === 0);
  console.log('=== ④ 名簿から追加 ===');
  w._ckLink = { adds: [{ r: { no: '201', name: '伊藤 真', trainee: true, referrer: '佐藤 花', trainings: { PG: { at: '2026-10-09' } } }, pid: 'a', on: true }] };
  w.ckLinkLoad = () => {};
  w.ckAddApply();
  const N = w.state.members.find(m => m.checkinNo === '201');
  c('紹介者の直下に追加', N && N.parentId === 'a');
  c('追加と同時に研修の進み具合とタイトル', N.traineeHistory.length === 1 && N.traineeHistory[0].status === 'PG' && N.title === 'PG');
  console.log('=== ⑤ 自動（1日1回） ===');
  c('自動取り込みの関数', typeof w.ckTrAuto === 'function');
});
