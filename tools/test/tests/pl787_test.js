// v787：計画シートの印刷（下が切れない・2枚）・行動の期日「日付だけ」・理想の答え直しは下に小さく・下の「やりたいこと／完了」をなくす・夢100のURLを開ける
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'G', parentId: '', mapType: 'both' }];
  const ym = w._p2Ym(0), cat = w.P2_SH_CAT[0].k;
  const e = w._tdMakeTask('藤原TEL', '', ''); e.planYm = ym; e.planCat = cat; w.state.events.push(e);
  w.switchView('plan'); w.p2Go('sheet'); await sleep(40);
  c('計画シートの下に「✓ 完了」は出さない', !$('.ux-btm .ux-nx'));
  // 日付だけ
  w.p2ShDt(e.id); await sleep(10);
  c('期日の窓は3択（ToDo／予定／日付だけ）', $$('#p2ShDtOv .seg.s3 span').length === 3 && /日付だけ/.test($('#p2ShDtOv').textContent));
  w.p2ShDtKind('only'); await sleep(5);
  c('日付だけ：時間は出さない・説明', !$('#p2ShDtT') && /この計画シートにだけ出ます/.test($('#p2ShDtOv').textContent));
  $('#p2ShDtD').value = '2026-10-20'; w.p2ShDtOk(); await sleep(20);
  c('日付だけ：ToDo・カレンダーの日付（date）は空・計画シートの期日（shD）', e.date === '' && e.shD === '2026-10-20' && e.type === 'task');
  const row = $$('.sp-at .r').find(r => r.querySelector('input') && r.querySelector('input').value === '藤原TEL');
  c('計画シートには 10/20（ToDo・予定の札なし）', !!row && /10\/20/.test(row.querySelector('.d').textContent) && !/ToDo|予定/.test(row.querySelector('.d').textContent));
  c('ToDoには出ない（その日のToDoに入らない）', !(w.state.events || []).some(x => x.type === 'task' && x.date === '2026-10-20'));
  w.p2ShDt(e.id); await sleep(5);
  c('開き直すと「日付だけ」が選ばれている', /on/.test($$('#p2ShDtOv .seg span')[2].className) && $('#p2ShDtD').value === '2026-10-20');
  w.p2ShDtKind('todo'); $('#p2ShDtD').value = '2026-10-21'; w.p2ShDtOk(); await sleep(10);
  c('ToDoに変えると date に入る（shD は消す）', e.date === '2026-10-21' && !e.shD);
  // 印刷
  const h1 = w._p2ShPrintHtml(ym), h2 = w._p2ShPrintHtml(ym, { two: true });
  c('1枚：表は残りの高さの箱の中（下が切れない）', /class="kpw"><table class="kp"/.test(h1) && /class="aw"><table>/.test(h1) && (h1.match(/class="pg"/g) || []).length === 1);
  c('2枚：1枚目はMAPだけ・2枚目は数字と改善点・行動', (h2.match(/class="pg/g) || []).length === 2 && /class="pg one"/.test(h2) && h2.indexOf('＜現状MAP＞') < h2.indexOf('2 / 2') && h2.indexOf('class="kp"') > h2.indexOf('2 / 2'));
  c('2枚の1枚だけ（PDF用）', (w._p2ShPrintHtml(ym, { two: true, only: 1 }).match(/class="pg/g) || []).length === 1 && !/＜現状MAP＞/.test(w._p2ShPrintHtml(ym, { two: true, only: 1 })));
  w.p2ShPrint(); await sleep(20);
  c('プレビューに 1枚／2枚 と PDF', !!$('#p2ShPv .pv-seg') && /1枚/.test($('#p2ShPv .pv-seg').textContent) && /2枚/.test($('#p2ShPv .pv-seg').textContent) && !!$('#p2ShPvPdf'));
  w.p2ShPvTwo(1); await sleep(20);
  c('2枚にするとプレビューも2枚の高さ', w._p2ShPvN === 2 && parseInt($('#p2ShPvF').style.height, 10) === w.P2_PV_H * 2 && w.localStorage.getItem('gm_shPr2') === '1');
  w.p2ShPvTwo(0); w.p2ShPvX(); w.localStorage.removeItem('gm_shPr2');
  // 理想：答え直すは下に小さく・下の「やりたいこと ›」はなし
  const g = w._p2G(); g.ans.housing_cost = 20; g.ans.food_cost = 10; g.p1 = true; g.ans.want_do = ['好きな時に好きな場所へ']; g.ans.want_be = ['感謝される自分'];
  w.p2Go('ideal', 0); await sleep(40);
  c('理想：下の「やりたいこと ›」はない', !$('.ux-btm .ux-nx') && /戻る/.test($('.ux-btm .ux-bk').textContent));
  const txt = $('.p2id').textContent;
  c('理想：理想の生活 → やりたいこと → 答え直す（いちばん下に小さく）', txt.indexOf('あなたの理想の生活') < txt.indexOf('やりたいこと・なりたい自分') && txt.indexOf('やりたいこと・なりたい自分') < txt.indexOf('理想の生活を答え直す') && !!$('.p2id-redo') && !$('#p2GwWrap .ux-acts span[onclick="p2IdealRedo()"]'));
  // 夢100
  w._p2().dreams = [{ id: 'd1', cat: 'do', t: 'ルート66走破', amt: 200, dl: '2027-09', url: 'https://jp.hotels.com/go/usa/route-66', done: false }, { id: 'd2', cat: 'want', t: 'ドメインだけ', url: 'example.com/x', done: false }, { id: 'd3', cat: 'want', t: '変なURL', url: 'javascript:alert(1)', done: false }];
  w.p2Go('dream'); await sleep(30);
  const a = $$('.ux-sk .dr-go');
  c('夢100：URLを入れた夢は「開く」で新しいタブ', a.length === 2 && a[0].getAttribute('href') === 'https://jp.hotels.com/go/usa/route-66' && a[0].getAttribute('target') === '_blank');
  c('ドメインだけは https:// を付ける・http(s)以外は出さない', a[1].getAttribute('href') === 'https://example.com/x' && !$$('.ux-sk .dr-go').some(x => /javascript/.test(x.getAttribute('href'))));
});
