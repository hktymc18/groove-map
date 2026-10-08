// v755：使い方ガイド（①はじめての案内 ②はじめのステップ ③スポットライト ④使い方ガイド）。見たら出ない・管理者は管理者の説明も
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.localStorage.removeItem('gm_guide'); w.currentUser.guide = null;
  let saved = null; const fs0 = w.fsSet; w.fsSet = (p, d) => { if (/^users\//.test(p) && d.guide) saved = d.guide; return Promise.resolve(); };
  w.state.members = [{ id: 'r', lastName: '山内', firstName: '北斗', title: 'G', parentId: '', mapType: 'both' }];
  // ① はじめての案内
  c('起動時：まだ見ていなければ案内が出る', w._gdAuto() === true && !!$('#gdIntro'));
  const nAdm = w._gdSlides().length;
  w.currentUser.role = 'member'; w.currentUser.uid = 'someone';
  c('管理者には「管理者の方へ」のスライドが1枚多い', w._gdSlides().length === nAdm - 1 && w._gdSlides().every(s => !s.adm));
  w.currentUser.uid = T.OWNER;
  w.gdIntroGo(1); await sleep(5); c('次へで2枚目（MAP）', /MAP/.test($('#gdIntro h2').textContent));
  w.gdIntroEnd(); await sleep(5);
  c('終わると「見た」（端末とアカウント）', !$('#gdIntro') && w._gdSt().intro === 1 && saved && saved.intro === 1);
  c('2回目は出ない', w._gdAuto() === false && !$('#gdIntro'));
  // ② はじめのステップ
  w.switchView('menu'); await sleep(20);
  c('HOMEに「はじめのステップ」（管理者は7つ）', !!$('.gds') && /はじめの7ステップ/.test($('.gds').textContent) && /1 \/ 7/.test($('.gds').textContent));
  w.state.members.push({ id: 'a', lastName: '佐藤', firstName: '花', title: 'B1', parentId: 'r', mapType: 'both' }); w.renderMenuHub(); await sleep(5);
  c('データを見て自動でチェック（フロント追加）', /2 \/ 7/.test($('.gds').textContent));
  w.gdStepsHide(); await sleep(5);
  c('閉じると出ない', !$('.gds') && w._gdSt().stepsHide === 1);
  // ③ スポットライト
  w.switchView('current'); await sleep(30);
  const gb = w.Element.prototype.getBoundingClientRect; w.Element.prototype.getBoundingClientRect = function() { return { left: 10, top: 100, width: 120, height: 40, right: 130, bottom: 140 }; }; // jsdomは大きさが0なので
  w.gdTour('map', true); await sleep(80);
  c('MAPのスポットライト（説明の吹き出し・何ステップか）', !!$('#gdSpot .bub') && /1 \//.test($('#gdSpot .bub .n').textContent) && w._gdSt().tour.map === 1);
  w.gdTourGo(1); await sleep(80); c('次へで2つ目', /2 \//.test($('#gdSpot .bub .n').textContent));
  w.gdTourX(); c('スキップで閉じる', !$('#gdSpot')); w.Element.prototype.getBoundingClientRect = gb;
  // ④ 使い方ガイド
  w.gdMenu(); await sleep(5);
  c('使い方：案内・ステップ・画面ごと・管理者・よくある質問', !!$('#gdMenuOv') && /はじめての案内をもう一度/.test($('#gdMenuOv').textContent) && $$('#gdMenuOv details').length >= 6 && /管理者向け/.test($('#gdMenuOv').textContent) && /✓ 見た/.test($('#gdMenuOv').textContent));
  w.gdStepsShow(); await sleep(20);
  c('「はじめのステップを表示」でHOMEにまた出る', !$('#gdMenuOv') && !!$('.gds'));
  w.currentUser.role = 'member'; w.currentUser.uid = 'someone'; w.gdMenu(); await sleep(5);
  c('一般メンバーには管理者向けを出さない', !/管理者向け/.test($('#gdMenuOv').textContent)); w.gdMenuX();
  w.fsSet = fs0;
});
