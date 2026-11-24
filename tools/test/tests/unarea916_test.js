// v916：ユニオン予定の地域は「愛知」「愛知県」と「名古屋」を同じ地域とみなす（MAP の地域と同じ決まり）。名前はすべて架空
const T = require('../lib/head.js')({ now: '2026-11-24T03:00:00Z' });
const { w, c } = T;
T.run(async () => {
  T.login();
  w.currentUser.union = 'REVE'; w.currentUser.role = 'member'; w.isCurrentAdmin = () => false; w._admOf = () => false; // 管理者は全地域が見えるので、ふつうのメンバーで試す
  const ev = (id, area) => ({ id, title: 'セミナー' + id, date: '2026-12-01', area, union: 'REVE', createdBy: 'someone' });
  w._unionRaw = [ev('a', '愛知'), ev('b', '名古屋'), ev('c', '愛知県'), ev('d', ''), ev('e', '大阪')];
  w._unionPrefs = { off: false, hidden: [] };
  const shown = () => w.state.events.filter(e => e._union).map(e => e.id.replace('UN_', '')).sort().join();
  w.currentUser.area = '名古屋'; w._unionApplyToState();
  c('名古屋の人に「愛知」「愛知県」「名古屋」と全地域の予定が出る（大阪は出ない）', shown() === 'a,b,c,d', shown());
  w.currentUser.area = '愛知'; w._unionApplyToState();
  c('愛知の人にも同じように出る', shown() === 'a,b,c,d', shown());
  w.currentUser.area = '大阪'; w._unionApplyToState();
  c('大阪の人には大阪と全地域だけ', shown() === 'd,e', shown());
  c('比べ方の関数', w._unAreaSame('愛知県', '名古屋') && !w._unAreaSame('大阪', '名古屋'));
});
