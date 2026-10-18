import scene from '../schemas/editor-compatible-scene-document.schema.json' with {type: 'json'};
import node from '../schemas/editor-compatible-scene-node.schema.json' with {type: 'json'};
import wrapper from '../schemas/editor-compatible-kamishibai-3d-scene-extension.schema.json' with {type: 'json'};
import type {SchemaBundle, SchemaDocument, SchemaResource, SyncOwnerValidator} from '@kubohiroya/turbowarp-extension-data-editor/schema';
import {normalizeSceneGraphDocument, validateSceneGraphDocument} from './scene-graph.js';
import {normalizeKamishibai3DSceneExtension, validateKamishibai3DSceneExtension} from './kamishibai-extension.js';
export {validateSceneGraphDocument, normalizeSceneGraphDocument} from './scene-graph.js';
export {validateKamishibai3DSceneExtension, normalizeKamishibai3DSceneExtension} from './kamishibai-extension.js';
const documents = [scene, node, wrapper];
const sources = documents.map(document => ({repository: 'turbowarp-scene-graph', path: 'schemas/'+document.$id.split('/').at(-1)}));
const resources: SchemaResource[] = documents.map((document, i) => ({retrievalUri: document.$id, document: document as SchemaDocument,
  artifact: {role: 'canonical-schema', source: sources[i]!}}));
function bundle(index: number, variantId: string): SchemaBundle {
  return {identity: {ownerId: 'turbowarp-scene-graph', contractId: 'scene-document', revision: 'parser-v0.2.0-ar0.3.0', variantId}, dialect: '2020-12',
    root: resources[index]!, resources: resources.filter((_, i) => i !== index),
    provenance: {canonicalSources: [sources[0]!, ...sources.slice(1)], generatedFiles: [], generationSources: [],
      referenceSchemas: ['scene-document','scene-node','kamishibai-3d-scene-extension'].map(name => ({repository: 'turbowarp-scene-graph', path: `schemas/${name}.schema.json`}))}};
}
export const sceneSchemaBundles = {bare: bundle(0, 'bare'), wrapper: bundle(2, 'wrapper')} as const;
export const validateSceneDocumentInput: SyncOwnerValidator = data => {
  try {validateSceneGraphDocument(data);normalizeSceneGraphDocument(data);return {kind: 'valid', issues: []};}
  catch {return {kind: 'invalid', issues: [{dataPath: '', ruleId: 'scene-plan-input'}]};}
};
export const validateSceneExtensionInput: SyncOwnerValidator = data => {
  try {validateKamishibai3DSceneExtension(data);normalizeKamishibai3DSceneExtension(data);return {kind: 'valid', issues: []};}
  catch {return {kind: 'invalid', issues: [{dataPath: '', ruleId: 'scene-extension-plan-input'}]};}
};
