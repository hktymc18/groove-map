const { record } = require('./rig');
const { DEMOS } = require('./demos');
(async () => {
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(DEMOS);
  for (const id of ids) {
    const d = DEMOS[id];
    try { await record(Object.assign({ id }, d)); } catch (e) { console.log(id + ': FAILED ' + e.message.split('\n')[0]); }
  }
})();
