// v841 #29：理想の生活の「いらない」（分野ごと）と「自分で足した項目」（推し活など）
//   NAVIGATOR（PLAN › 理想）と受付の宿題（checkin/index.html・受付 v106）で同じ形（ans.skip / ans.extra）
const T = require('../lib/head.js')({ timeout: 120000 });
const { w, c, sleep, setWH, $, $$ } = T;
const fs = require('fs'), path = require('path');
T.run(async () => {
  T.login(); setWH(390, 844);
  const g = w._p2G(); g.ans = { food_style: '好きなものを自由に', food_cost: 8, housing_type: '賃貸', housing_cost: 20 }; g.p1 = false;
  const tot0 = w._p2GwTotal();
  w.switchView('plan'); w.p2Go('ideal', 0); await sleep(80);
  // 住まいの最初の質問へ
  w._p2GwStep = w.P2GW_Q.findIndex(q => q.id === 'housing_type'); w._p2GwRender(); await sleep(20);
  c('分野の最初の質問に「いらない」・スキップは「あとで」', !!$('#p2GwWrap .gw2-no') && /いらない/.test($('#p2GwWrap .gw2-no').textContent) && /あとで/.test($('#p2GwWrap .gw2-skip').textContent));
  w._p2GwStep = w.P2GW_Q.findIndex(q => q.id === 'housing_style'); w._p2GwRender(); await sleep(20);
  c('分野の2問目には「いらない」は出ない', !$('#p2GwWrap .gw2-no'));
  w._p2GwStep = w.P2GW_Q.findIndex(q => q.id === 'housing_type'); w._p2GwRender(); await sleep(20);
  $('#p2GwWrap .gw2-no').click(); await sleep(30);
  c('「いらない」で記録される（skip.house）', g.ans.skip && g.ans.skip.house === 1);
  c('住まいの質問は出なくなり、次の分野へ進む', !w._p2IdealQs().some(q => /^housing_/.test(q.id)) && w.P2GW_Q[w._p2GwStep].id === 'food_style');
  c('住まいの金額は合計に入らない（答えは消さない）', w._p2GwTotal() === tot0 - 20 && g.ans.housing_cost === 20);
  w._p2IdealListPaint(); await sleep(10);
  const skr = $$('#p2IdList .p2id-r').find(r => /住まい/.test(r.textContent));
  c('一覧に「いらない」と ↺ 戻す', skr && skr.classList.contains('p2-skr') && /いらない/.test(skr.textContent) && /戻す/.test(skr.textContent));
  // 自分の項目を足す
  c('一覧に「＋ 自分の項目を足す」', !!$('#p2IdList .p2ex-add'));
  w.p2ExtraEdit(-1); await sleep(20);
  $('#p2ExT').value = '推し活'; $('#p2ExV').value = '6'; $('#p2ExM').value = 'ライブは全部行きたい';
  w.p2ExtraSave(-1); await sleep(30);
  c('足した項目が保存される', Array.isArray(g.ans.extra) && g.ans.extra.length === 1 && g.ans.extra[0].t === '推し活' && g.ans.extra[0].v === 6 && g.ans.extra[0].m === 'ライブは全部行きたい');
  c('足した項目の金額は合計に入る', w._p2GwTotal() === tot0 - 20 + 6);
  const exr = $$('#p2IdList .p2id-r').find(r => /推し活/.test(r.textContent));
  c('一覧に星のしるしで並ぶ', exr && !!exr.querySelector('.p2ex-st svg') && /6万/.test(exr.textContent));
  w.p2ExtraEdit(0); await sleep(20); $('#p2ExV').value = '9'; w.p2ExtraSave(0); await sleep(20);
  c('直せる', g.ans.extra[0].v === 9 && g.ans.extra.length === 1);
  for (let i = 0; i < 4; i++) { w.p2ExtraEdit(-1); await sleep(5); $('#p2ExT').value = 'X' + i; $('#p2ExV').value = '1'; w.p2ExtraSave(-1); await sleep(5); }
  c('5つまで（それ以上は足すボタンが出ない）', g.ans.extra.length === 5 && !$('#p2IdList .p2ex-add'));
  w.p2ExtraEdit(4); await sleep(10); w.p2ExtraDel(4); await sleep(20);
  c('消せる', g.ans.extra.length === 4 && !!$('#p2IdList .p2ex-add'));
  // 理想の生活シート
  w.p2LifeOpen(); await sleep(40);
  const box = $('#p2LfBody');
  c('理想の生活シートにも「いらない」と★の項目', box && /いらない/.test(box.textContent) && /推し活/.test(box.textContent) && /自分の項目を足す/.test(box.textContent));
  w.p2CatUnskip('house'); await sleep(20);
  c('↺ 戻すで答えられる（金額も戻る）', !(g.ans.skip || {}).house && w._p2GwTotal() === tot0 + 9 + 3);
  w.p2LifeClose(); await sleep(20);
  // 1年以内の理想は別に持つ
  w._p2LfMode = 'near'; w.p2CatSkip('travel'); w._p2LfMode = '';
  c('1年以内の理想の「いらない」は最終ゴールの理想と別', w._p2().lifeNear.skip.travel === 1 && !(g.ans.skip || {}).travel);
  // 引き継ぎ（宿題 → NAVIGATOR）
  const app = fs.readFileSync(path.join(__dirname, '../../../app.js'), 'utf8');
  c('宿題の引き継ぎで「いらない」と自分の項目も入れる', /addSk\) a\.skip = /.test(app) && /addEx\) a\.extra = /.test(app));

  // ── 受付の宿題（checkin/index.html）──
  const { JSDOM } = require(path.join(__dirname, '../node_modules/jsdom'));
  const H = fs.readFileSync(path.join(__dirname, '../../../checkin/index.html'), 'utf8');
  const pick = (re) => { const m = H.match(re); if (!m) throw new Error('not found ' + re); return m[0]; };
  const from = H.indexOf('var HW_VER'), to = H.indexOf('function renderTrainee(');
  const D = new JSDOM('<div id="modalHost"></div><div id="hwArea"></div>', { runScripts: 'outside-only', url: 'https://example.com/checkin/' });
  const W = D.window;
  W.eval(pick(/function \$\(id\)\{[^\n]*\}/) + '\n' + pick(/function esc\(s\)\{[\s\S]*?\n\}/) + '\n'
    + 'function ckIco(){ return ""; } var CK_CHICK = ""; var gCardToken = "tok1"; var __toasts = []; function toast(m){ __toasts.push(m); }'
    + 'function modal(h){ var host = $("modalHost"); host.innerHTML = \'<div class="modalback"><div class="modal">\' + h + "</div></div>"; return host; } function closeModal(){ $("modalHost").innerHTML = ""; }'
    + 'var __sent = null; var db = { collection: function(){ return { doc: function(){ return { set: function(d){ __sent = d; return Promise.resolve(); }, get: function(){ return Promise.resolve({ exists: false }); } }; } }; } };'
    + 'function renderGoalHw(){}\n' + H.slice(from, to));
  const Q = id => W.document.getElementById(id);
  W.eval("hwOpen({ name: '仮山 太郎', no: '9', union: 'U', trainings: { PG: { by: 'u1', byName: '仮川' } } }, null, false);");
  c('受付：住まいの最初の質問に「いらない」・スキップは「あとで」', !!Q('hwNo') && /いらない/.test(Q('hwNo').textContent) && Q('hwSkip').textContent === 'あとで');
  W.eval("hwSet('housing_cost', 30);");
  const t0 = W.eval('hwTotal(gHw.a)');
  Q('hwNo').click();
  c('受付：「いらない」で記録・住まいの質問を飛ばす', W.eval('gHw.a.skip.house') === 1 && W.eval("HW_Q[gHw.i].id") === 'food_style' && W.eval('hwTotal(gHw.a)') === t0 - 30);
  // 最後（いつまでに）の画面で自分の項目を足す
  W.eval("gHw.i = HW_Q.length - 1; hwRenderQ();");
  c('受付：最後の画面に「＋ 自分の項目を足す」', !!Q('hwExAdd'));
  Q('hwExAdd').click();
  Q('hwExT').value = '推し活'; Q('hwExV').value = '5'; Q('hwExM').value = '遠征も行く'; Q('hwExSave').click();
  c('受付：足した項目が答えに入り、合計にも入る', W.eval('gHw.a.extra.length') === 1 && W.eval('gHw.a.extra[0].t') === '推し活' && W.eval('hwTotal(gHw.a)') === t0 - 30 + 5);
  c('受付：足したあとは同じ質問の画面に戻る', !!Q('hwY') && /推し活/.test(W.document.getElementById('modalHost').textContent));
  W.eval('hwRenderSum();');
  const sumTxt = Q('modalHost').textContent;
  c('受付：確認の画面に「大事にしたいこと」★と「いらない：住まい」', /大事にしたいこと/.test(sumTxt) && /★/.test(sumTxt) && /推し活/.test(sumTxt) && /いらない：住まい/.test(sumTxt));
  W.document.querySelector('.hw-r[data-c="house"]').click();
  c('受付：いらないにした分野を押すと戻して質問へ', !W.eval('gHw.a.skip.house') && W.eval("HW_Q[gHw.i].id") === 'housing_type');
  W.eval("hwSetSkip('beauty', true); hwRenderSum();");
  Q('hwSend').click(); await sleep(20);
  const sent = W.eval('__sent');
  c('受付：提出に skip と extra が入る', sent && sent.ans.skip && sent.ans.skip.beauty === 1 && !sent.ans.skip.house && sent.ans.extra && sent.ans.extra[0].t === '推し活' && sent.ans.extra[0].v === 5);
  c('受付：提出の合計に自分の項目も入る', sent.total === W.eval('hwTotal(gHw.a)'));
  c('受付：答えのキーはルールの上限（40）以内', Object.keys(sent.ans).length <= 40);
  // 担当者の画面（hwSummaryHtml を編集なしで）
  const vw = W.eval('hwSummaryHtml(__sent.ans)');
  c('担当者の画面にも「大事にしたいこと」と「いらない」（足すボタンは出ない）', /大事にしたいこと/.test(vw) && /推し活/.test(vw) && /いらない：美容/.test(vw) && !/hwExAdd/.test(vw));
  c('受付 APP_VER v106・お知らせ', /var APP_VER = 'v1(0[6-9]|[1-9]\d)';/.test(H) && /\{ v: 'v106', d: '2026\/10\/27'/.test(H));
});
