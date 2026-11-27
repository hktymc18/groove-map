// v925：バグ報告の詳細に「🤖 Claude の見立て」（オーナーだけ）。一覧に印。ボタンで状態を変える／返信の下書きをコメント欄へ
//   オーナー以外には欄も印も出さず、fbTriage を読みに行かない。見立てが無い報告には欄を出さない
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  w.currentUser.name = '架空 一郎';
  if (!w.firebase.firestore.FieldValue) w.firebase.firestore.FieldValue = { serverTimestamp: () => 'ts' };
  const items = [
    { id: '40', no: 40, kind: 'bug', screen: 'MAP', title: '保存できない', did: '押した', got: '消えた', status: 'new', authorUid: 'uM', authorName: '架空 一郎' },
    { id: '41', no: 41, kind: 'req', screen: '予定', title: '並べ替えたい', did: 'x', status: 'new', authorUid: 'uM', authorName: '架空 一郎' },
    { id: '9042', no: 9042, kind: 'bug', screen: 'PLAN', title: '仕様かも', did: 'y', status: 'fix', authorUid: 'uM', authorName: '架空 一郎' } // v926: 架空の番号は実在のお知らせ（RELEASE_NOTES の #42）と被らない番号に（被ると「直した版が出たら確認待ち」が働く）
  ];
  const TRI = {
    '40': { id: '40', verdict: 'bug', confidence: 'high', summary: '保存の順番が逆になっている', plan: 'app.js の保存を await してから閉じる', replyDraft: 'ご報告ありがとうございます。次の版で直します', at: '2026-10-14T02:00:00Z', pr: 'https://github.com/hktymc18/groove-map/pull/700' },
    '9042': { id: '9042', verdict: 'decide', confidence: 'low', summary: '仕様の判断が要る', at: '2026-10-14T02:00:00Z' }
  };
  const reads = [], ups = [], notes = [];
  const oG = w.fsGet, oC = w.fsGetCol;
  w.fsGet = (p) => { if (/^fbTriage/.test(p)) { reads.push(p); return Promise.resolve(TRI[p.split('/')[1]] ? Object.assign({}, TRI[p.split('/')[1]]) : null); } return oG(p); };
  w.fsGetCol = (p) => { if (/^fbTriage/.test(p)) { reads.push(p); return Promise.resolve(Object.keys(TRI).map(k => Object.assign({}, TRI[k]))); } return oC(p); };
  w._fbLoadItems = () => Promise.resolve(items.map(x => Object.assign({}, x)));
  w._fbLoadSub = () => Promise.resolve([]);
  w._fbUpdate = (id, d) => { ups.push([id, d]); return Promise.resolve(); };
  w._fbAddNote = (id, n) => { notes.push([id, n]); return Promise.resolve(); };
  let toastMsg = ''; w.toast = m => { toastMsg = m; };
  const mark = id => { const it = $$('#fbMain .fb-it').find(e => e.textContent.indexOf('#' + id) >= 0); return it && !!it.querySelector('.fb-aimk'); };

  // ── オーナー以外（バグ報告の指定メンバー） ──
  w.currentUser.uid = 'uM'; w._fb.ok = true; w._fb.tri = {};
  w.fbOpen(); await sleep(60);
  w.fbDetailOpen('40'); await sleep(60);
  c('オーナー以外：fbTriage を読みに行かない（一覧・詳細とも）', reads.length === 0, reads.join());
  c('オーナー以外：見立ての欄が出ない', !$('#fbTri') && !/Claude の見立て/.test($('#fbDetBody').textContent));
  c('オーナー以外：一覧に印が出ない', !$('#fbMain .fb-aimk'));
  w._p2SheetClose('fbDetOv'); w._p2SheetClose('fbOv'); await sleep(20);

  // ── オーナー ──
  w.currentUser.uid = T.OWNER;
  w.fbOpen(); await sleep(80);
  c('オーナー：一覧を開くと fbTriage を1回まとめて読む', reads.filter(p => p === 'fbTriage').length === 1, reads.join());
  c('オーナー：見立てがある報告に印（#40）', mark(40));
  c('オーナー：見立てが無い報告には印なし（#41）', !mark(41));
  w.fbTab('fix'); await sleep(10);
  c('オーナー：判断が要る見立てにも印（#9042）', mark(9042));
  w.fbTab('new');
  w.fbDetailOpen('40'); await sleep(60);
  c('オーナー：詳細を開くと fbTriage/{id} を読む', reads.indexOf('fbTriage/40') >= 0);
  const box = $('#fbTri');
  c('オーナー：見立ての欄が出る（🤖 は線画のアイコンに差し替わる）', !!box && /Claude の見立て/.test(box.querySelector('.fb-ai-hd .t').textContent));
  c('中身：判定・確信度・要約・直し方・返信の下書き・PR', !!box && /直す/.test(box.querySelector('.fb-ai-v').textContent) && /確信度 高/.test(box.textContent) && /保存の順番が逆/.test(box.textContent) && /await してから閉じる/.test(box.textContent) && /次の版で直します/.test(box.textContent) && /pull\/700/.test(box.textContent));
  const btn = re => $$('#fbTri .fb-btn').find(b => re.test(b.textContent));
  c('判定に合う状態のボタン（「改修する」にする）', !!btn(/「改修する」にする/));
  // 返信の下書き → コメント欄（保存はしない）
  btn(/下書きをコメント欄へ/).onclick(); await sleep(10);
  c('返信の下書きを管理者コメント欄に入れる（まだ保存しない）', $('#fbCmt').value === 'ご報告ありがとうございます。次の版で直します' && !ups.some(u => 'adminComment' in u[1]), JSON.stringify(ups));
  // 状態を変える
  btn(/「改修する」にする/).onclick(); await sleep(30);
  c('ボタンで状態が「改修する」になる（fbSetSt）', ups.some(u => u[0] === '40' && u[1].status === 'fix') && w._fbItem('40').status === 'fix' && notes.some(n => n[0] === '40' && /新着 → 改修する/.test(n[1].text)));
  c('変えた後もコメント欄の書きかけは残る', $('#fbCmt').value === 'ご報告ありがとうございます。次の版で直します');
  c('変えた後はボタンが「いまは「改修する」」', !btn(/にする/) && !!$$('#fbTri .fb-btn.dis').find(b => /いまは「改修する」/.test(b.textContent)));
  // 見立てが無い報告
  w._p2SheetClose('fbDetOv'); w.fbDetailOpen('41'); await sleep(60);
  c('見立てが無い報告には欄を出さない', !$('#fbTri'));
  // 判断が要る
  w._p2SheetClose('fbDetOv'); w.fbDetailOpen('9042'); await sleep(60);
  c('判断が要る：状態のボタンは出さず、案内だけ', !!$('#fbTri') && /判断が要る/.test($('#fbTri').textContent) && !$$('#fbTri .fb-btn').length && /下の「状態」から選んで/.test($('#fbTri').textContent));
  // 見立てが後から消えた（詳細で読み直すと無い）→ 欄も印も消える
  delete TRI['9042'];
  w._p2SheetClose('fbDetOv'); w.fbDetailOpen('9042'); await sleep(60);
  c('読み直して無ければ欄を出さない', !$('#fbTri') && !w._fb.tri['9042']);
  // 文字はエスケープ
  TRI['41'] = { id: '41', verdict: 'no', confidence: 'mid', summary: '<img src=x onerror=alert(1)>', at: '2026-10-14T02:00:00Z' };
  w._p2SheetClose('fbDetOv'); w.fbDetailOpen('41'); await sleep(60);
  c('見立ての文字はエスケープする', !!$('#fbTri') && !$('#fbTri img') && /<img/.test($('#fbTri .fb-ai-sm').textContent));
  c('対応しない：ボタンは「対応しない」にする', !!$$('#fbTri .fb-btn').find(b => /「対応しない」にする/.test(b.textContent)));
  w._p2SheetClose('fbDetOv'); w._p2SheetClose('fbOv');
});
