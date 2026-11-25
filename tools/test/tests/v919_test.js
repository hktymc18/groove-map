// v919：名前の欄（iPhone の連絡先の自動入力を止める）・MAP を開いた時の段数・リスタート表示の誤操作対策。名前はすべて架空
const T = require('../lib/head.js')({ now: '2026-11-25T03:00:00Z' });
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  const M = (id, p, t, x) => Object.assign({ id, lastName: '見本', firstName: id, title: t, parentId: p, mapType: 'both', startMonth: '2026.01' }, x || {});
  w.state.members = [M('r', '', 'BR'), M('a', 'r', 'B3'), M('b', 'a', 'B2'), M('c', 'b', 'B1'), M('d', 'c', 'BM'), M('e', 'd', 'BM')];
  // ① 名前の欄
  w.switchView('current'); await sleep(80); w.mxTap('a'); await sleep(80); w.ppGo('prof'); await sleep(60);
  const nA = $('#ppNmA'), nB = $('#ppNmB');
  c('① 名前の欄は連絡先の自動入力を止める（autocomplete=off・名前らしくない id・見本の文字）', !!nA && !!nB && nA.getAttribute('autocomplete') === 'off' && nB.getAttribute('autocomplete') === 'off' && nA.placeholder === '例：山田' && !$('#ppLast'));
  c('① 名前を直して保存できる', (() => { nA.value = '見本'; nB.value = '直した'; w.ppName(); return w.state.members.find(m => m.id === 'a').firstName === '直した'; })());
  // ③ A：リスタート表示を付けるのは下の一覧から
  const body = w.document.getElementById('ppPg').textContent;
  c('③A 「＋ リスタート表示を設定」は出さない・プロフィールの下の一覧に「リスタート表示を付ける」', !/＋ リスタート表示を設定/.test(body) && /リスタート表示を付ける/.test(body));
  w.ppClose && w.ppClose();
  // ② 段数
  c('② 段数の設定は 2段がふつう', w.mapLevelPref() === '2');
  w.setMapLevelPref('4'); await sleep(20);
  c('② 4段にするとプロフィールに保存', w.currentUser.mapLevel === '4');
  w._mxLv = ''; w._mxLvInit = ''; w.switchView('home'); await sleep(30); w.switchView('current'); await sleep(120);
  const shown = id => !!w.document.querySelector('[data-cid="' + id + '"]');
  c('② 開くと 4段まで出る（4段目の d は出る・5段目の e は出ない）', shown('d') && !shown('e'), ['a', 'b', 'c', 'd', 'e'].map(shown).join());
  c('② 段の札も 4段', [...w.document.querySelectorAll('.mxsel')].some(e => /^4段/.test(e.textContent)));
  w.currentUser.mapLevel = '2'; w._mxLv = '';
  // ③ B・C（タイトルを手で変える）
  let asked = ''; w.confirm = m => { asked = m; return true; };
  const ed = (id, t) => { w._meOpen(id); w.document.getElementById('fTitle').value = t; w.saveMember(); }; // メンバーの画面と同じ保存の道
  w.state.members.find(m => m.id === 'c').rollup = { at: '2026.11', kids: [], fromTitle: 'BR', manual: true };
  asked = ''; ed('c', 'BM'); await sleep(30);
  c('③B リスタート表示のある人のタイトルを変えると、消すか聞いて OK で消える', /リスタート表示も消しますか/.test(asked) && !w.state.members.find(m => m.id === 'c').rollup);
  asked = ''; ed('b', 'BR'); await sleep(30); ed('b', 'B2'); await sleep(30);
  const b = w.state.members.find(m => m.id === 'b');
  c('③C 同じ月に BR にしてすぐ戻したら、降格の確認を出さずリスタート表示も付かない', !/降格（ロールアップ）/.test(asked) && !(b.rollup && b.rollup.at) && b.title === 'B2', asked + ' / ' + b.title);
  w.state.members.find(m => m.id === 'a').titleAt = '2026.09'; w.state.members.find(m => m.id === 'a').title = 'BR';
  asked = ''; ed('a', 'B3'); await sleep(30);
  c('③C 前の月から BR だった人を下げる時は、今まで通り降格の確認が出る', /降格（ロールアップ）/.test(asked));
});
