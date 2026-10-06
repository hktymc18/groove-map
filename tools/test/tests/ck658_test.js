// v658：受付の「名簿から追加」で、紹介者が自分のMAPにつながらない人は「ほかのチームかも」（チェックなし・たたむ）
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
  c('ほかのチームかも：中西さん・その紹介・紹介者なしはチェックなし', by('3').other && !by('3').on && by('4').other && !by('4').on && by('5').other);
  c('ほかのチームは最初たたむ（一覧に名前が出ない）', $('#ckPg').textContent.indexOf('ほかのチームかも 3人') >= 0 && $('#ckPg').textContent.indexOf('高橋 健') < 0);
  c('追加する人数は2人', $('.ux-btm .ux-nx').textContent.indexOf('2人') >= 0);
  w._ckLink.showOther = 1; w.ckPgRender(); await sleep(5);
  c('表示すると並ぶ', $('#ckPg').textContent.indexOf('高橋 健') >= 0);
  by('4').on = true; w.ckPgRender(); await sleep(5);
  c('紹介者（中西さん）にチェックが無ければ、その下の人はチェックが付いて見えない・数えない', !w._ckAddEff(by('4'), A) && $('.ux-btm .ux-nx').textContent.indexOf('2人') >= 0 && $('#ckPg').textContent.indexOf('を追加すると一緒に') >= 0);
  const n0 = w.state.members.length; w.ckLinkLoad = () => {}; w.ckAddApply(); await sleep(10);
  c('追加は自分のチームの2人だけ', w.state.members.length === n0 + 2 && !w.state.members.some(m => m.lastName === '高橋' || m.lastName === '中西'));
});
