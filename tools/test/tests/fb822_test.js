// v822：バグ・要望・アイデアで、間違えて登録した報告を消せる（オーナーはいつでも・書いた本人は「新着」のうち）。スクショ・やりとりも消す
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  if (!w.firebase.firestore.FieldValue) w.firebase.firestore.FieldValue = { serverTimestamp: () => 'ts' };
  const items = [
    { id: '30', no: 30, kind: 'bug', title: '間違えた', status: 'new', authorUid: 'uM', authorName: '架空 一郎', imgN: 1 },
    { id: '31', no: 31, kind: 'req', title: '対応中のもの', status: 'doing', authorUid: 'uM', authorName: '架空 一郎' },
    { id: '32', no: 32, kind: 'bug', title: 'ほかの人の', status: 'new', authorUid: 'uN', authorName: '試験 二郎' }
  ];
  const dels = [];
  w._fbLoadItems = () => Promise.resolve(items.map(x => Object.assign({}, x)));
  w._fbLoadSub = (id, sub) => Promise.resolve(sub === 'notes' ? [{ id: 'n1', text: 'メモ' }] : []);
  w._fbUpdate = () => Promise.resolve(); w._fbAddNote = () => Promise.resolve();
  w._fbCol = () => ({ doc: id => ({ delete: () => { dels.push(id); return Promise.resolve(); }, collection: sub => ({ doc: k => ({ delete: () => { dels.push(id + '/' + sub + '/' + k); return Promise.resolve(); } }) }) }) });
  let ok = true; w.confirm = () => ok;
  const delBtn = () => $$('#fbDetBody .fb-btn').find(b => /消す/.test(b.textContent));
  // 書いた本人（管理者でない）
  w.currentUser.uid = 'uM'; w._fb.ok = true;
  w.fbOpen(); await sleep(50);
  w.fbDetailOpen('31'); await sleep(30);
  c('新着でない自分の報告には「消す」が出ない', !delBtn());
  w._p2SheetClose('fbDetOv'); w.fbDetailOpen('32'); await sleep(30);
  c('ほかの人の報告には「消す」が出ない', !delBtn());
  w._p2SheetClose('fbDetOv'); w.fbDetailOpen('30'); await sleep(30);
  c('自分の新着の報告には「消す」', !!delBtn());
  ok = false; w.fbDelete(); await sleep(20);
  c('確認で「キャンセル」なら消さない', dels.length === 0 && w._fb.items.some(x => x.id === '30'));
  ok = true; w.fbDelete(); await sleep(30);
  c('消すと、スクショ・やりとり・本体を消して一覧からなくなる', dels.indexOf('30/imgs/0') >= 0 && dels.indexOf('30/notes/n1') >= 0 && dels[dels.length - 1] === '30' && !w._fb.items.some(x => x.id === '30') && !$('#fbDetOv') && !/間違えた/.test($('#fbMain').textContent));
  // オーナーは対応中でも消せる
  w.currentUser.uid = T.OWNER; dels.length = 0;
  w.fbDetailOpen('31'); await sleep(30);
  c('オーナーにはどの報告にも「この報告を消す」', !!delBtn() && /この報告を消す/.test(delBtn().textContent));
  w.fbDelete(); await sleep(30);
  c('オーナーは対応中の報告も消せる', dels[dels.length - 1] === '31' && !w._fb.items.some(x => x.id === '31'));
  w._p2SheetClose('fbOv');
});
