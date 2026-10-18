# 段階1 CI・main整合の修正

2026-10-18。Issue #5 / PR #6。分岐後のmain 8839eab2のpublish前buildを作業ブランチへ取り込み、package.jsonの競合を解消した。PRをmainへmergeする操作は行っていない。

- buildは従来runtime出力に加えbuild:editorを実行し、prepublishOnlyはpnpm run buildを維持。prepareも維持した。新Schema/API/データ契約を変更していない。
- corepack pnpm@11.11.0 checkが成功（型検査、全66テスト、既存/独立build、pack内容確認）。変更後artifactはcoordinatorの最終記録に対応付け、Runtimeのmanifest/lock/実解決へ固定する。
- 同梱resource、AR 0.3.0/plan、共通R4 b5f4b8d2は維持。npm公開・段階2以降の実装は行わない。
- rollbackは本取り込みcommitを第一親側へrevertし、新入口/producerの利用を停止する。mainのpublish前build保護を戻す場合は公開を停止してから行う。保存sourceの移行はなく逆変換不要。

旧editor-schema-publication.*は依存公開時の履歴。現在の設定/生成物/実依存と検証はeditor-schema-ci-fix-20261018.jsonおよびcoordinatorの最終記録を参照。

## 全check件数の訂正

成功ログの66件を10件と誤集計していたため訂正した。8ownerの合計は1,106件。以前の対象テスト10件や215件などの部分集合の検証とは区別する。[訂正前原文とSHA-256](history/stage1-counts-before-20261018/snapshot.json)を保持する。今回の変更は文書だけで、Schema・入力・API・生成物は変更しない。新しいGit artifactのSHAへRuntimeのmanifest/lock/実解決を揃える。
