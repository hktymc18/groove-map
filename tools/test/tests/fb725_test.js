// v725：バグ・要望の「Claude用にコピー」をどのタブでも・1件ずつ（詳しい画面）でも
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  let copied = '', ups = [];
  w._fbIsOwner = () => true; w._fb.ok = true;
  const items = [
    { id: '7', no: 7, kind: 'bug', screen: 'PLAN', title: '日付が入らない', did: '実行期日をタップ', got: '何も出ない', status: 'new', authorName: '花子', ver: 'v722', device: 'iPhone Safari', imgN: 1 },
    { id: '8', no: 8, kind: 'req', screen: 'MAP', title: '並び替えたい', did: '探しにくい', status: 'new', authorName: '太郎' },
    { id: '5', no: 5, kind: 'bug', screen: 'HOME', title: '古いもの', status: 'done' }
  ];
  w._fbLoadItems = () => Promise.resolve(items.map(x => Object.assign({}, x)));
  w._fbUpdate = (id, d) => { ups.push([id, d.status]); return Promise.resolve(); };
  w._fbAddNote = () => Promise.resolve();
  w._fbLoadSub = (id, sub) => Promise.resolve(sub === 'notes' ? [{ text: '同じことが起きました', byName: '次郎' }, { kind: 'status', text: '新着 → 改修する' }] : []);
  w._fbCopy = (t) => { copied = t; return Promise.resolve(true); };
  if (!w.firebase.firestore.FieldValue) w.firebase.firestore.FieldValue = { serverTimestamp: () => 'ts' };
  w.fbOpen(); await sleep(60);
  c('新着タブでもチェックとコピーのボタン', $$('.fb-cb').length === 2 && /Claude用にコピー/.test($('.fb-foot').textContent));
  w.fbPickAll(1); await sleep(10);
  c('ぜんぶ選ぶ', $$('.fb-cb.on').length === 2 && /選んだ2件/.test($('.fb-foot').textContent));
  w.fbCopyForClaude(); await sleep(30);
  c('2件をまとめてコピー（番号・本文・端末）', /改修依頼（2件）/.test(copied) && /#7 バグ／PLAN/.test(copied) && /実行期日をタップ/.test(copied) && /#8 要望／MAP/.test(copied) && /iPhone Safari/.test(copied) && !/古いもの/.test(copied));
  c('新着は「対応中」へ', ups.length === 2 && ups.every(u => u[1] === 'doing'));
  copied = ''; ups = [];
  w.fbTab('done'); await sleep(10);
  w.fbDetailOpen('5'); await sleep(40);
  c('詳しい画面に「Claude用にコピー」', !!$$('#fbDetBody .fb-btn').find(b => /Claude用にコピー/.test(b.textContent)));
  w._p2SheetClose('fbDetOv'); w.fbDetailOpen('7'); await sleep(40);
  w.fbCopyOne(); await sleep(30);
  c('1件だけ・やりとりも入る（状態の記録は入れない）', /改修依頼（1件）/.test(copied) && /#7/.test(copied) && /やりとり：/.test(copied) && /次郎：同じことが起きました/.test(copied) && !/新着 → 改修する/.test(copied) && /スクショ1枚あり/.test(copied));
  c('対応中のものは状態を変えない', ups.length === 0);
});
