#!/bin/bash
# guard-autonomous.sh を直接呼んで確かめる。本物の目印には触らず、仮の目印（GUARD_FLAG）で試す。
# 使い方: bash tools/hooks/guard_test.sh   → 最後の行が "PASS N FAIL 0"
H="$(cd "$(dirname "$0")" && pwd)/guard-autonomous.sh"
T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT
pass=0; fail=0
js() { node -e 'console.log(JSON.stringify({tool_name:process.argv[1],tool_input:JSON.parse(process.argv[2])}))' "$1" "$2"; }
# chk <期待 0|2> <目印 on|off> <ブランチ> <ツール> <tool_input JSON>
chk() {
  local want=$1 fl=$2 br=$3 tool=$4 inp=$5 got
  [ "$fl" = on ] && touch "$T/flag" || rm -f "$T/flag"
  js "$tool" "$inp" | GUARD_FLAG="$T/flag" GUARD_BRANCH="$br" bash "$H" 2>"$T/err"; got=$?
  if [ "$got" = "$want" ]; then pass=$((pass+1)); else fail=$((fail+1)); echo "FAIL 期待$want 実際$got [$fl $br] $tool $inp $(cat "$T/err")"; fi
}
B() { node -e 'console.log(JSON.stringify({command:process.argv[1]}))' "$1"; }
W=claude/work
# --- 目印あり：止める
for c in "gh pr merge 12 --merge" "gh pr merge --auto --squash" "cd x && gh pr merge 3" \
         "git push origin main" "git push origin HEAD:main" "git push -u origin main" "git push origin feat:refs/heads/main" \
         "git push --force origin $W" "git push -f origin $W" "git push --force-with-lease origin $W" "git push origin +$W" \
         "git -C /x push origin main" "FOO=1 git push origin main" "git push --mirror origin" "git push origin :main" \
         "gh api -X PUT repos/o/r/pulls/5/merge" "curl -X PUT https://api.github.com/repos/o/r/pulls/5/merge"; do
  chk 2 on $W Bash "$(B "$c")"; done
chk 2 on main Bash "$(B "git push")"
chk 2 on main Bash "$(B "git push -u origin HEAD")"
chk 2 on $W mcp__github__merge_pull_request '{"owner":"o","repo":"r","pullNumber":1}'
chk 2 on $W mcp__github__enable_pr_auto_merge '{"owner":"o","repo":"r","pullNumber":1}'
chk 2 on $W mcp__github__push_files '{"branch":"main","files":[]}'
# --- 目印あり：通す（作業ブランチへの push・普通の操作）
for c in "git push -u origin $W" "git push origin HEAD" "git push" "git status" "git commit -m 'main への push は禁止'" \
         "bash tools/test/run.sh" "gh pr create --base main" "gh pr view 3" "git merge origin/main" "echo gh pr merge" "git fetch origin main"; do
  chk 0 on $W Bash "$(B "$c")"; done
chk 0 on $W mcp__github__create_pull_request '{"base":"main","head":"x"}'
chk 0 on $W mcp__github__push_files "{\"branch\":\"$W\",\"files\":[]}"
chk 0 on $W Read '{"file_path":"/x"}'
# --- 目印なし：何も止めない
for c in "gh pr merge 12 --merge" "git push origin main" "git push --force origin $W"; do chk 0 off $W Bash "$(B "$c")"; done
chk 0 off main Bash "$(B "git push")"
chk 0 off $W mcp__github__merge_pull_request '{"pullNumber":1}'
chk 0 off $W mcp__github__enable_pr_auto_merge '{"pullNumber":1}'
# --- 止めた時は理由を返す
touch "$T/flag"; r=$(js Bash "$(B "gh pr merge 1")" | GUARD_FLAG="$T/flag" bash "$H" 2>&1 >/dev/null)
if echo "$r" | grep -q "autonomous.flag"; then pass=$((pass+1)); else fail=$((fail+1)); echo "FAIL 理由が出ない: $r"; fi
echo "PASS $pass FAIL $fail"
[ $fail -eq 0 ]
