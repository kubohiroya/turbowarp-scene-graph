# turbowarp-scene-graph

[English](README.md)

`@kubohiroya/turbowarp-scene-graph` は、小さな scene graph document を決定的な TurboWarp 拡張の呼び出し計画へ変換します。YAML での読み書き、検証と正規化、そして Kamishibai scene が持つ `scene3d` / `ar` 断片を2つの拡張の起動呼び出しへ展開するところまでを担当します。

計画するだけで、実行はしません。A-Frame を読み込むことも、カメラを開くことも、Kamishibai story を parse することもありません。document を渡すのも、返った呼び出しを dispatch するのも、利用側の責務です。

## 役割

- scene graph document を YAML として parse / stringify する。
- node、class、data、attribute の形を検証し、id の重複を拒否する。
- id を正規化し、省略された option を決定的に埋める。
- typed value を A-Frame 文字列へ変換する。array と `{x,y,z,w}` vector は空白区切り、その他の scalar object は key 順の `key: value` になる。
- document から `turbowarp-aframe` の、AR 断片から `turbowarp-ar` の呼び出し計画を作る。

## 構成

| モジュール | 責務 |
|---|---|
| [src/scene-graph.ts](src/scene-graph.ts) | document モデル本体。型、検証、正規化、`turbowarp-aframe` 計画。アプリ非依存。 |
| [src/scene-yaml.ts](src/scene-yaml.ts) | 上のモデルに対する YAML 入出力。 |
| [src/kamishibai-extension.ts](src/kamishibai-extension.ts) | Kamishibai scene が持つ `{scene3d, ar}` エンベロープと、2つの拡張の起動順序。唯一のアプリ固有部分。 |
| [schemas/](schemas) | エディタや外部ツール向けの JSON Schema。 |

AR scene control の型・検証・計画は [`@kubohiroya/turbowarp-ar/plan`](https://github.com/kubohiroya/turbowarp-ar) の責務で、import はしますが re-export はしません。直接必要なときは向こうから import してください。

エラーメッセージは、それを投げたパッケージの語彙のままです。`scene3d` の不正は scene graph のエラーとして、`ar` の不正は TurboWarp AR のエラーとして出るので、メッセージがルールを持つコードを指します。

## document

```yaml
formatVersion: 1
root:
  children:
    - type: box
      class: card
      attributes:
        position: 0 1 -3
```

```ts
import {parseSceneGraphYaml, stringifySceneGraphYaml} from '@kubohiroya/turbowarp-scene-graph';

const scene = parseSceneGraphYaml(source);

scene.options; // { layer: 'above-stage', mode: '3d' }
scene.root.children?.[0]?.id; // 'scene-box-1'
stringifySceneGraphYaml(scene);
```

正規化の規則:

- `root.id` は常に `scene`。
- `options.layer` の既定は `above-stage`、`options.mode` の既定は `3d`。
- id の無い子 node には `scene-box-1` のような決定的な id を与える。
- id は trim し、ASCII の英数字・`_`・`-` 以外は `-` に置き換える。
- 正規化後に id が重複すると例外。

`data` と `attributes` の値は scalar、scalar 配列、scalar object のいずれかです。`stringifySceneGraphValue` が TurboWarp の引数に合う形へ変換します。

## 計画

```ts
import {createAFrameSceneGraphPlan} from '@kubohiroya/turbowarp-scene-graph';

const calls = createAFrameSceneGraphPlan({
  formatVersion: 1,
  root: {
    children: [{type: 'box', id: 'card', class: 'selected', attributes: {position: {x: 0, y: 1, z: -3}}}]
  }
});
```

## Kamishibai 断片

```ts
import {createTurboWarpExtensionPlan} from '@kubohiroya/turbowarp-scene-graph';

const calls = createTurboWarpExtensionPlan({
  scene3d: {formatVersion: 1, root: {children: [{type: 'box', id: 'card'}]}},
  ar: {cameraId: 'front', targets: [{targetId: 'marker-1', selector: '#card'}]}
});
```

両方の半分とも省略可能で、空の断片は何も計画しません。3D scene を先に計画するため、`attachSelectorToARTarget` が走る時点で AR target の bind 先 node は存在します。AR の既定値は `cameraId: default`、`layer: above-stage`、target 無しです。`layer` が受け付けるのは `above-stage` と `below-stage` だけで、これは `turbowarp-ar` と `turbowarp-aframe` が共有する語彙です。

## Schema

[schemas/](schemas) の JSON Schema は、TypeScript の validator が強制しているのと同じ形を、このパッケージを実行できないエディタやツール向けに記述したものです。1つの契約に対する2つ目の記述である以上、[tests/schema-contract.test.ts](tests/schema-contract.test.ts) が document の集合を両方に通し、食い違ったら失敗します。

## 開発

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run check
```

## ライセンス

Mozilla Public License 2.0。[LICENSE](LICENSE) を参照してください。
