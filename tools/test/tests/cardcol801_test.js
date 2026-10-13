// v801：カードコレクション（OLチェックアウトで集めたカード・OL履歴）。HOMEのボタン・新着の知らせ・受付の #col を埋め込んで開く
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $ } = T;
T.run(async () => {
  T.login();
  setWH(390, 844);
  w.currentUser.union = 'ANTARES';
  w.currentUser.ckNo = 'AN0002';
  w._evLoadedUid = w.currentUser.uid;
  w.localStorage.removeItem('gm_card_seen');
  const subs = [];
  const col0 = w.db.collection;
  const mkQ = (path, f) => ({ where(a, op, v) { return mkQ(path, f.concat([[a, op, v]])); }, onSnapshot(cb) { subs.push({ f, cb }); return () => {}; }, get() { return Promise.resolve({ forEach() {} }); } });
  w.db.collection = (p) => (p === 'olCheckouts' ? mkQ(p, []) : col0.call(w.db, p));
  const toasts = []; const ta = w.toastAction; w.toastAction = (m, l, fn) => { toasts.push([m, l, fn]); };
  w._olCoSelf();
  const s = subs.find(x => x.f.length === 1 && x.f[0][0] === 'no');
  c('自分宛ての購読', !!s);
  const recs = [
    { no: 'AN0002', aName: '馬場 太郎', special: true, serial: 1, ymd: '20261013', atMs: 1, task: {} },
    { no: 'AN0002', aName: '普通 次郎', special: false, serial: 3, ymd: '20261013', atMs: 2, task: {} },
  ];
  s.cb({ forEach(fn) { recs.forEach((r, i) => fn({ id: 'k' + i, data: () => Object.assign({}, r), ref: { update: () => Promise.resolve() } })); } });
  await sleep(50);
  c('新しいカードは特別なカードだけ数える', w.cardColNew().length === 1 && w.cardColNew()[0]._id === 'k0');
  c('「新しいカード！」のお知らせ', toasts.length === 1 && /新しいカード/.test(toasts[0][0]) && /馬場 太郎/.test(toasts[0][0]));
  w.switchView('menu'); await sleep(100);
  const hub = (($('#view-menu') || {}).innerHTML || '');
  c('HOMEのボタンに「カードコレクション」（新着1）', /カードコレクション/.test(hub) && /cardColOpen\(\)/.test(hub) && /<span class="nb">1<\/span>/.test(hub.split('カードコレクション')[1] || ''));
  toasts[0][2]();
  const ov = w.document.getElementById('cardColOv'), fr = ov && ov.querySelector('iframe');
  c('「見る」で受付の #col を埋め込んで開く（新着はカードGET!）', fr && /checkin\/index\.html#col&get=1$/.test(fr.getAttribute('src')));
  w.localStorage.setItem('gm_card_seen', JSON.stringify({ k0: 1 }));
  w.cardColClose();
  c('閉じると消える・見たら新着0', !w.document.getElementById('cardColOv') && w.cardColNew().length === 0);
  s.cb({ forEach(fn) { recs.forEach((r, i) => fn({ id: 'k' + i, data: () => Object.assign({}, r), ref: { update: () => Promise.resolve() } })); } });
  await sleep(50);
  c('同じカードで何度も知らせない', toasts.length === 1);
  w.currentUser.ckNo = '';
  w.switchView('menu'); await sleep(100);
  c('受付と紐付いていない人にはボタンを出さない', !/カードコレクション/.test(($('#view-menu') || {}).innerHTML || ''));
  w.toastAction = ta; w.db.collection = col0;
});
