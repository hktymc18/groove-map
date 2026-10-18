// 受付 v82：名簿の「MAPで連携するユニオン」（alsoUnions）。集計を保存する時に、連携の付いた人の分だけ連携先ユニオン向けの文書にも保存
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '../../..');
const h = fs.readFileSync(R + '/checkin/index.html', 'utf8');
let fails = 0;
const c = (n, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n); if (!ok) fails++; };
const grab = re => (h.match(re) || [''])[0];
const src = grab(/function ckStatDocId\(union, key\)\{[^\n]*\n/) + grab(/function ckSaveRateSnapshot\(union, key, evs, rows, range\)\{[\s\S]*?\n\}\nfunction ckStatShareId[^\n]*\n/);
c('集計の保存と連携先向けの文書の関数がある', /ckStatShareId/.test(src) && /shareTo/.test(src));
(async () => {
  const DB = {};
  const db = { collection: () => ({ doc: id => ({ get: () => Promise.resolve({ exists: !!DB[id], data: () => DB[id] }), set: d => { DB[id] = JSON.parse(JSON.stringify(d)); return Promise.resolve(); } }) }) };
  const run = new Function('db', 'gUser', 'todayStr', src + '\nreturn ckSaveRateSnapshot;')(db, { uid: 'u1' }, () => '2026-10-18');
  const rows = [{ no: 'B001', count: 3, rate: 75, held: 4, also: ['UA'] }, { no: 'B002', count: 2, rate: 50, held: 4, also: [] }, { no: 'B003', count: 4, rate: 100, held: 4, also: ['UA', 'UC', 'UB'] }, { no: 'g1', count: 1, rate: 25, held: 4, also: ['UA'] }];
  await run('UB', 'last1m', [{ id: 'e1' }], rows, { from: '2026-09-19', to: '2026-10-18' });
  c('ユニオンの集計は今までどおり全員分', DB['UB__last1m'] && Object.keys(DB['UB__last1m'].rates).length === 3 && DB['UB__last1m'].rates.B002.rate === 50);
  const ua = DB['UB__last1m__to__UA'];
  c('連携先（UA）向けの文書：連携の付いた人だけ', ua && ua.union === 'UB' && ua.view === 'UA' && Object.keys(ua.rates).sort().join() === 'B001,B003' && ua.rates.B001.rate === 75 && ua.from === '2026-09-19');
  c('連携先（UC）向けは UC の人だけ・自分のユニオン宛ては作らない', DB['UB__last1m__to__UC'] && Object.keys(DB['UB__last1m__to__UC'].rates).join() === 'B003' && !DB['UB__last1m__to__UB']);
  c('ゲストは入れない', !ua.rates.g1);
  c('どこに出したかを残す', DB['UB__last1m'].shareTo.sort().join() === 'UA,UC');
  // 連携を外す → 次の集計で、その連携先の文書は空に
  rows[2].also = ['UA'];
  await run('UB', 'last1m', [{ id: 'e1' }], rows, { from: '2026-09-19', to: '2026-10-18' });
  c('連携を外したユニオン宛ては空にする', Object.keys(DB['UB__last1m__to__UC'].rates).length === 0 && DB['UB__last1m'].shareTo.join() === 'UA');
  // 名簿の編集画面
  c('名簿の編集に「MAPで連携するユニオン」（所属ユニオンは出さない）', /MAPで連携するユニオン（任意）/.test(h) && /gUnions\.filter\(function\(u\)\{ return u !== curUnion; \}\)/.test(h) && /data\.alsoUnions = /.test(h));
  c('集計の行に連携先を持たせる', /also: m\.alsoUnions \|\| \[\]/.test(h));
  c('APP_VER v82以降・v82のお知らせ', (+(h.match(/var APP_VER = 'v(\d+)';/) || [0, 0])[1]) >= 82 && /\{ v: 'v82', d: '2026\/10\/18'/.test(h));
  console.log(fails ? 'NG ' + fails : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})();
