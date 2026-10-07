// v670：プロフィールの名前の変更を ATTACK LIST・GOAL SETTING にも反映（displayName も保存）
const T = require('../lib/head.js')();
const { w, c } = T;
T.run(async () => {
  c('プロフィール保存で name と displayName を両方保存', /name: name, displayName: name/.test(String(w.saveProfile)));
});
