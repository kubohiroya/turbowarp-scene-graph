import {parse as parseYaml, stringify as stringifyYaml} from 'yaml';

import {
  normalizeSceneGraphDocument,
  validateSceneGraphDocument,
  type NormalizedSceneGraphDocument,
  type SceneGraphDocument
} from './scene-graph.js';

/** Reads a handwritten scene graph document and returns it validated and normalized. */
export function parseSceneGraphYaml(source: string): NormalizedSceneGraphDocument {
  const value: unknown = parseYaml(source);
  validateSceneGraphDocument(value);
  return normalizeSceneGraphDocument(value);
}

/** Writes a scene graph document as YAML, normalized so the output is deterministic. */
export function stringifySceneGraphYaml(document: SceneGraphDocument): string {
  validateSceneGraphDocument(document);
  return stringifyYaml(normalizeSceneGraphDocument(document), {lineWidth: 0});
}
