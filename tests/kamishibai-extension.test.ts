import {describe, expect, it} from 'vitest';

import {
  createTurboWarpExtensionPlan,
  normalizeKamishibai3DSceneExtension
} from '../src/kamishibai-extension.js';

describe('Kamishibai 3D scene extensions', () => {
  it('normalizes each half with the owner of that half', () => {
    const extension = normalizeKamishibai3DSceneExtension({
      scene3d: {formatVersion: 1, root: {children: [{type: 'box', class: 'card'}]}},
      ar: {targets: [{targetId: 'marker-1', selector: '#scene-box-1'}]}
    });

    expect(extension.scene3d?.root.children?.[0]?.id).toBe('scene-box-1');
    expect(extension.ar).toEqual({
      cameraId: 'default',
      layer: 'above-stage',
      targets: [{targetId: 'marker-1', selector: '#scene-box-1'}]
    });
  });

  it('plans the 3D scene before the AR scene that binds to it', () => {
    const calls = createTurboWarpExtensionPlan({
      scene3d: {
        formatVersion: 1,
        root: {
          children: [
            {
              type: 'box',
              id: 'card',
              class: 'monster selected',
              data: {zone: 'field'},
              attributes: {position: '0 1 -3'}
            }
          ]
        }
      },
      ar: {cameraId: 'front', targets: [{targetId: 'marker-1', selector: '#card'}]}
    });

    expect(calls).toEqual([
      {extension: 'turbowarp-aframe', opcode: 'createScene', args: {LAYER: 'above-stage', MODE: '3d'}},
      {
        extension: 'turbowarp-aframe',
        opcode: 'createNode',
        args: {TYPE: 'box', ID: 'card', PARENT: '#scene'}
      },
      {extension: 'turbowarp-aframe', opcode: 'addClass', args: {CLASS: 'monster', SELECTOR: '#card'}},
      {extension: 'turbowarp-aframe', opcode: 'addClass', args: {CLASS: 'selected', SELECTOR: '#card'}},
      {
        extension: 'turbowarp-aframe',
        opcode: 'setData',
        args: {SELECTOR: '#card', KEY: 'zone', VALUE: 'field'}
      },
      {
        extension: 'turbowarp-aframe',
        opcode: 'setAttribute',
        args: {SELECTOR: '#card', NAME: 'position', VALUE: '0 1 -3'}
      },
      {
        extension: 'turbowarp-ar',
        opcode: 'createARScene',
        args: {CAMERA_ID: 'front', LAYER: 'above-stage'}
      },
      {extension: 'turbowarp-ar', opcode: 'defineARTarget', args: {TARGET_ID: 'marker-1'}},
      {
        extension: 'turbowarp-ar',
        opcode: 'attachSelectorToARTarget',
        args: {SELECTOR: '#card', TARGET_ID: 'marker-1'}
      }
    ]);
  });

  it('plans nothing for an empty fragment, and only one half when only one is given', () => {
    expect(createTurboWarpExtensionPlan({})).toEqual([]);
    expect(createTurboWarpExtensionPlan({ar: {}}).map((call) => call.extension)).toEqual([
      'turbowarp-ar'
    ]);
    expect(
      createTurboWarpExtensionPlan({scene3d: {formatVersion: 1, root: {}}}).map(
        (call) => call.extension
      )
    ).toEqual(['turbowarp-aframe']);
  });

  it('reports each half with the vocabulary of the package that owns it', () => {
    expect(() => normalizeKamishibai3DSceneExtension({scene2d: {}} as never)).toThrow(
      'Kamishibai 3D scene extension scene2d is not supported.'
    );
    expect(() =>
      normalizeKamishibai3DSceneExtension({scene3d: {formatVersion: 2, root: {}}} as never)
    ).toThrow('Scene graph document formatVersion must be 1.');
    expect(() =>
      normalizeKamishibai3DSceneExtension({ar: {layer: 'camera-under-3d'}} as never)
    ).toThrow('TurboWarp AR scene control ar.layer must be one of above-stage, below-stage.');
  });
});
