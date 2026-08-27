# turbowarp-scene-graph-plan

[English](README.md)

`@kubohiroya/turbowarp-scene-graph-plan` は、小さな scene graph document を正規化し、deterministic な TurboWarp extension call plan へ変換します。

このパッケージはアプリ非依存です。A-Frame の実行、AR camera state、Kamishibai story のparseは所有しません。アプリ側が document source を渡し、生成された call をdispatchします。

## 役割

- scene graph node id と既定値を正規化する。
- node、class、data、attribute の対応範囲を検証する。
- deterministic な `turbowarp-aframe` call plan を作る。

## 例

```ts
import {createAFrameSceneGraphPlan} from '@kubohiroya/turbowarp-scene-graph-plan';

const calls = createAFrameSceneGraphPlan({
  formatVersion: 1,
  root: {
    children: [
      {
        type: 'box',
        id: 'card',
        class: 'selected',
        attributes: {position: '0 1 -3'}
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
