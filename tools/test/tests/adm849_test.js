// v849：アカウント管理を見やすく（アカウント｜設定 のタブ・絞り込み・設定は1行ずつのメニュー）。名前はすべて架空
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  const pv = { ver: w.PRIVACY_VER, at: 'x' };
  const USERS = [
    { id: T.OWNER, name: '架空 オーナー', union: 'GRANT', privacy: pv },
    { id: 'a1', name: '架空 管理', union: 'GRANT', role: 'admin', status: 'active', privacy: pv },
    { id: 'b1', name: '見本 一', union: 'GRANT', status: 'active', early: true, privacy: pv },
    { id: 'b2', name: '見本 二', union: 'LIEN', status: 'active' },
    { id: 'b3', name: '見本 三', union: 'LIEN', status: 'active', privacy: pv },
    { id: 'p1', name: '待ち 四', union: 'GRANT', status: 'pending' }];
  w._adminUsersFetch = () => Promise.resolve(USERS.map(u => Object.assign({}, u)));
  w._admCkLoad = () => {}; w._accLoad = () => { w._accA = { mode: 'early', unions: [] }; w._accNames = ['未登録 さん']; };
  w._shAdmLoad = () => { w._shTop = { uids: ['b1'] }; w._shAud = [{ rel: 'down' }, { rel: 'unknown' }]; }; w._admCoreAllLoad = () => {};
  w._unionCfg = [{ name: 'GRANT', upbd: '架空BD' }, { name: 'LIEN', upbd: '' }];
  w._featCfg = { sheet2: { on: false, testers: ['b1'] } };
  w.currentUser = { uid: T.OWNER, name: '架空 オーナー', union: 'GRANT', area: '福岡' };
  w.openAdminPanel(); await sleep(40); w.renderAdminList(); // 読み込みのあとに描き直す（本物は読み込むと _accRe）
  const tabs = () => $$('#adminTabs .adm-tabs span').map(x => x.textContent);
  const chips = () => $$('#adminBody .adm-fl span').map(x => x.textContent);
  const rows = () => $$('#adminBody .adm-row').map(x => x.querySelector('.adm-name').textContent);

  // ① 開いた時はアカウントの一覧
  c('オーナー：アカウント｜設定 のタブ', tabs().length === 2 && /アカウント/.test(tabs()[0]) && /設定/.test(tabs()[1]) && $('#adminTabs .adm-tabs span.on').textContent === 'アカウント');
  c('検索のすぐ下が一覧（設定の箱は出さない）', !$('#adminBody .acc-box') && !$('#shAdmBox') && !$('#unAdmBox') && !$('#featAdmBox') && rows().length > 0);
  c('上は人数だけ', $('#adminCount').textContent === '6人');
  c('絞り込み：すべて・承認待ち・未同意・管理者・先行利用・使える人（人数つき）', chips().join('|') === 'すべて6|承認待ち1|未同意2|管理者2|先行利用1|使える人3');
  c('承認待ちがいる時は赤', $$('#adminBody .adm-fl span')[1].classList.contains('hot'));
  w.admF('pv'); await sleep(5);
  c('未同意で絞る（承認待ちの人もふくむ）', rows().length === 2 && rows().some(t => /見本 二/.test(t)) && rows().some(t => /待ち 四/.test(t)));
  w.admF('pend'); await sleep(5);
  c('承認待ちで絞る', rows().length === 1 && /待ち 四/.test(rows()[0]));
  w.admF('adm'); await sleep(5);
  c('管理者で絞る（オーナー・管理者）', rows().length === 2);
  w.admF('early'); await sleep(5);
  c('先行利用で絞る', rows().length === 1 && /見本 一/.test(rows()[0]));
  w.admF('ok'); await sleep(5);
  c('使える人で絞る（前の「使える人だけ表示」）', rows().length === 3 && !rows().some(t => /見本 二|見本 三/.test(t)));
  w.admF('all'); $('#adminSearch').value = 'LIEN'; w.renderAdminList(); await sleep(5);
  c('検索と絞り込みは一緒に使える（人数も検索の中で）', rows().length === 2 && chips()[0] === 'すべて2' && chips()[2] === '未同意1');
  $('#adminSearch').value = ''; w.renderAdminList();

  // ② 設定タブ：1項目1行
  c('気にした方がいいこと（UPBDが空）があれば設定タブに赤丸', !!$('#adminTabs .adm-tabs span i'));
  w.admTab('set'); await sleep(5);
  const mn = () => $$('#adminBody .adm-mn > div').map(x => x.textContent);
  c('設定：公開範囲・MAPの共有・ユニオンとUPBD・新機能のテスト', mn().length === 4 && /^公開範囲/.test(mn()[0]) && /^MAPの共有/.test(mn()[1]) && /^ユニオンとUPBD/.test(mn()[2]) && /^新機能のテスト/.test(mn()[3]));
  c('右に今の状態', /先行利用・使える人3人/.test(mn()[0]) && /登録待ちの名簿 1人/.test(mn()[0]) && /上の人1人・アップ以外2件/.test(mn()[1]) && /2ユニオン/.test(mn()[2]) && /UPBDが空 1/.test(mn()[2]) && /テスト中1件/.test(mn()[3]));
  c('設定の時は検索を隠す', $('#adminPanel .sd-search').style.display === 'none');
  w.admPg('acc'); await sleep(5);
  c('押すとその設定の画面（中身は前と同じ）', /‹ 設定/.test($('.adm-sph').textContent) && /公開範囲/.test($('.adm-sph').textContent) && $$('#adminBody .acc-seg span').length === 3 && /名簿を貼り付けて先行利用に/.test($('#adminBody').textContent));
  c('「使える人だけ表示」は絞り込みへ移した', !/使える人だけ表示/.test($('#adminBody').textContent));
  w.accSetMode('open'); await sleep(10);
  c('設定を変えても同じ画面のまま', /公開範囲/.test($('.adm-sph').textContent));
  w.admPg(''); await sleep(5);
  c('‹ 設定 で戻る', $$('#adminBody .adm-mn > div').length === 4);
  w.admPg('feat'); await sleep(5);
  c('新機能のテストも開ける', !!$('#featAdmBox'));
  w.admTab('acc'); await sleep(5);
  c('全国公開の時は「使える人」の絞り込みは出さない', !chips().some(t => /使える人/.test(t)) && $('#adminPanel .sd-search').style.display === '');
  w.admTab('set'); w.closeAdminPanel(); w.openAdminPanel(); await sleep(40);
  c('開き直すとアカウントの一覧から', $('#adminTabs .adm-tabs span.on').textContent === 'アカウント' && rows().length > 0);
  w._unionCfg = [{ name: 'GRANT', upbd: '架空BD' }, { name: 'LIEN', upbd: '架空BD2' }]; w.renderAdminList();
  c('気にすることがなければ赤丸なし', !$('#adminTabs .adm-tabs span i'));
  w.closeAdminPanel();

  // ③ オーナー以外（ユニオン管理者）：タブなし・公開範囲は1行
  w.currentUser = { uid: 'a1', name: '架空 管理', union: 'GRANT', role: 'admin', area: '福岡' };
  w._adminUsersFetch = () => Promise.resolve(USERS.filter(u => u.union === 'GRANT').map(u => Object.assign({}, u)));
  w._accLoad = () => { w._accA = { mode: 'early', unions: [] }; };
  w.openAdminPanel(); await sleep(40);
  c('管理者：タブは出さない', !$('#adminTabs .adm-tabs'));
  c('管理者：公開範囲は1行', /公開範囲：先行利用・使える人/.test($('#adminBody .adm-ln').textContent) && !$('#adminBody .acc-box'));
  w.admPg('acc'); await sleep(5);
  c('管理者：押すと貼り付け（切りかえは出さない）', /‹ アカウント/.test($('.adm-sph').textContent) && /名簿を貼り付けて先行利用に/.test($('#adminBody').textContent) && !$('#adminBody .acc-seg'));
  w.admPg(''); await sleep(5);
  c('管理者：戻ると一覧', rows().length > 0 && !!$('#adminBody .adm-fl'));
  w.admTab('set'); await sleep(5);
  c('管理者は設定タブを使えない', rows().length > 0 && !$('#adminBody .adm-mn'));
});
