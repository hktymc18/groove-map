// v842：理想の生活の一覧で、金額を押すと金額だけその場で直せる（PC・スマホ共通／理想のページの一覧・理想の生活シート）
const T = require('../lib/head.js')({ timeout: 120000 });
const { w, c, sleep, setWH, $, $$ } = T;
const key = (el, k) => el.dispatchEvent(new w.KeyboardEvent('keydown', { key: k, bubbles: true }));
const row = (sel, re) => $$(sel).find(r => re.test(r.textContent));
async function run(pc) {
  setWH(pc ? 1400 : 390, pc ? 900 : 844); try { w._uxSync && w._uxSync(); } catch (e) {}
  const g = w._p2G(); g.ans = { housing_type: '賃貸', housing_cost: 17, food_cost: 30, transport: '外車', car_name: 'レンジローバー', car_loan: { price: 1500, down: 0, years: 5, rate: 3, insurance: 3, parking: 2, gas: 2 }, extra: [{ t: '推し活', v: 6, m: '' }] }; g.p1 = false;
  w.switchView('plan'); w.p2Go('ideal', 0); await sleep(80);
  const tag = pc ? 'PC：' : 'スマホ：';
  const t0 = w._p2GwTotal();
  let r = row('#p2IdList .p2id-r', /住まい/), v = r.querySelector('.p2amt');
  c(tag + '金額に「押して直せる」しるし（点線）', !!v && /17万/.test(v.textContent));
  w._p2GwStep = w.P2GW_Q.findIndex(q => q.id === 'travel_freq'); w._p2GwRender(); await sleep(10);
  const st0 = w._p2GwStep;
  v.click(); await sleep(10);
  let inp = r.querySelector('.p2amt-in');
  c(tag + '金額を押すと入力欄（今の金額・数字のキーボード）', !!inp && inp.value === '17' && inp.getAttribute('inputmode') === 'numeric');
  c(tag + '金額を押しても質問の画面には移らない', w._p2GwStep === st0 && w.P2GW_Q[st0].id === 'travel_freq');
  inp.value = '25'; key(inp, 'Enter'); await sleep(20);
  c(tag + 'Enterで保存・合計も変わる', g.ans.housing_cost === 25 && w._p2GwTotal() === t0 + 8 && /25万/.test(row('#p2IdList .p2id-r', /住まい/).textContent) && /万円\/月/.test($('#p2IdList .p2id-h').textContent));
  c(tag + '中身（賃貸）はそのまま', g.ans.housing_type === '賃貸');
  r = row('#p2IdList .p2id-r', /食/); r.querySelector('.p2amt').click(); await sleep(10);
  inp = r.querySelector('.p2amt-in'); inp.value = '99'; key(inp, 'Escape'); await sleep(20);
  c(tag + 'Escでやめると元のまま', g.ans.food_cost === 30 && !$('#p2IdList .p2amt-in'));
  r = row('#p2IdList .p2id-r', /食/); r.querySelector('.p2amt').click(); await sleep(10);
  inp = r.querySelector('.p2amt-in'); inp.value = '1500'; inp.dispatchEvent(new w.Event('blur')); await sleep(20);
  c(tag + '外を押しても保存・999万まで', g.ans.food_cost === 999);
  r = row('#p2IdList .p2id-r', /ファッション/); r.querySelector('.p2amt').click(); await sleep(10);
  inp = r.querySelector('.p2amt-in'); inp.value = '12'; key(inp, 'Enter'); await sleep(20);
  c(tag + 'まだ答えていない分野も金額だけ入れられる', g.ans.clothes_cost === 12);
  r = row('#p2IdList .p2id-r', /推し活/); r.querySelector('.p2amt').click(); await sleep(10);
  inp = r.querySelector('.p2amt-in'); inp.value = '8'; key(inp, 'Enter'); await sleep(20);
  c(tag + '自分で足した項目も金額だけ直せる', g.ans.extra[0].v === 8 && g.ans.extra[0].t === '推し活');
  // 車（ローン・保険などの合計）はローンの画面へ
  r = row('#p2IdList .p2id-r', /移動/); r.querySelector('.p2amt').click(); await sleep(30);
  c(tag + '車の金額はローンの画面を開く（1500万の車も入る）', w.P2GW_Q[w._p2GwStep].id === 'car_loan' && !!$('#p2glP') && $('#p2glP').value === '1500' && !$('#p2glP').getAttribute('max'));
  // 理想の生活シート
  w.p2LifeOpen(); await sleep(40);
  r = row('#p2LfBody .p2lf-row', /住まい/); r.querySelector('.p2amt').click(); await sleep(10);
  inp = r.querySelector('.p2amt-in');
  c(tag + '理想の生活シートでも金額を押すと入力欄（行は開かない）', !!inp && !r.classList.contains('open'));
  inp.value = '40'; key(inp, 'Enter'); await sleep(20);
  c(tag + '理想の生活シートで保存', g.ans.housing_cost === 40 && /40万/.test(row('#p2LfBody .p2lf-row', /住まい/).textContent));
  r = row('#p2LfBody .p2lf-row', /移動/); r.querySelector('.p2amt').click(); await sleep(20);
  c(tag + 'シートの車はローンの欄を開く', row('#p2LfBody .p2lf-row', /移動/).classList.contains('open') && !!$('#p2LfBody .p2lf-loan'));
  w.p2LifeClose(); await sleep(20);
}
T.run(async () => {
  T.login();
  await run(false);
  await run(true);
});
