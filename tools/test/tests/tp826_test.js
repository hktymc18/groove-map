// v826：PCの時刻入力を全部「手入力＋時・分を別々に選ぶ（15分刻み・時は10時のあたりから）」に統一
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $, $$ } = T;
T.run(async () => {
  T.login(); setWH(1440, 900);
  w.isPCMode = () => true;
  const pop = () => w.document.querySelector('.pctp');
  const pick = (k, v) => { const it = pop().querySelector('[data-' + k + '="' + v + '"]'); it.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); };
  // ① 予定の入力（開始・終了）
  w.openEventModal(null, '', '2026-10-20', 'event'); await sleep(30);
  w._pcTimeInputs(['evTime', 'evTimeEnd']);
  const st = w.document.getElementById('evTime'), en = w.document.getElementById('evTimeEnd');
  st.value = ''; en.value = '';
  st.onclick(); await sleep(5);
  c('時刻欄を押すと「時」「分」の2列が出る（分は15分刻み）', !!pop() && /時/.test(pop().querySelector('[data-c="h"] .hd').textContent) && pop().querySelectorAll('[data-h]').length === 24 && pop().querySelectorAll('[data-m]').length === 4 && /00分15分30分45分/.test(pop().querySelector('[data-c="m"]').textContent));
  c('手入力もできる（読み取り専用ではない）', !st.readOnly);
  pick('h', 19); await sleep(5);
  c('時を選ぶと 19:00・続けて分を選べる（閉じない）', st.value === '19:00' && !!pop());
  pick('m', 30); await sleep(5);
  c('分を選ぶと 19:30 で閉じる・終了は +1時間', st.value === '19:30' && !pop() && en.value === '20:30');
  en.value = ''; st.value = ''; st.onclick(); await sleep(5);
  pick('m', 15); await sleep(5);
  c('時を選ばずに分を選ぶと 10時（最初の位置）', st.value === '10:15');
  c('何も入っていない時は10時のあたりから（10時の行がある）', (() => { st.value = ''; st.onclick(); return !!pop().querySelector('[data-h="10"]'); })());
  w._pcTimeDropClose();
  st.focus(); st.value = '1930'; st.dispatchEvent(new w.Event('blur')); await sleep(5);
  c('手入力「1930」は 19:30 に整える', st.value === '19:30');
  try { w.closeEventModal(true); } catch (e) {}
  // ② 数字のパッドだった欄（タスク・新しい予定の画面・OLなど）もPCは同じ形
  const inp = w.document.createElement('input'); inp.id = 'tkT'; inp.readOnly = true; w.document.body.appendChild(inp);
  let done = 0; w._tkPadDone = () => { done++; };
  w.openTimePad('tkT'); await sleep(5);
  c('PCは数字のパッドではなく「時」「分」を選ぶ', !w.document.getElementById('tpOv') && !!pop() && !inp.readOnly);
  pick('h', 9); pick('m', 45); await sleep(5);
  c('選び終わったら保存の処理が1回動く', inp.value === '09:45' && done === 1);
  inp.dispatchEvent(new w.Event('blur')); await sleep(5);
  c('そのあと欄から外れても二重に保存しない', done === 1);
  // ③ ブラウザ標準の時刻欄（type=time）
  const nt = w.document.createElement('input'); nt.type = 'time'; let chg = ''; nt.addEventListener('change', () => { chg = nt.value; }); w.document.body.appendChild(nt);
  nt.dispatchEvent(new w.MouseEvent('mousedown', { bubbles: true })); await sleep(5);
  c('type=time の欄も同じ形（手入力できる文字の欄に）', nt.type === 'text' && !!pop());
  pick('h', 14); pick('m', 0); await sleep(5);
  c('選ぶと変更の処理（onchange）が動く', chg === '14:00');
  // ④ 企画書の「時」「分」の欄
  const th = w.document.createElement('input'); th.id = 'otlTH_k1'; const tm = w.document.createElement('input'); tm.id = 'otlTM_k1'; w.document.body.appendChild(th); w.document.body.appendChild(tm);
  let fixed = ''; w.otlTimeFix = k => { fixed = k + ':' + th.value + ':' + tm.value; };
  th.dispatchEvent(new w.FocusEvent('focusin', { bubbles: true })); await sleep(5);
  pick('h', 9); pick('m', 15); await sleep(5);
  c('企画書の時・分の欄も選べる（時と分に分かれて入る）', th.value === '9' && tm.value === '15' && fixed === 'k1:9:15');
  // ⑤ 外を押すと閉じる
  nt.dispatchEvent(new w.MouseEvent('mousedown', { bubbles: true })); await sleep(5);
  w.document.body.dispatchEvent(new w.MouseEvent('mousedown', { bubbles: true })); await sleep(5);
  c('外を押すと閉じる', !pop());
  // ⑥ スマホは今までどおり数字のパッド
  w.isPCMode = () => false;
  w.openTimePad('tkT'); await sleep(5);
  c('スマホは今までどおり数字のパッド', !!w.document.getElementById('tpOv'));
  w.closeTimePad(false);
});
