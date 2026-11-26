// 受付 v182：相談の数・報告された相談（架空データ）
//   「💜 Beauty」タブ：📊 相談の数（DAY HOST・管理者・オーナー。中身は出ない）／💬 すべての相談（オーナーだけ）
//   オーナーはこのユニオンの相談を全部読める。開くと読んだ記録（olog）が残る。報告には「対応済み」を付けられる
//   お客さんの画面の説明も「スタッフと運営（オーナー）が見ます」
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
  'ckDm/n1': TH({ cname: '見本 ほか', upAt: now + 1000 }),
  'ckDm/n1/m/a': { by: 'u', uid: 'dev-1', t: 'ほかの相談です', at: '2026-11-26T09:00:00Z' },
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
    c('オーナー：このユニオンのすべての相談（報告なしも）・ほかのユニオンは出ない', /見本 はなこ さん → 見本 りな さん/.test(dr) && /見本 ほか/.test(dr) && !/見本 よそ/.test(dr), dr);
    c('未対応の報告が上', /🚩 報告あり/.test(await o.ev(`document.querySelector('#btDr .cs-row').innerText`)));
    c('一覧には中身を出さない', !/つっぱり/.test(dr));
    await o.page.locator('#btDr').screenshot({ path: OUT + '/ckdm182_all.png' });
    await o.ev(`document.querySelector('#drFlt [data-v="rep"]').click()`); await o.wt(200);
    c('「🚩 報告」で絞れる', (await o.ev(`document.querySelectorAll('#btDr .cs-row').length`)) === 1);
    await o.page.locator('#btDr').screenshot({ path: OUT + '/ckdm182_owner.png' });
    await o.ev(`document.querySelector('#btDr [data-dr]').click()`); await o.wt(500);
    c('開くと中身が出て、読んだ記録が残る', (await o.ev(`!!window.__FBDATA['ckDm/r1/olog/${OWN}']`)) && /朝つっぱります/.test(await o.ev(`document.querySelector('.modal').innerText`)));
    await o.page.screenshot({ path: OUT + '/ckdm182_read.png' });
    c('スタッフの吹き出しに色がある（受付の画面では --ua-vio が無いので、白い文字が見えなくなっていた）', !/rgba\(0, 0, 0, 0\)|transparent/.test(await o.ev(`getComputedStyle(document.querySelector('.modal .cs-msg.me')).backgroundColor`)));
    c('お客さんとスタッフ、両方のメッセージ', /化粧水のあとにすぐクリームを/.test(await o.ev(`document.querySelector('.modal').innerText`)), await o.ev(`document.querySelector('.modal').innerHTML`));
    await o.ev(`document.getElementById('drDone').click()`); await o.wt(400);
    const rd = JSON.parse(await o.ev(`JSON.stringify(window.__FBDATA['ckDm/r1'].repDone || null)`));
    c('報告を対応済みにする（自分の名前で）', rd && rd.by === OWN && rd.at > 0, JSON.stringify(rd));
    c('一覧に「対応済み」', /対応済み/.test(await o.ev(`document.getElementById('btDr').innerText`)));
    await o.ev(`document.querySelector('#drFlt [data-v=""]').click()`); await o.wt(200);
    await o.ev(`[].filter.call(document.querySelectorAll('#btDr .cs-row'), function(r){ return /見本 ほか/.test(r.innerText); })[0].querySelector('[data-dr]').click()`); await o.wt(500);
    c('報告のない相談も読める（対応済みボタンは出ない）', (await o.ev(`!!window.__FBDATA['ckDm/n1/olog/${OWN}']`)) && /ほかの相談です/.test(await o.ev(`document.querySelector('.modal').innerText`)) && !(await o.ev(`!!document.getElementById('drDone')`)));
    c('オーナーにも 📊 相談の数', /7\s*件（30日）/.test(await o.ev(`document.getElementById('btDs').innerText`)));
    c('エラーなし（オーナー）', !o.errs.length, o.errs.join(' / '));
    await o.ctx.close();
  }
  await b.close();
  const H = fs.readFileSync(P.R + '/checkin/index.html', 'utf8');
  c('APP_VER v182 以上', (+(H.match(/var APP_VER = 'v(\d+)';/) || [0, 0])[1]) >= 182);
  console.log(fails ? 'FAIL ' + fails : 'ALL PASS'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('exception', e); process.exit(1); });
