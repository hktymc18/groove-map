// v834：メンバーのプロフィールの誕生日は入れ終わってから保存（前は1つ変えた瞬間に保存して欄を作り直し、残りの入力が消えていた）
//   研修の記録の「日付で」も同じ
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '架空', firstName: '太郎', title: 'G', parentId: '', mapType: 'both' },
    { id: 'd1', lastName: '下田', firstName: '一', title: 'B80', parentId: 'r', mapType: 'both', birthday: '1998-03-05' }];
  w.switchView('current'); await sleep(20);
  w.ppOpen('d1'); w._pp.pg = 'prof'; w._ppRender(); await sleep(10);
  const bd = () => w.state.members.find(m => m.id === 'd1').birthday;
  let el = $('#ppBirthIn'); el.focus();
  const chg = v => { el.value = v; el.dispatchEvent(new w.Event('change', { bubbles: true })); };
  chg('1998-07-05'); await sleep(50);
  c('入れている途中は欄を作り直さない（続けて入れられる）', $('#ppBirthIn') === el && bd() === '1998-03-05');
  chg('2001-07-05'); chg('2001-07-21'); await sleep(50);
  el.blur(); el.dispatchEvent(new w.Event('blur')); await sleep(30);
  c('欄から離れたら、最後に入れた日付を保存', bd() === '2001-07-21' && $('#ppBirthIn').value === '2001-07-21');
  // 入れたまま戻る
  el = $('#ppBirthIn'); el.focus(); chg('2002-01-02');
  w.ppGo(''); await sleep(20);
  c('入れたまま戻っても保存', bd() === '2002-01-02');
  // 欄から離れたあとに変わった時（ピッカーが閉じてから change が来る端末）
  w._pp.pg = 'prof'; w._ppRender(); await sleep(10);
  el = $('#ppBirthIn'); chg('2003-04-05'); await sleep(1100);
  c('欄から離れている時は少し待って保存', bd() === '2003-04-05');
  // 同じ日付なら保存し直さない
  let n = 0; const os = w.saveMember; w.saveMember = function() { n++; return os.apply(this, arguments); };
  el = $('#ppBirthIn'); el.focus(); chg('2003-04-05'); el.blur(); el.dispatchEvent(new w.Event('blur')); await sleep(20);
  c('変わっていない時は保存し直さない', n === 0);
  w.saveMember = os;
  w.ppClose();
});
