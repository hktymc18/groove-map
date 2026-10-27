// 受付 v108：会員証の「タイトル」（宝石・1人1つ: cardTitle）と「バッジ」（役職・複数: badges）を分けた。
//   古いデータ（badge 1つに宝石か役職）も同じに見える・開くと自動で移す・発行／OL控え／工房でも両方引き継ぐ・BD/TEはオーナーだけ
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '../../..');
const H = fs.readFileSync(R + '/checkin/index.html', 'utf8');
const rules = fs.readFileSync(R + '/firestore.rules', 'utf8');
const { JSDOM } = require(path.join(__dirname, '../node_modules/jsdom'));
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const pick = re => { const m = H.match(re); if (!m) throw new Error('not found ' + re); return m[0]; };
const slice = (a, b) => { const i = H.indexOf(a), j = H.indexOf(b, i); if (i < 0 || j < 0) throw new Error('slice ' + a); return H.slice(i, j); };
(async () => {
  const D = new JSDOM('<div id="modalHost"></div>', { runScripts: 'outside-only', url: 'https://example.com/checkin/' });
  const W = D.window;
  // メモリ上の Firestore（書いた内容を記録）
  W.eval(`
    var STORE = {}, WRITES = [], DEL = { __del: 1 }, FAIL = false, OWNER = false, TOASTS = [], KOBO = null, ISSUED = null;
    var FV = { delete: function(){ return DEL; }, serverTimestamp: function(){ return 'TS'; } };
    function apply(p, d, merge){ var o = merge ? Object.assign({}, STORE[p] || {}) : {}; Object.keys(d).forEach(function(k){ if(d[k] === DEL) delete o[k]; else o[k] = JSON.parse(JSON.stringify(d[k])); }); STORE[p] = o; }
    var db = {
      collection: function(n){ return { doc: function(id){ var p = n + '/' + id; return { path: p,
        get: function(){ return Promise.resolve({ exists: !!STORE[p], id: id, data: function(){ return JSON.parse(JSON.stringify(STORE[p])); } }); },
        set: function(d, o){ WRITES.push({ p: p, d: d }); apply(p, d, o && o.merge); return Promise.resolve(); },
        delete: function(){ delete STORE[p]; return Promise.resolve(); } }; } }; },
      batch: function(){ var ops = []; return { set: function(r, d, o){ ops.push([r.path, d, o]); }, delete: function(r){ ops.push([r.path, null]); },
        commit: function(){ if(FAIL) return Promise.reject({ code: 'permission-denied' }); ops.forEach(function(x){ WRITES.push({ p: x[0], d: x[1] }); if(x[1]) apply(x[0], x[1], x[2] && x[2].merge); else delete STORE[x[0]]; }); return Promise.resolve(); } }; }
    };
    function isOwner(){ return OWNER; }
    function canEditUnion(){ return false; }
    function toast(t){ TOASTS.push(t); }
    function permMsg(e, t){ return t; }
    function olAdminBox(){} function olSyncDesign(m){ STORE['olHosts/x'] = { design: olDesign(m) }; }
    function cardUrl(t){ return 'https://example.com/checkin/#c=' + t; }
    function koboEdit(d, mem){ KOBO = mem; } function koboList(){}
    function issueCardNow(m, cb){ ISSUED = JSON.parse(JSON.stringify(m)); }
    function ckIsTcg(){ return false; } function ckMemberOff(){ return false; }
    var gRosterUnion = 'U1';
    var KB_TEXT_KEYS = ['skinName'];
  `);
  W.eval([pick(/function \$\(id\)\{[^\n]*\}/), pick(/function hq\(t\)\{[^\n]*\}/), pick(/function esc\(s\)\{[\s\S]*?\n\}/),
    slice('function modal(html, wide){', 'function csvDownload('),
    slice('// 👑 タイトル（宝石）: 1人1つ', '// 🃏 レアカード風の技の属性'),
    pick(/function ckBadge\(k\)\{[\s\S]*?\n\}/), pick(/function ckBadgeHtml\(k\)\{[\s\S]*?\n\}/),
    slice('function olDesign(m){', 'function olSpecial('),
    slice('function refreshCardDoc(token, m){', 'function copyText('),
    slice('function issueCard(m, cb){', 'function issueCardNow('),
    slice('function cardModal(m){', 'function cardQrModal(')].join('\n'));
  const $ = id => W.document.getElementById(id);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const st = p => W.eval('STORE[' + JSON.stringify(p) + ']');

  // ── 一覧 ──
  const T = W.eval('CARD_TITLES.map(function(b){ return b.k; }).join()'), B = W.eval('CARD_BADGES.map(function(b){ return b.k; }).join()');
  c('タイトルの一覧（8つ・宝石）', T === 'BR,GOLD,LAPIS,RUBY,EMERALD,DIAMOND,BLUE DIAMOND,TEAM ELITE' && W.eval('CARD_TITLES.every(function(b){ return b.t === "gem"; })'), T);
  c('バッジの一覧（8つ・役職）・NTC Ambassador は無い', B === 'EXPERT,ASSOCIATE,マコシエイト,DIRECTOR,受付,設営,個別,体感' && W.eval('CARD_BADGES.every(function(b){ return b.t === "role" && b.c.length === 2; })'), B);
  // ── 古いデータの読み方 ──
  const TO = m => W.ckTitleOf(m), BO = m => Array.from(W.ckBadgesOf(m)).join(), ROW = m => { const d = W.document.createElement('div'); d.innerHTML = W.ckBadgeRowHtml(m); return [].map.call(d.querySelectorAll('.bdg'), x => x.textContent).join('|'); };
  c('古いデータ: 宝石の badge はタイトルとして読む', TO({ badge: 'RUBY' }) === 'RUBY' && BO({ badge: 'RUBY' }) === '' && ROW({ badge: 'RUBY' }) === 'RUBY');
  c('古いデータ: 役職の badge はバッジとして読む', TO({ badge: 'EXPERT' }) === '' && BO({ badge: 'EXPERT' }) === 'EXPERT' && ROW({ badge: 'EXPERT' }) === 'EXPERT');
  c('古いデータ: NTC Ambassador はデータに残るが表示しない', BO({ badge: 'NTC Ambassador' }) === 'NTC Ambassador' && ROW({ badge: 'NTC Ambassador' }) === '');
  c('新しいデータ: タイトル＋バッジ（一覧の順・重複なし）', ROW({ cardTitle: 'GOLD', badges: ['受付', 'EXPERT', 'NTC Ambassador', 'EXPERT'] }) === 'GOLD|EXPERT|受付' && BO({ badges: ['受付', 'EXPERT', 'EXPERT'] }) === '受付,EXPERT');
  c('新しいタイトルが古い badge より優先', TO({ cardTitle: 'DIAMOND', badge: 'RUBY' }) === 'DIAMOND');
  const box = W.document.createElement('div');
  W.ckPaintBadges(box, { cardTitle: 'GOLD', badges: ['EXPERT', '受付'] });
  c('3つ以上は小さめ（many）', box.classList.contains('many') && box.querySelectorAll('.bdg').length === 3);
  W.ckPaintBadges(box, { badge: 'EXPERT' });
  c('1つなら今まで通りの大きさ', !box.classList.contains('many'));
  c('BLUE DIAMOND・TEAM ELITE だけがオーナー限定', W.ckTopTitle('BLUE DIAMOND') && W.ckTopTitle('TEAM ELITE') && !W.ckTopTitle('DIAMOND') && !W.ckTopTitle('EXPERT'));

  // ── カードの見た目（renderCard の判定）: タイトルで決まる・古いデータも同じ ──
  const judge = new W.Function('c', 'skin', pick(/  var ttl = ckTitleOf\(c\);[^\n]*\n[^\n]*\n[^\n]*\n/) + pick(/  var ruby = [^\n]*\n/) + 'return (plat ? "plat" : dia ? "dia" : ruby ? "ruby" : "");');
  [['RUBY', 'ruby'], ['DIAMOND', 'dia'], ['BLUE DIAMOND', 'plat'], ['TEAM ELITE', 'plat'], ['GOLD', '']].forEach(([t, want]) => {
    c('見た目: タイトル ' + t + ' → ' + (want || '通常'), judge({ cardTitle: t, badges: ['EXPERT'] }, '') === want && judge({ badge: t }, '') === want);
  });
  c('見た目: 特別カード・研修生はタイトルより優先（今まで通り）', judge({ cardTitle: 'RUBY' }, 'reaperTcg') === '' && judge({ cardTitle: 'DIAMOND', trainee: true }, '') === '');
  c('会員証・コレクションの控えはタイトル＋バッジを描く', /ckPaintBadges\(\$\('mcBadge'\), c\)/.test(H) && /ckPaintBadges\(card\.querySelector\('\.mc-badge'\), d\)/.test(H));

  // ── 名簿の会員証設定（管理者）──
  W.eval("STORE['checkinMembers/ZZ0001'] = { no: 'ZZ0001', name: '見本 太郎', union: 'U1', badge: 'EXPERT', cardToken: 'tok1' }; STORE['cards/tok1'] = { no: 'ZZ0001', badge: 'EXPERT' };");
  let m = { no: 'ZZ0001', name: '見本 太郎', union: 'U1', badge: 'EXPERT', cardToken: 'tok1' };
  W.cardModal(m); await sleep(20);
  c('タイトル（1つ）とバッジ（複数）を別々に選べる', $('cmTitle') && $('cmTitle').tagName === 'SELECT' && $('cmBadges').querySelectorAll('input[type=checkbox]').length === 8);
  c('管理者のタイトルに BLUE DIAMOND・TEAM ELITE は出ない', ![].some.call($('cmTitle').options, o => /BLUE DIAMOND|TEAM ELITE/.test(o.value)) && $('cmTitle').options.length === 7);
  c('開いた時: 古い役職の badge をバッジへ自動で移す（名簿と会員証）', JSON.stringify(st('checkinMembers/ZZ0001').badges) === '["EXPERT"]' && !('badge' in st('checkinMembers/ZZ0001')) && JSON.stringify(st('cards/tok1').badges) === '["EXPERT"]' && !('badge' in st('cards/tok1')));
  c('移した時はお知らせを出さない', W.eval('TOASTS.length') === 0);
  c('EXPERT にチェックが付いている', $('cmBadges').querySelector('input[value="EXPERT"]').checked);
  $('cmTitle').value = 'GOLD'; $('cmTitle').onchange(); await sleep(10);
  const dir = $('cmBadges').querySelector('input[value="DIRECTOR"]'); dir.checked = true; dir.onchange(); await sleep(10);
  c('タイトルとバッジを両方保存（名簿・会員証）', st('checkinMembers/ZZ0001').cardTitle === 'GOLD' && st('checkinMembers/ZZ0001').badges.join() === 'EXPERT,DIRECTOR' && st('cards/tok1').cardTitle === 'GOLD' && st('cards/tok1').badges.join() === 'EXPERT,DIRECTOR');
  c('OLチェックアウトの控え（olDesign）にも両方', st('olHosts/x').design.cardTitle === 'GOLD' && st('olHosts/x').design.badges.join() === 'EXPERT,DIRECTOR');
  const ex = $('cmBadges').querySelector('input[value="EXPERT"]'); ex.checked = false; ex.onchange(); await sleep(10);
  c('バッジを外せる', st('checkinMembers/ZZ0001').badges.join() === 'DIRECTOR');
  dir.checked = false; dir.onchange(); await sleep(10);
  c('全部外すと badges は消える', !('badges' in st('checkinMembers/ZZ0001')) && st('checkinMembers/ZZ0001').cardTitle === 'GOLD');
  $('cmTitle').value = ''; $('cmTitle').onchange(); await sleep(10);
  c('タイトルを外せる', !('cardTitle' in st('checkinMembers/ZZ0001')));

  // NTC Ambassador の人: データは残す
  W.eval("STORE['checkinMembers/ZZ0002'] = { no: 'ZZ0002', name: '見本 次郎', union: 'U1', badge: 'NTC Ambassador' };");
  m = { no: 'ZZ0002', name: '見本 次郎', union: 'U1', badge: 'NTC Ambassador' };
  W.cardModal(m); await sleep(20);
  const e2 = $('cmBadges').querySelector('input[value="体感"]'); e2.checked = true; e2.onchange(); await sleep(10);
  c('NTC Ambassador はバッジのデータに残る（表示しない）', st('checkinMembers/ZZ0002').badges.join() === 'NTC Ambassador,体感' && ROW(st('checkinMembers/ZZ0002')) === '体感');

  // BD の古いデータ・管理者: 移さない（ルールで拒否されるため）・タイトルは変えられない・バッジは付けられる
  W.eval("STORE['checkinMembers/ZZ0003'] = { no: 'ZZ0003', name: '見本 三郎', union: 'U1', badge: 'BLUE DIAMOND' }; WRITES.length = 0;");
  m = { no: 'ZZ0003', name: '見本 三郎', union: 'U1', badge: 'BLUE DIAMOND' };
  W.cardModal(m); await sleep(20);
  c('管理者: BD の古いデータは開いても書き換えない', W.eval('WRITES.length') === 0);
  c('管理者: BD のタイトルは選べない（🔒・今の値は見える）', $('cmTitle').disabled && $('cmTitle').value === 'BLUE DIAMOND' && /オーナーが設定します/.test($('modalHost').textContent));
  const e3 = $('cmBadges').querySelector('input[value="EXPERT"]'); e3.checked = true; e3.onchange(); await sleep(10);
  const w3 = W.eval('JSON.stringify(WRITES[0].d)');
  c('管理者: BD の人にバッジを付ける時、タイトルと古い badge には触れない', !/cardTitle|"badge"/.test(w3) && st('checkinMembers/ZZ0003').badge === 'BLUE DIAMOND' && st('checkinMembers/ZZ0003').badges.join() === 'EXPERT', w3);
  c('管理者: そのあともタイトルは BD のまま', W.ckTitleOf(st('checkinMembers/ZZ0003')) === 'BLUE DIAMOND');

  // オーナー: BD/TE を選べる・古いデータを移せる
  W.eval('OWNER = true;');
  m = JSON.parse(JSON.stringify(st('checkinMembers/ZZ0003'))); m.no = 'ZZ0003';
  W.cardModal(m); await sleep(20);
  c('オーナー: BD/TE を選べる', !$('cmTitle').disabled && [].some.call($('cmTitle').options, o => o.value === 'TEAM ELITE'));
  c('オーナー: 開いた時に BD をタイトルへ移す（バッジはそのまま）', st('checkinMembers/ZZ0003').cardTitle === 'BLUE DIAMOND' && !('badge' in st('checkinMembers/ZZ0003')) && st('checkinMembers/ZZ0003').badges.join() === 'EXPERT');
  W.eval('OWNER = false;');

  // 権限がなく保存できなかった時（移すのは黙って失敗・表示は古いデータのまま）
  W.eval("FAIL = true; TOASTS.length = 0; STORE['checkinMembers/ZZ0004'] = { no: 'ZZ0004', union: 'U1', badge: 'RUBY' };");
  W.cardModal({ no: 'ZZ0004', union: 'U1', badge: 'RUBY' }); await sleep(20);
  c('移せなかった時もエラーを出さない・データはそのまま', W.eval('TOASTS.length') === 0 && st('checkinMembers/ZZ0004').badge === 'RUBY');
  W.eval('FAIL = false;');

  // ── 発行・再発行・工房の引き継ぎ ──
  W.eval("STORE['checkinMembers/ZZ0005'] = { no: 'ZZ0005', union: 'U1', cardTitle: 'TEAM ELITE', badges: ['受付', '設営'] };");
  W.issueCard({ no: 'ZZ0005', union: 'U1' }); await sleep(20);
  const is = W.eval('ISSUED');
  c('発行・再発行: 名簿の最新のタイトル・バッジを引き継ぐ', is.cardTitle === 'TEAM ELITE' && is.badges.join() === '受付,設営');
  await W.refreshCardDoc('tokR', { no: 'ZZ0005', badge: 'EXPERT', cardTitle: 'RUBY', badges: ['受付'] }); await sleep(10);
  c('会員証の作り直し（refreshCardDoc）にタイトル・バッジ（古い badge も）', st('cards/tokR').cardTitle === 'RUBY' && st('cards/tokR').badges.join() === '受付,EXPERT' && st('cards/tokR').badge === 'EXPERT');
  const cardWrites = H.match(/badge: m\.badge \|\| '', cardTitle: m\.cardTitle \|\| '', badges: ckBadgesOf\(m\), skinName:/g) || [];
  c('会員証を作る4か所（発行・再発行・一括発行・グレード変更）すべてに両方', cardWrites.length === 4 && !/badge: m\.badge \|\| '', skinName:/.test(H));
  c('会員証の端末キャッシュにも両方', /badge: c\.badge \|\| '', cardTitle: c\.cardTitle \|\| '', badges: ckBadgesOf\(c\), skinName:/.test(H));
  const od = W.olDesign({ no: 'A1', badge: 'DIAMOND' });
  c('olDesign: 古いデータでも控えから同じタイトルが読める', W.ckTitleOf(od) === 'DIAMOND' && od.badge === 'DIAMOND' && Array.isArray(od.badges));
  W.eval('OWNER = true;');
  W.eval("STORE['checkinMembers/ZZ0006'] = { no: 'ZZ0006', union: 'U1', cardTitle: 'TEAM ELITE', badges: ['EXPERT'] };");
  W.cardModal({ no: 'ZZ0006', union: 'U1', cardTitle: 'TEAM ELITE', badges: ['EXPERT'] }); await sleep(10);
  W.eval('db.collection = (function(o){ return function(n){ var r = o(n); r.where = function(){ return { get: function(){ return Promise.resolve({ forEach: function(){} }); } }; }; return r; }; })(db.collection);');
  $('cmKobo').onclick(); await sleep(20);
  c('特別カード工房へ: タイトル・バッジを渡す', W.eval('KOBO && KOBO.cardTitle') === 'TEAM ELITE' && W.eval('KOBO.badges.join()') === 'EXPERT');
  c('工房の「付ける人」: タイトルでも探す（古い badge も）', /where\('cardTitle', 'in', \['BLUE DIAMOND', 'TEAM ELITE'\]\)/.test(H) && /where\('badge', 'in', \['BLUE DIAMOND', 'TEAM ELITE'\]\)/.test(H) && /ckTopTitle\(ckTitleOf\(m\)\)/.test(H));
  c('工房のプレビューにタイトル・バッジ', /cardTitle: mem \? \(mem\.cardTitle \|\| ''\) : 'TEAM ELITE', badges: mem \? ckBadgesOf\(mem\) : \[\]/.test(H));
  W.eval('OWNER = false;');

  // ── ルール ──
  c('ルール: cardTitle も BD/TE はオーナーだけ（更新）', /function ckTopKeyOk\(k\)/.test(rules) && /ckTopKeyOk\('badge'\) && ckTopKeyOk\('cardTitle'\)/.test(rules));
  c('ルール: 作成時に BD/TE のタイトル不可', /!ckTopBadge\(d\.get\('badge', ''\)\) && !ckTopBadge\(d\.get\('cardTitle', ''\)\)/.test(rules));
  c('ルール: 発行時は名簿と同じタイトルなら引き継げる', /ckTopBadge\(d\.get\('cardTitle', ''\)\) \|\| d\.get\('cardTitle', ''\) == m\.get\('cardTitle', ''\)/.test(rules));
  c('画面とルールのオーナー限定タイトルが一致', /function ckTopTitle\(k\)\{ return k === 'BLUE DIAMOND' \|\| k === 'TEAM ELITE'; \}/.test(H) && /function ckTopBadge\(b\) \{ return b in \['BLUE DIAMOND', 'TEAM ELITE'\]; \}/.test(rules));
  // ── お知らせ ──
  c('APP_VER v108以降・v108のお知らせ', (+(H.match(/var APP_VER = 'v(\d+)';/) || [0, 0])[1]) >= 108 && /\{ v: 'v108', d: '2026\/10\/28'/.test(H));
  console.log(fails ? 'NG ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log('exception', e); process.exit(1); });
