// index.html に app.js を埋め込んで返す（外部スクリプトは外す）
const fs = require('fs');
const path = require('path');
module.exports = function () {
  const DIR = path.resolve(__dirname, '../../..');
  let html = fs.readFileSync(DIR + '/index.html', 'utf8');
  const js = fs.readFileSync(DIR + '/app.js', 'utf8').replace(/<\/script/gi, '<\\/script');
  html = html.replace(/<script src="https?:[^"]*"[^>]*><\/script>/g, '');
  html = html.replace(/<script src="app\.js\?v=[^"]*"><\/script>/, () => '<script>' + js + '\n</script>');
  return html;
};
