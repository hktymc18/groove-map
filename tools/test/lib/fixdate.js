// GM_FIXED_NOW の時刻に Date を固定（new Date() と Date.now()）
module.exports = function (w) {
  const fixed = process.env.GM_FIXED_NOW;
  if (!fixed) return;
  const T = new Date(fixed).getTime();
  const RD = w.Date;
  function FD(...a) { if (!(this instanceof FD)) return new RD(T).toString(); return a.length ? new RD(...a) : new RD(T); }
  FD.prototype = RD.prototype; FD.now = () => T; FD.UTC = RD.UTC; FD.parse = RD.parse;
  w.Date = FD;
};
