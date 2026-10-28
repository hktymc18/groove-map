// 受付 v109（#21）：タイトルが RUBY 以上の人のプロフィール（自己紹介200字・得意100字・苦手100字）。
//   会員証の「詳細」で開く／閉じる・本人が保存・字数の上限・再発行で引き継ぐ・コレクションのAさんの最新を出す（架空のデータだけ）
//   ルールの実地テスト（エミュレータ）は tools/test/rules/ckpf109_rules.js
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
  const D = new JSDOM('<div id="mcProf"></div><div id="colPf"></div>', { runScripts: 'outside-only', url: 'https://example.com/checkin/' });
  const W = D.window;
  W.eval(`
    var STORE = {}, WRITES = [], FAIL = false, TOASTS = [];
    function ref(p){ return { path: p,
      collection: function(n){ return { doc: function(id){ return ref(p + '/' + n + '/' + id); } }; },
      get: function(){ return Promise.resolve({ exists: !!STORE[p], data: function(){ return JSON.parse(JSON.stringify(STORE[p])); } }); },
      set: function(d){ WRITES.push(p); STORE[p] = JSON.parse(JSON.stringify(d)); return Promise.resolve(); },
      delete: function(){ delete STORE[p]; return Promise.resolve(); } }; }
    var db = {
      collection: function(n){ return { doc: function(id){ return ref(n + '/' + id); } }; },
      batch: function(){ var ops = []; return { set: function(r, d){ ops.push([r.path, d]); },
        commit: function(){ if(FAIL) return Promise.reject({ code: 'permission-denied' }); ops.forEach(function(x){ WRITES.push(x[0]); STORE[x[0]] = JSON.parse(JSON.stringify(x[1])); }); return Promise.resolve(); } }; }
    };
    function toast(t){ TOASTS.push(t); }
    function permMsg(e, t){ return t; }
    var gCardToken = 'tokA';
  `);
  W.eval([pick(/function \$\(id\)\{[^\n]*\}/), pick(/function esc\(s\)\{[\s\S]*?\n\}/),
    slice('// 👑 タイトル（宝石）: 1人1つ', '// 🃏 レアカード風の技の属性'),
    slice('/* 👤 #21 プロフィール', '/* 📝 CO面談シートの本人入力')].join('\n'));
  const $ = id => W.document.getElementById(id);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const st = p => W.eval('STORE[' + JSON.stringify(p) + ']');
  const E = c0 => W.pfEligible(c0);

  // ── 1. 対象（タイトル）──
  c('対象: RUBY・EMERALD・DIAMOND・BLUE DIAMOND・TEAM ELITE', ['RUBY', 'EMERALD', 'DIAMOND', 'BLUE DIAMOND', 'TEAM ELITE'].every(t => E({ cardTitle: t })));
  c('対象外: BR・GOLD・LAPIS・タイトルなし', ['BR', 'GOLD', 'LAPIS', ''].every(t => !E({ cardTitle: t, badges: ['EXPERT'] })));
  c('古いデータ（badge に宝石）もタスクAと同じ判定', E({ badge: 'RUBY' }) && E({ badge: 'DIAMOND' }) && !E({ badge: 'GOLD' }) && !E({ badge: 'EXPERT' }));
  c('研修生・領収書だけのページ・無効の会員証は対象外', !E({ cardTitle: 'RUBY', trainee: true }) && !E({ cardTitle: 'RUBY', rcptOnly: true }) && !E({ cardTitle: 'RUBY', active: false }));

  // ── ルビー未満・研修生には出ない ──
  W.renderProfile({ no: 'ZZ0003', cardTitle: 'GOLD' });
  c('GOLD の会員証には「詳細」が出ない', $('mcProf').innerHTML === '');
  W.renderProfile({ no: 'ZZ0004', cardTitle: 'RUBY', trainee: true });
  c('研修生の会員証には「詳細」が出ない', $('mcProf').innerHTML === '');

  // ── 1. 開く・閉じる ──
  const me = { no: 'ZZ0001', name: '見本 太郎', cardTitle: 'RUBY', badges: ['EXPERT'] };
  W.renderProfile(me);
  const tg = () => $('mcProf').querySelector('.pf-tg'), body = () => $('mcProf').querySelector('.pf-body');
  c('RUBY の会員証に「詳細」ボタン・ふだんは閉じている', !!tg() && /詳細/.test(tg().textContent) && body().classList.contains('hide') && tg().getAttribute('aria-expanded') === 'false');
  tg().click(); await sleep(10);
  c('押すと開く（閉じるに変わる）', !body().classList.contains('hide') && /閉じる/.test(tg().textContent) && tg().getAttribute('aria-expanded') === 'true');
  c('6. 空のプロフィールは「まだ書かれていません」＋編集', /まだ書かれていません/.test(body().textContent) && !!$('mpEdit'));
  tg().click();
  c('もう一度押すと閉じる', body().classList.contains('hide') && /詳細/.test(tg().textContent));
  tg().click(); await sleep(10);

  // ── 2. 書いて保存 ──
  $('mpEdit').click();
  c('編集: 3つの欄（上限つき）', !!$('mpIn_intro') && $('mpIn_intro').getAttribute('maxlength') === '200' && $('mpIn_good').getAttribute('maxlength') === '100' && $('mpIn_bad').getAttribute('maxlength') === '100');
  const intro = 'ビジネスキャリアは1年半です！\nスキル：見本の資格／PG（PAはまだ苦手）';
  $('mpIn_intro').value = intro; $('mpIn_good').value = '旅行好きのNAのお手伝い'; $('mpIn_bad').value = 'PA';
  $('mpIn_intro').dispatchEvent(new W.Event('input'));
  c('字数の表示', $('mpCnt_intro').textContent === intro.length + ' / 200');
  $('mpSave').click(); await sleep(10);
  const pm = st('cards/tokA/prof/me'), pc = st('cardProfiles/ZZ0001');
  c('本人の分（トークンの下）に保存', pm && pm.intro === intro && pm.good === '旅行好きのNAのお手伝い' && pm.bad === 'PA' && pm.atMs > 0, JSON.stringify(pm));
  c('公開用の写し（番号）にも同じ中身・トークンは入れない', pc && pc.no === 'ZZ0001' && pc.intro === intro && pc.atMs === pm.atMs && JSON.stringify(pc).indexOf('tokA') < 0 && Object.keys(pc).sort().join() === 'atMs,bad,good,intro,no', JSON.stringify(pc));
  c('保存後は表示に戻る（改行も残る）', !$('mpIn_intro') && body().querySelector('.pf-tx').textContent === intro);
  // 開き直しても残る
  W.renderProfile(me); tg().click(); await sleep(10);
  c('開き直しても残っている', /旅行好きのNAのお手伝い/.test(body().textContent) && body().querySelector('.pf-tx').textContent === intro && /ABOUT/.test(body().textContent));
  // 字数オーバー
  const nW = W.eval('WRITES.length');
  $('mpEdit').click();
  $('mpIn_intro').value = 'あ'.repeat(201);
  $('mpIn_intro').dispatchEvent(new W.Event('input'));
  c('上限を超えると字数が赤くなる', $('mpCnt_intro').classList.contains('over'));
  $('mpSave').click(); await sleep(10);
  c('自己紹介201字は保存できない', W.eval('WRITES.length') === nW && /自己紹介が長すぎます/.test($('mpErr').textContent) && st('cards/tokA/prof/me').intro === intro);
  $('mpIn_intro').value = 'い'; $('mpIn_good').value = 'う'.repeat(101); $('mpSave').click(); await sleep(10);
  c('得意なこと101字は保存できない', W.eval('WRITES.length') === nW && /得意なことが長すぎます/.test($('mpErr').textContent));
  $('mpIn_good').value = ''; $('mpIn_bad').value = 'え'.repeat(101); $('mpSave').click(); await sleep(10);
  c('苦手なこと101字は保存できない', W.eval('WRITES.length') === nW && /苦手なことが長すぎます/.test($('mpErr').textContent));
  $('mpIn_intro').value = 'あ'.repeat(200); $('mpIn_good').value = 'う'.repeat(100); $('mpIn_bad').value = 'え'.repeat(100); $('mpSave').click(); await sleep(10);
  c('ちょうど上限（200・100・100）は保存できる', st('cards/tokA/prof/me').intro.length === 200 && st('cardProfiles/ZZ0001').bad.length === 100);
  // 保存に失敗した時
  $('mpEdit').click(); W.eval('FAIL = true'); $('mpSave').click(); await sleep(10);
  c('保存に失敗した時は欄が残り、メッセージが出る', !!$('mpIn_intro') && /保存できませんでした/.test($('mpErr').textContent) && !$('mpSave').disabled);
  W.eval('FAIL = false');

  // ── 4. 再発行・無効化のあとも消えない ──
  await W.pfMoveToken('ZZ0001', 'tokB');
  c('再発行: 写しから新しい会員証へ戻す', st('cards/tokB/prof/me') && st('cards/tokB/prof/me').intro === st('cardProfiles/ZZ0001').intro && st('cards/tokB/prof/me').atMs === st('cardProfiles/ZZ0001').atMs);
  await W.pfMoveToken('ZZ0099', 'tokC');
  c('プロフィールの無い人は何も書かない', !st('cards/tokC/prof/me'));
  c('発行・再発行（issueCardNow）で戻す', /olMoveToken\(oldToken, token\);[^\n]*\n\s*pfMoveToken\(m\.no, token\);/.test(H));
  c('まとめて発行でも戻す', /moved\.push\(\[m\.no, token\]\)/.test(H) && /moved\.splice\(0\)\.forEach\(function\(x\)\{ pfMoveToken\(x\[0\], x\[1\]\); \}\)/.test(H));
  const rv = slice('function revokeCard(m, cb){', 'function cardModal(');
  c('無効化では写し（cardProfiles）を消さない', rv.indexOf('cardProfiles') < 0 && rv.indexOf('pfDelete') < 0);
  c('名簿から削除した時は写しも消す', /function ckMemberCardDelAfter\(m\)\{\n[^\n]*\n  if\(m\) pfDelete\(m\.no\);/.test(H) && /\n    pfDelete\(m\.no\);\n    coInboxAll/.test(H));
  c('会員証の作り直し（グレード変更など）は cards 本体だけ＝プロフィール（下の階層）は残る', H.indexOf("collection('prof')") > 0 && !/refreshCardDoc[\s\S]{0,400}collection\('prof'\)/.test(H));

  // ── 5. コレクションのAさんのカード ──
  W.eval("STORE['cardProfiles/ZZ0002'] = { no: 'ZZ0002', intro: 'Aさんの最新の自己紹介', good: '', bad: '話すこと', atMs: 5 };");
  W.pfCollectionBox($('colPf'), 'ZZ0002');
  const ctg = $('colPf').querySelector('.pf-tg'), cb = $('colPf').querySelector('.pf-body');
  c('コレクション: 「詳細」は閉じている・暗い画面用', !!ctg && cb.classList.contains('hide') && $('colPf').querySelector('.pf').classList.contains('dk'));
  ctg.click(); await sleep(10);
  c('コレクション: 押すとAさんの最新のプロフィール（空の項目は出さない）', /Aさんの最新の自己紹介/.test(cb.textContent) && /話すこと/.test(cb.textContent) && !/GOOD AT/.test(cb.textContent) && !/編集/.test(cb.textContent));
  W.pfCollectionBox($('colPf'), 'ZZ0077'); $('colPf').querySelector('.pf-tg').click(); await sleep(10);
  c('コレクション: 書いていないAさんは「まだ書かれていません」', /まだ書かれていません/.test($('colPf').textContent));
  c('ショーケースでAさんの番号から開く', /pfCollectionBox\(\$\('colShowPf'\), g\.list\[0\]\.aNo\)/.test(H) && /<div id="colShowPf"><\/div>/.test(H));
  const olD = slice('function olDesign(m){', 'function olSpecial(');
  const olS = slice('function olSubmit(p, f){', 'function olDone(');
  c('コレクションの控えに会員証トークンを入れない', !/tok|Token/.test(olD) && !/(tok|cardToken)\s*:/.test(olS.slice(olS.indexOf('var rec'), olS.indexOf('tx.set('))));
  c('XSS: 中身はエスケープ', (() => { W.eval("STORE['cardProfiles/ZZ0005'] = { no: 'ZZ0005', intro: '<img src=x onerror=alert(1)>', good: '', bad: '', atMs: 1 };"); W.pfCollectionBox($('colPf'), 'ZZ0005'); $('colPf').querySelector('.pf-tg').click(); return true; })());
  await sleep(10);
  c('XSS: タグとして出ない', !$('colPf').querySelector('img') && /<img/.test($('colPf').textContent));

  // ── 画面への組み込み・お知らせ ──
  c('会員証の下に mcProf・renderProfile を呼ぶ・ID が重ならない', ['mcProf', 'mpEdit', 'mpErr', 'mpSave', 'mpCancel', 'colShowPf'].every(id => H.split('id="' + id + '"').length === 2) && /<\/div><\/div>\n    <div id="mcProf"><\/div>/.test(H) && /renderCoSheetEntry\(c\);\n      renderProfile\(c\);/.test(H));
  c('APP_VER v109以降・v109のお知らせ', (+(H.match(/var APP_VER = 'v(\d+)';/) || [0, 0])[1]) >= 109 && /\n  \{ v: 'v109', d: '2026\/10\/28'/.test(H));

  // ── 3. firestore.rules ──
  const rp = rules.slice(rules.indexOf('match /cards/{token}/prof/{pid}'), rules.indexOf('match /cardProfiles/{no}'));
  const rc = rules.slice(rules.indexOf('match /cardProfiles/{no}'), rules.indexOf('// 📝 CO面談シートの本人入力（下書き送信箱）'));
  c('rules: 本人の分はトークンのパス・3項目＋時刻だけ', /pid == 'me'/.test(rp) && /hasOnly\(\['intro', 'good', 'bad', 'atMs'\]\)/.test(rp) && /ckProfTitleOk\(get\(/.test(rp));
  c('rules: 字数の上限 200・100・100', /'intro', ''\)\.size\(\) <= 200/.test(rules) && /'good', ''\)\.size\(\) <= 100/.test(rules) && /'bad', ''\)\.size\(\) <= 100/.test(rules));
  c('rules: タイトルの判定（古い badge も）・研修生と無効は不可', /in \['RUBY', 'EMERALD', 'DIAMOND', 'BLUE DIAMOND', 'TEAM ELITE'\]/.test(rules) && /d\.get\('cardTitle', ''\) != '' \? d\.get\('cardTitle', ''\) : d\.get\('badge', ''\)/.test(rules) && /'trainee', false\) != true/.test(rules));
  c('rules: 写しは本人の分と同じ一括書き込みだけ・一覧は不可・読むのはログインした人', /ckProfSame\(/.test(rc) && /allow list: if false;/.test(rc) && /allow get: if signedIn\(\) && notDisabled/.test(rc));
  c('rules: cards 本体の更新は今まで通りログインした人だけ（本人は変えられない）', /allow update: if signedIn\(\) && ckDecoUpdOk\(\);/.test(rules));

  console.log(fails ? 'FAILS ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
