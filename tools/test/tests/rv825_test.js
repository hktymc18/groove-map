// v825：レビューの結果の「対象・まだ答えていない人」。開発メンバーだけ＝指定した人全員（statusが空の人も）。みんな＝アカウント管理の「使える人」と同じ
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $ } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  const ymd = n => { const d = new w.Date(); d.setDate(d.getDate() + n); return w._fbYmd(d); };
  let cfg = { round: 'r1', title: 'レビュー', from: ymd(-1), to: ymd(5), scope: 'dev' };
  w._rvLoadCfg = () => Promise.resolve(cfg); w._rvLoadMine = () => Promise.resolve(null);
  w._rvLoadAll = () => Promise.resolve([]);
  const U2 = 'E4WT7EHai5c6WANUgASz42Euu1y1';
  const users = [
    { id: T.OWNER, name: '架空 一郎' }, // オーナー（statusが空）
    { id: U2, name: '架空 二郎' },
    { id: 'm1', name: '試験 三郎', role: 'admin' }, // 開発メンバー・statusが空（承認の仕組みより前からいる人）
    { id: 'm2', name: '試験 四郎', status: 'active' },
    { id: 'm3', name: '試験 五郎', status: 'disabled' }, // 無効
    { id: 'x1', name: '見本 六郎', early: true }, // 先行利用・statusが空
    { id: 'x2', name: '見本 七郎', status: 'active' }, // 先行利用でない
    { id: 'x3', name: '見本 八郎', status: 'pending', early: true } // 承認待ち
  ];
  const fgc = w.fsGetCol; w.fsGetCol = p => p === 'users' ? Promise.resolve(users) : fgc(p);
  w._fb.ok = true; w._fb.cfg = { members: ['m1', 'm2', 'm3'] };
  let acc = { mode: 'early', unions: [] };
  const od = w.db.doc; w.db.doc = p => p === 'appAccess/mode' ? { get: () => Promise.resolve({ exists: true, data: () => acc }) } : od(p);
  w._accA = null;
  await w.rvInit();
  w._rv.users = null; w.rvResOpen(); await sleep(40);
  const tx = () => $('#rvResOv').textContent;
  c('開発メンバーだけ：オーナー2人＋メンバー（statusが空の人も）・無効の人は除く＝4人', /0\/ 4人/.test(tx()) && /試験 三郎/.test(tx()) && /試験 四郎/.test(tx()) && !/試験 五郎/.test(tx()) && !/見本/.test(tx()));
  c('説明は「開発メンバー」', /開発メンバー（オーナー＋バグ・要望・アイデアを見られる人）/.test(tx()));
  w._p2SheetClose('rvResOv');
  // みんな（公開範囲＝先行利用）：使える人＝オーナー・管理者・先行利用（承認待ち・無効は除く）
  cfg.scope = 'all'; await w.rvInit(); w._rv.users = null; w.rvResOpen(); await sleep(40);
  c('みんな（先行利用の時）：アカウント管理の「使える人」と同じ＝オーナー2・管理者1・先行利用1', /0\/ 4人/.test(tx()) && /見本 六郎/.test(tx()) && !/見本 七郎/.test(tx()) && !/見本 八郎/.test(tx()) && /試験 三郎/.test(tx()) && !/試験 四郎/.test(tx()));
  c('説明は「NAVIGATORを使える人」', /NAVIGATORを使える人/.test(tx()));
  w._p2SheetClose('rvResOv');
  // 全国公開：承認待ち・無効でない人は全員（statusが空の人も）
  acc = { mode: 'open' }; w._rv.acc = null; w._rv.users = null; w.rvResOpen(); await sleep(40);
  c('全国公開：承認待ち・無効でない人は全員（statusが空の人も）＝6人', /0\/ 6人/.test(tx()) && /見本 七郎/.test(tx()) && !/見本 八郎/.test(tx()) && !/試験 五郎/.test(tx()));
  w._p2SheetClose('rvResOv'); w.fsGetCol = fgc; w.db.doc = od;
});
