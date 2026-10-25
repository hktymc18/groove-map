// v838：所属ユニオンを選んだ時に入るUPBDは、オーナーがアカウント管理の「ユニオンとUPBD」で設定する（appConfig/unions）。
//   設定がまだ無い時はアプリに入っている一覧。一覧に無いユニオンの人も、プロフィールでは選んだまま
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  const docs = {}; let sets = [];
  w.db = Object.assign({}, w.db, { doc(p) { return { get() { return Promise.resolve({ exists: !!docs[p], data: () => docs[p] }); }, set(d) { sets.push([p, d]); docs[p] = d; return Promise.resolve(); }, delete() { return Promise.resolve(); }, onSnapshot() { return () => {}; } }; } });
  try { w.localStorage.removeItem('gm_unions'); } catch (e) {}
  w._unionCfg = null;
  c('設定がまだ無い時はアプリに入っている一覧', w._unionList() === w.UNION_LIST);
  docs['appConfig/unions'] = { list: [{ name: '架空ユニオン', upbd: '架空 太郎' }, { name: '見本ユニオン', upbd: '' }] };
  await w._unionCfgLoad(); await sleep(10);
  c('オーナーが設定した一覧を使う', w._unionList().length === 2 && w._unionList()[0].name === '架空ユニオン');
  const sel = $('#signupUnion');
  c('新規登録の選択肢も入れ替わる', sel && sel.options.length === 3 && sel.options[1].value === '架空ユニオン' && sel.options[1].getAttribute('data-upbd') === '架空 太郎');
  sel.value = '架空ユニオン'; w.onUnionSelect(sel, 'signupUpBd');
  c('選ぶとUPBDの欄に入る', $('#signupUpBd').value === '架空 太郎');
  c('端末にも覚える（次に開いた時すぐ出す）', JSON.parse(w.localStorage.getItem('gm_unions'))[1].name === '見本ユニオン');
  // 一覧に無いユニオンの人
  w.currentUser.union = '前のユニオン'; w.currentUser.unionSelectedV2 = true;
  w.openProfileModal(); await sleep(10);
  c('一覧に無いユニオンの人もプロフィールでは選んだまま', $('#profileUnion').value === '前のユニオン');
  w.closeProfileModal(null);
  // オーナーの設定画面
  w._adminUsersFetch = () => Promise.resolve([]); w._admCkLoad = () => {}; w._accLoad = () => { w._accA = { mode: 'open', unions: [] }; }; w._shAdmLoad = () => {}; w._admCoreAllLoad = () => {};
  w.openAdminPanel(); await sleep(30);
  c('オーナーのアカウント管理に「ユニオンとUPBD」', /ユニオンとUPBD/.test($('#unAdmBox').textContent) && /UPBDが空 1/.test($('#unAdmBox').textContent));
  w.unAdmOpen(); await sleep(5);
  c('一覧が開く（⠿・名前・UPBD・✕）', $$('#unAdmL .tdo-row').length === 2 && $$('#unAdmL .tdo-handle').length === 2);
  $$('#unAdmL .un-u')[1].value = '見本 花子';
  w.unAdmAdd(); await sleep(40);
  const r = $$('#unAdmL .tdo-row'); r[2].querySelector('.un-n').value = '新ユニオン'; r[2].querySelector('.un-u').value = '試験 次郎';
  // ⠿ で新しいユニオンを先頭へ
  r[2].querySelector('.tdo-handle').dispatchEvent(new w.MouseEvent('mousedown', { bubbles: true }));
  r[2].parentNode.insertBefore(r[2], r[0]);
  w.document.dispatchEvent(new w.MouseEvent('mouseup', { bubbles: true })); await sleep(5);
  sets = []; w.confirm = () => true; w.unAdmSave(); await sleep(20);
  const sv = sets.find(s => s[0] === 'appConfig/unions');
  c('保存：並べ替え・追加・UPBDの直しが入る', sv && sv[1].list.map(x => x.name).join() === '新ユニオン,架空ユニオン,見本ユニオン' && sv[1].list[2].upbd === '見本 花子' && sv[1].list[0].upbd === '試験 次郎');
  c('保存したらすぐ選択肢も新しく', $('#signupUnion').options[1].value === '新ユニオン');
  // 同じ名前は2つにできない
  w.unAdmOpen(); w.unAdmAdd(); await sleep(40); $$('#unAdmL .un-n').pop().value = '新ユニオン'; sets = []; let tm = ''; const ot = w.toast; w.toast = m => { tm = m; };
  w.unAdmSave(); await sleep(10);
  c('同じユニオン名が2つの時は保存しない', !sets.length && /2つあります/.test(tm));
  w.toast = ot; w._accDlgClose();
  // オーナー以外には出さない
  w.currentUser.uid = 'uAdm'; w.currentUser.role = 'admin';
  c('オーナー以外には出さない', w._unAdmHtml() === '');
  w.currentUser.uid = T.OWNER;
  w.closeAdminPanel();
});
