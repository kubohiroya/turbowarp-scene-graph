# turbowarp-scene-graph

[日本語](README.ja.md)

`@kubohiroya/turbowarp-scene-graph` turns small scene graph documents into deterministic TurboWarp
extension call plans. It reads and writes them as YAML, validates and normalizes them, and expands
the `scene3d` / `ar` fragment a Kamishibai scene can carry into the calls that set both extensions
up.

It plans; it does not run. It never loads A-Frame, never opens a camera, and never parses a
Kamishibai story. The caller supplies the document and dispatches the calls it gets back.

## Scope

- Parse and stringify scene graph documents as YAML.
- Validate node, class, data, and attribute shapes, and reject duplicate ids.
- Normalize ids and fill omitted options deterministically.
- Convert typed values to A-Frame strings: arrays and `{x,y,z,w}` vectors become space-separated
  values; other scalar objects become sorted `key: value` pairs.
- Plan `turbowarp-aframe` calls for a document, and `turbowarp-ar` calls for an AR fragment.

## Layout

| Module | Owns |
|---|---|
| [src/scene-graph.ts](src/scene-graph.ts) | The document model: types, validation, normalization, and the `turbowarp-aframe` plan. App-neutral. |
| [src/scene-yaml.ts](src/scene-yaml.ts) | YAML in and out, over that model. |
| [src/kamishibai-extension.ts](src/kamishibai-extension.ts) | The `{scene3d, ar}` envelope a Kamishibai scene carries, and the order the two extensions are set up in. The only app-specific part. |
| [schemas/](schemas) | JSON Schemas for editors and external tooling. |

AR scene control — its types, validation, and plan — belongs to
[`@kubohiroya/turbowarp-ar/plan`](https://github.com/kubohiroya/turbowarp-ar) and is imported, not
re-exported. Import it from there when you need it directly.

Errors keep the vocabulary of whichever package raised them. A malformed `scene3d` reports as a
scene graph error and a malformed `ar` as a TurboWarp AR error, so a message points at the code that
enforces the rule.

## Documents

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

Normalization rules:

- `root.id` is always `scene`.
- `options.layer` defaults to `above-stage` and `options.mode` to `3d`.
- A child without an id gets a deterministic one such as `scene-box-1`.
- Ids are trimmed, and anything outside ASCII letters, digits, `_`, and `-` becomes `-`.
- Duplicate ids after normalization throw.

`data` and `attributes` values may be scalars, scalar arrays, or scalar objects.
`stringifySceneGraphValue` renders them the way a TurboWarp argument needs.

## Plans

```ts
import {createAFrameSceneGraphPlan} from '@kubohiroya/turbowarp-scene-graph';

const calls = createAFrameSceneGraphPlan({
  formatVersion: 1,
  root: {
    children: [{type: 'box', id: 'card', class: 'selected', attributes: {position: {x: 0, y: 1, z: -3}}}]
  }
});
```

## Kamishibai fragments

```ts
import {createTurboWarpExtensionPlan} from '@kubohiroya/turbowarp-scene-graph';

const calls = createTurboWarpExtensionPlan({
  scene3d: {formatVersion: 1, root: {children: [{type: 'box', id: 'card'}]}},
  ar: {cameraId: 'front', targets: [{targetId: 'marker-1', selector: '#card'}]}
});
```

Both halves are optional, and an empty fragment plans nothing. The 3D scene is planned first, so the
nodes an AR target binds to exist by the time `attachSelectorToARTarget` runs. AR defaults are
`cameraId: default`, `layer: above-stage`, and no targets; `layer` accepts only `above-stage` and
`below-stage`, the vocabulary `turbowarp-ar` and `turbowarp-aframe` share.

## Schemas

The JSON Schemas under [schemas/](schemas) describe the same shapes the TypeScript validators
enforce, for editors and tools that cannot run this package. Because that is a second description of
one contract, [tests/schema-contract.test.ts](tests/schema-contract.test.ts) runs a corpus of
documents through both and fails if the two ever disagree.

## Development

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run check
```

## License

Mozilla Public License 2.0. See [LICENSE](LICENSE).
