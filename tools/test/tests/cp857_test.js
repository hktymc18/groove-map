// v857：翌月コピーで、削除した人（昔の重複など）は判定しない（古いGSVのまま「降格」と出ていた）。名前はすべて架空
const T = require('../lib/head.js')();
const { w, c, sleep, setWH } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  w.state.isEditor = true;
  w.state.currentMonth = '2026.10';
  w.state.members = [
    { id: 'r', lastName: '架空', firstName: '一郎', title: 'ゴールド', parentId: '', mapType: 'both', ptSelf: 500 },
    // 生きているBR（GSV 1,200）＝維持
    { id: 'a', lastName: '見本', firstName: '一', title: 'BR', parentId: 'r', mapType: 'both', ptSelf: 1200, startMonth: '2025.01' },
    // 同じ人の古い重複（削除済み・GSVは古いまま 329）
    { id: 'a2', lastName: '見本', firstName: '一', title: 'BR', parentId: 'r', mapType: 'both', ptSelf: 329, ptCurrent: 329, deleted: true, startMonth: '2025.01' },
    { id: 'k', lastName: '見本', firstName: '子', title: 'B3', parentId: 'a2', mapType: 'both', ptSelf: 0, ptCurrent: 0, deleted: true },
    // 削除済みのOUT
    { id: 'o', lastName: '試験', firstName: '光', title: 'OUT', parentId: 'r', mapType: 'both', ptSelf: 0, deleted: true },
    // 生きているBRで本当に未達＝降格は今まで通り
    { id: 'b', lastName: '試験', firstName: '二郎', title: 'BR', parentId: 'r', mapType: 'both', ptSelf: 400, startMonth: '2025.01' }];
  w.state.idealMembers = [];
  w.recalcAllGSV();
  let got = null, cb = null;
  const orig = w._showCopyPreview;
  w._showCopyPreview = (cur, nx, changes, onOk) => { got = changes; cb = onOk; };
  w.copyToNextMonth(); await sleep(10);
  w._showCopyPreview = orig;
  const names = k => got.filter(x => x.kind === k).map(x => x.name + '|' + x.from + '|' + x.to);
  c('プレビューが出る', Array.isArray(got));
  c('削除した重複は「降格」に出ない', !got.some(x => x.kind === 'demote' && /見本/.test(x.name)));
  c('削除した重複のロールアップも出ない', !got.some(x => /ロールアップ/.test(x.to) && /見本/.test(x.name)));
  c('生きているBRで本当に未達の人は今まで通り降格', names('demote').some(s => /試験/.test(s) && /^.*\|BR\|/.test(s)));
  c('削除したOUTは「OUT」に出ない', !got.some(x => x.kind === 'out'));
  c('同じ人が2回出ない', got.filter(x => /見本一|見本 一/.test(x.name)).length <= 1);
});
