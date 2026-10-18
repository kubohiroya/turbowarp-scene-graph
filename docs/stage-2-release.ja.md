# 段階2の公開Git配布とnpmリリース

2026-10-18、日本時間。段階2全体の公開承認に基づく。共通0.2.0の最終merge SHAへmanifest・lock・allowBuilds・実解決を統一し、full type/test/build/packと生成物を検証する。先行file/Git artifactの記録は当時の履歴として保持する。

既存API・受理条件・Schemaの正本を維持する。GUIのsourceFormsは起動時固定・既定OFF、dialogsと同時に有効な場合だけ追加capabilityを公開する。release検証にはfresh frozen installを使い、同じ版の直接/間接依存を実パスまで記録する。

公開順は共通→Scene Graph/Camera Source→consumer/GUI。PRの新CIを確認してsquash mergeし、最終merge SHAの同一pack tarballをnpmへ公開、registry integrityを照合する。結果はPRと集約記録へ記載する。

ロールバックはsourceForms OFF。必要ならconsumer→producer→共通の逆依存順でrevertし、manifest/lock/実解決を一体で戻す。raw移行は不要。公開済みnpmを削除せず修正版を新versionで公開する。

## 最終Git依存での安定版検証

共通pinは `76fa1d50a3c188082ceef723ea018a9d8769ea6e`、common version0.2.0、直接・間接fast-uri3.1.8。Node22.23.3、packageManager指定のpnpmでfresh frozen install・型・全66テスト・build・packが成功した。versionは0.2.1。保存済みsubsetと再実行を重複加算しない。

生成物19ファイルが同じ場所での連続buildおよび別checkoutパスのbuildで全SHA-256一致した。後者は同一frozen storeを使う別作業コピーであり、別OSすべての再現性を主張しない。sourceを削除したpackでeditor-schema入口をimportできる。作業tarball SHA-256は `d0372ee70e5c8717c9613db0eafe7496600f30436586943d9cb3c559b475c934`、最終main packの内容一致はmerge後に確認する。

配布依存のauditは全severity0。開発依存を含む全auditの既存指摘は `{"info": 0, "low": 0, "moderate": 0, "high": 1, "critical": 0}` で、今回は配布コード/APIと無関係な開発ツールの一括更新は行わず履歴へ保存した。ソースのdiffcheckを行い、生成JSはbuild同一性で確認する。

このrepoにCI workflowがなかったためNode22/pnpm11.11のfrozen installと既存full checkをPR/push CIへ追加した。pack:checkは非対応のpnpm pack --dry-runからnpm pack --dry-run --ignore-scriptsへ変更し、梱包範囲は維持する。AR0.3.0とSchema正本は不変。
