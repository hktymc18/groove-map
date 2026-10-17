// v808：写真（avatars0〜7）は「版」が同じで今日すでに読んでいれば端末のキャッシュから。写真を保存したら版が変わる
const T = require('../lib/head.js')();
const { w, c, sleep } = T;
T.run(async () => {
  T.login();
  const uid = w.currentUser.uid, log = [];
  let ver = 'v1';
  const store = { ['maps/' + uid + '/meta/avatars0']: { m1: 'data:image/png;base64,AAA' } };
  const odoc = w.db.doc;
  w.db.doc = p => Object.assign(odoc(p), {
    get(o) {
      const src = o && o.source === 'cache' ? 'cache' : 'server'; log.push(src + ' ' + p.split('/').pop());
      const data = /avatarsVer$/.test(p) ? (ver ? { v: ver } : null) : store[p];
      return Promise.resolve({ exists: !!data, data: () => data });
    },
    set(d) { log.push('set ' + p.split('/').pop()); if (/avatarsVer$/.test(p)) ver = d.v; else store[p] = Object.assign({}, store[p] || {}, d); return Promise.resolve(); }
  });
  ['gm_avVer_', 'gm_avDay_'].forEach(k => w.localStorage.removeItem(k + uid));
  const srv = () => log.filter(x => /^server avatars\d$/.test(x)).length, cch = () => log.filter(x => /^cache avatars\d$/.test(x)).length;
  w._avatarsUid = ''; await w.loadAvatars(uid); await sleep(10);
  c('その日はじめては写真8件をサーバーから', srv() === 8 && cch() === 0 && w._avatars.m1);
  log.length = 0; w._avatarsUid = ''; await w.loadAvatars(uid); await sleep(10);
  c('2回目は版の1件だけ読み、写真はキャッシュから', log.filter(x => /^server/.test(x)).length === 1 && cch() === 8 && w._avatars.m1);
  // 写真を保存（別の端末を想定して版を変える）
  await w.saveAvatar('m2', 'data:image/png;base64,BBB'); await sleep(10);
  c('写真を保存すると版を書く', log.some(x => x === 'set avatarsVer') && ver !== 'v1');
  log.length = 0; w._avatarsUid = ''; await w.loadAvatars(uid); await sleep(10);
  c('版が変わったらサーバーから読み直す', srv() === 8);
  // 日が変わったらサーバーから
  w.localStorage.setItem('gm_avDay_' + uid, '2000-01-01');
  log.length = 0; w._avatarsUid = ''; await w.loadAvatars(uid); await sleep(10);
  c('日が変わった最初はサーバーから（古い版のアプリで保存された写真も1日で反映）', srv() === 8);
});
