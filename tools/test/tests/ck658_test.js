// v658・v680：受付の「名簿から追加」で、紹介者をたどって自分のMAPにつながらない人は候補に出さない
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login();
  w.state.members = [{ id: 'r', lastName: '福木', firstName: '葵', title: 'BR', parentId: '', mapType: 'both' }, { id: 'a', lastName: '佐藤', firstName: '花', title: 'B1', parentId: 'r', mapType: 'both' }];
  setWH(390, 844); w._uxSync && w._uxSync(); w.switchView('current'); await sleep(20);
  const roster = [
    { no: '1', name: '伊藤 真', referrer: '佐藤 花', trainee: true },          // 自分のMAPの人の紹介 → 自動でチェック
    { no: '2', name: '鈴木 一', referrer: '伊藤 真', trainee: true },          // その紹介 → いっしょに
    { no: '3', name: '中西 優衣', referrer: '上田 太郎' },                     // 紹介者がMAPにいない
    { no: '4', name: '高橋 健', referrer: '中西 優衣', trainee: true },        // 中西さんの紹介（ほかのチーム）
    { no: '5', name: '木村 空', referrer: '' }                                 // 紹介者なし
  ];
  w._ckLink = { unions: [{ id: 'U' }], sel: 'U', roster: roster, items: [] };
  w._ckPgI = 1; w.ckPgRender(); await sleep(10);
  const A = w._ckLink.adds, by = no => A.filter(a => a.r.no === no)[0];
  c('自分のMAPにつながる人は自動でチェック（紹介の紹介も）', by('1').on && !by('1').other && by('2').on && !by('2').other);
  c('v680: つながらない人（中西さん・その紹介・紹介者なし）は候補に出さない', !by('3') && !by('4') && !by('5') && A.length === 2);
  c('一覧にも名前が出ない・「ほかのチームかも」もない', ['中西 優衣', '高橋 健', '木村 空', 'ほかのチームかも'].every(t => $('#ckPg').textContent.indexOf(t) < 0));
  c('追加する人数は2人', $('.ux-btm .ux-nx').textContent.indexOf('2人') >= 0);
  const n0 = w.state.members.length; w.ckLinkLoad = () => {}; w.ckAddApply(); await sleep(10);
  c('追加は自分のチームの2人だけ', w.state.members.length === n0 + 2 && !w.state.members.some(m => m.lastName === '高橋' || m.lastName === '中西' || m.lastName === '木村'));
  // 紹介者がMAPに同じ名前で2人いる時も「つながる」（置き場所は自分で選ぶ）
  w.state.members.push({ id: 'b', lastName: '佐藤', firstName: '花', title: '', parentId: 'r', mapType: 'both' });
  w._ckLink = { unions: [{ id: 'U' }], sel: 'U', roster: [{ no: '9', name: '山本 光', referrer: '佐藤 花' }], items: [] };
  w.ckPgRender(); await sleep(5);
  c('紹介者がMAPに2人いる時は候補に出す（置き場所は選ぶ・チェックなし）', w._ckLink.adds.length === 1 && !w._ckLink.adds[0].pid && !w._ckLink.adds[0].on && $('#ckPg').textContent.indexOf('山本 光') >= 0);
});
