// v925：カレンダーの繰り返しに「平日（月〜金）」。予定の名前は見本
const T = require('../lib/head.js')({ now: '2026-11-26T03:00:00Z' });
const { w, c, sleep, $ } = T;
T.run(async () => {
  T.login();
  w.state.events = [];
  const add = async (title, date, until) => {
    w.eaOpen({}); await sleep(30);
    w._ef.o.date = date; if ($('#efTitle')) $('#efTitle').value = title; w._ef.o.title = title; w._ef.o.time = '09:00';
    w.efRep('wd'); w.efRepUntil(until); await sleep(10);
    w.efSave(); await sleep(150);
    return w.state.events.filter(e => e.title === title).map(e => e.date).sort();
  };
  c('繰り返しの選び方に「平日（月〜金）」がある（新しい画面・前の画面とも）', w.EV_REP.some(x => x[0] === 'wd' && /平日/.test(x[1])) && !!w.document.querySelector('#evRepeat option[value="wd"]'));
  const a = await add('見本の朝会', '2026-11-27', '2026-12-08'); // 金曜から
  c('金曜から始めると、土日を飛ばして月〜金だけに入る', a.join() === '2026-11-27,2026-11-30,2026-12-01,2026-12-02,2026-12-03,2026-12-04,2026-12-07,2026-12-08', a.join());
  const days = a.map(d => new Date(d + 'T12:00:00').getDay());
  c('土曜（6）・日曜（0）は1つも無い', !days.some(x => x === 0 || x === 6));
  const b = await add('見本の朝練', '2026-11-28', '2026-12-02'); // 土曜から
  c('土曜から始めると、1回目は次の月曜にする', b.join() === '2026-11-30,2026-12-01,2026-12-02', b.join());
  const one = w.state.events.find(e => e.title === '見本の朝会' && e.date === '2026-11-30');
  c('🔁 の札は「平日」', /平日/.test(w._tdSeriesMark(one)), w._tdSeriesMark(one));
  const m = await (async () => { w.eaOpen({}); await sleep(30); w._ef.o.date = '2026-11-27'; if ($('#efTitle')) $('#efTitle').value = '見本の毎日'; w._ef.o.title = '見本の毎日'; w.efRep('d'); w.efRepUntil('2026-11-30'); w.efSave(); await sleep(150); return w.state.events.filter(e => e.title === '見本の毎日').map(e => e.date).sort(); })();
  c('毎日は今まで通り土日も入る', m.join() === '2026-11-27,2026-11-28,2026-11-29,2026-11-30', m.join());
});
