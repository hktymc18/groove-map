---
name: verify-groove-map
description: GROOVE MAP（NAVIGATOR 本体 app.js・index.html）・受付 BASE CHECK-IN（checkin/index.html）・firestore.rules・sw.js を変えた時の確かめ方。テストの起動、正しい物が動いているかの診断、テスト・画面写真・ルールのエミュレータ、PR に書く証拠、片付けまで。変更をコミット・PR にする前に使う。
---

# GROOVE MAP の確かめ方

5つの段階で進める：**起動 → 診断 → 操作 → 証拠 → 片付け**。
コマンドはすべてリポジトリの一番上（`groove-map/`）で実行する。テストのデータは架空のものだけ（個人情報は使わない・書かない）。

## 1. 起動

```bash
git status --short                    # 自分の変更だけか確認（out/ や node_modules が出ないこと＝.gitignore 済み）
git rev-parse --short HEAD            # 確かめるコミット（PR の「確かめたコミット」に書く）
(cd tools/test && npm install --no-audit --no-fund)   # jsdom を入れる。run.sh も無ければ自動で入れる
```

画面をブラウザで見たい時だけローカルサーバ（`.claude/launch.json` と同じ 8765 番）：

```bash
python3 -m http.server 8765 >/dev/null 2>&1 & echo $! > tools/test/out/server.pid   # 自分が起動した印に PID を残す
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8765/index.html         # 200 なら起動済み
```

- Firebase は本番につながるので、ローカルサーバでログインして本番データを触らない。見た目の確認は下の `shot.js` / `ckcard.js`（Firebase はスタブ・架空データ）を使う。

## 2. 診断（正しい物が動いているか・使えない環境の見分け方）

```bash
grep -c "url.pathname.indexOf('/checkin') >= 0" sw.js        # 必ず 1
grep -o "CACHE = 'groove-map-v[0-9]*'" sw.js; grep -o "APP_JS_VERSION = 'v[0-9]*'" app.js; grep -o "GM_EXPECT_JS='v[0-9]*'" index.html   # 3つの版がそろう
node tools/test/tests/smoke_test.js | tail -1                  # ALL PASS（読み込み・版・/checkin 除外を見る）
grep -o "APP_VER = 'v[0-9]*'" checkin/index.html               # 受付を変えた時は上がっているか
curl -s http://127.0.0.1:8765/sw.js | grep -c "/checkin"       # サーバを立てた時：配っている物がこの作業ツリーのものか
```

使えない環境の見分け方（使えない時は無理に回避せず、PR の「まだ確かめていないこと」に理由を書く）：

| 症状 | 意味 | どうするか |
|---|---|---|
| `npm install` が止まる・ETIMEDOUT・403 | ネットワークで npm に出られない | テスト不可。PR に「npm に出られず未実行」と書く |
| `node -v` が 18 未満・無い | node が古い | テスト不可（jsdom 24 は node 18 以上） |
| shot.js が `Cannot find module '/opt/node22/lib/node_modules/playwright'` / `Executable doesn't exist` | Playwright・Chromium が無い | 写真は取れない。テストだけで進め、写真は「未確認」に |
| `which java` が空 | Java が無い | ルールのエミュレータは不可。ルールは目で読んだだけと書く |
| `firebase setup:emulators:firestore` が失敗 | エミュレータの jar を落とせない | 同上 |
| 本番 URL（github.io）に curl がつながらない | この環境から本番へ出られない | 公開の確認は `tools/test/waitdeploy.sh`（gh api で main の中身を見る）で代える |

## 3. 操作

```bash
bash tools/test/run.sh                         # 全テスト（tests/*_test.js を並列）。FAIL だけ表示し最後に "PASS N FAIL M:…"
node tools/test/tests/ck829_test.js            # 1本だけ（変えた所に近いテストを先に回すと早い）
bash tools/hooks/guard_test.sh                 # 自動の実行の見張り（フック）だけ確かめる → "PASS N FAIL 0"
```

- 新しい動きには `tools/test/tests/<略号><版>_test.js` を足す（書き方は `tools/test/README.md`）。
- 画面写真（Firebase はスタブ・架空データ。出力は `tools/test/out/`）：

```bash
# NAVIGATOR 本体
VIEW=events VW=390 VH=844 PFX=cal SHOTS='[["month","setTheme(\"light\");setEventsMode(\"calendar\")"]]' node tools/test/shot/shot.js
#   → tools/test/out/cal_month.png（横向きは VW=844 VH=390）
# 受付の会員証
CASES='[["gold",{"cardTitle":"GOLD","badges":["EXPERT"]}]]' DARK=1 node tools/test/shot/ckcard.js
#   → tools/test/out/ck_gold.png（HASH='' で管理画面・FULL=1 でページ全体）
```

- 写真は Read で開いて自分の目で見る（崩れ・はみ出し・ダーク/ライト両方）。
- 本体の写真が「アップデート（vNNN）」のお知らせに隠れていたら、SHOTS の JS の先頭でお知らせを閉じる（2026/11 に実際に起きた）：
  `_rnMarkSeen();[].forEach.call(document.querySelectorAll(\"button,a,span,div\"),function(b){if(b.children.length===0&&b.textContent.trim()===\"閉じる\"&&b.offsetParent)b.click()});` を `setTheme(...)` の前に足す。

### firestore.rules をエミュレータで試す（手順）

```bash
E=/tmp/fbemu; mkdir -p $E && (cd $E && npm i firebase-tools@13 @firebase/rules-unit-testing@3 firebase@10 && npx firebase setup:emulators:firestore)
java -jar ~/.cache/firebase/emulators/cloud-firestore-emulator-*.jar --host 127.0.0.1 --port 8089 >/dev/null 2>&1 & echo $! > tools/test/out/emu.pid
NODE_PATH=$E/node_modules node tools/test/rules/ckpf109_rules.js     # 既存のルールテスト。変えた所には rules/<名前>_rules.js を足す
```

## 4. 証拠

- テスト：`bash tools/test/run.sh` の**最後の行が `PASS N FAIL 0`**（N は本数。FAIL の後ろに名前が無い）。この行をそのまま PR に貼る。
- 各テストの全出力：`tools/test/out/<テスト名>.txt`（CI では Artifacts の `test-out`）。
- 写真：`tools/test/out/*.png`。コミットはしない（.gitignore 済み）。PR に貼るか、場所とファイル名を書く。
- PR は `.github/pull_request_template.md` の形で、上の結果と「確かめたコミット」を書く。

### 変更の種類ごとに必要な証拠

| 変えた物 | 必要な証拠 |
|---|---|
| NAVIGATOR 本体（app.js・ルートの index.html） | `run.sh` が PASS N FAIL 0／変えた動きのテストを足して PASS／見た目を変えたら `shot.js` の写真（スマホ縦・必要なら横・ライト/ダーク）／版を上げたら `smoke_test.js` が ALL PASS（`tools/test/bump.py` で上げる）／`grep -c "url.pathname.indexOf('/checkin') >= 0" sw.js` が 1 |
| 受付（checkin/index.html） | `run.sh` が PASS N FAIL 0（ck*_test.js を含む）／見た目を変えたら `ckcard.js` の写真／ユーザーに見える変更なら `APP_VER` を1つ上げ `CHANGELOG` 先頭に追記したこと／`grep -c "url.pathname.indexOf('/checkin') >= 0" sw.js` が 1 |
| firestore.rules | エミュレータのルールテスト（許す・拒むの両方）が全部 PASS。環境で無理なら「未確認（理由）」／`run.sh` が PASS N FAIL 0／オーナーへ Cloud Shell の `firebase deploy --only firestore:rules,firestore:indexes` を依頼（CLAUDE.md の手順）／`grep -c "url.pathname.indexOf('/checkin') >= 0" sw.js` が 1 |
| sw.js | **`grep -c "url.pathname.indexOf('/checkin') >= 0" sw.js` が 1**／CACHE 名を上げた（`smoke_test.js` で版がそろう）／`run.sh` が PASS N FAIL 0 |

## 5. 片付け

自分が起動したものだけ止める（PID を残した物だけ。他の人・他の作業のサーバは止めない）：

```bash
for f in tools/test/out/server.pid tools/test/out/emu.pid; do [ -f $f ] && kill $(cat $f) 2>/dev/null; rm -f $f; done
git status --short        # 自分の変更以外（out/・node_modules・写真）が出ていないこと
```

- `tools/test/out/` と `node_modules` は消さなくてよい（.gitignore 済み・次回が速い）。
- コミットは `git add <ファイル名>` で1つずつ（`git add -A` は使わない）。
