// 受付 v182：相談の数・報告された相談（架空データ）
//   「💜 Beauty」タブ：📊 相談の数（DAY HOST・管理者・オーナー。中身は出ない）／🚩 報告された相談（オーナーだけ）
//   オーナーが読む時は確認 → 読んだ記録（olog）を残してから中身を出す → 「対応済みにする」
const path = require('path'), fs = require('fs');
const P = require('../lib/ckpage.js');
let fails = 0;
const c = (n, ok, info) => { console.log((ok ? 'PASS' : 'FAIL') + ': ' + n + (ok || info === undefined ? '' : '  ' + info)); if (!ok) fails++; };
const OUT = path.join(__dirname, '../out');
const TA = '0123456789abcdef0123456789abcdef', OWN = 'j2DPDAccCygHmR9i5K3bTvHnH0V2';
const user = (name) => ({ name, union: 'REVE', unionSelectedV2: true, status: 'active', email: name.length + '@example.com', privacy: { ver: '2026-10', at: '2026-10-01T00:00:00Z' } });
const now = Date.now();
const TH = (x) => Object.assign({ tk: TA, un: 'REVE', cno: 'u1', cname: '見本 はなこ', sUid: 'st1', sName: '見本 りな', topic: 'skin', st: 'open', last: { by: 'u', t: 'x', at: now }, uRead: now, sRead: 0, byStaff: false, at: 1, upAt: now }, x || {});
const data = {
  'checkinUnions/REVE': { name: 'REVE', dayStaff: ['host1'] }, 'checkinConfig/beauty': { testers: ['host1', OWN] },
  'users/host1': user('見本 ほすと'), 'users/mem1': user('見本 めむ'), ['users/' + OWN]: user('見本 おーなー'),
  'ckCs/REVE/s/st1': { name: '見本 りな', tags: ['skin'], bio: '', off: false, ord: 1 },
  'ckDmStat/REVE': { n30: 7, topics: { skin: 4, bust: 2, inner: 1 }, open: 3, done: 4, rep: 1, byStaff: 1, stop: 1, noReply: 2, avgFirstMin: 150, at: now },
  'ckDm/r1': TH({ rep: { at: now - 3600000 } }),
  'ckDm/r1/m/a': { by: 'u', uid: 'dev-1', t: '朝つっぱります', at: '2026-11-26T10:00:00Z' },
  'ckDm/r1/m/b': { by: 's', uid: 'st1', t: '化粧水のあとにすぐクリームを', at: '2026-11-26T11:00:00Z' },
  'ckDm/n1': TH({ cname: '見本 ほか' }),
  'ckDm/x1': TH({ un: 'ANTARES', cname: '見本 よそ', rep: { at: now } })
};
(async () => {
  const b = await P.browser();
  const open = async (uid) => { const o = await P.open(b, { uid, data, wait: 2600 }); await o.page.addStyleTag({ content: '#toast,#rnPopOv,#gxHint{display:none!important}' }); await o.page.click('nav button[data-pane="pBeauty"]'); await o.wt(900); return o; };
  {
    const o = await open('host1');
    const ds = await o.ev(`document.getElementById('btDs').innerText`);
    c('DAY HOST：📊 相談の数（30日・最初の返事まで・まだ返事のない相談）', /7\s*件（30日）/.test(ds) && /2\.5時間/.test(ds) && /2\s*まだ返事のない相談/.test(ds) && /スキンケア 4/.test(ds), ds);
    c('DAY HOST には 🚩 報告された相談は出ない', await o.ev(`document.getElementById('btDr').classList.contains('hide')`));
    c('エラーなし（DAY HOST）', !o.errs.length, o.errs.join(' / '));
    await o.ctx.close();
  }
  {
    const o = await open('');
    const dr = await o.ev(`document.getElementById('btDr').innerText`);
    c('オーナー：報告された相談だけ・このユニオンだけ', /見本 はなこ さん → 見本 りな さん/.test(dr) && !/見本 ほか/.test(dr) && !/見本 よそ/.test(dr), dr);
    c('一覧には中身を出さない', !/つっぱり/.test(dr));
    await o.page.screenshot({ path: OUT + '/ckdm182_owner.png' });
    let asked = ''; o.page.removeAllListeners('dialog'); o.page.on('dialog', d => { asked = d.message(); d.dismiss(); });
    await o.ev(`document.querySelector('#btDr [data-dr]').click()`); await o.wt(400);
    c('読む前に確認（やめたら記録も残さず読まない）', /読んだ」という記録が残ります/.test(asked) && !(await o.ev(`!!window.__FBDATA['ckDm/r1/olog/${OWN}']`)) && !(await o.ev(`!!document.querySelector('.modal .cs-chat')`)));
    o.page.removeAllListeners('dialog'); o.page.on('dialog', d => d.accept());
    await o.ev(`document.querySelector('#btDr [data-dr]').click()`); await o.wt(500);
    c('はい → 読んだ記録を残して中身を出す', (await o.ev(`!!window.__FBDATA['ckDm/r1/olog/${OWN}']`)) && /朝つっぱります/.test(await o.ev(`document.querySelector('.modal').innerText`)));
    await o.page.screenshot({ path: OUT + '/ckdm182_read.png' });
    await o.ev(`document.getElementById('drDone').click()`); await o.wt(400);
    const rd = JSON.parse(await o.ev(`JSON.stringify(window.__FBDATA['ckDm/r1'].repDone || null)`));
    c('対応済みにする（自分の名前で）', rd && rd.by === OWN && rd.at > 0, JSON.stringify(rd));
    c('一覧に「対応済み」', /対応済み/.test(await o.ev(`document.getElementById('btDr').innerText`)));
    c('オーナーにも 📊 相談の数', /7\s*件（30日）/.test(await o.ev(`document.getElementById('btDs').innerText`)));
    c('エラーなし（オーナー）', !o.errs.length, o.errs.join(' / '));
    await o.ctx.close();
  }
  await b.close();
  const H = fs.readFileSync(P.R + '/checkin/index.html', 'utf8');
  c('APP_VER v182 以上', (+(H.match(/var APP_VER = 'v(\d+)';/) || [0, 0])[1]) >= 182);
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
