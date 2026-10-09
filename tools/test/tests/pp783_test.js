// v783（#10）：「編集」はどこから開いても新しいメンバー画面。研修・活動・写真もこの画面の中で（今までの編集画面は出ない）。PCは右側のパネル
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  const today = w._ppYmd(0), fut = w._ppYmd(5);
  w.state.members = [{ id: 'r', lastName: '永尾', firstName: '歩夢', title: 'BR', parentId: '', mapType: 'both' },
    { id: 't', lastName: '別所', firstName: '星哉', title: 'DLR', parentId: 'r', mapType: 'both', trainee: true,
      traineeHistory: [{ status: 'PG', date: '2026-09-23', aSan: '小川拓郎', result: 'next' }, { status: 'DLR', date: '2026-09-23', aSan: '平井凛太郎', result: 'next' }, { status: 'PA', date: '2026-10-01', aSan: '', result: 'left' }] },
    { id: 'o', lastName: '大田', firstName: '翔', title: 'OUT', parentId: 'r', mapType: 'both', age: 27 }];
  w.state.events = [{ id: 'e1', title: 'PAのフォロー連絡', type: 'task', date: '2026-10-03', memberId: 't' }, { id: 'e2', title: 'ランチ', date: '2026-11-17', memberId: 't' }];
  w.switchView('current'); await sleep(30);
  const modal = w.document.getElementById('modal');
  const M = () => w.state.members.find(x => x.id === 't');

  // ① どこからの「編集」も新しい画面
  w.openEdit('t'); await sleep(20);
  c('「編集」で新しいメンバー画面が開く', !!$('#ppPg') && w._pp && w._pp.id === 't' && !modal.classList.contains('open'));
  const trTile = $('#ppPg [onclick="ppGo(\'tr\')"]'), actTile = $('#ppPg [onclick="ppGo(\'act\')"]');
  c('入口に「研修」「活動」（今までの画面へ飛ぶボタンは無い）', !!trTile && !!actTile && !$('#ppPg [onclick^="ppOld"]') && /2件/.test(actTile.textContent));

  // ② 研修
  trTile.click(); await sleep(20);
  c('研修の画面（この画面の中）', w._pp.pg === 'tr' && /研修/.test($('#ppPg .ux-crumb').textContent) && !modal.classList.contains('open') && !$('#ppPg #traineeStatusFields'));
  const st = s => $$('#ppPg .pptrg>div').find(d => d.querySelector('span').textContent === s);
  c('ステップの流れ：済み・流れた・次', st('PG').className === 'ok' && /9\/23/.test(st('PG').textContent) && st('PA').className === 'ng' && st('EXP').className === 'nx' && st('CO').className === '');
  c('記録は新しい順（PAが先頭）', $$('#ppPg .pprc').length === 3 && /PA/.test($$('#ppPg .pprc')[0].textContent) && /流れた/.test($$('#ppPg .pprc')[0].textContent));
  // 結果
  $$('#ppPg .ppseg span').find(x => /BC/.test(x.textContent)).click(); await sleep(20);
  c('研修結果を押すとすぐ保存（確定月も）', M().traineeResult === 'BC' && M().traineeResultMonth === w.state.currentMonth && !modal.classList.contains('open') && !w.document.body.classList.contains('pp-silent'));
  c('BCならタイトルを変える案内', /BC獲得/.test($('#ppPg').textContent));
  $$('#ppPg .ppseg span').find(x => /進行中/.test(x.textContent)).click(); await sleep(20);
  c('進行中に戻せる', M().traineeResult === '' && $$('#ppPg .ppseg span.on')[0].textContent.indexOf('進行中') >= 0);
  // 記録を足す
  st('EXP').click(); await sleep(10);
  c('ステップを押すと「記録を足す」（そのステップを選んだ状態）', !!$('#ppSh') && /記録を足す/.test($('#ppSh').textContent) && $('#ppSh .ppch span.on').textContent === 'EXP');
  c('Aさんの候補（最近のAさん）', $$('#ppSh .ppsug span').map(x => x.textContent).join(',') === '小川拓郎,平井凛太郎');
  $$('#ppSh .ppsug span')[1].click();
  $('#ppSh .ppbig').click(); await sleep(20);
  const ex = M().traineeHistory.find(h => h.status === 'EXP');
  c('追加：今日・Aさん・進んだ', !$('#ppSh') && ex && ex.date === today && ex.aSan === '平井凛太郎' && ex.result === 'next' && M().traineeStatus === 'EXP');
  c('画面にすぐ出る', st('EXP').className === 'ok' && st('PA').className === 'ng' && $$('#ppPg .pprc').length === 4);
  // 予定：日付を選ぶ → 先の日付なら「予定」
  $('#ppPg .ux-btm .ux-nx').click(); await sleep(10);
  c('下の「＋ 記録を足す」は次のステップから', $('#ppSh .ppch span.on').textContent === 'PA');
  w.ppShSet('step', '面談'); w.ppShDay('p'); await sleep(5);
  w.ppShDate(fut); await sleep(5);
  c('先の日付は「予定」になる', w._ppSh.res === 'planned' && $$('#ppSh .ppseg span.on')[0].textContent === '予定');
  $('#ppShA').value = '小川拓郎'; $('#ppSh .ppbig').click(); await sleep(20);
  const mt = M().traineeHistory.find(h => h.status === '面談');
  c('予定を追加（次の予定にも）', mt && mt.result === 'planned' && mt.date === fut && M().nextDate === fut && st('面談').className === 'pl');
  // フォロー
  const st0 = M().traineeStatus;
  w.ppTrSheet(''); w.ppShSet('step', '__fr'); await sleep(5);
  c('フォロー：内容の欄・「流れた」は無い', !!$('#ppShFr') && !$$('#ppSh .ppseg span').some(x => /流れた/.test(x.textContent)));
  $('#ppSh .ppbig').click(); await sleep(5);
  c('内容が空なら足さない', !!$('#ppSh') && !M().traineeHistory.some(h => h.ir));
  $('#ppShFr').value = '電話で状況確認'; $('#ppSh .ppbig').click(); await sleep(20);
  c('フォローの記録', M().traineeHistory.some(h => h.ir && h.status === '電話で状況確認') && M().traineeStatus === st0 && $$('#ppPg .pprc.fl').length === 1);
  // 予定の記録の操作（⋯）：進んだ
  const iM = M().traineeHistory.indexOf(mt);
  $$('#ppPg .pprc').find(x => /面談/.test(x.textContent)).click(); await sleep(10);
  c('記録を押すと操作（進んだ・流れた・リスケ・消す）', /進んだ/.test($('#ppSh').textContent) && /流れた/.test($('#ppSh').textContent) && /リスケ/.test($('#ppSh').textContent) && /消す/.test($('#ppSh').textContent));
  $$('#ppSh .ux-li')[0].click(); await sleep(20);
  c('予定→進んだ（タイトルも面談）', M().traineeHistory[iM].result === 'next' && M().title === '面談' && st('面談').className === 'ok' && !$('#ppSh'));
  // 消す → 元に戻す
  w.ppTrMenu(iM); await sleep(5);
  $$('#ppSh .ux-li').find(x => /消す/.test(x.textContent)).click(); await sleep(10);
  c('記録を消せる', !M().traineeHistory.some(h => h.status === '面談') && !$$('#ppPg .pprc').some(x => /面談/.test(x.textContent)));
  w._gmUndoFn(); await sleep(10);
  c('↩ 元に戻す', M().traineeHistory.some(h => h.status === '面談') && $$('#ppPg .pprc').some(x => /面談/.test(x.textContent)));
  // リスケは今までのシートで → 決めると描き直す
  const iP = M().traineeHistory.length; M().traineeHistory.push({ status: 'BPC', date: fut, aSan: '', result: 'planned' }); w._ppRender();
  w.ppTrRs(iP); await sleep(10);
  c('リスケのシート', !!w.document.getElementById('stepRsOv'));
  w.document.getElementById('_rsDate').value = w._ppYmd(9); w.stepReschedDo(iP, false); await sleep(400);
  c('リスケすると画面も新しい日付に', M().traineeHistory[iP].rs === 1 && st('BPC').className === 'pl' && new RegExp(w._ppMD(w._ppYmd(9))).test(st('BPC').textContent));
  w.ppGo(''); await sleep(10);
  c('戻ると入口', w._pp.pg === '' && !!$('#ppPg .pptl'));

  // ③ 活動
  w.ppGo('act'); await sleep(10);
  c('活動の画面：OL・タスク・企画書を足す', w._pp.pg === 'act' && $$('#ppPg .ppadd3 span').length === 3 && /OL/.test($('#ppPg .ppadd3').textContent));
  c('月ごとに並ぶ（新しい順）', $$('#ppPg .ppmh').map(x => x.textContent).join(',') === '11月,10月' && $$('#ppPg .ppa').length >= 3);
  c('研修の予定も出る（押すと研修へ）', $$('#ppPg .ppa').some(x => /BPC の予定/.test(x.textContent)));
  $$('#ppPg .ppfil span').find(x => /タスク/.test(x.textContent)).click(); await sleep(10);
  c('タスクだけに絞れる', $$('#ppPg .ppa').length === 1 && /PAのフォロー連絡/.test($('#ppPg .ppa').textContent));
  $('#ppPg .ppa .ic>span').click(); await sleep(10);
  c('タスクを済みにできる', w.state.events[0].done === true && $('#ppPg .ppa').classList.contains('dn'));
  w._meActF.t = 'all';

  // ④ 写真
  w.ppGo('photo'); await sleep(10);
  c('写真の画面：選ぶ・撮る', w._pp.pg === 'photo' && /写真を選ぶ/.test($('#ppPg').textContent) && /撮る/.test($('#ppPg').textContent) && !!$('#ppPhC[capture]'));
  w._avatars.t = 'data:image/png;base64,AAAA'; w._ppRender();
  c('写真があれば 位置を直す・消す', /位置・大きさを直す/.test($('#ppPg').textContent) && /写真を消す/.test($('#ppPg').textContent));
  w.ppPhDel(); await sleep(20);
  c('写真を消せる（元に戻すつき）', !w._avatars.t && /選ぶ/.test($('#ppPg').textContent));
  w._gmUndoFn(); await sleep(20);
  c('写真を元に戻す', w._avatars.t === 'data:image/png;base64,AAAA');
  w.ppGo(''); await sleep(5);
  c('入口の顔写真を押すと写真へ', /ppGo\('photo'\)/.test($('#ppPg .pph .av').getAttribute('onclick')));

  // ⑤ プロフィール：年齢・OUTの後の表示
  w.ppOpen('o', 'current'); w.ppGo('prof'); await sleep(10);
  c('誕生日が無い人は年齢を入れられる', !!$('#ppAge') && $('#ppAge').value === '27');
  w.ppAge('31'); await sleep(10);
  const O = () => w.state.members.find(x => x.id === 'o');
  c('年齢を保存', String(O().age) === '31' && !O().birthYear);
  w.ppGo('title'); await sleep(10);
  c('OUTの人は「OUTの後の表示」', /OUTの後の表示/.test($('#ppPg').textContent));
  w.ppOutVis(1); await sleep(10);
  c('非表示を保存', O().outHidden === true && O().title === 'OUT');
  w.ppClose(); await sleep(10);
  c('閉じると消える', !$('#ppPg') && !modal.classList.contains('open'));

  // ⑥ 研修の「記録」ボタン・PC
  w.ckRecord('t', 'trainee'); await sleep(20);
  c('研修の記録ボタンは新しい画面の研修へ', !!$('#ppPg') && w._pp.pg === 'tr' && !modal.classList.contains('open'));
  w.ppClose();
  setWH(1440, 900); w._uxSync && w._uxSync();
  w.openEdit('t'); await sleep(20);
  c('PCも新しい画面（今までの右の編集パネルは出ない）', w.isPCMode() && !!$('#ppPg') && !modal.classList.contains('open'));
  c('PCは右側のパネルにするCSS', /@media\(min-width:768px\) and \(min-height:501px\)\{#ppPg,#naPg\{left:auto!important;right:0;width:440px/.test(w.document.getElementById('ppCss').textContent));
  w.ppGo('tr'); await sleep(5);
  w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape' })); await sleep(5);
  c('Escで入口へ', w._pp && w._pp.pg === '');
  w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape' })); await sleep(5);
  c('もう一度Escで閉じる', !w._pp && !$('#ppPg'));
});
