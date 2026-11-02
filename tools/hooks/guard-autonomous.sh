#!/bin/bash
# 自動の実行（スケジュール実行・brain のタスクの自動実行）のときだけ、マージ・main への push・強制 push を止める。
# 目印：<リポジトリ>/.claude/autonomous.flag（自動の実行が最初に作る。.gitignore 済み）。無ければ何も止めない。
# Claude Code の PreToolUse フック。標準入力にツール呼び出しの JSON が来る。止めるときは exit 2 で理由を stderr に返す。
# テスト：bash tools/hooks/guard_test.sh
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FLAG="${GUARD_FLAG:-$ROOT/.claude/autonomous.flag}"
[ -f "$FLAG" ] || exit 0
# 目印があるのに判定できないときは安全側（止める）
command -v node >/dev/null 2>&1 || { echo "自動の実行中（.claude/autonomous.flag あり）だが node が無く判定できないため止めました" >&2; exit 2; }
BR="${GUARD_BRANCH:-$(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null)}"
INPUT="$(cat)"
BR="$BR" node -e '
var raw = process.argv[1], br = process.env.BR || "";
var j; try { j = JSON.parse(raw); } catch (e) { console.error("自動の実行中：ツール呼び出しを読めないため止めました"); process.exit(2); }
var tool = j.tool_name || "", ti = j.tool_input || {};
function stop(why) { console.error("自動の実行中（.claude/autonomous.flag あり）なので止めました：" + why + "。マージ・main への反映はオーナーが行います（タスクに #自動マージOK がある時だけ例外）。"); process.exit(2); }
function isMain(r) { return /^(refs\/heads\/)?main$/.test(String(r || "")); }
// MCP（GitHub）
if (/merge_pull_request$/.test(tool)) stop("PR のマージ（" + tool + "）");
if (/enable_pr_auto_merge$/.test(tool)) stop("自動マージの有効化（" + tool + "）");
if (/(push_files|create_or_update_file|delete_file)$/.test(tool) && isMain(ti.branch)) stop("main への直接の書き込み（" + tool + "）");
if (tool !== "Bash") process.exit(0);
var cmd = String(ti.command || "");
// 区切り（; && || | 改行）でばらし、空白で単語に（引用符は外す）
var parts = cmd.split(/&&|\|\||[;|\n]/);
for (var i = 0; i < parts.length; i++) {
  var w = (parts[i].match(/"[^"]*"|\x27[^\x27]*\x27|\S+/g) || []).map(function (s) { return s.replace(/^["\x27]|["\x27]$/g, ""); });
  // 先頭の env 代入・sudo などを飛ばす
  while (w.length && (/^[A-Za-z_][A-Za-z0-9_]*=/.test(w[0]) || /^(sudo|env|command|exec|time|nohup|\(|\{)$/.test(w[0]))) w.shift();
  if (!w.length) continue;
  var p = w[0].replace(/^\(+/, "").replace(/^.*\//, "");
  if (p === "gh") {
    var s = w.slice(1).join(" ");
    if (/(^|\s)pr\s+merge(\s|$)/.test(s)) stop("gh pr merge");
    if (/(^|\s)api(\s|$)/.test(s) && /pulls\/[^\s\/]+\/merge/.test(s)) stop("gh api での PR マージ");
    if (/(^|\s)api(\s|$)/.test(s) && /enablePullRequestAutoMerge|mergePullRequest/.test(s)) stop("gh api での（自動）マージ");
    continue;
  }
  if (/^(curl|wget)$/.test(p) && /pulls\/[^\s\/]+\/merge/.test(parts[i])) stop("API での PR マージ");
  if (p !== "git") continue;
  // git のオプション（-C dir・-c k=v など）を飛ばして push を探す
  var k = 1; while (k < w.length && /^-/.test(w[k])) { if (/^-(C|c)$/.test(w[k]) || /^--(git-dir|work-tree|namespace)$/.test(w[k])) k++; k++; }
  if (w[k] !== "push") continue;
  var args = w.slice(k + 1), pos = [];
  for (var a = 0; a < args.length; a++) {
    var x = args[a];
    if (/^--force(-with-lease|-if-includes)?(=|$)/.test(x) || /^-[A-Za-z]*f[A-Za-z]*$/.test(x)) stop("強制 push（" + x + "）");
    if (/^--(mirror|all|delete)$/.test(x) || /^-[A-Za-z]*d[A-Za-z]*$/.test(x)) stop("git push " + x);
    if (/^(--repo|--receive-pack|--exec|--push-option|-o)$/.test(x)) { a++; continue; }
    if (/^-/.test(x)) continue;
    pos.push(x);
  }
  var refs = pos.slice(1);   // 先頭は送り先（origin など）
  for (var r = 0; r < refs.length; r++) {
    var rf = refs[r];
    if (/^\+/.test(rf)) stop("強制 push（" + rf + "）");
    var dst = rf.indexOf(":") >= 0 ? rf.slice(rf.lastIndexOf(":") + 1) : rf;
    if (isMain(dst) || (rf === "HEAD" && br === "main")) stop("main への push（" + rf + "）");
  }
  if (!refs.length && br === "main") stop("main ブランチにいる状態での git push（送り先が main になる）");
}
process.exit(0);
' "$INPUT"
