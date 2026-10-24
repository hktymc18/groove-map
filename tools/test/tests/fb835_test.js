// v835：ファーストボーナスの金額（計算で出したところ）の下に「※概算（税抜）…保証するものではありません」
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '架空', firstName: '太郎', title: 'G', parentId: '', mapType: 'both' }];
  w.switchView('plan'); w.p2Go('sim'); await sleep(30);
  w.p2SimMo(4); await sleep(20);
  const nt = () => $$('#view-plan .p2fb-nt');
  c('金額を見る前は出さない（金額が出ていない）', nt().length === 0 || !w._p2FbShown);
  w.p2FbReveal(); await sleep(30);
  c('シミュレーション：金額の下に注意書き', nt().length >= 1 && nt()[0].textContent === '※概算（税抜）です。実際の支給額は条件や実績によって変わり、この金額を保証するものではありません');
  c('文は1か所で決めている', w.P2_FB_NOTE === nt()[0].textContent);
  // 目標ファーストボーナスの表
  const h = w._p2FbNote();
  c('小さい文字', /font-size:10\.5px/.test(h) && /class="p2fb-nt"/.test(h));
  const src = require('fs').readFileSync(require('path').join(__dirname, '../../../app.js'), 'utf8');
  c('「この人数のファーストボーナス」・前からの画面にも', /この人数のファーストボーナス[\s\S]{0,300}_p2FbNote\(\)/.test(src) && /p2sFB[\s\S]{0,1200}_p2FbNote\(\)/.test(src));
});
