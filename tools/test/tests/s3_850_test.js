// v850：スマホの計画シートを1画面に（新機能のテスト sheet2）。目標・MAP・行動・振り返りの4タブ、押すと下から。名前はすべて架空
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login();
  w.state.members = [{ id: 'r', lastName: '架空', firstName: '一郎', title: 'BR', parentId: '', mapType: 'both', ptCurrent: 3000, activity: 'S' },
    { id: 'a', lastName: '見本', firstName: '一', title: 'B2', parentId: 'r', mapType: 'both', activity: 'S', actRate: 100 },
    { id: 'b', lastName: '見本', firstName: '二', title: 'B1', parentId: 'r', mapType: 'both', activity: 'A' }];
  const ym = w._p2Ym(0), pv = w._p2YmAdd(ym, -1);
  setWH(390, 844); w._uxSync && w._uxSync(); w.switchView('plan');
  // ① スイッチなし・PC・サマリーの時は前のまま
  w._featCfg = {}; w.p2Go('sheet'); await sleep(40);
  c('スイッチなし：前の計画シート', !$('#p2S3'));
  w._featCfg = { sheet2: { on: false, testers: [w.currentUser.uid] } };
  w.renderPlan(); await sleep(40);
  c('先に見られる人：1画面の計画シート', !!$('#p2S3') && !$('.sp-kr') && !$('.sp-at'));
  c('4つのタブ（目標・MAP・行動・振り返り）・開いた時は目標', $$('.s3-tb span').map(x => x.textContent.trim()).join('|') === '目標|MAP|行動|振り返り' && $('.s3-tb span.on').textContent === '目標');
  c('下の●も4つ', $$('.ux-btm .ux-dots span').length === 4 && $$('.ux-btm .ux-dots span')[0].classList.contains('on'));
  c('「テスト中」の印', /テスト中/.test($('.s3-hr').textContent));

  // ② 目標
  const m = w._p2M(ym); m.comm = 20; m.s = 5; m.teamPg = 4;
  const M = w._p2ShM(ym); M.kpi.pg = 4; M.man.pg = 2; M.kpi.ct = 10; M.man.ct = 10;
  w.p2RmCell('front', ym, '2'); await sleep(40);
  const rows = () => $$('#p2S3P .s3-sc .s3-lr').map(r => r.querySelector('.n').textContent);
  c('上の行：年の目標の帯・達成度のカード・月収とフロント', !!$('.s3-band') && !!$('.s3-cd') && /月収/.test($('.s3-top').textContent) && /フロント/.test($('.s3-top').textContent));
  c('達成度＝目標を入れた項目の平均（100%まで）', /\d+%/.test($('.s3-cd').textContent) && $$('.s3-cd .st i').length === 5);
  c('自分自身｜チーム の切りかえ（BR以上）', $$('.s3-sw span').length === 2 && /自分自身/.test($('.s3-sw span.on').textContent));
  c('自分自身：フロントは上に出すので一覧には入れない・ユーザーPTはある', !rows().some(t => /フロント/.test(t)) && rows().some(t => /ユーザーPT/.test(t)) && rows().some(t => t === 'マケPG'));
  const pgRow = () => $$('#p2S3P .s3-sc .s3-lr').find(r => r.querySelector('.n').textContent === 'マケPG');
  c('目標 ▶ 今 と色（届いていない＝オレンジ）', pgRow().querySelector('.t').textContent === '4' && pgRow().querySelector('.v').textContent === '2' && pgRow().querySelector('.v').classList.contains('lo'));
  w.p2S3Sw('team'); await sleep(30);
  c('チーム：S稼働・チームB1・平均稼働・チームPG…', rows()[0] === 'S稼働' && rows().includes('チームB1') && rows().includes('平均稼働') && rows().includes('チームPG'));
  c('MAPから自動の数字は薄く', $$('#p2S3P .s3-sc .s3-lr')[0].querySelector('.v').classList.contains('dim'));
  w.p2S3Sw('self'); await sleep(30);
  // 押すと下から − ＋
  pgRow().click(); await sleep(40);
  c('行を押すと下から 目標と今の − ＋', !!$('.s3-sh') && /マケPG/.test($('.s3-sh h3').textContent) && $$('.s3-sh .s3-pm i').length === 2 && !!$('.s3-sh .sp-st'));
  $$('.s3-sh .s3-pm i')[1].click(); await sleep(40);
  c('目標の＋', w._p2ShM(ym).kpi.pg === 5 && !!$('.s3-sh'));
  $('.s3-sh .sp-st i:last-child').click(); await sleep(10);
  c('今の＋', w._p2ShM(ym).man.pg === 3);
  c('記録に残す（予定・ToDoに入れる）', /予定に入れる/.test($('.s3-sh').textContent));
  w.p2S3Sheet(''); await sleep(30);
  c('閉じると一覧も新しい数字', !$('.s3-sh') && pgRow().querySelector('.t').textContent === '5' && pgRow().querySelector('.v').textContent === '3');
  w.p2S3Sheet('kp:comm'); await sleep(30);
  c('月収：目標は − ＋（5万ずつ）・今はMAPから見込み', /月収/.test($('.s3-sh h3').textContent) && /MAPから見込み/.test($('.s3-sh').textContent));
  $$('.s3-sh .s3-pm i')[1].click(); await sleep(30);
  c('月収の目標が＋5万', w._p2M(ym).comm === 25);
  w.p2S3Sw('team'); w.p2S3Sheet('kp:s'); await sleep(30);
  c('S稼働：めやす・今はMAPから自動（− ＋ なし）', /めやす/.test($('.s3-sh').textContent) && /MAPから自動/.test($('.s3-sh').textContent) && !$('.s3-sh .sp-st'));
  w.p2S3Sheet(''); w.p2S3Sw('self');

  // ③ MAP
  w.p2S3Tab(1); await sleep(60);
  c('MAP：いつものモバイルのMAPの行（ツリー）', !!$('#p2S3P #p2ShMI .mr') && /架空/.test($('#p2S3P').textContent) && $$('.ux-btm .ux-dots span')[1].classList.contains('on'));
  c('MAP：上は 現状｜理想・MAPを開く', /現状/.test($('.s3-mh').textContent) && /MAPを開く/.test($('.s3-mh').textContent));
  w.p2ShIssTap('a'); await sleep(60);
  c('人を押すと下からその人の課題', !!$('.s3-sh') && /見本/.test($('.s3-sh h3').textContent) && !!$('.s3-sh #p2ShIssIn'));
  w.p2ShIssSave('a', 'DLRの前日にPGができていない'); w.p2S3Sheet(''); await sleep(60);
  c('課題のある人には印・数', !!$('#p2ShMI .mr.iss-on') && /課題1人/.test($('.s3-mh').textContent.replace(/\s/g, '')));
  w.p2S3Sheet('iss'); await sleep(30);
  c('「課題・メモ」で一覧と自分・全体のメモ', /DLRの前日/.test($('.s3-sh').textContent) && !!$('.s3-sh .iss-fi'));
  w.p2S3Sheet('');

  // ④ 行動
  w.p2S3Tab(2); await sleep(40);
  c('行動：4分野の切りかえ', $$('.s3-chips span').length === 4 && /フロント作り/.test($('.s3-chips span.on').textContent));
  const inp = $('#p2ShIn_front'); inp.value = 'リストアップ書き直し';
  inp.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter' })); await sleep(40);
  const acts = () => w.state.events.filter(e => e.planCat === 'front' && e.planYm === ym && !e.deleted);
  c('下の欄に書いて Enter で行動に', acts().length === 1 && acts()[0].title === 'リストアップ書き直し' && $$('#p2S3P .s3-ar').length === 1);
  $('#p2S3P .s3-ar .ck').click(); await sleep(40);
  c('✓でやった', acts()[0].done === true && $('#p2S3P .s3-ar').classList.contains('dn'));
  w.p2S3Sheet('ex:front'); await sleep(30);
  c('例を見る：読むだけ（押しても足さない・ボタンなし）', $$('.s3-sh .s3-ex').length >= 3 && !$$('.s3-sh .s3-ex').some(x => x.getAttribute('onclick')) && !/足す|使う/.test($$('.s3-sh .s3-ex').map(x => x.textContent).join('')));
  $$('.s3-sh .s3-ex')[1].click(); await sleep(10);
  c('例を押しても行動は増えない', acts().length === 1);
  w.p2S3Sheet('');
  w.p2S3Cat('dist'); await sleep(30);
  c('分野を切りかえ', /流通/.test($('.s3-chips span.on').textContent) && !!$('#p2ShIn_dist'));

  // ⑤ 振り返り
  const P = w._p2ShM(pv); P.kpi.ur = 4; P.man.ur = 1; P.kpi.ct = 10; P.man.ct = 12;
  w.p2S3Tab(3); await sleep(40);
  const rv = () => $$('#p2S3P .s3-rv').map(r => r.querySelector('.n').textContent);
  c('振り返り：先月の 目標 ▶ 結果・届かなかった順', rv()[0] === 'UR動員' && rv().indexOf('CT') > 0 && /の振り返り/.test($('.s3-ttl').textContent));
  c('届かなかった所は「＋ 改善点を書く」・達成は✓', /改善点を書く/.test($$('#p2S3P .s3-rv')[0].textContent) && !!$$('#p2S3P .s3-rv').find(r => /CT/.test(r.textContent)).querySelector('.s3-stp'));
  c('改善点がまだの時はタブに赤い点', !!$$('.s3-tb span')[3].querySelector('i'));
  $$('#p2S3P .s3-rv')[0].click(); await sleep(40);
  c('改善点を書く画面：例は読むだけ', !!$('#p2S3Kz') && /例/.test($('.s3-sh').textContent) && !/使う/.test($('.s3-sh').textContent));
  $('#p2S3Kz').value = 'AさんにURのTupを頼む'; $('.s3-sh .s3-go').click(); await sleep(40);
  c('保存すると今月の改善点に入る（前の画面と同じ場所）', w._p2ShM(ym).kz.ur === 'AさんにURのTupを頼む' && !$('.s3-sh') && /AさんにURのTupを頼む/.test($('#p2S3P').textContent) && !$$('.s3-tb span')[3].querySelector('i'));

  // ⑥ …メニュー・めくる・開き直し
  w.p2S3Sheet('menu'); await sleep(30);
  c('…：PDF・印刷・サマリー・数字の項目を変える', ['PDF', '印刷', 'サマリーを見る', '数字の項目を変える'].every(t => $('.s3-sh').textContent.indexOf(t) >= 0));
  w.p2S3Sheet('ked'); await sleep(30);
  c('数字の項目を変える', !!$('.s3-sh .sh-ke'));
  w.p2S3Sheet('');
  w.p2S3Tab(1); w.p2Go(''); await sleep(30); w.p2Go('sheet'); await sleep(40);
  c('計画シートを開き直すと目標から', $('.s3-tb span.on').textContent === '目標');
  // v853: サマリー＝今月の成績表1枚
  w.p2S3Sheet('menu'); await sleep(20); $$('.s3-sh .s3-mn > div').find(x => /サマリー/.test(x.textContent)).click(); await sleep(40);
  const sm = () => ($('#p2S3P') || {}).textContent || '';
  c('…→サマリー：成績表1枚（カード・名前・タイトル）', !!$('#p2S3.s3 .s3s-top') && /架空 一郎/.test(sm()) && /BR/.test($('.s3s-in .tg').textContent) && !!$('.s3s-top .s3-cd'));
  c('サマリー：タブと下の●は出さない・編集に戻る', !$('.s3-tb') && !$$('.ux-btm .ux-dots span').length && /編集に戻る/.test($('.s3-hr').textContent));
  c('サマリー：自分自身・チーム・行動の段（目標がある項目だけ）', $$('.s3s-h b').map(x => x.textContent).join('|') === '自分自身の目標|チームの目標|行動' && /マケPG/.test(sm()) && !/FT/.test($$('.s3s-g')[0].textContent));
  c('サマリー：課題・改善点・期日すぎの件数', /課題1人/.test($('.s3s-ft').textContent.replace(/\s/g, '')) && /改善点1件/.test($('.s3s-ft').textContent.replace(/\s/g, '')));
  c('サマリー：書く欄はない（見るだけ）', !$('#p2S3P input') && !$('#p2S3P textarea'));
  $$('.s3s-sec')[2].click(); await sleep(40);
  c('段を押すとその編集のタブ（行動）', !$('.s3s-top') && $('.s3-tb span.on').textContent === '行動');
  w.p2S3Sum(1); await sleep(30); w.p2S3Sum(0); await sleep(30);
  c('✕ 編集に戻る', !!$('.s3-tb'));
  w.p2S3Sum(1); w.p2Go(''); await sleep(20); w.p2Go('sheet'); await sleep(40);
  c('開き直すと編集（目標）から', !!$('.s3-tb') && $('.s3-tb span.on').textContent === '目標');
  // PCは今のまま
  setWH(1440, 900); w._uxSync && w._uxSync(); w.renderPlan(); await sleep(60);
  c('PCは今のまま（表）', !$('#p2S3') && $$('.sp-tb').length >= 1);
  setWH(390, 844); w._uxSync && w._uxSync();
  // 見るだけの時
  w.viewingOwnerUid = 'other'; w.state.isEditor = false; w.renderPlan(); await sleep(40);
  c('見るだけの時：書く欄なし', !!$('#p2S3') && !$('.s3-add'));
});
