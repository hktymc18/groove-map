## 何を変えたか
<!-- ユーザーから見て何が変わるか。アプリの見た目・動きを変えない時はそう書く -->

## 確かめたコミット
<!-- 確かめた時の HEAD の SHA（git rev-parse --short HEAD） -->

## 実行したコマンドと結果
<!-- 例：bash tools/test/run.sh → PASS 160 FAIL 0 ／ grep -c "url.pathname.indexOf('/checkin') >= 0" sw.js → 1 -->

## 証拠（写真・ログの場所）
<!-- 例：tools/test/out/xxx.png（PR に貼った写真）、CI の test-out -->

## まだ確かめていないこと（理由つき）
<!-- 例：iPhone 実機（この環境では無理）、本番データでの動き（個人情報のため） -->

## 残っている危険
<!-- 壊れるとしたらどこか・迷って安全な方を選んだ所 -->

## オーナーがやること（デプロイ・実機確認など）
<!-- 例：firestore.rules を変えた → Cloud Shell で firebase deploy --only firestore:rules,firestore:indexes ／ マージ（自動の実行ではマージしない） -->
