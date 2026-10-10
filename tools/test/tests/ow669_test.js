// v669：オーナーに馬越さんを追加（MAP・受付・ルールで一致）
const T = require('../lib/head.js')();
const { w, c } = T;
const fs = require('fs'), p = require('path'), R = p.join(__dirname, '../../..');
const U2 = 'E4WT7EHai5c6WANUgASz42Euu1y1';
T.run(async () => {
  c('オーナーは2人', w.isOwnerUid(T.OWNER) && w.isOwnerUid(U2) && !w.isOwnerUid('x'));
  w.currentUser = { uid: U2, name: '馬越' };
  c('馬越さんは管理者扱い（全ユニオンの承認・受付）', w.isCurrentAdmin() && w._ckIsOwner());
  c('バグ・要望の管理とフィットネスは山内さんだけ', !w._fbIsOwner() && !w._fitOwner());
  const rules = fs.readFileSync(R + '/firestore.rules', 'utf8');
  c('ルール：isOwnerUid に2人・isOwnerAdmin/isAdmin が使う', rules.indexOf("request.auth.uid in ['" + T.OWNER + "', '" + U2 + "']") >= 0 && /function isOwnerAdmin\(\) \{\s*return isOwnerUid\(\);/.test(rules) && (rules.match(/'j2DPDAccCygHmR9i5K3bTvHnH0V2'/g) || []).length === 2); // v786: rosterOff のオーナー除外にも
  const ck = fs.readFileSync(R + '/checkin/index.html', 'utf8');
  c('受付：オーナーに2人', ck.indexOf("OWNER_UIDS = [OWNER_UID, '" + U2 + "']") >= 0 && /function isOwner\(\)\{ return !!gUser && OWNER_UIDS\.indexOf/.test(ck));
});
