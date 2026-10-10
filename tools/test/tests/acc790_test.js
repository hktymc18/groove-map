// v790：先行利用（公開範囲：先行利用 → ユニオン単位 → 全国公開）。名前はすべて架空
const T = require('../lib/head.js')();
const { w, c, sleep, $, $$ } = T;
T.run(async () => {
  T.login();
  const docs = { 'appAccess/mode': { mode: 'early', unions: [] }, 'appAccess/names': { names: [] } }, writes = [];
  let fail = false;
  const d0 = T.dbStub.doc;
  w.db = Object.assign({}, T.dbStub, {
    doc(path) {
      const r = d0(path);
      r.get = () => fail ? Promise.reject(new Error('offline')) : Promise.resolve({ exists: !!docs[path], data: () => JSON.parse(JSON.stringify(docs[path] || {})) });
      r.set = (d, o) => { writes.push([path, d]); docs[path] = Object.assign({}, (o && o.merge) ? docs[path] : {}, d); return Promise.resolve(); };
      return r;
    },
  });
  w.fsSet = (p, d) => { writes.push([p, d]); return Promise.resolve(); };
  const pv = { ver: w.PRIVACY_VER, at: 'x' }, gate = () => $('#approvalGate');
  w.localStorage.clear();
  // ① ログイン
  w.loginSuccess({ uid: 'u1', name: '架空 一郎', union: 'GRANT', status: 'active', privacy: pv }); await sleep(30);
  c('先行利用の時、先行利用でない人は「順番にご案内しています」', !!gate() && /順番にご案内しています/.test(gate().textContent) && /所属ユニオンのリーダー/.test(gate().textContent));
  w.closeApprovalGate();
  w.loginSuccess({ uid: 'u1', name: '架空 一郎', union: 'GRANT', status: 'active', privacy: pv }); 
  c('次に開いた時は、読み込みを待たずにすぐ止める', !!gate()); await sleep(30); w.closeApprovalGate();
  w.loginSuccess({ uid: 'u2', name: '架空 二郎', union: 'GRANT', status: 'active', privacy: pv, early: true }); await sleep(30);
  c('先行利用の人は使える', !gate());
  w.loginSuccess({ uid: 'u3', name: '架空 三郎', union: 'GRANT', status: 'active', privacy: pv, role: 'admin' }); await sleep(30);
  c('管理者は使える', !gate());
  w.loginSuccess({ uid: T.OWNER, name: 'オーナー', privacy: pv }); await sleep(30);
  c('オーナーは使える', !gate());
  docs['appAccess/mode'] = { mode: 'union', unions: ['LIEN'] }; w.localStorage.removeItem('gm_acc');
  w.loginSuccess({ uid: 'u4', name: '架空 四郎', union: 'LIEN', status: 'active', privacy: pv }); await sleep(30);
  c('ユニオン単位：選んだユニオンの人は使える', !gate());
  w.loginSuccess({ uid: 'u5', name: '架空 五郎', union: 'GRANT', status: 'active', privacy: pv }); await sleep(30);
  c('ユニオン単位：ほかのユニオンの人はまだ', !!gate()); w.closeApprovalGate();
  docs['appAccess/mode'] = { mode: 'open' };
  w.loginSuccess({ uid: 'u5', name: '架空 五郎', union: 'GRANT', status: 'active', privacy: pv }); await sleep(30);
  c('止まっていた人も、全国公開にすると入れる（裏で読み直してゲートを閉じる）', !gate());
  w.localStorage.removeItem('gm_acc'); fail = true; docs['appAccess/mode'] = { mode: 'early' };
  w.loginSuccess({ uid: 'u6', name: '架空 六郎', union: 'GRANT', status: 'active', privacy: pv }); await sleep(30);
  c('設定を読めない時（オフライン等）は止めない', !gate()); fail = false;
  delete docs['appAccess/mode']; w.localStorage.removeItem('gm_acc');
  w.loginSuccess({ uid: 'u6', name: '架空 六郎', union: 'GRANT', status: 'active', privacy: pv }); await sleep(30);
  c('設定が無い時は今までどおり（全国公開）', !gate());
  w.currentUser = { uid: T.OWNER, name: '山内北斗', area: '福岡', union: 'GRANT' };

  // ② アカウント管理（オーナー）
  docs['appAccess/mode'] = { mode: 'open', unions: [] }; docs['appAccess/names'] = { names: [] };
  w._adminUsers = [
    { id: T.OWNER, name: 'オーナー', union: 'GRANT' },
    { id: 'a1', name: '架空 管理', union: 'GRANT', role: 'admin', status: 'active' },
    { id: 'b1', name: '澁谷 架空', union: 'GRANT', status: 'active' },
    { id: 'b2', name: '佐藤太郎', union: 'GRANT', status: 'active' },
    { id: 'b3', name: '鈴木 花', union: 'LIEN', status: 'active' },
    { id: 'b4', name: '鈴木 花', union: 'GRANT', status: 'active' },
    { id: 'b5', name: '使う 予定外', union: 'LIEN', status: 'active' },
    { id: 'p1', name: '新人 架空', union: 'GRANT', status: 'pending' }];
  w.document.getElementById('adminPanel').classList.add('open');
  w.renderAdminList(); w._accLoad(); await sleep(30);
  c('アカウント管理の上に公開範囲（3段階）', !!$('#adminBody .acc-box') && $$('#adminBody .acc-seg span').length === 3 && /全国公開/.test($('#adminBody .acc-seg span.on').textContent));
  c('行ごとに「先行利用にする」・管理者は「使えます」', $$('#adminBody .acc-ev').some(x => /先行利用にする/.test(x.textContent)) && $$('#adminBody .acc-ev').some(x => /管理者＝使えます/.test(x.textContent)));
  // 貼り付け
  w.accPasteOpen(); await sleep(5);
  $('#accIn').value = '佐藤 太郎\n渋谷架空\n鈴木花\n架空 管理\n未登録 さん\n佐藤 太郎';
  w.accMatch(); await sleep(5);
  const txt = $('#accOv').textContent;
  c('照らし合わせ：見つかった・同じ名前2人・表記ちがい・見つからない', /見つかった 2人/.test(txt) && /同じ名前が2人以上 1/.test(txt) && /表記ちがいの候補 1/.test(txt) && /見つからない 1人/.test(txt) && /未登録 さん/.test(txt));
  c('スペースのちがい・重複行は気にしない', /名簿 5人/.test(txt));
  const box = (id) => $$('#accOv input').find(x => x.value === id);
  c('見つかった人は最初からチェック・表記ちがいと同じ名前は選ぶ', box('b2').checked && !box('b1').checked && !box('b3').checked && !box('b4').checked);
  box('b1').checked = true; box('b4').checked = true;
  w.accApply(); await sleep(20);
  const early = (id) => w._adminUsers.find(u => u.id === id).early === true;
  c('決めると先行利用に（管理者はそのまま）', early('b1') && early('b2') && early('b4') && !early('b3') && !w._adminUsers.find(u => u.id === 'a1').early);
  c('見つからない人は登録待ちの名簿に', docs['appAccess/names'].names.join() === '未登録 さん');
  // 切りかえ（使えなくなる人を見せる）
  w.accSetMode('early'); await sleep(5);
  c('先行利用に切りかえる前に、使えなくなる人の名前', !!$('#accOv') && /使えなくなる人がいます/.test($('#accOv').textContent) && /2人/.test($('#accOv').textContent) && /使う 予定外/.test($('#accOv').textContent) && /鈴木 花/.test($('#accOv').textContent));
  w._accP.go(); await sleep(10);
  c('切りかえると保存', docs['appAccess/mode'].mode === 'early' && /先行利用/.test($('#adminBody .acc-seg span.on').textContent));
  w._accFilter = true; w.renderAdminList();
  c('「使える人だけ表示」', !$$('#adminBody .adm-row').some(r => /使う 予定外/.test(r.textContent)) && $$('#adminBody .adm-row').some(r => /佐藤太郎/.test(r.textContent)));
  w._accFilter = false; w.renderAdminList();
  // 1人ずつ
  w.accEarlyTgl('b5'); await sleep(5);
  c('1人ずつ先行利用にできる', early('b5') && writes.some(x => x[0] === 'users/b5' && x[1].early === true));
  w.accEarlyTgl('b5'); await sleep(5);
  c('外せる', !early('b5'));
  // 承認した時に登録待ちの名簿にあれば先行利用に
  docs['appAccess/names'] = { names: ['新人架空'] }; w._accNames = ['新人架空'];
  w.adminApprove('p1'); await sleep(30);
  c('承認した人が登録待ちの名簿にいれば、先行利用にして名簿から外す', early('p1') && docs['appAccess/names'].names.length === 0);
  // オーナー以外は公開範囲を変えられない（画面）
  w.currentUser = { uid: 'a1', name: '架空 管理', union: 'GRANT', role: 'admin' }; w.renderAdminList();
  c('管理者には公開範囲の切りかえを出さない（貼り付けはできる）', !$('#adminBody .acc-seg') && /名簿を貼り付けて先行利用に/.test($('#adminBody .acc-box').textContent));
  w.closeAdminPanel();
  // ルール
  const rules = require('fs').readFileSync(require('path').join(__dirname, '../../../firestore.rules'), 'utf8');
  c('ルール：本人は early を付けられない・公開範囲はオーナーだけ', /!\('early' in request\.resource\.data\)/.test(rules) && /get\('early', false\)\s*== resource\.data\.get\('early', false\)/.test(rules) && /match \/appAccess\/\{doc\}[\s\S]{0,300}doc == 'mode' && isOwnerAdmin\(\)/.test(rules));
});
