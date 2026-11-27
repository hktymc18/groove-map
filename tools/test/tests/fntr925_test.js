// v925：バグ報告の「見立て」の関数（functions/triage.js）。にせのデータベース（架空データ）
//   鍵なし・鍵違いは 401／new・fix だけ返す／個人情報が入らない／見立ての保存で状態が変わらない／許した状態の変化だけ通る／上限を超えると拒否
const path = require('path');
const T = require(path.join(__dirname, '../../../functions/triage.js'));
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
function fakeDb(store) {
  const cp = (d) => d === undefined ? undefined : JSON.parse(JSON.stringify(d));
  let auto = 0;
  const snap = (p) => ({ id: p.split('/').pop(), exists: store[p] !== undefined, data: () => cp(store[p]), ref: ref(p) });
  const ref = (p) => ({ path: p, id: p.split('/').pop(), get: async () => snap(p),
    set: async (d, o) => { store[p] = o && o.merge ? Object.assign({}, store[p] || {}, cp(d)) : cp(d); },
    update: async (d) => { if (store[p] === undefined) throw new Error('no doc'); store[p] = Object.assign({}, store[p], cp(d)); },
    collection: (n) => col(p + '/' + n) });
  const col = (p, fs) => ({ doc: (id) => ref(p + '/' + id), add: async (d) => { const id = 'a' + (++auto); store[p + '/' + id] = cp(d); return ref(p + '/' + id); },
    where: (f, op, v) => col(p, (fs || []).concat([[f, op, v]])),
    get: async () => ({ docs: Object.keys(store).filter((k) => k.indexOf(p + '/') === 0 && k.slice(p.length + 1).indexOf('/') < 0)
      .filter((k) => (fs || []).every(([f, op, v]) => op === 'in' ? v.indexOf(store[k][f]) >= 0 : store[k][f] === v)).map(snap) }) });
  return { collection: (n) => col(n) };
}
const KEY = 'test-key-0123456789';
const H = { 'x-triage-key': KEY };
const item = (no, st, x) => Object.assign({ no, kind: 'bug', status: st, screen: 'MAP', title: '架空のバグ ' + no, did: 'ボタンを押した', got: '動かない', want: '動いてほしい', ver: 'v900', device: 'iPhone Safari',
  authorUid: 'uSecret', authorName: '架空 太郎', reqBy: '見本 花子', slackUrl: 'https://example.slack.com/x', createdAt: '2026-11-20T01:00:00.000Z', imgN: 2, due: '2026-11-30', dueK: 'm', adminComment: '再現した' }, x || {});
(async () => {
  const base = () => ({
    'fbItems/1': item(1, 'new'), 'fbItems/2': item(2, 'fix'), 'fbItems/3': item(3, 'doing'), 'fbItems/4': item(4, 'done'), 'fbItems/5': item(5, 'review'), 'fbItems/6': item(6, 'check'),
    'fbItems/1/notes/n1': { text: '同じことが起きました', admin: false, byUid: 'uOther', byName: '試験 次郎', at: '2026-11-21T00:00:00.000Z' },
    'fbItems/1/notes/n2': { kind: 'status', text: '新着 → 検討中', byName: '架空 オーナー', at: '2026-11-21T01:00:00.000Z' },
  });
  // ── 鍵 ──
  {
    const db = fakeDb(base());
    for (const [n, h] of [['鍵なし', {}], ['鍵違い', { 'x-triage-key': 'wrong' }], ['空の鍵', { 'x-triage-key': '' }]]) {
      const r1 = await T.queue(db, { method: 'GET', headers: h }, KEY), r2 = await T.write(db, { method: 'POST', headers: h, body: { id: '1', triage: { verdict: 'bug', summary: 'x', confidence: 'high' } } }, KEY, 0);
      c(n + 'は 401（読み・書き）', r1.status === 401 && r2.status === 401, r1.status + '/' + r2.status);
    }
    const r3 = await T.queue(db, { method: 'GET', headers: H }, '');
    c('シークレットが空なら、どんな鍵でも 401', r3.status === 401);
    c('ヘッダー名の大文字小文字は問わない', T.keyOk({ 'X-Triage-Key': KEY }, KEY) && !T.keyOk({ 'X-Triage-Key': KEY + 'x' }, KEY));
  }
  // ── 読み（キュー） ──
  {
    const db = fakeDb(base());
    const r = await T.queue(db, { method: 'GET', headers: H }, KEY);
    c('GET は 200', r.status === 200);
    c('new・fix だけ返す（番号順）', r.body.items.map((x) => x.id).join() === '1,2', r.body.items.map((x) => x.id).join());
    const s = JSON.stringify(r.body);
    c('個人情報（書いた人・依頼した人・uid・Slack・やりとりの名前）が入らない', !/架空 太郎|見本 花子|uSecret|uOther|試験 次郎|slack|authorName|authorUid|reqBy|byName|byUid/.test(s), s.slice(0, 300));
    const x = r.body.items[0];
    const want = ['id', 'no', 'status', 'kind', 'app', 'screen', 'title', 'did', 'got', 'want', 'ver', 'device', 'createdAt', 'due', 'dueK', 'adminComment', 'notes', 'imgN'];
    c('返す項目は決めたものだけ', Object.keys(x).sort().join() === want.slice().sort().join(), Object.keys(x).join());
    c('やりとりは状態の記録を除く・本文と管理者の印と時刻だけ', x.notes.length === 1 && x.notes[0].text === '同じことが起きました' && Object.keys(x.notes[0]).sort().join() === 'admin,at,text');
    c('スクショは枚数だけ', x.imgN === 2 && !/data:image/.test(s));
    c('中身（タイトル・したこと・期限・管理者コメント）は返す', x.title === '架空のバグ 1' && x.did === 'ボタンを押した' && x.due === '2026-11-30' && x.adminComment === '再現した' && x.createdAt === '2026-11-20T01:00:00.000Z');
    const r2 = await T.queue(db, { method: 'POST', headers: H }, KEY);
    c('読みは GET だけ（POST は 405）', r2.status === 405);
  }
  // ── 見立ての保存 ──
  {
    const store = base(), db = fakeDb(store);
    const tri = { verdict: 'bug', summary: '保存の順番の問題', plan: 'app.js の保存を直す', replyDraft: 'ありがとうございます。次の版で直します', confidence: 'mid' };
    const r = await T.write(db, { method: 'POST', headers: H, body: { id: '1', triage: tri } }, KEY, Date.UTC(2026, 10, 27));
    c('見立ては 200 で fbTriage/{id} に保存', r.status === 200 && store['fbTriage/1'] && store['fbTriage/1'].summary === '保存の順番の問題' && store['fbTriage/1'].verdict === 'bug', JSON.stringify(r));
    c('書いた時刻（at）が付く', store['fbTriage/1'].at === new Date(Date.UTC(2026, 10, 27)).toISOString());
    c('見立ての保存で報告の状態は変わらない', store['fbItems/1'].status === 'new' && store['fbItems/1'].statusAt === undefined);
    const r2 = await T.write(db, { method: 'POST', headers: H, body: JSON.stringify({ id: 2, triage: { verdict: 'decide', summary: '仕様の判断', confidence: 'low' } }) }, KEY, 0);
    c('JSON の文字列・数の id でも受け付ける（省いた欄は空）', r2.status === 200 && store['fbTriage/2'].plan === '' && store['fbItems/2'].status === 'fix');
    const r3 = await T.write(db, { method: 'POST', headers: H, body: { id: '99', triage: tri } }, KEY, 0);
    c('無い報告は 404', r3.status === 404 && !store['fbTriage/99']);
    const r4 = await T.write(db, { method: 'GET', headers: H, body: { id: '1', triage: tri } }, KEY, 0);
    c('書きは POST だけ（GET は 405）', r4.status === 405);
  }
  // ── 拒否する中身 ──
  {
    const store = base(), db = fakeDb(store);
    const ok = { verdict: 'bug', summary: 's', confidence: 'high' };
    const bad = [
      ['各欄が 2000 字を超える（summary）', { id: '1', triage: Object.assign({}, ok, { summary: 'あ'.repeat(2001) }) }],
      ['各欄が 2000 字を超える（replyDraft）', { id: '1', triage: Object.assign({}, ok, { replyDraft: 'x'.repeat(2001) }) }],
      ['許さない項目（triage の中）', { id: '1', triage: Object.assign({}, ok, { status: 'done' }) }],
      ['許さない項目（一番上）', { id: '1', triage: ok, status: 'done' }],
      ['判定が決めた4つ以外', { id: '1', triage: Object.assign({}, ok, { verdict: 'maybe' }) }],
      ['確信度が決めた3つ以外', { id: '1', triage: Object.assign({}, ok, { confidence: 'sure' }) }],
      ['要約が空', { id: '1', triage: Object.assign({}, ok, { summary: '  ' }) }],
      ['文字でない欄', { id: '1', triage: Object.assign({}, ok, { plan: { a: 1 } }) }],
      ['見立てと直した記録を両方', { id: '1', triage: ok, fix: { pr: 'https://github.com/hktymc18/groove-map/pull/1', step: 'doing' } }],
      ['どちらも無い', { id: '1' }],
      ['id がおかしい（パス）', { id: '../users/x', triage: ok }],
      ['JSON でない', 'not json{'],
      ['配列', [1, 2]],
    ];
    for (const [n, b] of bad) { const r = await T.write(db, { method: 'POST', headers: H, body: b }, KEY, 0); c('拒否：' + n, r.status === 400, JSON.stringify(r)); }
    c('拒否した時は何も書かない', !Object.keys(store).some((k) => k.indexOf('fbTriage/') === 0) && store['fbItems/1'].status === 'new');
    c('2000 字ちょうどは通る', (await T.write(db, { method: 'POST', headers: H, body: { id: '1', triage: Object.assign({}, ok, { summary: 'あ'.repeat(2000) }) } }, KEY, 0)).status === 200);
  }
  // ── 直した記録（状態の変化） ──
  {
    const store = base(), db = fakeDb(store);
    const PR = 'https://github.com/hktymc18/groove-map/pull/700';
    const fx = (id, step, pr) => T.write(db, { method: 'POST', headers: H, body: { id, fix: { pr: pr || PR, step } } }, KEY, Date.UTC(2026, 10, 27));
    let r = await fx('2', 'doing');
    c('fix → doing は通る', r.status === 200 && store['fbItems/2'].status === 'doing' && store['fbItems/2'].statusBy === 'Claude', JSON.stringify(r));
    c('fbTriage に PR の URL が残る', store['fbTriage/2'].pr === PR && store['fbTriage/2'].prStep === 'doing');
    c('やりとりに状態の記録が付く', Object.keys(store).some((k) => k.indexOf('fbItems/2/notes/') === 0 && store[k].kind === 'status' && /改修する → 対応中/.test(store[k].text)));
    r = await fx('2', 'check');
    c('doing → check は通る', r.status === 200 && store['fbItems/2'].status === 'check');
    r = await fx('3', 'check');
    c('（もともと対応中の報告）doing → check は通る', r.status === 200 && store['fbItems/3'].status === 'check');
    for (const [id, step, n] of [['1', 'doing', 'new → doing'], ['1', 'check', 'new → check'], ['2', 'doing', 'check → doing'], ['4', 'check', 'done → check'], ['5', 'doing', 'review → doing'], ['6', 'check', 'check → check']]) {
      const before = store['fbItems/' + id].status; r = await fx(id, step);
      c('拒否：' + n, r.status === 409 && store['fbItems/' + id].status === before, JSON.stringify(r));
    }
    r = await T.write(db, { method: 'POST', headers: H, body: { id: '2', fix: { pr: PR, step: 'done' } } }, KEY, 0);
    c('拒否：step が doing・check 以外（done）', r.status === 400);
    r = await fx('2', 'doing', 'https://evil.example.com/pull/1');
    c('拒否：PR がこのリポジトリのものでない', r.status === 400);
    r = await T.write(db, { method: 'POST', headers: H, body: { id: '2', fix: { pr: PR, step: 'doing', status: 'done' } } }, KEY, 0);
    c('拒否：fix の中の許さない項目', r.status === 400);
  }
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch((e) => { console.log('exception ' + (e && e.stack || e)); process.exit(1); });
