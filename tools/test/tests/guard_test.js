// 自動の実行の見張り（tools/hooks/guard-autonomous.sh）をフックとして直接呼んで確かめる
const r = require('child_process').spawnSync('bash', [__dirname + '/../../hooks/guard_test.sh'], { encoding: 'utf8' });
process.stdout.write(r.stdout + r.stderr);
const last = (r.stdout.trim().split('\n').pop() || '');
console.log(r.status === 0 && / FAIL 0$/.test(last) ? 'ALL PASS' : 'FAIL guard_test.sh');
process.exit(r.status === 0 ? 0 : 1);
