# Changelog

## 0.2.0

Absorbs `@kubohiroya/turbowarp-3d-scene-dsl`, which is retired. That package wrapped this one to
rename its error messages and re-export its API, which made this package's internal strings part of
its public contract without adding a layer of its own. Its YAML I/O and Kamishibai envelope moved
here instead, and the wrapper is gone.

### Added

- `parseSceneGraphYaml` and `stringifySceneGraphYaml`.
- `Kamishibai3DSceneExtension`, `validateKamishibai3DSceneExtension`,
  `normalizeKamishibai3DSceneExtension`, and `createTurboWarpExtensionPlan`.
- JSON Schemas under `schemas/`, with a contract test that runs a corpus through both the schemas
  and the TypeScript validators and fails when the two disagree.
- `src/` is split into `scene-graph.ts` (app-neutral), `scene-yaml.ts`, and
  `kamishibai-extension.ts` (the only app-specific module).

### Changed

- Depends on `@kubohiroya/turbowarp-ar@^0.3.0` for AR scene control, and on `yaml`.
- AR types and functions are imported, not re-exported. Import them from
  `@kubohiroya/turbowarp-ar/plan`.

### Migrating from `@kubohiroya/turbowarp-3d-scene-dsl`

| Was | Now |
|---|---|
| `parseSceneYaml` | `parseSceneGraphYaml` |
| `stringifySceneYaml` | `stringifySceneGraphYaml` |
| `validateSceneDocument` | `validateSceneGraphDocument` |
| `normalizeSceneDocument` | `normalizeSceneGraphDocument` |
| `validateSceneNodeTemplate` | `validateSceneGraphNode` |
| `SceneDocument`, `NormalizedSceneDocument`, `SceneNodeTemplate`, `SceneOptions` | `SceneGraphDocument`, `NormalizedSceneGraphDocument`, `SceneGraphNode`, `SceneGraphOptions` |
| `ARSceneControl`, `ARTargetBinding`, `TurboWarpARScenePlanCall` re-exported | import from `@kubohiroya/turbowarp-ar/plan` |

Error messages are no longer rewritten. Text that began `3D scene ...` now begins `Scene graph ...`,
and AR errors keep their `TurboWarp AR ...` prefix. Code matching on those strings has to be updated.

`ar.layer` no longer accepts `camera-under-3d`, which the AR extension never implemented and
silently discarded at runtime. Use `above-stage` (the default) or `below-stage`; the AR camera
background already renders under a 3D scene on the same layer.

## 0.1.0

- Initial scene graph planning package.
