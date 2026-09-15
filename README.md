# turbowarp-scene-graph

[日本語](README.ja.md)

`@kubohiroya/turbowarp-scene-graph` normalizes small scene graph documents and turns them into deterministic TurboWarp extension call plans.

The package is app-neutral. It does not run A-Frame, own AR camera state, or parse a Kamishibai story. App packages provide the document source and dispatch the resulting calls.

## Scope

- Normalize scene graph node ids and defaults.
- Validate supported node, class, data, and attribute shapes.
- Create deterministic `turbowarp-aframe` call plans.
- Convert typed values to A-Frame strings: arrays and `{x,y,z,w}` vectors become space-separated values; other scalar objects become sorted `key: value` pairs.

## Example

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

## Development

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run check
```
