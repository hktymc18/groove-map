#!/bin/bash
# 公開の確認： bash tools/test/waitdeploy.sh <mainのコミットSHA> v614
# GitHub Pages のデプロイ完了を待ち、本番の index.html にそのバージョンが出ているか数える（3なら反映済み）
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
for i in $(seq 1 30); do
  n=$(curl -s "https://hktymc18.github.io/groove-map/index.html?nc=$RANDOM$RANDOM" | grep -c "$V")
  if [ "$n" -ge 3 ]; then echo "$n"; exit 0; fi
  sleep 10
done
echo "$n"; exit 1
