// テストの土台：jsdom で GROOVE MAP を読み込み、Firebase はスタブ。
// 使い方：const T = require('../lib/head.js')(); const { w, c, sleep, setWH } = T; ... T.end();
process.env.TZ = 'Asia/Tokyo';
module.exports = function (opt) {
  opt = opt || {};
  process.env.GM_FIXED_NOW = opt.now || process.env.GM_FIXED_NOW || '2026-10-14T03:00:00Z'; // 水曜（今週 10/12〜10/18）
  const { JSDOM, VirtualConsole } = require('jsdom');
  process.on('unhandledRejection', () => {});
  const html = require('./load_html.js')();
  const OWNER = 'j2DPDAccCygHmR9i5K3bTvHnH0V2';
  const T0 = {}; // ログインの流れを試す用（authCb＝onAuthStateChangedに渡された関数・signIn＝ログインの結果）
  const dbStub = {
    settings() {}, enablePersistence() { return Promise.resolve(); },
    doc(p) { return { set() { return Promise.resolve(); }, get() { return Promise.resolve({ exists: false, data: () => null }); }, delete() { return Promise.resolve(); }, update() { return Promise.resolve(); }, onSnapshot() { return () => {}; }, collection(c) { return dbStub.collection(p + '/' + c); } }; },
    collection(p) { return { get() { return Promise.resolve({ docs: [], forEach() {} }); }, doc(id) { return dbStub.doc(p + '/' + id); }, where() { return this; }, orderBy() { return this; }, limit() { return this; }, onSnapshot() { return () => {}; } }; },
    batch() { return { set() {}, update() {}, delete() {}, commit() { return Promise.resolve(); } }; },
  };
  const fbStub = {
    initializeApp: () => {},
    firestore: Object.assign(() => dbStub, { FieldValue: { delete: () => '__DEL__', serverTimestamp: () => '', arrayUnion: (...a) => a }, CACHE_SIZE_UNLIMITED: -1 }),
    auth: Object.assign(() => ({ onAuthStateChanged(cb) { T0.authCb = cb; }, signInWithEmailAndPassword() { return T0.signIn ? T0.signIn() : new Promise(() => {}); }, signOut() { return Promise.resolve(); }, setPersistence(p) { T0.persist = p; return Promise.resolve(); } }), { GoogleAuthProvider: function () {}, Auth: { Persistence: { LOCAL: 'local', SESSION: 'session', NONE: 'none' } } }),
    messaging: Object.assign(() => ({}), { isSupported: () => false }),
    apps: [],
  };
  const vc = new VirtualConsole(); vc.on('jsdomError', (e) => { if (process.env.DBG) console.log('JSDOMERR', e.message); });
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', pretendToBeVisual: true,
    url: 'https://hktymc18.github.io/groove-map/', virtualConsole: vc,
    beforeParse(w) {
      require('./fixdate.js')(w);
      w.firebase = fbStub;
      if (opt.ua) Object.defineProperty(w.navigator, 'userAgent', { value: opt.ua, configurable: true });
      if (opt.touch != null) Object.defineProperty(w.navigator, 'maxTouchPoints', { value: opt.touch, configurable: true });
      w.matchMedia = w.matchMedia || (q => ({ matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
      w.scrollTo = () => {};
      w.HTMLElement.prototype.scrollIntoView = () => {};
      w.HTMLCanvasElement.prototype.getContext = () => ({ scale() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {}, arc() {}, fillText() {}, fillRect() {}, strokeRect() {}, save() {}, restore() {}, translate() {}, setLineDash() {}, measureText: () => ({ width: 10 }), createLinearGradient: () => ({ addColorStop() {} }) });
      w.alert = () => {}; w.confirm = () => true; w.prompt = () => null; w.print = () => {};
    }
  });
  const w = dom.window;
  const T = Object.assign(T0, { w, dbStub, OWNER, fails: 0 });
  T.c = (n, cond, x) => { console.log((cond ? 'PASS' : 'FAIL') + ': ' + n + (x !== undefined ? '  [' + x + ']' : '')); if (!cond) T.fails++; };
  T.sleep = ms => new Promise(r => setTimeout(r, ms));
  T.setWH = (W, H) => { Object.defineProperty(w, 'innerWidth', { value: W, configurable: true }); Object.defineProperty(w, 'innerHeight', { value: H, configurable: true }); };
  // ログイン済みのオーナー（編集できる）
  T.login = () => { w.db = dbStub; w.currentUser = { uid: OWNER, name: '山内北斗', area: '福岡' }; w.state.isEditor = true; };
  T.$ = s => w.document.querySelector(s);
  T.$$ = s => [...w.document.querySelectorAll(s)];
  // テスト本体を読み込み完了後に実行（例外もFAILとして数える）
  T.run = (fn, ms) => {
    const fs = setTimeout(() => { console.log('FAIL: timeout'); process.exit(1); }, opt.timeout || 40000);
    setTimeout(async () => {
      try { await fn(); } catch (e) { console.log('FAIL: exception ' + e.stack); T.fails++; }
      clearTimeout(fs);
      console.log(T.fails ? ('NG ' + T.fails) : 'ALL PASS');
      process.exit(T.fails ? 1 : 0);
    }, ms || 1500);
  };
  return T;
};
