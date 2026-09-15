# turbowarp-scene-graph

[English](README.md)

`@kubohiroya/turbowarp-scene-graph` は、小さな scene graph document を正規化し、deterministic な TurboWarp extension call plan へ変換します。

このパッケージはアプリ非依存です。A-Frame の実行、AR camera state、Kamishibai story のparseは所有しません。アプリ側が document source を渡し、生成された call をdispatchします。

## 役割

- scene graph node id と既定値を正規化する。
- node、class、data、attribute の対応範囲を検証する。
- deterministic な `turbowarp-aframe` call plan を作る。
- typed value を A-Frame 文字列へ変換する。array と `{x,y,z,w}` vector は空白区切り、その他のscalar objectはkey順の `key: value` 形式になる。

## 例

```ts
import {createAFrameSceneGraphPlan} from '@kubohiroya/turbowarp-scene-graph';

const calls = createAFrameSceneGraphPlan({
  formatVersion: 1,
  root: {
    children: [
      {
        type: 'box',
        id: 'card',
        class: 'selected',
        attributes: {position: {x: 0, y: 1, z: -3}}
      }
    ]
  }
});
```

## 開発

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run check
```
