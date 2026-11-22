// v914：OUT を「非表示」にした人が MAP から消える（下にいるのが非表示の OUT だけなら一緒に消える）。名前はすべて架空
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $ } = T;
T.run(async () => {
  T.login();
  const M = (id, p, t, h) => ({ id, lastName: '見本', firstName: id, title: t, parentId: p, mapType: 'both', outHidden: !!h });
  w.state.members = [M('r', '', 'BR'), M('a', 'r', 'OUT', true), M('b', 'r', 'OUT', true), M('b1', 'b', 'OUT', true),
    M('c', 'r', 'OUT', true), M('c1', 'c', 'B2'), M('d', 'r', 'OUT', false)];
  const ids = w._treeVisibleMembers(w.state.members, 'current').map(m => m.id);
  c('下に誰もいない非表示の OUT は消える', ids.indexOf('a') < 0);
  c('下にいるのが非表示の OUT だけなら一緒に消える（前は残っていた）', ids.indexOf('b') < 0 && ids.indexOf('b1') < 0);
  c('下に出ている人がいれば残る（迷子にしない）', ids.indexOf('c') >= 0 && ids.indexOf('c1') >= 0);
  c('「ツリーに残す」の OUT は残る', ids.indexOf('d') >= 0);
  c('残る理由の人数（下に出ている人）', w._outKeptKids(w.state.members[4], w.state.members) === 1 && w._outKeptKids(w.state.members[2], w.state.members) === 0);
  setWH(390, 844); w._uxSync && w._uxSync(); w.switchView('current'); await sleep(120);
  const txt = w.document.body.textContent;
  c('スマホの MAP に消えた人は出ない', !/見本 ?a(?![a-z0-9])/.test(txt.replace(/\s+/g, ' ')) || ![...w.document.querySelectorAll('[data-mid="a"],[data-mid="b"]')].length);
});
