import {describe, expect, it} from 'vitest';
import {
  createAFrameSceneGraphPlan,
  normalizeSceneGraphDocument,
  stringifySceneGraphValue
} from '../src/index.js';

describe('normalizeSceneGraphDocument', () => {
  it('fills defaults and deterministic ids', () => {
    const document = normalizeSceneGraphDocument({
      formatVersion: 1,
      root: {
        children: [{type: 'box'}, {type: 'box'}]
      }
    });
    expect(document.options).toEqual({layer: 'above-stage', mode: '3d'});
    expect(document.root.id).toBe('scene');
    expect(document.root.children?.map((node) => node.id)).toEqual(['scene-box-1', 'scene-box-2']);
  });

  it('rejects duplicate normalized ids', () => {
    expect(() =>
      normalizeSceneGraphDocument({
        formatVersion: 1,
        root: {children: [{id: 'card'}, {id: 'card'}]}
      })
    ).toThrow('Duplicate scene graph node id: card');
  });
});

describe('createAFrameSceneGraphPlan', () => {
  it('creates deterministic low-level TurboWarp calls', () => {
    const calls = createAFrameSceneGraphPlan({
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
      });
    expect(Object.isFrozen(calls)).toBe(true);
    expect(Object.isFrozen(calls[0]?.args)).toBe(true);
    expect(calls).toEqual([
      {
        extension: 'turbowarp-aframe',
        opcode: 'createScene',
        args: {LAYER: 'above-stage', MODE: '3d'}
      },
      {
        extension: 'turbowarp-aframe',
        opcode: 'createNode',
        args: {TYPE: 'box', ID: 'card', PARENT: '#scene'}
      },
      {
        extension: 'turbowarp-aframe',
        opcode: 'addClass',
        args: {CLASS: 'monster', SELECTOR: '#card'}
      },
      {
        extension: 'turbowarp-aframe',
        opcode: 'addClass',
        args: {CLASS: 'selected', SELECTOR: '#card'}
      },
      {
        extension: 'turbowarp-aframe',
        opcode: 'setData',
        args: {SELECTOR: '#card', KEY: 'zone', VALUE: 'field'}
      },
      {
        extension: 'turbowarp-aframe',
        opcode: 'setAttribute',
        args: {SELECTOR: '#card', NAME: 'position', VALUE: '0 1 -3'}
      }
    ]);
  });

  it('stringifies typed object values with an explicit A-Frame contract', () => {
    expect(stringifySceneGraphValue({x: 0, y: 1, z: -3})).toBe('0 1 -3');
    expect(stringifySceneGraphValue(['0', 1, -3])).toBe('0 1 -3');
    expect(stringifySceneGraphValue({dur: 500, property: 'rotation'})).toBe(
      'dur: 500; property: rotation'
    );
    const calls = createAFrameSceneGraphPlan({
      formatVersion: 1,
      root: {
        children: [{id: 'card', attributes: {position: {x: 0, y: 1, z: -3}}}]
      }
    });
    expect(calls).toContainEqual({
      extension: 'turbowarp-aframe',
      opcode: 'setAttribute',
      args: {SELECTOR: '#card', NAME: 'position', VALUE: '0 1 -3'}
    });
  });

  it('rejects nested object values', () => {
    expect(() =>
      createAFrameSceneGraphPlan({
        formatVersion: 1,
        root: {
          children: [{id: 'card', attributes: {position: {x: {value: 0}} as never}}]
        }
      })
    ).toThrow('Scene graph root.children[0].attributes.position.x must be a scalar value.');
  });
});
