// v817：バグ・要望・アイデア。種類にアイデア・状態に検討中／確認待ち・期限（目安／日付）と期限で見る・対象・依頼した人・Slackのリンク
//   馬越さん（2人目のオーナー）も管理者・直した版が出たら自動で確認待ち・Slack用の文と進捗まとめ
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  w.currentUser.name = '架空 一郎';
  if (!w.firebase.firestore.FieldValue) w.firebase.firestore.FieldValue = { serverTimestamp: () => 'ts' };
  const ymd = n => { const d = new w.Date(); d.setDate(d.getDate() + n); return w._fbYmd(d); };
  let copied = '', ups = [], created = null, notes = [];
  const items = [
    { id: '20', no: 20, kind: 'bug', app: '受付システム', screen: '受付', title: '名簿が出ない', did: '開いた', got: '空', status: 'doing', authorName: '架空 一郎', reqBy: '試験 二郎', slackUrl: 'https://x.slack.com/archives/C1/p1' },
    { id: '21', no: 21, kind: 'idea', title: '他ユニオン連携', did: 'つなぎたい', status: 'review', authorName: '架空 一郎', due: ymd(-2), dueK: 'd' },
    { id: '22', no: 22, kind: 'req', screen: 'MAP', title: '並び替えたい', did: '探しにくい', status: 'fix', authorName: '見本 三郎', dueK: 'l' },
    { id: '23', no: 23, kind: 'bug', screen: 'PLAN', title: '古いもの', status: 'done' },
    { id: '24', no: 24, kind: 'req', screen: '予定', title: '今週やる', did: 'x', status: 'new', due: ymd(0), dueK: 'w' }
  ];
  w._fbLoadItems = () => Promise.resolve(items.map(x => Object.assign({}, x)));
  w._fbUpdate = (id, d) => { ups.push([id, d]); return Promise.resolve(); };
  w._fbAddNote = (id, n) => { notes.push([id, n.text]); return Promise.resolve(); };
  w._fbLoadSub = () => Promise.resolve([]);
  w._fbCopy = (t) => { copied = t; return Promise.resolve(true); };
  w._fbCreate = (it) => { created = it; return Promise.resolve(30); };
  let toastMsg = ''; const ot = w.toast; w.toast = m => { toastMsg = m; };
  // ① 2人目のオーナー（馬越さん）も管理者
  w.currentUser.uid = 'E4WT7EHai5c6WANUgASz42Euu1y1';
  c('2人目のオーナーも管理者', w._fbIsOwner());
  w.currentUser.uid = T.OWNER; w._fb.ok = true;
  // ② 直した版が出たら自動で確認待ち（RELEASE_NOTES に #20）
  w.RELEASE_NOTES.unshift({ v: 'v999', d: '2026-10-19', items: ['名簿が出ない問題を修正（#20）', '別の話（#23）'] });
  w.fbOpen(); await sleep(60);
  const it = id => w._fb.items.find(x => x.id === id);
  c('#20（対応中）は自動で確認待ち・何版で直したか', it('20').status === 'check' && it('20').doneVer === 'v999' && ups.some(u => u[0] === '20' && u[1].status === 'check') && notes.some(n => /確認待ち（v999/.test(n[1])));
  c('完了ずみ・Claudeに渡していないものは変えない', it('23').status === 'done' && it('24').status === 'new');
  w.RELEASE_NOTES.shift();
  // ③ 一覧：種類・対象・期限・依頼した人
  const tx = () => $('#fbMain').textContent;
  w.fbTab('all'); await sleep(5);
  c('タイトルは「バグ・要望・アイデア」', /バグ・要望・アイデア/.test(tx()));
  c('状態に検討中・確認待ち', /検討中/.test(tx()) && /確認待ち/.test(tx()));
  c('一覧に種類（アイデア・改善）・対象・期限・依頼した人', /アイデア/.test(tx()) && /改善/.test(tx()) && /受付システム/.test(tx()) && /いつか/.test(tx()) && /依頼 試験 二郎/.test(tx()) && !/要望<\/span>/.test($('#fbMain').innerHTML.replace(/バグ・要望・アイデア/g, '')));
  w.fbKf('idea'); await sleep(5);
  c('種類で絞れる', $$('#fbMain .fb-it').length === 1 && /他ユニオン連携/.test(tx()));
  w.fbKf(''); w.fbView('due'); await sleep(5);
  const lbs = $$('#fbMain .fb-lb').map(e => e.textContent);
  c('期限で見る：期限切れ・今週まで・いつか・期限なし（終わったものは出さない）', /期限切れ1件/.test(lbs.join()) && /今週まで1件/.test(lbs.join()) && /いつか（長期）1件/.test(lbs.join()) && /期限なし1件/.test(lbs.join()) && !/古いもの/.test(tx()));
  c('期限切れは件数を赤で知らせる', /期限で見る1/.test(tx()));
  // ④ 詳しい画面：状態（検討中・確認待ち）・期限・Slack
  w.fbDetailOpen('22'); await sleep(30);
  const dt = () => $('#fbDetBody').textContent;
  c('状態のボタンに検討中・確認待ち', /検討中/.test(dt()) && /確認待ち/.test(dt()) && /運用回避/.test(dt()));
  w.fbDetDue('m'); await sleep(10);
  const dueU = ups.filter(u => u[0] === '22').pop();
  c('期限の目安（今月中）→ 月末の日付', dueU && dueU[1].dueK === 'm' && dueU[1].due === w._fbDueOf('m') && /〜\d+\/\d+/.test(dt()));
  w.fbDetDue('d'); await sleep(5);
  c('「日付で」を押すと日付の欄', !!$('#fbDetDueD'));
  w.fbDetDue('d', '2026-12-24'); await sleep(10);
  c('日付で決められる', it('22').due === '2026-12-24' && /〜12\/24/.test(dt()));
  w.fbDetDue(''); await sleep(10);
  c('なしにもできる', !it('22').due && !it('22').dueK);
  w.fbSetSt('review'); await sleep(10);
  c('検討中にできる', it('22').status === 'review');
  w._p2SheetClose('fbDetOv'); w.fbDetailOpen('20'); await sleep(30);
  c('依頼した人・Slackを開くリンク', /依頼した人 試験 二郎/.test(dt()) && !!$('#fbDetBody a[href^="https://x.slack.com"]'));
  w.fbCopySlack(); await sleep(10);
  c('Slack用：確認待ち → 対応した版と確認のお願い', /#20「名簿が出ない」 は v999 で対応しました/.test(copied) && /確認をお願いします/.test(copied));
  w._p2SheetClose('fbDetOv');
  // ⑤ 進捗まとめ
  w.fbCopyProgress(); await sleep(10);
  c('進捗まとめ：期限切れ・今週まで・確認待ち', /NAVIGATOR 改修の進捗/.test(copied) && /■ 期限切れ（1件）\n・#21 他ユニオン連携（アイデア/.test(copied) && /■ 今週まで（1件）/.test(copied) && /確認待ち（確認をお願いします）（1件）\n・#20/.test(copied) && /v999で対応/.test(copied));
  // ⑥ Claude用：アイデア・対象・期限・依頼
  w._fb.view = 'st'; w._fb.tab = 'all'; w._fb.sel = { '20': true, '21': true }; w.fbCopyForClaude(); await sleep(20);
  c('Claude用：アイデアはまず設計を提案・対象・期限・依頼した人', /まず設計を提案/.test(copied) && /#20 バグ／受付システム・受付/.test(copied) && /#21 アイデア／/.test(copied) && /期限：\d+\/\d+まで/.test(copied) && /依頼：試験 二郎（Slack）/.test(copied) && /どんなアイデアか：つなぎたい/.test(copied));
  // ⑦ 書く：アイデア・対象・依頼した人・Slack・期限（管理者）
  w.fbFormOpen(); await sleep(10);
  w.fbKind('idea'); w.fbFormSet('app', '受付システム'); w.fbFormDue('n'); await sleep(5);
  c('書く：アイデアの言葉・対象・期限の目安', /どんなアイデアか/.test($('#fbFormBody').textContent) && $$('#fbApp span.on')[0].textContent === '受付システム' && /来月/.test($$('#fbFormBody .fb-chips span.on').map(e => e.textContent).join()));
  $('#fbTitle').value = '新しいアイデア'; $('#fbDid').value = 'こうしたい'; $('#fbReqBy').value = '試験 二郎'; $('#fbSlack').value = 'javascript:alert(1)';
  w.fbSend(); await sleep(10);
  c('Slackのリンクは https:// だけ', !created && /https/.test(toastMsg));
  $('#fbSlack').value = 'https://x.slack.com/archives/C2/p2'; w.fbSend(); await sleep(20);
  c('書いた内容（種類・対象・依頼した人・リンク・期限）', created && created.kind === 'idea' && created.app === '受付システム' && created.reqBy === '試験 二郎' && /^https:/.test(created.slackUrl) && created.dueK === 'n' && created.due === w._fbDueOf('n') && /#30/.test(toastMsg));
  // 一般のメンバーには期限の欄を出さない
  w.currentUser.uid = 'uX'; w.fbFormOpen(); await sleep(10);
  c('管理者でない人には期限の欄を出さない', !/いつまでに/.test($('#fbFormBody').textContent));
  w._p2SheetClose('fbFormOv'); w.currentUser.uid = T.OWNER;
  w._p2SheetClose('fbOv'); w.toast = ot;
});
