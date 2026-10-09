// v689：アップデート後に最初に開いた時だけ、大きい更新（pop付き）を1回出す。「見た」は1人1回（プロフィール）
const T = require('../lib/head.js')();
const { w, c, sleep, $ } = T;
T.run(async () => {
  T.login(); await sleep(30);
  const u = w.currentUser, sets = [];
  const of = w.fsSet; w.fsSet = (p, d) => { sets.push([p, d]); return Promise.resolve(); };
  const reset = () => { w._rnPopDone = false; const o = $('#rnPopOv'); if (o) o.remove(); };
  w.localStorage.setItem('gm_seenNote', 'v687'); u.seenNote = 'v687'; u.createdAt = '2025-01-01T00:00:00Z';
  reset(); w._rnPopCheck(); await sleep(10);
  c('前の版まで見た人：更新内容が1回出る', !!$('#rnPopOv') && $('#rnPopOv').textContent.indexOf(w.RELEASE_NOTES.filter(n => n.pop)[0].pop.t) >= 0); // v783: 新しい順に3つまで
  c('新しい場所へ飛ぶボタン（いちばん新しい pop のボタン）', (() => { const p = w.RELEASE_NOTES.filter(n => n.pop && n.pop.go)[0]; return !!p && $('#rnPopOv').textContent.indexOf(p.pop.go[0]) >= 0; })());
  c('見た記録：端末とプロフィール（1人1回）', w.localStorage.getItem('gm_seenNote') === w.RELEASE_NOTES[0].v && u.seenNote === w.RELEASE_NOTES[0].v && sets.some(x => /^users\//.test(x[0]) && x[1].seenNote === w.RELEASE_NOTES[0].v));
  reset(); w._rnPopCheck(); await sleep(10);
  c('2回目は出ない', !$('#rnPopOv'));
  w.localStorage.setItem('gm_seenNote', 'v600'); reset(); w._rnPopCheck(); await sleep(10);
  c('別の端末でも、プロフィールで見ていれば出ない', !$('#rnPopOv'));
  w.localStorage.removeItem('gm_seenNote'); u.seenNote = ''; u.createdAt = new w.Date().toISOString(); reset(); w._rnPopCheck(); await sleep(10);
  c('登録したばかりの人には過去のお知らせを出さない', !$('#rnPopOv') && u.seenNote === w.RELEASE_NOTES[0].v, [!!$('#rnPopOv'), u.seenNote, w.localStorage.getItem('gm_seenNote'), w._rnSeen()]);
  w.localStorage.setItem('gm_seenNote', 'v687'); u.seenNote = 'v687'; u.createdAt = '2025-01-01T00:00:00Z';
  w.viewingOwnerUid = 'x'; reset(); w._rnPopCheck(); await sleep(10);
  c('他の人のMAPを見ている時は出さない', !$('#rnPopOv')); w.viewingOwnerUid = null;
  const big = w.RELEASE_NOTES.filter(n => n.pop).map(n => n.v);
  c('出すのは大きい更新（pop付き）だけ', big.indexOf('v688') >= 0 && big.length < w.RELEASE_NOTES.length && w.RELEASE_NOTES.filter(n => n.v === 'v687')[0].pop === undefined);
  w.fsSet = of;
});
