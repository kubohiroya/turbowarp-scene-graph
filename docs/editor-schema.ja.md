> 現在のCI修正・依存artifactの検証は [editor-schema-ci-fix-20261018.ja.md](editor-schema-ci-fix-20261018.ja.md) / [JSON](editor-schema-ci-fix-20261018.json) を参照。以下の旧pin・検証結果は採取時の履歴として保持する。

# 段階1: scene固定契約

> 現在のGit依存固定・実解決・検証結果は[editor-schema-publication.ja.md](editor-schema-publication.ja.md)と同名JSONを参照。以下は依存更新前の採取履歴として保持する。

追跡: https://github.com/kubohiroya/turbowarp-scene-graph/issues/5 。共通親はextension-data-editor #18。

`./editor-schema`のsceneSchemaBundles.bare/wrapperは同じscene-document契約のvariantで、3つの同梱resourceを持つ。validateSceneDocumentInput / validateSceneExtensionInputは既存の純粋validatorとnormalizeを使い、正規化後ID重複等の入力条件を検査する。元の値を正規化結果へ置き換えず、dispatchしない。

既存公開3 Schemaは空文字やclass重複をparserより厳しく扱うため参照用として保持する。新しいschemas/editor-compatible-*.schema.jsonを正本とし、type/id/optionsの空文字、重複class、AR cameraIdの空文字を現行parserに合わせる。空白キーや正規化後ID重複、空白target/selectorの拒否はowner層が担当する。

ARはこのpackageが実際に解決する0.3.0の./planを固定し、別checkoutの0.4.0を代用しない。所在・版・manifestとplanのSHA-256はeditor-schema-verification.jsonに記録する。共通型依存も検証済みGit commitへ固定する。

確認: 型検査、既存Schema契約/planと新adapterの56テスト、従来dist＋独立JS/型/resource build、srcなし・DOM/Reactなし隔離importとskipLibCheck:falseのconsumer型検査が成功。元の公開Schemaは変更していない。

段階2でconsumerがraw source/variantを保持してフォームへ接続する。段階1では拡張editor登録や候補UIを追加しない。新入口の利用を外す/本Issueのcommitをrevertしてrollbackでき、既存sourceの移行は不要。

## S1-5の最終確認

対象は合計56ケース（増分検証を含む）。srcを除いた実packageでReact不在・DOM/VM/通信globalアクセス0、skipLibCheck:falseの型検査を確認し、独立生成9ファイルを再emitと全SHA-256照合した。16契約の横断fixtureと依存artifact照合の記録は共通repoのschema-stage1-*.jsonを参照。既存生成基準は保持する。
