// v792：PLANの見出しの下はスローガン（やる理由の作文を書いていても、スローガンを出す）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'G', parentId: '', mapType: 'both' }];
  w._p2Notes().why.cur = '・とにかく財布を気にする生活をしたくない\n家族との時間を増やしたい';
  w._p2().motto = '貧乏脱出大作戦';
  w.switchView('plan'); w.p2Go(''); await sleep(40);
  c('やる理由を書いていても、見出しの下はスローガン', !!$('.ux-hd .ux-why') && /貧乏脱出大作戦/.test($('.ux-hd .ux-why').textContent) && !/財布/.test($('.ux-hd').textContent));
  w._p2().motto = ''; w.p2Go(''); await sleep(30);
  c('スローガンが無い時は何も出さない（やる理由は出さない）', !$('.ux-hd .ux-why') && !/財布/.test($('.ux-hd').textContent));
});
