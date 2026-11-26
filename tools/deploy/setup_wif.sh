#!/bin/bash
# Firestore のルールを GitHub から自動でデプロイするための、最初の1回だけの設定（オーナーが Cloud Shell で実行）
#   bash ~/groove-map/tools/deploy/setup_wif.sh
# 作る物：
#   ・デプロイ専用のサービスアカウント github-deploy-rules（できるのは ルールの更新・索引の更新 だけ。データは読めない）
#   ・GitHub の hktymc18/groove-map の main ブランチから動いた時だけ、そのアカウントを使える連携（鍵は作らない）
# 何回実行しても大丈夫（もうある物は飛ばす）
set -u
PROJECT=hotlist-21865
REPO=hktymc18/groove-map
SA=github-deploy-rules
SA_EMAIL=$SA@$PROJECT.iam.gserviceaccount.com
POOL=github
PROVIDER=groove-map

gcloud config set project $PROJECT >/dev/null
PN=$(gcloud projects describe $PROJECT --format='value(projectNumber)')
echo "▶ プロジェクト $PROJECT（番号 $PN）"

echo "▶ 使う機能をオンにする"
gcloud services enable iamcredentials.googleapis.com sts.googleapis.com firebaserules.googleapis.com firestore.googleapis.com

echo "▶ デプロイ専用のアカウント"
gcloud iam service-accounts describe $SA_EMAIL >/dev/null 2>&1 \
  || gcloud iam service-accounts create $SA --display-name="GitHub Actions: Firestore rules deploy"

echo "▶ できることを、ルール・索引の更新だけにする"
for R in roles/firebaserules.admin roles/datastore.indexAdmin roles/serviceusage.serviceUsageConsumer; do
  gcloud projects add-iam-policy-binding $PROJECT --member="serviceAccount:$SA_EMAIL" --role=$R --condition=None >/dev/null && echo "  $R"
done

echo "▶ GitHub との連携（鍵なし）"
gcloud iam workload-identity-pools describe $POOL --location=global >/dev/null 2>&1 \
  || gcloud iam workload-identity-pools create $POOL --location=global --display-name="GitHub"
gcloud iam workload-identity-pools providers describe $PROVIDER --location=global --workload-identity-pool=$POOL >/dev/null 2>&1 \
  || gcloud iam workload-identity-pools providers create-oidc $PROVIDER --location=global --workload-identity-pool=$POOL \
       --display-name="groove-map main" --issuer-uri="https://token.actions.githubusercontent.com" \
       --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
       --attribute-condition="assertion.repository=='$REPO' && assertion.ref=='refs/heads/main'"
gcloud iam service-accounts add-iam-policy-binding $SA_EMAIL --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$PN/locations/global/workloadIdentityPools/$POOL/attribute.repository/$REPO" >/dev/null

echo ""
if [ "$PN" = "565556414915" ]; then
  echo "✅ 設定できました。Claude に「設定した」と伝えてください（試しにデプロイを動かして確かめます）"
else
  echo "⚠️ プロジェクト番号が $PN でした。Claude にこの番号を伝えてください（デプロイの設定を直します）"
fi
