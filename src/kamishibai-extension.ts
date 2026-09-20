import {
  createTurboWarpARScenePlan,
  normalizeARSceneControl,
  validateARSceneControl,
  type ARSceneControl,
  type NormalizedARSceneControl,
  type TurboWarpARScenePlanCall
} from '@kubohiroya/turbowarp-ar/plan';

import {
  createAFrameSceneGraphPlan,
  normalizeSceneGraphDocument,
  validateSceneGraphDocument,
  type AFrameSceneGraphCall,
  type NormalizedSceneGraphDocument,
  type SceneGraphDocument
} from './scene-graph.js';

/**
 * The 3D and AR fragment a Kamishibai scene can carry.
 *
 * This is the one place in the package that is not app-neutral: it names the two keys a Kamishibai
 * scene uses and fixes the order the two extensions are set up in.
 */
export interface Kamishibai3DSceneExtension {
  scene3d?: SceneGraphDocument;
  ar?: ARSceneControl;
}

export interface NormalizedKamishibai3DSceneExtension {
  scene3d?: NormalizedSceneGraphDocument;
  ar?: NormalizedARSceneControl;
}

export type TurboWarpExtensionCall = AFrameSceneGraphCall | TurboWarpARScenePlanCall;

export function validateKamishibai3DSceneExtension(
  value: unknown
): asserts value is Kamishibai3DSceneExtension {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('Kamishibai 3D scene extension must be an object.');
  }
  const extension = value as Record<string, unknown>;
  for (const key of Object.keys(extension)) {
    if (key !== 'scene3d' && key !== 'ar') {
      throw new TypeError(`Kamishibai 3D scene extension ${key} is not supported.`);
    }
  }
  if (extension['scene3d'] !== undefined) validateSceneGraphDocument(extension['scene3d']);
  if (extension['ar'] !== undefined) validateARSceneControl(extension['ar']);
}

export function normalizeKamishibai3DSceneExtension(
  extension: Kamishibai3DSceneExtension
): NormalizedKamishibai3DSceneExtension {
  validateKamishibai3DSceneExtension(extension);
  const normalized: NormalizedKamishibai3DSceneExtension = {};
  if (extension.scene3d !== undefined) {
    normalized.scene3d = normalizeSceneGraphDocument(extension.scene3d);
  }
  if (extension.ar !== undefined) {
    normalized.ar = normalizeARSceneControl(extension.ar);
  }
  return normalized;
}

/**
 * Expands a Kamishibai fragment into the calls that set both extensions up.
 *
 * The 3D scene is planned before the AR scene, so the nodes an AR target binds to exist by the time
 * `attachSelectorToARTarget` runs.
 */
export function createTurboWarpExtensionPlan(
  extension: Kamishibai3DSceneExtension
): TurboWarpExtensionCall[] {
  const normalized = normalizeKamishibai3DSceneExtension(extension);
  const calls: TurboWarpExtensionCall[] = [];
  if (normalized.scene3d !== undefined) {
    calls.push(...createAFrameSceneGraphPlan(normalized.scene3d));
  }
  if (normalized.ar !== undefined) {
    calls.push(...createTurboWarpARScenePlan(normalized.ar));
  }
  return calls;
}
