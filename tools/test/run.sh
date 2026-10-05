#!/bin/bash
# 全テストを並列で実行（tests/*_test.js）。結果は out/ に保存し、FAILだけ表示
cd "$(dirname "$0")"
[ -d node_modules/jsdom ] || npm install --no-audit --no-fund >/dev/null 2>&1
mkdir -p out
P=${P:-6}
ls tests/*_test.js | xargs -P "$P" -I{} sh -c 'n=$(basename {} .js); node {} > out/$n.txt 2>&1; echo "$? $n" >> out/_rc.$$' 
pass=0; fail=0; failed=""
for f in tests/*_test.js; do n=$(basename $f .js); if tail -1 out/$n.txt | grep -q "ALL PASS"; then pass=$((pass+1)); else fail=$((fail+1)); failed="$failed $n"; echo "=== $n"; grep -E "^FAIL|exception" out/$n.txt | head -10; fi; done
rm -f out/_rc.*
echo "PASS $pass FAIL $fail:$failed"
[ $fail -eq 0 ]
