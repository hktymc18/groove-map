// v834→v870：メンバーのプロフィールの誕生日は入れ終わってから保存（入れている途中で欄を作り直すと残りの入力が消えていた）。
//   v870 から 年（わからない）・月・日 のリスト。月と日がそろった時に保存し、年は空でもよい（西暦がわからない誕生日は 0000-月-日）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '架空', firstName: '太郎', title: 'G', parentId: '', mapType: 'both' },
    { id: 'd1', lastName: '下田', firstName: '一', title: 'B80', parentId: 'r', mapType: 'both', birthday: '1998-03-05' },
    { id: 'u1', lastName: '見本', firstName: 'はなこ', title: 'ユーザー', parentId: 'r', mapType: 'both' }];
  w.switchView('current'); await sleep(20);
  w.ppOpen('d1'); w._pp.pg = 'prof'; w._ppRender(); await sleep(10);
  const bd = (id) => w.state.members.find(m => m.id === (id || 'd1')).birthday;
  const sel = (id, v) => { const el = $('#' + id); el.value = String(v); el.dispatchEvent(new w.Event('change', { bubbles: true })); return el; };
  c('今の誕生日がリストに入っている（1998年・3月・5日）', $('#ppBY').value === '1998' && $('#ppBM').value === '3' && $('#ppBD').value === '5');
  c('年のリストの最初は「西暦（わからない）」', /西暦（わからない）/.test($('#ppBY').options[0].textContent));
  // 月だけ消す → そろうまで保存しない・欄は作り直さない
  const elM = sel('ppBM', ''); await sleep(30);
  c('月だけ空にしても保存しない（欄も作り直さない）', $('#ppBM') === elM && bd() === '1998-03-05');
  sel('ppBM', 7); await sleep(50);
  c('月と日がそろうと保存', bd() === '1998-07-05');
  sel('ppBY', ''); await sleep(50);
  c('年を「わからない」にすると 0000-月-日 で保存', bd() === '0000-07-05');
  c('西暦がわからない時は年齢の欄が出る', !!$('#ppAge'));
  sel('ppBY', 2001); sel('ppBD', 21); await sleep(50);
  c('年と日を変えるとその日付で保存', bd() === '2001-07-21' && $('#ppBY').value === '2001' && $('#ppBD').value === '21');
  c('西暦がある時は年齢の欄は出ない', !$('#ppAge'));
  // 同じ日付なら保存し直さない
  let n = 0; const os = w.saveMember; w.saveMember = function() { n++; return os.apply(this, arguments); };
  sel('ppBD', 21); await sleep(20);
  c('変わっていない時は保存し直さない', n === 0);
  w.saveMember = os;
  w.ppClose();
  // ユーザー：年を入れずに月日だけ
  w.ppOpen('u1'); w._pp.pg = 'prof'; w._ppRender(); await sleep(10);
  sel('ppBM', 12); await sleep(20);
  c('ユーザー：月だけでは保存しない', !bd('u1'));
  sel('ppBD', 24); await sleep(50);
  c('ユーザー：西暦なしの月日だけで登録できる', bd('u1') === '0000-12-24');
  w.ppClose();
});
