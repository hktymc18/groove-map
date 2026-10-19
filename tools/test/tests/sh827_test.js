// v827：MAPの共有はアップだけ（#23）。ダウンは止める・わからない人は「アップです」と確認して記録・上の人（設定）は誰からでも
//   プロフィールに紹介者（受付の名簿から自動）・共有一覧に印・アカウント管理に「共有してよい上の人」「アップ以外への共有」
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  const ME = { uid: 'uMe', name: '架空 太郎', upRuby: '見本 花子', upBd: '試験 次郎', referrer: '仮名 一子', union: '架空ユニオン', email: 'me@x.jp' };
  const users = [
    { id: 'uMe', name: '架空 太郎', upRuby: '見本 花子', upBd: '試験 次郎', referrer: '仮名 一子', email: 'me@x.jp' },
    { id: 'uRef', name: '仮名 一子', referrer: '仮名 祖父', upRuby: '見本 花子', email: 'ref@x.jp' },
    { id: 'uGr', name: '仮名　祖父', email: 'gr@x.jp' },
    { id: 'uHana', name: '見本花子', email: 'hana@x.jp' },
    { id: 'uTop', name: '上野 頂', email: 'top@x.jp' },
    { id: 'uDn', name: '下田 一', referrer: '架空 太郎さん', upRuby: '見本 花子', email: 'dn@x.jp' },
    { id: 'uDn2', name: '下田 二', referrer: '下田 一', email: 'dn2@x.jp' },
    { id: 'uSide', name: '横山 三', upRuby: '別系 統', upBd: '別系 長', email: 'side@x.jp' },
    { id: 'uMap', name: '地図 四', email: 'map@x.jp' }
  ];
  const U = id => users.find(u => u.id === id);
  const top = { uids: ['uTop'] };
  w.state.members = [
    { id: 'm0', name: '架空 太郎', parentId: '' },
    { id: 'm1', name: '地図 四', parentId: 'm0' },
    { id: 'm2', name: '見本 花子', parentId: '' } // MAPの別の根（自分より下ではない）
  ];
  // ① 関係の見分け
  const rel = id => w._shRel(Object.assign({ id: ME.uid }, ME), U(id), users, top);
  c('紹介者はアップ', rel('uRef') === 'up');
  c('紹介者の紹介者もアップ（全角スペース・つながりをたどる）', rel('uGr') === 'up');
  c('UPルビー（スペースなし表記）もアップ', rel('uHana') === 'up');
  c('共有してよい上の人（設定）', rel('uTop') === 'top');
  c('自分を紹介者にしている人はダウン（さん付きでも）', rel('uDn') === 'down');
  c('ダウンのダウンもダウン', rel('uDn2') === 'down');
  c('自分のMAPで自分より下にいる人はダウン', rel('uMap') === 'down');
  c('つながりのない人は「わからない」', rel('uSide') === 'unknown');
  // ② 共有する：ダウンは止める／わからない人は確認／アップはそのまま
  Object.assign(w.currentUser, ME);
  w._shLoadUsers = () => Promise.resolve(users);
  w._shLoadTop = () => Promise.resolve(top);
  let sets = [], dels = [], alerts = [], confirms = [], conf = true;
  const ofs = w.fsSet; w.fsSet = (p, d) => { sets.push([p, d]); return Promise.resolve(); };
  w.alert = m => alerts.push(m); w.confirm = m => { confirms.push(m); return conf; };
  const realDoc = w.db.doc.bind(w.db), realCol = w.db.collection.bind(w.db);
  w.db.doc = p => { const o = realDoc(p); o.delete = () => { dels.push(p); return Promise.resolve(); }; return o; };
  w.db.collection = p => {
    const o = realCol(p);
    if (p === 'users') o.where = (f, op, v) => ({ get: () => { const u = users.find(x => x.email === v); return Promise.resolve({ empty: !u, forEach: fn => { if (u) fn({ id: u.id, data: () => u }); } }); } });
    return o;
  };
  const share = async em => { sets = []; alerts = []; confirms = []; $('#shareEmail').value = em; w.addShareUser(); await sleep(40); };
  const shared = id => sets.find(s => s[0] === 'maps/uMe/shared/' + id);
  await share('dn2@x.jp');
  c('ダウンには共有できない（エラー）', alerts.length === 1 && /共有できません/.test(alerts[0]) && /ダウン/.test(alerts[0]) && !shared('uDn2') && !sets.some(s => /sharedWith/.test(s[0])));
  conf = false; await share('side@x.jp');
  c('わからない人：確認でやめると共有しない', confirms.length === 1 && /確認できませんでした/.test(confirms[0]) && /サイド/.test(confirms[0]) && !shared('uSide'));
  conf = true; await share('side@x.jp');
  const au = sets.find(s => s[0] === 'shareAudit/uMe_uSide');
  c('わからない人：「アップです」と確認すると共有でき、記録が残る', shared('uSide') && shared('uSide')[1].rel === 'ok' && au && au[1].how === 'confirm' && au[1].rel === 'unknown' && au[1].toName === '横山 三' && au[1].fromName === '架空 太郎');
  await share('ref@x.jp');
  c('アップにはそのまま共有できる（確認なし）', !alerts.length && !confirms.length && shared('uRef') && shared('uRef')[1].rel === 'up' && sets.some(s => s[0] === 'sharedWith/uRef/from/uMe'));
  await share('top@x.jp');
  c('上の人（設定）にも共有できる', !confirms.length && shared('uTop') && shared('uTop')[1].rel === 'top');
  await share('me@x.jp');
  c('自分には共有しない', !sets.length);
  // オーナーは止めない
  w.currentUser.uid = T.OWNER; await share('dn2@x.jp');
  c('オーナーが共有する時は止めない', !alerts.length && !confirms.length && sets.some(s => s[0] === 'maps/' + T.OWNER + '/shared/uDn2'));
  w.currentUser.uid = 'uMe';
  // ③ 共有一覧の印（前からある共有は記録）
  sets = []; dels = [];
  const ofc = w.fsGetCol;
  w.fsGetCol = p => Promise.resolve(p === 'maps/uMe/shared' ? [
    { id: 'uDn', email: 'dn@x.jp', perm: 'edit', recipientUid: 'uDn' },
    { id: 'uSide', email: 'side@x.jp', perm: 'view', recipientUid: 'uSide', rel: 'ok' },
    { id: 'uMap', email: 'map@x.jp', perm: 'view', recipientUid: 'uMap' },
    { id: 'uRef', email: 'ref@x.jp', perm: 'view', recipientUid: 'uRef', rel: 'up' }
  ] : []);
  w.openShareModal(); await sleep(60);
  const badge = id => { const r = $('#shareUserList [data-rid="' + id + '"] .sh-rel'); return r ? r.textContent : ''; };
  c('ダウンへの共有に ⚠ ダウン', /^\W*ダウン$/.test(badge('uDn').trim()) && /^\W*ダウン$/.test(badge('uMap').trim()));
  c('確認ずみ・アップは目立たせない', badge('uSide') === 'アップと確認ずみ' && badge('uRef') === '');
  c('一覧に名前も出す', /下田 一/.test($('#shareUserList [data-rid="uDn"]').textContent));
  c('前からあるダウンへの共有は記録（確認ずみは上書きしない）', sets.some(s => s[0] === 'shareAudit/uMe_uDn' && s[1].how === 'old' && s[1].rel === 'down' && s[1].perm === 'edit') && sets.some(s => s[0] === 'shareAudit/uMe_uMap') && !sets.some(s => s[0] === 'shareAudit/uMe_uSide'));
  c('アップへの共有は記録を消す', dels.indexOf('shareAudit/uMe_uRef') >= 0);
  c('共有画面に「アップだけ」の説明', /アップ（あなたの上の人）だけ/.test($('#shareModal').textContent));
  w.closeShareModal(null);
  // 共有を外すと記録も消す
  dels = []; w.removeShareUser('uDn'); await sleep(20);
  c('共有を外すと記録も消す', dels.indexOf('shareAudit/uMe_uDn') >= 0 && dels.indexOf('maps/uMe/shared/uDn') >= 0);
  // ④ プロフィールの紹介者
  w.openProfileModal(); await sleep(10);
  c('プロフィールに紹介者', $('#profileReferrer') && $('#profileReferrer').value === '仮名 一子');
  { const o = w.document.createElement('option'); o.value = o.textContent = '架空ユニオン'; $('#profileUnion').appendChild(o); $('#profileUnion').value = '架空ユニオン'; }
  $('#profileReferrer').value = '仮名 祖父'; sets = [];
  w.saveProfile(); await sleep(10);
  const pf = sets.find(s => s[0] === 'users/uMe');
  c('紹介者を保存（本人が直した印）', pf && pf[1].referrer === '仮名 祖父' && pf[1].referrerFrom === 'self' && w.currentUser.referrer === '仮名 祖父');
  // スマホの設定のプロフィール
  w._stPg = 'prof'; try { w.setOpen && w.setOpen('prof'); } catch (e) {}
  if (!$('#stReferrer')) { w._stPg = 'prof'; w._stRender(); }
  await sleep(10);
  c('スマホのプロフィールにも紹介者', $('#stReferrer') && $('#stReferrer').value === '仮名 祖父');
  // ⑤ 受付の名簿から紹介者を入れる（空の時だけ）
  w.currentUser.referrer = ''; w.currentUser.referrerFrom = ''; sets = [];
  w.db.doc = p => { const o = realDoc(p); if (p === 'checkinMembers/N12') o.get = () => Promise.resolve({ exists: true, data: () => ({ referrer: ' 仮名 一子 ' }) }); return o; };
  w._shRefFill({ uid: 'uMe', ckNo: 'N12' }); await sleep(20);
  c('名簿の紹介者をプロフィールへ（受付から入れた印）', w.currentUser.referrer === '仮名 一子' && sets.some(s => s[0] === 'users/uMe' && s[1].referrer === '仮名 一子' && s[1].referrerFrom === 'ck'));
  sets = []; w._shRefFill({ uid: 'uMe', ckNo: 'N12', referrer: '自分で入れた' }); await sleep(20);
  c('紹介者が入っている人は変えない', !sets.length);
  // ⑥ アカウント管理（オーナー）
  w.currentUser.uid = T.OWNER; w.currentUser.name = '架空 管理';
  w._adminUsersFetch = () => Promise.resolve(users.map(u => Object.assign({ status: 'active' }, u)));
  w._admCkLoad = () => {}; w._accLoad = () => { w._accA = { mode: 'open', unions: [] }; };
  w._shLoadTop = () => Promise.resolve(w._shTop = { uids: ['uTop'] });
  w.fsGetCol = p => Promise.resolve(p === 'shareAudit' ? [
    { id: 'uA_uB', fromName: '架空 太郎', toName: '下田 一', rel: 'down', how: 'old', perm: 'view', at: '2026-10-18T01:00:00Z' },
    { id: 'uA_uC', fromName: '架空 太郎', toName: '横山 三', rel: 'unknown', how: 'confirm', perm: 'view', at: '2026-10-19T01:00:00Z' }
  ] : []);
  w.openAdminPanel(); await sleep(60);
  const box = () => $('#shAdmBox') ? $('#shAdmBox').textContent : '';
  c('アカウント管理に「MAPの共有」：上の人・アップ以外への共有の件数', /共有してよい上の人/.test(box()) && /上野 頂/.test(box()) && /アップ以外への共有 2件（ダウン1）/.test(box()));
  w.shAudOpen(); await sleep(5);
  const dl = $('#accOv').textContent;
  c('アップ以外への共有の一覧（新しい順・ダウン・確認したか）', /架空 太郎 → 横山 三[\s\S]*架空 太郎 → 下田 一/.test(dl) && /前からある共有/.test(dl) && /本人が「アップです」と確認/.test(dl));
  w._accDlgClose();
  let topSet = null; w.db.doc = p => { const o = realDoc(p); if (p === 'appShare/top') o.set = d => { topSet = d; return Promise.resolve(); }; return o; };
  w.shTopOpen(); await sleep(5);
  w.shTopOpen('仮名'); await sleep(5);
  c('上の人を探して足せる', $$('#shTopL label.r').length === 2 && /仮名 一子/.test($('#shTopL').textContent));
  w.shTopAdd('uRef'); await sleep(10);
  c('上の人を足して保存', topSet && topSet.uids.join() === 'uTop,uRef' && /仮名 一子/.test(box()));
  w.shTopDel('uTop'); await sleep(10);
  c('上の人を外せる', topSet.uids.join() === 'uRef');
  // オーナー以外の管理者には出さない
  w.currentUser.uid = 'uAdm'; w.currentUser.role = 'admin';
  c('オーナー以外には出さない', w._shAdmHtml() === '');
  w.currentUser.uid = T.OWNER;
  w.closeAdminPanel(); w.fsSet = ofs; w.fsGetCol = ofc;
});
