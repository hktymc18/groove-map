#!/bin/bash
# 公開の確認： bash tools/test/waitdeploy.sh <mainのコミットSHA> v614
# GitHub Pages のデプロイ（pages build and deployment）完了を待ち、そのコミットの index.html にバージョンが出ているか数える（3なら反映済み）
SHA=$1; V=$2
for i in $(seq 1 60); do
  r=$(gh api "repos/hktymc18/groove-map/actions/runs?head_sha=$SHA" 2>/dev/null | python3 -c 'import sys,json
try:
  d=json.load(sys.stdin); rs=[x for x in d.get("workflow_runs",[]) if "pages" in (x.get("name","")+x.get("path","")).lower()] or d.get("workflow_runs",[])
  print(rs[0]["status"], rs[0]["conclusion"]) if rs else print("none")
except Exception: print("none")')
  if [[ "$r" == completed* ]]; then echo "$r"; break; fi
  sleep 10
done
# 本番（github.io）へはこの環境から直接つなげないことがあるので、mainのindex.htmlに出ている数で確認
n=$(gh api "repos/hktymc18/groove-map/contents/index.html?ref=$SHA" -H "Accept: application/vnd.github.raw" 2>/dev/null | grep -c "$V")
echo "$n"; [ "$n" -ge 3 ]
