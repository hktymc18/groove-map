// 本物の Firebase（compat）と Firestore エミュレータで、読み取りを数える仕組み（RC）を試す（架空のデータだけ）
// 準備・実行は ckpf109_rules.js と同じ（エミュレータを起動し、NODE_PATH に firebase を入れて node tools/test/rules/rc884_sdk.js）
const fs = require('fs'), path = require('path'), P = path.dirname(require.resolve('firebase/package.json')) + '/';
const { chromium } = require(fs.existsSync('/opt/node22/lib/node_modules/playwright') ? '/opt/node22/lib/node_modules/playwright' : 'playwright');
const MOD = fs.readFileSync(path.join(__dirname, '../../../app.js'), 'utf8').match(/\/\* 📊 読み取りを数える[\s\S]*?\n\}\)\(\);\n/)[0];
let fails = 0; const c = (n, ok, i) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok ? '' : '  ' + (i || ''))); if (!ok) fails++; };
(async () => {
  await fetch('http://127.0.0.1:8089/emulator/v1/projects/rc-test/databases/(default)/documents', { method: 'DELETE' });
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-proxy-server', '--disable-web-security', '--disable-features=BlockInsecurePrivateNetworkRequests,PrivateNetworkAccessSendPreflights,PrivateNetworkAccessRespectPreflightResults'] });
  const page = await b.newPage();
  await page.route('http://x.test/**', r => { const u = r.request().url();
    if (/app-compat/.test(u)) return r.fulfill({ body: fs.readFileSync(P + 'firebase-app-compat.js'), contentType: 'application/javascript' });
    if (/firestore-compat/.test(u)) return r.fulfill({ body: fs.readFileSync(P + 'firebase-firestore-compat.js'), contentType: 'application/javascript' });
    if (/rc\.js/.test(u)) return r.fulfill({ body: MOD, contentType: 'application/javascript' });
    return r.fulfill({ body: '<html><body><script src="/app-compat.js"></script><script src="/firestore-compat.js"></script><script src="/rc.js"></script></body></html>', contentType: 'text/html' }); });
  await page.goto('http://x.test/');
  const r = await page.evaluate(async () => {
    firebase.initializeApp({ projectId: 'rc-test', apiKey: 'x' });
    const db = firebase.firestore(); db.useEmulator('127.0.0.1', 8089);
    let tag = 'home'; RC.start('nav', () => tag, () => 'U1');
    await db.doc('maps/U1/months/2026.11').set({ a: 1 });
    for (let i = 0; i < 3; i++) await db.collection('maps/U1/events').doc('e' + i).set({ x: i });
    const snap = () => Object.assign({}, RC._st.pend);
    const out = {};
    await db.doc('maps/U1/months/2026.11').get(); out.docGet = snap();
    tag = 'events'; RC._st.pend = {};
    await db.collection('maps/U1/events').get(); await db.collection('maps/U1/events').where('x', '>', 99).get(); out.qGet = snap();
    RC._st.pend = {};
    await db.doc('maps/U1/months/2026.11').get({ source: 'cache' }).catch(() => {}); out.cache = snap();
    RC._st.pend = {}; tag = 'live';
    await new Promise(res => { let n = 0; const un = db.collection('maps/U1/events').onSnapshot(s => { n++; if (n === 1) db.collection('maps/U1/events').doc('e9').set({ x: 9 }); if (n >= 3 || (n === 2 && !s.metadata.hasPendingWrites)) { setTimeout(() => { un(); res(); }, 300); } }); setTimeout(res, 5000); });
    out.listen = snap();
    RC._st.pend = {};
    await db.collectionGroup('events').get(); out.cg = snap();
    RC._st.pend = {}; RC._st.n = 0;
    tag = 'home'; RC.add('maps/months', 4); RC.flush(); await new Promise(r => setTimeout(r, 1500));
    RC.add('maps/months', 2); RC.flush(); await new Promise(r => setTimeout(r, 1500));
    const d = new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10).replace(/-/g, '');
    const saved = (await db.doc('readStats/' + d + '/u/U1_nav').get()).data();
    out.saved = saved; out.d = d;
    return out;
  });
  console.log(JSON.stringify(r).slice(0, 900));
  c('1件の読み込みは 1（画面|場所）', r.docGet['home|maps/months'] === 1);
  c('一覧は返ってきた数（3）・0件の検索も 1', r.qGet['events|maps/events'] === 4);
  c('端末の控え（キャッシュ）から出した分は数えない', Object.keys(r.cache).length === 0);
  c('見張り: 最初に届いた数（3）＋そのあと変わった数（1）', r.listen['live|maps/events'] === 4, JSON.stringify(r.listen));
  c('全員分の検索（collectionGroup）も数える', r.cg['live|**/events'] === 4, JSON.stringify(r.cg));
  c('1人1日1件に足し込む（4＋2＝6）', r.saved && r.saved.n === 6 && r.saved.by['home|maps/months'] === 6 && r.saved.uid === 'U1' && r.saved.app === 'nav' && r.saved.d === r.d, JSON.stringify(r.saved));
  await b.close(); console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('ERR', e.message); process.exit(1); });

