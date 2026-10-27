// v843：ユーザー台帳（MAPの「ビジネス｜ユーザー」）
//   ビジネスのMAPにユーザーを出さず紹介者に「ユーザー○人・○P」／ユーザーの一覧・表・詳細（ポイント手入力・ADP・購入・ニーズ・プロフィール）／研修生にする
const T = require('../lib/head.js')({ timeout: 120000 });
const { w, c, sleep, setWH, $, $$ } = T;
const key = (el, k) => el.dispatchEvent(new w.KeyboardEvent('keydown', { key: k, bubbles: true }));
function data() {
  w.state.isEditor = true;
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'ゴールド', parentId: '', mapType: 'both', ptSelf: 3000, activity: 'S' },
    { id: 'a', lastName: '鈴木', firstName: '一', title: 'B2', parentId: 'r', mapType: 'both', ptSelf: 1200 },
    { id: 'b', lastName: '高橋', firstName: '光', title: 'B1', parentId: 'r', mapType: 'both', ptSelf: 300 },
    { id: 'u1', lastName: '仮田', firstName: '花子', title: 'ユーザー', parentId: 'a', mapType: 'both', ptSelf: 1800, ptCurrent: 1800, ptFixed: 1500, adp: { on: true, next: '2026-11-12' }, buys: [{ t: 'スキンケアセット', d: '2026-10-12' }], needs: ['美容'] },
    { id: 'u2', lastName: '見本', firstName: '太郎', title: 'ユーザー', parentId: 'a', mapType: 'both', ptSelf: 0, ptCurrent: 0, buys: [{ t: 'プロテイン', d: '2020-01-03' }] },
    { id: 'u3', lastName: '例山', firstName: 'さくら', title: 'ユーザー', parentId: 'a', mapType: 'both', ptSelf: 2700, ptCurrent: 2700, adp: { on: true } },
    { id: 'u4', lastName: '試験', firstName: '次郎', title: 'ユーザー', parentId: 'b', mapType: 'both', ptSelf: 1600, ptCurrent: 1600, needMemo: '乾燥肌' }];
  w.state.idealMembers = JSON.parse(JSON.stringify(w.state.members)).map(m => Object.assign(m, { mapType: 'ideal' }));
  w.recalcAllGSV();
}
const M = id => w.state.members.find(m => m.id === id);
T.run(async () => {
  T.login(); setWH(390, 844); try { w._uxSync && w._uxSync(); } catch (e) {}
  data(); w.umSet(false); w.switchView('current'); await sleep(80);
  // ── ビジネスのMAP（スマホ）
  const rows = $$('#treeCurrent .mr[data-cid]').map(r => r.getAttribute('data-cid'));
  c('スマホ：ビジネスのMAPにユーザーは出ない', rows.indexOf('a') >= 0 && !rows.some(id => /^u/.test(id)));
  const ra = $('#treeCurrent .mr[data-cid="a"]');
  c('紹介者の行に「ユーザー3人・4,500P」', ra && /ユーザー 3人・4,500P/.test(ra.textContent));
  c('ユーザーのポイントは紹介者のGSVに入ったまま', M('a').ptCurrent === 1200 + 1800 + 0 + 2700 && M('r').ptCurrent > 9000);
  c('切り替え「ビジネス｜ユーザー」と？', !!$('#mxTop .umsw') && /ユーザー/.test($('#mxTop .umsw').textContent) && !!$('#mxTop .umsw .umq'));
  // 紹介者の札を押すとその人のユーザー一覧
  ra.querySelector('.umb').click(); await sleep(400);
  c('札を押すと、その紹介者のユーザーだけの一覧', w._umMode && $$('#treeCurrent .umcd').length === 3);
  w._umRef = ''; w._umRepaint(); await sleep(20);
  c('ユーザーの一覧（4人）・ポイントとADPの合計', $$('#treeCurrent .umcd').length === 4 && /6,100/.test($('#treeCurrent .ums').textContent) && /2\/4/.test($('#treeCurrent .ums').textContent.replace(/\s/g, '')));
  w.umFlt('noadp'); await sleep(10); c('ADPなしで絞る', $$('#treeCurrent .umcd').length === 2);
  w.umFlt('old'); await sleep(10); c('60日買ってないで絞る（オレンジ）', $$('#treeCurrent .umcd').length === 1 && !!$('#treeCurrent .umd.old'));
  w.umFlt('needs'); await sleep(10); c('ニーズありで絞る（タグ・メモ）', $$('#treeCurrent .umcd').length === 2);
  w.umFlt('all'); await sleep(10);
  c('スマホの下のボタンは「＋ ユーザー」', /ユーザー/.test(($('#mxBtm') || {}).textContent || ''));
  // ── v844: ユーザーの画面（MAPと同じメンバー画面のユーザー版）
  w.umOpen('u1'); await sleep(40);
  const pg = () => $('#ppPg'), tx = () => (pg() || {}).textContent || '';
  c('押すとメンバー画面のユーザー版（稼働・やる気・研修は出ない）', !!pg() && /ADP・購入/.test(tx()) && /ニーズ/.test(tx()) && !/稼働/.test(tx()) && !/やる気/.test(tx()) && /紹介者：鈴木 一/.test(tx()));
  c('前のニーズのタグは文章に入れて残す', M('u1').needs.length === 0 && /美容/.test(M('u1').needMemo));
  c('下のボタンは「＋ ToDo」', /ToDo/.test($('#ppPg .ux-btm').textContent) && !/フロント追加/.test($('#ppPg .ux-btm').textContent));
  w.ppGo('upt'); await sleep(20);
  const inp = $('#ppPg .ux-sv input'); inp.value = '2500'; inp.dispatchEvent(new w.Event('change')); await sleep(20);
  c('ポイント：数字を直接入れる → 紹介者のGSVにも入る', M('u1').ptCurrent === 2500 && M('u1').ptSelf === 2500 && M('a').ptCurrent === 1200 + 2500 + 2700);
  w.umPpStep('f', 100); await sleep(10);
  c('− ＋ でも直せる（固定）', M('u1').ptFixed === 1600);
  w.ppGo('uadp'); await sleep(20);
  c('ADP・購入：製品名・日付・記録するを1行ずつ', !!$('#ppPg #umBuyT') && !!$('#ppPg #umBuyD') && /記録する/.test(tx()));
  w.umAdpSet(0); await sleep(10); c('ADPを「なし」に', M('u1').adp.on === false && !$('#ppPg .umdt input[onchange^="umAdpNext"]'));
  M('u1').adp = { on: false, next: '' }; w.umAdpSet(1); await sleep(10);
  c('次の発送日が空なら「日付を選ぶ」', !!$('#ppPg .umdt.em'));
  w.umAdpNext('2026-12-01'); await sleep(10); c('ADPの次の発送日', M('u1').adp.on && M('u1').adp.next === '2026-12-01');
  $('#umBuyT').value = '美容液'; $('#umBuyD').value = '2026-10-25'; w.umBuyAdd(); await sleep(10);
  c('購入を記録（新しい順）・一覧に出る', M('u1').buys[0].t === '美容液' && M('u1').buys.length === 2 && $$('#ppPg .umbl .r').length === 2);
  w.umBuyDel(0); await sleep(10); c('購入の記録を消せる', M('u1').buys.length === 1);
  w.ppGo('uneed'); await sleep(10);
  c('ニーズは自由に書く欄だけ（ボタンなし）', !!$('#ppPg textarea.ppmemo') && !$('#ppPg .umtg'));
  w.umNeedTxt('乾燥肌が悩み'); await sleep(10); c('ニーズを書ける', M('u1').needMemo === '乾燥肌が悩み');
  w.ppGo('prof'); await sleep(10);
  c('プロフィールはMAPと同じ（研修生の欄は出ない・ユーザーになった月）', /誕生日/.test(tx()) && /ユーザーになった月/.test(tx()) && !/研修生（水色）/.test(tx()));
  w.ppGo(''); await sleep(10);
  let called = null; const orig = w.openEventModal; w.openEventModal = function(id, mid, d, type) { called = [mid, type]; }; w.umTodo(); w.openEventModal = orig;
  c('＋ ToDo はいつものタスクを足す画面（この人にひもづく＝活動に残る）', called && called[0] === 'u1' && called[1] === 'task');
  w.ppClose(); await sleep(10);
  // ── 足す
  w._umRef = 'b'; w.umAdd(); await sleep(20);
  c('足す：紹介者は今見ている人が最初から選ばれている', $('#umAP').value === 'b');
  $('#umAL').value = '新井'; $('#umAF').value = '空'; $('#umAPt').value = '500'; w.umAddSave(); await sleep(30);
  const nu = w.state.members.find(m => m.lastName === '新井');
  c('ユーザーを足せる（紹介者の下・ポイントはGSVへ）', nu && nu.title === 'ユーザー' && nu.parentId === 'b' && M('b').ptCurrent === 300 + 1600 + 500);
  w.ppClose(); w._umRef = '';
  // ── 研修生にする
  w.umOpen('u4'); await sleep(20);
  w.confirm = () => true; w.umToTrainee(); await sleep(20);
  c('研修生にする：タイトルを外して研修生に（記録は残す）', M('u4').title === '' && M('u4').trainee === true && !!M('u4').fromUser && M('u4').needMemo === '乾燥肌');
  w.ppClose(); w.umSet(false); await sleep(400);
  const r4 = $('#treeCurrent .mr[data-cid="u4"]');
  c('ビジネスのMAPに研修生として出る（元ユーザー）', !!r4 && /元ユーザー/.test(r4.textContent));
  // ── 見るだけの人（共有MAP）
  w.state.isEditor = false; w.umSet(true); await sleep(400);
  c('見るだけの人には「＋ ユーザーを足す」は出ない', !$('#treeCurrent .umadd'));
  w.umOpen('u1'); await sleep(20);
  c('見るだけの人は編集画面を開かない', !w.document.body.classList.contains('pp-on'));
  try { w.uxMemClose(); } catch (e) {} w.state.isEditor = true;
  // ── 理想MAPはそのまま（ユーザーも出る）
  w.umSet(false); await sleep(400); w.switchView('ideal'); await sleep(400);
  c('理想MAPにはユーザーがそのまま出る', $$('#treeIdeal .mr[data-cid]').some(r => /^u/.test(r.getAttribute('data-cid'))));
  c('理想MAPでは um-on を外す', !w.document.body.classList.contains('um-on'));
  // ── PC
  data(); setWH(1400, 900); try { w._uxSync && w._uxSync(); } catch (e) {}
  w.umSet(false); w.switchView('current'); await sleep(200);
  const pcIds = $$('#pcMapCurrent [data-id], #pcMapCurrent g[id^="nw-"]').map(g => g.getAttribute('data-id') || g.id.replace('nw-', ''));
  c('PC：組織図にユーザーは出ない・紹介者に札', !pcIds.some(id => /^u/.test(id)) && $$('#pcMapCurrent .pc-umb').length === 2);
  c('PC：上の帯に「ビジネス｜ユーザー」', !!$('#umSegPc') && /ユーザー/.test($('#umSegPc').textContent));
  w.renderPCTable('current'); await sleep(20);
  c('PC：表のビューにもユーザーは出ない', !/仮田/.test(($('#pcTableCurrent') || {}).textContent || ''));
  w.umSet(true); await sleep(400);
  c('PC：ユーザーは表で出る', $$('#umPane .umtb tbody tr').length === 4 && w.document.body.classList.contains('um-on'));
  const cell = $$('#umPane .umtb tbody tr').find(tr => /仮田/.test(tr.textContent)).querySelector('td.umed');
  cell.click(); await sleep(10);
  const ci = cell.querySelector('input'); ci.value = '3000'; key(ci, 'Enter'); await sleep(30);
  c('PC：表の今月PTを押してその場で入力', M('u1').ptCurrent === 3000 && /3,000/.test($('#umPane').textContent));
  // メンバー画面で保存しても項目を落とさない
  const app = require('fs').readFileSync(require('path').join(__dirname, '../../../app.js'), 'utf8');
  c('メンバー画面の保存でユーザー台帳の項目を落とさない', /UM_KEYS\.forEach\(function\(k\) \{ if \(_prevMember\[k\] !== undefined/.test(app));
  w.umSet(false);
});
