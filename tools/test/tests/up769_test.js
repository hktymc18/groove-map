// v769：アップライン変更の付け替え先に、同じMAPに出ている人（「現状」と「両方」）が出る
const T = require('../lib/head.js')();
const { w, c, sleep, $$ } = T;
T.run(async () => {
  T.login();
  w.state.members = [
    { id: 'r', lastName: '烈', firstName: '庵怒豪', title: 'ルビー', parentId: '', mapType: 'both' },
    { id: 'f1', lastName: '小松', firstName: '菜々', title: 'ラピス', parentId: 'r', mapType: 'current' },
    { id: 'f2', lastName: '本田', firstName: '圭佑', title: 'ラピス', parentId: 'r', mapType: 'both' },
    { id: 'f3', lastName: '天城', firstName: '蓮司', title: 'BR', parentId: 'r' },
    { id: 'x', lastName: '堂安', firstName: '律', title: 'LOI', parentId: 'f1', mapType: 'current' },
    { id: 'x2', lastName: '配下', firstName: '一', title: 'B1', parentId: 'x', mapType: 'both' },
    { id: 'i1', lastName: '理想', firstName: 'だけ', title: 'B1', parentId: 'r', mapType: 'ideal' }];
  w.switchView('current'); await sleep(20);
  w.openParentPicker('x'); await sleep(20);
  const names = $$('#parentPickerOv .ms-act').map(e => e.textContent);
  console.log(names.join(' / '));
  c('「両方」の人も付け替え先に出る（本田・自分）', names.some(t => /本田/.test(t)) && names.some(t => /烈/.test(t)));
  c('区分なし（現状扱い）の人も出る', names.some(t => /天城/.test(t)));
  c('自分の配下・今のアップライン・理想だけの人は出ない', !names.some(t => /配下|小松|理想/.test(t)));
  w.closeParentPicker();
});
