// v862：カレンダーの予定の帯は、最初から「時間の長さで伸ばす」（自分で「固定（1行）」を選んだ人はそのまま）
const T = require('../lib/head.js')();
const { w, c, sleep, setWH, $ } = T;
T.run(async () => {
  T.login(); setWH(390, 844);
  c('設定していない端末は「時間の長さで伸ばす」', w.localStorage.getItem('gm_barDur') === null && w._calBarDur === true);
  w.switchView('events'); w.setEventsMode('calendar'); await sleep(40);
  w.openCalSettings(); await sleep(20);
  const all = () => w.document.querySelectorAll('#calSetOv'), ov = () => all()[all().length - 1];
  const sel = () => Array.from(ov().querySelectorAll('.rb.sel')).map(x => x.textContent).join('|');
  c('設定の画面でも「時間の長さで伸ばす」が選ばれている', /時間の長さで伸ばす/.test(sel()) && !/固定（1行）/.test(sel()));
  w.setBarDur(false); await sleep(20);
  c('「固定（1行）」を選ぶと保存', w.localStorage.getItem('gm_barDur') === '0' && w._calBarDur === false && /固定（1行）/.test(sel()));
  // 次に開いた時の読み方（「0」だけ固定。前に「1」を選んだ人・何も選んでいない人は伸ばす）
  const src = require('fs').readFileSync(require('path').join(__dirname, '../../../app.js'), 'utf8');
  const line = src.match(/try \{ _calBarDur = (localStorage\.getItem\('gm_barDur'\)[^;]*); \}/)[1];
  const read = v => { w.localStorage.removeItem('gm_barDur'); if (v !== null) w.localStorage.setItem('gm_barDur', v); return w.eval(line); };
  c('次に開いた時：固定を選んだ人は固定のまま', read('0') === false);
  c('次に開いた時：前に「伸ばす」を選んだ人・まだ選んでいない人は伸ばす', read('1') === true && read(null) === true);
  w.closeCalSettings();
});
