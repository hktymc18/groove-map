// v870：西暦がわからない誕生日（0000-月-日）。誕生日のお知らせ・カードの🎂は月日で出る・年齢は出さない（手で入れた年齢を使う）・
//   今までの編集画面（年/月/日のリスト）でも年を空にして保存できる（架空データ）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $ } = T;
T.run(async () => {
  T.login(); setWH(390, 844); w._uxSync && w._uxSync();
  const d = new w.Date(); d.setDate(d.getDate() + 3);   // ページの時計で（テストの時計とずれることがある）
  const mmdd = String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const tm = new w.Date(); tm.setDate(tm.getDate() + 1);
  const tmdd = String(tm.getMonth() + 1).padStart(2, '0') + '-' + String(tm.getDate()).padStart(2, '0');
  w.state.members = [{ id: 'r', lastName: '架空', firstName: '太郎', title: 'G', parentId: '', mapType: 'both' },
    { id: 'n1', lastName: '見本', firstName: 'ねんなし', title: 'B80', parentId: 'r', mapType: 'both', birthday: '0000-' + mmdd, age: 30 },
    { id: 'n2', lastName: '見本', firstName: 'あした', title: 'ユーザー', parentId: 'r', mapType: 'both', birthday: '0000-' + tmdd },
    { id: 'y1', lastName: '見本', firstName: 'ねんあり', title: 'B80', parentId: 'r', mapType: 'both', birthday: '1990-' + mmdd }];
  const M = id => w.state.members.find(m => m.id === id);
  c('誕生日まであと何日（月日で計算）', w._bdayDaysUntil(M('n1')) === 3 && w._bdayDaysUntil(M('y1')) === 3);
  c('西暦がわからない時は「◯歳に」を出さない', w._bdayTurnAge(M('n1')) === null && w._bdayTurnAge(M('y1')) > 0);
  c('年齢は手で入れた年齢を使う（0000年から計算しない）', w._memberAge(M('n1')) === 30 && w._memberAge(M('n2')) === null);
  c('明日の誕生日のお知らせに入る', w.birthdayUpcoming().some(m => m.id === 'n2'));
  const card = w.bdayCardHtml('sheet');
  c('誕生日カードに出て「歳に」は出ない', /ねんなし/.test(card) && !/ねんなし[^]*?2026歳|0000/.test(card));
  c('_bdHasYear：西暦あり／なし', w._bdHasYear('1990-01-02') && !w._bdHasYear('0000-01-02') && !w._bdHasYear(''));
  // 今までの編集画面（年/月/日のリスト）
  w._fBirthSet('0000-' + mmdd, '');
  c('編集画面：0000 の時は年が空（西暦不明）・月日は入る', $('#fBirthY').value === '' && $('#fBirthM').value === String(+mmdd.slice(0, 2)) && /西暦不明/.test($('#fBirthY').options[0].textContent));
  c('編集画面：年が空でも月日があれば 0000-月-日 で読める', w._fBirthGet() === '0000-' + mmdd && w._fBirthYearGet() === '');
  w._fBirthSet('', '1995');
  c('編集画面：年だけなら今までどおり生まれ年', w._fBirthGet() === '' && w._fBirthYearGet() === '1995');
  c('バージョン v870 以降', +(w.APP_JS_VERSION || 'v0').slice(1) >= 870);
});
