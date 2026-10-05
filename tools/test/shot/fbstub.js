// Firebase compat の最小スタブ（メモリ上のFirestore・ログイン済みオーナー）
(function () {
  var OWNER = 'j2DPDAccCygHmR9i5K3bTvHnH0V2';
  var store = window.__FBDATA || {};
  store['users/' + OWNER] = store['users/' + OWNER] || { name: '山内北斗', org: '山内北斗', area: '福岡', union: 'GRANT', upRuby: 'テスト', upBd: 'テスト', unionSelectedV2: true, status: 'active', email: 't@example.com' };
  function cp(d) { return d === undefined ? undefined : JSON.parse(JSON.stringify(d)); }
  function snap(path) { var d = store[path]; return { exists: d !== undefined, id: path.split('/').pop(), data: function () { return cp(d); }, get: function (k) { return d ? d[k] : undefined; }, ref: docRef(path) }; }
  function docRef(path) {
    return { path: path, id: path.split('/').pop(),
      get: function () { return Promise.resolve(snap(path)); },
      set: function (d, o) { store[path] = (o && o.merge) ? Object.assign({}, store[path] || {}, cp(d)) : cp(d); return Promise.resolve(); },
      update: function (d) { store[path] = Object.assign({}, store[path] || {}, cp(d)); return Promise.resolve(); },
      delete: function () { delete store[path]; return Promise.resolve(); },
      onSnapshot: function (a, b) { var cb = typeof a === 'function' ? a : b; setTimeout(function () { try { cb(snap(path)); } catch (e) {} }, 0); return function () {}; },
      collection: function (c) { return colRef(path + '/' + c); } };
  }
  function colRef(path) {
    var q = { path: path, id: path.split('/').pop(),
      doc: function (id) { return docRef(path + '/' + (id || ('x' + Math.random().toString(36).slice(2)))); },
      where: function () { return q; }, orderBy: function () { return q; }, limit: function () { return q; }, startAfter: function () { return q; }, limitToLast: function () { return q; },
      get: function () { var docs = Object.keys(store).filter(function (k) { return k.indexOf(path + '/') === 0 && k.slice(path.length + 1).indexOf('/') < 0; }).map(snap);
        return Promise.resolve({ docs: docs, empty: !docs.length, size: docs.length, forEach: function (f) { docs.forEach(f); }, docChanges: function () { return []; } }); },
      onSnapshot: function (a, b) { var cb = typeof a === 'function' ? a : b; q.get().then(function (s) { try { cb(s); } catch (e) {} }); return function () {}; },
      add: function (d) { var r = q.doc(); return r.set(d).then(function () { return r; }); } };
    return q;
  }
  var db = { collection: colRef, doc: docRef, settings: function () {}, enablePersistence: function () { return Promise.resolve(); },
    enableNetwork: function () { return Promise.resolve(); }, disableNetwork: function () { return Promise.resolve(); },
    batch: function () { var ops = []; return { set: function (r, d, o) { ops.push(function () { r.set(d, o); }); }, update: function (r, d) { ops.push(function () { r.update(d); }); }, delete: function (r) { ops.push(function () { r.delete(); }); }, commit: function () { ops.forEach(function (f) { f(); }); return Promise.resolve(); } }; },
    runTransaction: function (fn) { return fn({ get: function (r) { return r.get(); }, set: function (r, d, o) { r.set(d, o); }, update: function (r, d) { r.update(d); }, delete: function (r) { r.delete(); } }); } };
  var user = { uid: OWNER, email: 't@example.com', displayName: '山内北斗', getIdToken: function () { return Promise.resolve('x'); } };
  var authObj = { currentUser: user, onAuthStateChanged: function (cb) { setTimeout(function () { cb(user); }, 0); return function () {}; },
    signOut: function () { return Promise.resolve(); }, signInWithEmailAndPassword: function () { return Promise.resolve({ user: user }); },
    signInWithPopup: function () { return Promise.resolve({ user: user }); }, setPersistence: function () { return Promise.resolve(); } };
  var FV = { delete: function () { return undefined; }, serverTimestamp: function () { return new Date().toISOString(); }, arrayUnion: function () { return [].slice.call(arguments); }, arrayRemove: function () { return []; }, increment: function (n) { return n; } };
  window.firebase = { apps: [], initializeApp: function () { return {}; }, app: function () { return {}; },
    firestore: Object.assign(function () { return db; }, { FieldValue: FV, CACHE_SIZE_UNLIMITED: -1, Timestamp: { now: function () { return { toDate: function () { return new Date(); } }; }, fromDate: function (d) { return { toDate: function () { return d; } }; } } }),
    auth: Object.assign(function () { return authObj; }, { GoogleAuthProvider: function () {}, Auth: { Persistence: { LOCAL: 'local' } } }),
    messaging: Object.assign(function () { return { getToken: function () { return Promise.resolve(''); }, onMessage: function () {} }; }, { isSupported: function () { return false; } }),
    functions: function () { return { httpsCallable: function () { return function () { return Promise.resolve({ data: {} }); }; } }; } };
})();
