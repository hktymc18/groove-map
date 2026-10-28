// v836：今月の目標（月の目標）の画面へ、赤い帯・HOMEのPLAN・PLANの入口・PCのタブから直接行ける（前はPLANの入口が開くだけで行き方がなかった）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  w.state.members = [{ id: 'r', lastName: '架空', firstName: '太郎', title: 'G', parentId: '', mapType: 'both' }];
  const m = w._p2M(w._p2Ym(0)); m.declared = false; m.s = '';
  w._p2WhyDone = () => true; w.state.goals.plan.title = 'BR'; w.state.goals.plan.deadline = '2027-12';
  c('今月の目標がまだの時', w._p2NextKey() === 'mon');
  const onMon = () => w.currentView === 'plan' && w._p2Pg === 'mon';
  // 赤い帯
  w.switchView('menu'); await sleep(10);
  w._p2Boot && w._p2Boot(); const b = $('#p2Banner'); b.onclick(); await sleep(20);
  c('赤い帯を押すと「◯月の目標」の画面', onMon());
  // HOMEのPLAN
  w.state.goals.plan.title = 'BR'; w.state.goals.plan.deadline = '2027-12';
  w.switchView('menu'); await sleep(20);
  const tile = $$('#view-menu .ux-t').find(x => /PLAN/.test(x.textContent));
  c('HOMEのPLANは p2OpenHome', /p2OpenHome\(\)/.test(tile.getAttribute('onclick')));
  tile.click(); await sleep(20);
  c('HOMEのPLANを押すと「◯月の目標」の画面', onMon());
  // PLANの入口
  w.p2Go(''); await sleep(20);
  const row = $$('#view-plan .ux-li.p2-monx')[0];
  c('PLANの入口のいちばん上に「◯月の目標 決める ›」（赤い枠）', row && /月の目標/.test(row.textContent) && /決める/.test(row.textContent));
  row.click(); await sleep(20);
  c('押すと「◯月の目標」の画面', onMon());
  // 設定したら
  m.s = 5; w.p2Declare(w._p2Ym(0)); await sleep(20);
  w.switchView('menu'); await sleep(10);
  $$('#view-menu .ux-t').find(x => /PLAN/.test(x.textContent)).click(); await sleep(20);
  c('設定ずみならHOMEのPLANはいつもの入口', w.currentView === 'plan' && w._p2Pg !== 'mon');
  w.p2Go(''); await sleep(20);
  c('設定ずみなら入口の行は目立たせない（なおす ›）', !$('#view-plan .ux-li.p2-monx') && /なおす/.test($('#view-plan').textContent));
  // PC：タブ
  const src = require('fs').readFileSync(require('path').join(__dirname, '../../../app.js'), 'utf8');
  c('PCのPLANのタブに「◯月の目標」・ほかのタブも全部ある', /\(_p2Sh2\(\) \? '' : tab\('mon', parseInt\(ym\.slice\(5\), 10\) \+ '月の目標'\)\) \+ tab\('ideal', '理想'\) \+ tab\('dream', '夢100'\) \+ tab\('sim', 'シミュレーション'\) \+ tab\('ck', 'チェック'\)/.test(src) && !/goal: 'tool', mon: 'tool'/.test(src));
});
